import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const schema = z.object({
  email: z.string().email('Email inválido')
});

/**
 * POST /api/auth/forgot-password
 * Envia email com link para redefinir senha
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Sempre retorna sucesso (não revela se email existe)
    if (!user || !user.password) {
      return NextResponse.json({
        success: true,
        message: 'Se o email existir, você receberá um link de recuperação.'
      });
    }

    // Deletar tokens anteriores do mesmo email
    await prisma.passwordResetToken.deleteMany({
      where: { email }
    });

    // Gerar token seguro
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.passwordResetToken.create({
      data: { email, token, expires }
    });

    // Enviar email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: 'Redefinir senha - InfluencerAI',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
          <h2 style="text-align: center;">InfluencerAI</h2>
          <p>Você solicitou a redefinição da sua senha.</p>
          <p>Clique no botão abaixo para criar uma nova senha:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: #000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Redefinir senha
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Se você não solicitou isso, ignore este email.</p>
          <p style="color: #666; font-size: 12px;">Este link expira em 1 hora.</p>
        </div>
      `
    });

    return NextResponse.json({
      success: true,
      message: 'Se o email existir, você receberá um link de recuperação.'
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}
