import Stripe from 'stripe';
import { SubscriptionRepository } from '@/lib/repositories/subscription.repository';
import { CreditService } from './credit.service';
import { SubscriptionService } from './subscription.service';

/**
 * Serviço de integração com Stripe (Singleton)
 * Gerencia checkout, portal, e webhooks
 */
export class StripeService {
  private static instance: StripeService;
  private stripe: Stripe | null = null;
  private subscriptionRepository = new SubscriptionRepository();
  private creditService = new CreditService();
  private subscriptionService = new SubscriptionService();

  private constructor() {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
  }

  static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  /**
   * Verifica se o Stripe está configurado
   */
  isConfigured(): boolean {
    return this.stripe !== null;
  }

  /**
   * Cria sessão de checkout do Stripe
   */
  async createCheckoutSession(
    userId: string,
    email: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ url: string }> {
    if (!this.stripe) {
      throw new Error('Stripe não configurado');
    }

    // Check if user already has a Stripe customer
    const existingSub = await this.subscriptionRepository.findByUser(userId);
    let customerId = existingSub?.stripeCustomerId || undefined;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email,
        metadata: { userId },
      });
      customerId = customer.id;
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId },
    });

    if (!session.url) {
      throw new Error('Falha ao criar sessão de checkout');
    }

    return { url: session.url };
  }

  /**
   * Cria sessão do portal de billing do Stripe
   */
  async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<{ url: string }> {
    if (!this.stripe) {
      throw new Error('Stripe não configurado');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  /**
   * Constrói e valida evento do webhook Stripe
   */
  constructWebhookEvent(body: string, signature: string): Stripe.Event {
    if (!this.stripe) {
      throw new Error('Stripe não configurado');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET não configurado');
    }

    return this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
  }

  /**
   * Processa evento do webhook Stripe
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
    }
  }

  /**
   * Checkout concluído — ativa assinatura + adiciona créditos
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    if (!userId) return;

    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;

    if (!this.stripe || !subscriptionId) return;

    // Get subscription details from Stripe
    const stripeSub = await this.stripe.subscriptions.retrieve(subscriptionId);
    const priceId = stripeSub.items.data[0]?.price?.id;

    // Find plan by Stripe price ID
    const plans = await this.subscriptionRepository.getPlans();
    const plan = plans.find((p) => p.stripePriceId === priceId);
    if (!plan) return;

    // Extract period timestamps from the subscription object
    const subData = stripeSub as unknown as Record<string, unknown>;
    const periodStart = subData.current_period_start as number | undefined;
    const periodEnd = subData.current_period_end as number | undefined;

    // Create/update subscription in our DB
    await this.subscriptionService.createOrUpdateSubscription(userId, plan.id, {
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : undefined,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
    });

    // Add monthly credits
    await this.creditService.addCredits(
      userId,
      plan.creditsMonthly,
      'subscription',
      `Assinatura ativada: ${plan.name}`,
      { planId: plan.id, stripeSubscriptionId: subscriptionId }
    );
  }

  /**
   * Invoice paga — renova créditos mensais
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const invoiceData = invoice as unknown as Record<string, unknown>;
    const subscriptionId = invoiceData.subscription as string | null;
    if (!subscriptionId) return;

    // Skip first invoice (handled by checkout.session.completed)
    if (invoice.billing_reason === 'subscription_create') return;

    const sub = await this.subscriptionRepository.findByStripeSubscriptionId(subscriptionId);
    if (!sub) return;

    await this.subscriptionService.renewCredits(sub.userId);
  }

  /**
   * Assinatura atualizada — sincroniza status
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const sub = await this.subscriptionRepository.findByStripeSubscriptionId(subscription.id);
    if (!sub) return;

    const subData = subscription as unknown as Record<string, unknown>;
    const periodStart = subData.current_period_start as number | undefined;
    const periodEnd = subData.current_period_end as number | undefined;

    await this.subscriptionRepository.update(sub.id, {
      status: subscription.status,
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : undefined,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  }

  /**
   * Assinatura cancelada — fallback para plano gratuito
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const sub = await this.subscriptionRepository.findByStripeSubscriptionId(subscription.id);
    if (!sub) return;

    // Get free plan
    const freePlan = await this.subscriptionRepository.getPlanBySlug('free');
    if (!freePlan) return;

    await this.subscriptionRepository.update(sub.id, {
      planId: freePlan.id,
      status: 'canceled',
      stripeSubscriptionId: undefined,
    });
  }
}
