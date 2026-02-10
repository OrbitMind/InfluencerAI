import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UserRepository } from '@/lib/repositories/user.repository';
import { CreditService } from '@/lib/services/billing/credit.service';

const userRepository = new UserRepository();

/**
 * POST /api/user/register
 * Registra um novo usuário com email e senha
 */
const registerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    // Verificar se email já existe
    const existing = await userRepository.findByEmail(validated.email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email já cadastrado' },
        { status: 400 }
      );
    }

    // Criar usuário
    const user = await userRepository.create(validated);

    // Inicializar créditos gratuitos
    try {
      const creditService = new CreditService();
      await creditService.initializeCredits(user.id);
    } catch (creditError) {
      console.error('Error initializing credits:', creditError);
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: 'Usuário criado com sucesso'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error registering user:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
