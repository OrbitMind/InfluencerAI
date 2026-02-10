import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/auth';
import { CreditService } from '@/lib/services/billing/credit.service';
import { transactionsQuerySchema } from '@/lib/validations/billing';

const creditService = new CreditService();

/**
 * GET /api/billing/transactions
 * Lista transações de créditos com paginação
 */
export const GET = withAuth(async (req, { userId }) => {
  try {
    const { searchParams } = new URL(req.url);
    const query = transactionsQuerySchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      type: searchParams.get('type') || undefined,
    });

    const result = await creditService.getTransactions(userId, query);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar transações' },
      { status: 500 }
    );
  }
});
