import { prisma } from '@/lib/db';
import { SubscriptionRepository } from '@/lib/repositories/subscription.repository';
import { CreditService } from './credit.service';
import type { PlanInfo, PlanLimits, SubscriptionInfo } from '@/lib/types/billing';

/**
 * Serviço para gerenciamento de Assinaturas
 * Service Layer — lógica de negócio
 */
export class SubscriptionService {
  private repository = new SubscriptionRepository();
  private creditService = new CreditService();

  /**
   * Retorna assinatura ativa do usuário
   */
  async getUserSubscription(userId: string): Promise<SubscriptionInfo | null> {
    const sub = await this.repository.findByUser(userId);
    if (!sub) return null;

    return {
      id: sub.id,
      planId: sub.planId,
      status: sub.status,
      stripeCustomerId: sub.stripeCustomerId,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      plan: this.mapPlan(sub.plan),
    };
  }

  /**
   * Lista todos os planos ativos
   */
  async getPlans(): Promise<PlanInfo[]> {
    const plans = await this.repository.getPlans();
    return plans.map((p) => this.mapPlan(p));
  }

  /**
   * Busca plano por slug
   */
  async getPlanBySlug(slug: string): Promise<PlanInfo | null> {
    const plan = await this.repository.getPlanBySlug(slug);
    if (!plan) return null;
    return this.mapPlan(plan);
  }

  /**
   * Verifica se o usuário pode criar mais recursos (personas/campaigns)
   * baseado nos limites do plano
   */
  async checkPlanLimit(
    userId: string,
    resource: 'personas' | 'campaigns'
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    // Get user's subscription and plan limits
    const sub = await this.repository.findByUser(userId);
    let limits: PlanLimits;

    if (sub?.plan) {
      limits = sub.plan.limits as unknown as PlanLimits;
    } else {
      // Default free plan limits
      limits = { maxPersonas: 3, maxCampaigns: 5, maxStorageMb: 100 };
    }

    // Count current resources
    let current: number;
    let limit: number;

    if (resource === 'personas') {
      current = await prisma.persona.count({
        where: { userId, isArchived: false },
      });
      limit = limits.maxPersonas;
    } else {
      current = await prisma.campaign.count({
        where: { userId },
      });
      limit = limits.maxCampaigns;
    }

    return {
      allowed: current < limit,
      current,
      limit,
    };
  }

  /**
   * Cria ou atualiza assinatura do usuário
   */
  async createOrUpdateSubscription(
    userId: string,
    planId: string,
    stripeData?: {
      stripeSubscriptionId?: string;
      stripeCustomerId?: string;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
    }
  ): Promise<void> {
    await this.repository.upsertByUser(userId, {
      planId,
      ...stripeData,
      status: 'active',
    });
  }

  /**
   * Cancela assinatura do usuário
   */
  async cancelSubscription(userId: string): Promise<void> {
    const sub = await this.repository.findByUser(userId);
    if (!sub) return;

    await this.repository.update(sub.id, {
      cancelAtPeriodEnd: true,
    });
  }

  /**
   * Renova créditos mensais baseado no plano ativo
   * Chamado pelo webhook Stripe quando invoice.paid
   */
  async renewCredits(userId: string): Promise<void> {
    const sub = await this.repository.findByUser(userId);
    if (!sub?.plan) return;

    await this.creditService.addCredits(
      userId,
      sub.plan.creditsMonthly,
      'subscription',
      `Créditos mensais: ${sub.plan.name}`,
      { planId: sub.planId, planSlug: sub.plan.slug }
    );
  }

  private mapPlan(plan: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    priceMonthly: number;
    creditsMonthly: number;
    features: unknown;
    limits: unknown;
    stripePriceId: string | null;
    isActive: boolean;
    sortOrder: number;
  }): PlanInfo {
    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      creditsMonthly: plan.creditsMonthly,
      features: plan.features as string[],
      limits: plan.limits as PlanLimits,
      stripePriceId: plan.stripePriceId,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
    };
  }
}
