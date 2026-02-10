import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/auth';
import { SubscriptionService } from '@/lib/services/billing/subscription.service';

const subscriptionService = new SubscriptionService();

/**
 * GET /api/billing/plans
 * Lista todos os planos de assinatura disponíveis
 */
export const GET = withAuth(async (_req, { userId }) => {
  try {
    const plans = await subscriptionService.getPlans();

    return NextResponse.json({
      success: true,
      data: { plans },
    });
  } catch (error: unknown) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar planos' },
      { status: 500 }
    );
  }
});
