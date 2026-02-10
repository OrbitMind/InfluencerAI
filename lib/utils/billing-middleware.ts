import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/utils/auth';
import { CreditService } from '@/lib/services/billing/credit.service';
import { SubscriptionService } from '@/lib/services/billing/subscription.service';
import { CREDIT_COSTS, type CreditOperationType } from '@/lib/types/billing';

type AuthHandler = (req: NextRequest, context: { userId: string }) => Promise<NextResponse>;

/**
 * Higher-Order Function para verificar e consumir créditos
 *
 * Fluxo:
 * 1. Autentica o usuário (withAuth embutido)
 * 2. Verifica saldo de créditos antes da execução
 * 3. Executa o handler original
 * 4. Se sucesso (2xx), consome os créditos
 *
 * Uso:
 * export const POST = withCredits('image', async (req, { userId }) => { ... });
 */
export function withCredits(
  operationType: CreditOperationType,
  handler: AuthHandler
) {
  return async (req: NextRequest, routeParams?: unknown) => {
    try {
      const user = await requireAuth();
      const userId = user.id;
      const cost = CREDIT_COSTS[operationType];

      // Check credits before execution
      if (cost > 0) {
        const creditService = new CreditService();
        const hasEnough = await creditService.hasEnoughCredits(userId, [operationType]);

        if (!hasEnough) {
          return NextResponse.json(
            {
              success: false,
              error: 'Créditos insuficientes',
              code: 'INSUFFICIENT_CREDITS',
              required: cost,
            },
            { status: 402 }
          );
        }
      }

      // Execute the original handler
      const response = await handler(req, { userId });

      // Consume credits only on success
      if (cost > 0 && response.status >= 200 && response.status < 300) {
        const creditService = new CreditService();
        try {
          await creditService.consumeCredits(userId, operationType, {
            endpoint: req.nextUrl.pathname,
          });
        } catch {
          // Credit consumption failed after successful generation
          // Log but don't fail the response
          console.error(`Failed to consume credits for ${operationType} (userId: ${userId})`);
        }
      }

      return response;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }
  };
}

/**
 * Higher-Order Function para verificar limites do plano
 *
 * Uso:
 * export const POST = withPlanLimit('personas', async (req, { userId }) => { ... });
 */
export function withPlanLimit(
  resource: 'personas' | 'campaigns',
  handler: AuthHandler
) {
  return async (req: NextRequest, routeParams?: unknown) => {
    try {
      const user = await requireAuth();
      const userId = user.id;

      const subscriptionService = new SubscriptionService();
      const check = await subscriptionService.checkPlanLimit(userId, resource);

      if (!check.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: `Limite do plano atingido (${check.current}/${check.limit} ${resource})`,
            code: 'PLAN_LIMIT',
            current: check.current,
            limit: check.limit,
          },
          { status: 403 }
        );
      }

      return await handler(req, { userId });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }
  };
}
