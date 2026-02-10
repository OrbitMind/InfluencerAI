import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/auth';
import { SubscriptionRepository } from '@/lib/repositories/subscription.repository';
import { StripeService } from '@/lib/services/billing/stripe.service';

const subscriptionRepository = new SubscriptionRepository();

/**
 * POST /api/billing/portal
 * Cria sessão do portal de billing do Stripe
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

    // Get user's subscription to find Stripe customer ID
    const sub = await subscriptionRepository.findByUser(userId);
    if (!sub?.stripeCustomerId) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma assinatura encontrada' },
        { status: 404 }
      );
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const { url } = await stripeService.createPortalSession(
      sub.stripeCustomerId,
      `${origin}/dashboard/billing`
    );

    return NextResponse.json({
      success: true,
      data: { url },
    });
  } catch (error: unknown) {
    console.error('Error creating portal session:', error);
    const message = error instanceof Error ? error.message : 'Erro ao abrir portal';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
});
