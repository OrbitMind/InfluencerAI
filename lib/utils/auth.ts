import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { NextRequest, NextResponse } from "next/server";

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
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Não autenticado');
  }

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
export function withAuth(
  handler: (req: NextRequest, context: { userId: string }) => Promise<NextResponse>
) {
  return async (req: NextRequest, routeParams?: any) => {
    try {
      const user = await requireAuth();

      // Passa userId no context para o handler
      return await handler(req, { userId: user.id });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }
  };
}
