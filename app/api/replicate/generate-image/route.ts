import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createLogger } from '@/lib/utils/logger';
import Replicate from 'replicate';
import { ApiKeyService } from '@/lib/services/api-key/api-key.service';
import { withCredits } from '@/lib/utils/billing-middleware';

const logger = createLogger('generate-image');

const apiKeyService = new ApiKeyService();

/**
 * POST /api/replicate/generate-image
 * Cria uma predição Replicate e retorna o ID imediatamente.
 * O cliente faz polling em /api/replicate/prediction-status para acompanhar o progresso.
 */
const schema = z.object({
  modelId: z.string().min(1, 'Model ID é obrigatório'),
  prompt: z.string().min(1, 'Prompt é obrigatório'),
  aspectRatio: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  personaId: z.string().optional(),
});

export const POST = withCredits('image', async (req, { userId }) => {
  try {
    const body = await req.json();
    const validated = schema.parse(body);

    const replicateKey = await apiKeyService.getApiKeyWithEnvFallback(userId, 'replicate');
    if (!replicateKey) {
      return NextResponse.json(
        { success: false, error: 'API key do Replicate não configurada. Configure em /dashboard/settings' },
        { status: 400 }
      );
    }

    const replicate = new Replicate({ auth: replicateKey, useFileOutput: false });

    const input: Record<string, unknown> = { prompt: validated.prompt };
    if (validated.aspectRatio) input.aspect_ratio = validated.aspectRatio;
    if (validated.width) input.width = validated.width;
    if (validated.height) input.height = validated.height;

    logger.info('Criando predição de imagem', { modelId: validated.modelId, userId });

    const prediction = await replicate.predictions.create({
      model: validated.modelId as `${string}/${string}`,
      input,
    });

    logger.info('Predição criada', { predictionId: prediction.id, status: prediction.status });

    return NextResponse.json({
      success: true,
      data: {
        predictionId: prediction.id,
        status: prediction.status,
        modelId: validated.modelId,
        prompt: validated.prompt,
        personaId: validated.personaId ?? null,
      },
    });
  } catch (error: unknown) {
    logger.error('Image generation error:', { error });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Falha ao gerar imagem';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
