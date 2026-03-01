import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { GenerationService } from '@/lib/services/generation/generation.service';
import { withAuth } from '@/lib/utils/auth';

const logger = createLogger('history-id');

const generationService = new GenerationService();

/**
 * GET /api/history/:id
 * Retorna uma geração específica
 */
export const GET = withAuth(async (req, { userId }) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const generation = await generationService.getGeneration(id, userId);

    if (!generation) {
      return NextResponse.json(
        { success: false, error: 'Geração não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: generation
    });
  } catch (error: unknown) {
    logger.error('Error fetching generation:', { error });
    const message = error instanceof Error ? error.message : 'Erro inesperado'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/history/:id
 * Deleta uma geração (remove do storage E do banco)
 */
export const DELETE = withAuth(async (req, { userId }) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    await generationService.deleteGeneration(id, userId);

    return NextResponse.json({
      success: true,
      message: 'Geração deletada com sucesso'
    });
  } catch (error: unknown) {
    logger.error('Error deleting generation:', { error });
    const message = error instanceof Error ? error.message : 'Erro inesperado'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
});
