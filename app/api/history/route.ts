import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GenerationService } from '@/lib/services/generation/generation.service';
import { withAuth } from '@/lib/utils/auth';

const generationService = new GenerationService();

/**
 * GET /api/history
 * Retorna histórico de gerações do usuário com paginação
 *
 * Query params:
 * - type: 'image' | 'video' (opcional)
 * - page: número da página (default: 1)
 * - limit: itens por página (default: 20)
 */
const querySchema = z.object({
  type: z.enum(['image', 'video']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

export const GET = withAuth(async (req, { userId }) => {
  try {
    const { searchParams } = new URL(req.url);
    const params = {
      type: searchParams.get('type'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit')
    };

    const validated = querySchema.parse(params);

    const history = await generationService.getHistory(userId, validated);

    return NextResponse.json({
      success: true,
      data: history
    });
  } catch (error: unknown) {
    console.error('Error fetching history:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Erro inesperado'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
});
