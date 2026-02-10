import { NextRequest, NextResponse } from 'next/server';
import { ApiKeyService } from '@/lib/services/api-key/api-key.service';
import { withAuth } from '@/lib/utils/auth';

const apiKeyService = new ApiKeyService();

/**
 * DELETE /api/user/api-keys/:id
 * Deleta uma API key específica
 */
export const DELETE = withAuth(async (req, { userId }) => {
  try {
    // Extrair ID da URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    await apiKeyService.deleteApiKey(id, userId);

    return NextResponse.json({
      success: true,
      message: 'API key deletada com sucesso'
    });
  } catch (error: any) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
});
