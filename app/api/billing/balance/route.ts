import { NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { withAuth } from '@/lib/utils/auth';
import { CreditService } from '@/lib/services/billing/credit.service';
import { SubscriptionService } from '@/lib/services/billing/subscription.service';
import { CREDIT_COSTS } from '@/lib/types/billing';

const logger = createLogger('billing-balance');

const creditService = new CreditService();
const subscriptionService = new SubscriptionService();

/**
 * GET /api/billing/balance
 * Retorna saldo de créditos, assinatura e tabela de custos
 */
export const GET = withAuth(async (_req, { userId }) => {
  try {
    const [balance, subscription] = await Promise.all([
      creditService.getBalance(userId),
      subscriptionService.getUserSubscription(userId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        balance,
        subscription,
        costs: CREDIT_COSTS,
      },
    });
  } catch (error: unknown) {
    logger.error('Error fetching balance:', { error });
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar saldo' },
      { status: 500 }
    );
  }
});
