import { createLogger } from "@/lib/utils/logger";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { NextRequest, NextResponse } from "next/server";

const logger = createLogger('auth');

/**
 * Utilitários de autenticação
 */

/**
 * Retorna a sessão atual do servidor
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Retorna o usuário atual autenticado
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

/**
 * Verifica se há usuário autenticado, caso contrário lança erro
 */
export async function requireAuth() {
  logger.info('[requireAuth] Verificando autenticação...');
  const user = await getCurrentUser();

  if (!user) {
    logger.error('[requireAuth] Usuário não autenticado');
    throw new Error('Não autenticado');
  }

  logger.info('[requireAuth] Usuário autenticado:', { id: user.id, email: user.email });
  return user;
}

/**
 * Higher-Order Function para proteger API routes
 * Wrapper que adiciona verificação de autenticação
 *
 * Exemplo de uso:
 * export const GET = withAuth(async (req, { userId }) => {
 *   // userId está disponível aqui
 * });
 */
export type AuthContext = { userId: string; params?: Record<string, string> }

export function withAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    routeParams?: { params?: Record<string, string> | Promise<Record<string, string>> }
  ) => {
    try {
      const user = await requireAuth();
      const rawParams = routeParams?.params;
      const params = rawParams instanceof Promise ? await rawParams : rawParams;
      return await handler(req, { userId: user.id, params });
    } catch {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }
  };
}
