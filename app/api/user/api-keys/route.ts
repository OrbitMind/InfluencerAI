import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiKeyService } from '@/lib/services/api-key/api-key.service';
import { withAuth } from '@/lib/utils/auth';

const apiKeyService = new ApiKeyService();

/**
 * GET /api/user/api-keys
 * Lista todas as API keys do usuário (sem dados sensíveis)
 */
export const GET = withAuth(async (req, { userId }) => {
  try {
    const apiKeys = await apiKeyService.listApiKeys(userId);

    return NextResponse.json({
      success: true,
      data: apiKeys
    });
  } catch (error: any) {
    console.error('Error listing API keys:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
});

/**
 * POST /api/user/api-keys
 * Cria ou atualiza uma API key
 */
const createSchema = z.object({
  provider: z.enum(['replicate', 'openai', 'google', 'elevenlabs']),
  apiKey: z.string().min(1, 'API key é obrigatória'),
  name: z.string().optional()
});

export const POST = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json();
    const validated = createSchema.parse(body);

    const apiKey = await apiKeyService.saveApiKey(
      userId,
      validated.provider,
      validated.apiKey,
      validated.name
    );

    return NextResponse.json({
      success: true,
      data: {
        id: apiKey.id,
        provider: apiKey.provider,
        name: apiKey.name
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving API key:', error);

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
