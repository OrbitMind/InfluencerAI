import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UserRepository } from '@/lib/repositories/user.repository';
import { withAuth } from '@/lib/utils/auth';

const userRepository = new UserRepository();

/**
 * GET /api/user/profile
 * Retorna perfil do usuário autenticado
 */
export const GET = withAuth(async (req, { userId }) => {
  try {
    const user = await userRepository.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/user/profile
 * Atualiza perfil do usuário
 */
const updateSchema = z.object({
  name: z.string().min(1).optional(),
  image: z.string().url().optional()
});

export const PATCH = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json();
    const validated = updateSchema.parse(body);

    const user = await userRepository.update(userId, validated);

    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);

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
});
