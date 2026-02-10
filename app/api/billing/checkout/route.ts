import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/utils/auth';
import { getCurrentUser } from '@/lib/utils/auth';
import { SubscriptionService } from '@/lib/services/billing/subscription.service';
import { StripeService } from '@/lib/services/billing/stripe.service';
import { createCheckoutSchema } from '@/lib/validations/billing';

const subscriptionService = new SubscriptionService();

/**
 * POST /api/billing/checkout
 * Cria sessão de checkout do Stripe para um plano
 */
export const POST = withAuth(async (req, { userId }) => {
  try {
    const stripeService = StripeService.getInstance();

    if (!stripeService.isConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Stripe não configurado' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { planSlug } = createCheckoutSchema.parse(body);

    // Find plan
    const plan = await subscriptionService.getPlanBySlug(planSlug);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    if (!plan.stripePriceId) {
      return NextResponse.json(
        { success: false, error: 'Plano sem configuração de pagamento' },
        { status: 400 }
      );
    }

    // Get user email
    const user = await getCurrentUser();
    const email = user?.email || '';

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const { url } = await stripeService.createCheckoutSession(
      userId,
      email,
      plan.stripePriceId,
      `${origin}/dashboard/billing?success=true`,
      `${origin}/dashboard/billing?canceled=true`
    );

    return NextResponse.json({
      success: true,
      data: { url },
    });
  } catch (error: unknown) {
    console.error('Error creating checkout:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Erro ao criar checkout';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
});
