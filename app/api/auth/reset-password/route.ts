import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { UserRepository } from '@/lib/repositories/user.repository';

const userRepository = new UserRepository();

const schema = z.object({
  token: z.string().min(1, 'Token obrigatório'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
});

/**
 * POST /api/auth/reset-password
 * Redefine a senha usando o token recebido por email
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = schema.parse(body);

    // Buscar token válido
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }

    // Verificar expiração
    if (new Date() > resetToken.expires) {
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      });

      return NextResponse.json(
        { success: false, error: 'Token expirado. Solicite um novo link.' },
        { status: 400 }
      );
    }

    // Atualizar senha
    await userRepository.updatePassword(resetToken.email, password);

    // Deletar token usado
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso!'
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao redefinir senha' },
      { status: 500 }
    );
  }
}
