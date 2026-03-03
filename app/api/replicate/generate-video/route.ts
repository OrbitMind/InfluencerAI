import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createLogger } from '@/lib/utils/logger';
import Replicate from 'replicate';
import { ApiKeyService } from '@/lib/services/api-key/api-key.service';
import { CameraControlService } from '@/lib/services/camera-control/camera-control.service';
import { withCredits } from '@/lib/utils/billing-middleware';
import type { CameraMovement } from '@/lib/types/camera-control';

const logger = createLogger('generate-video');

const apiKeyService = new ApiKeyService();
const cameraControlService = CameraControlService.getInstance();

/**
 * POST /api/replicate/generate-video
 * Cria uma predição Replicate e retorna o ID imediatamente.
 * O cliente faz polling em /api/replicate/prediction-status para acompanhar o progresso.
 */
const schema = z.object({
  modelId: z.string().min(1, 'Model ID é obrigatório'),
  prompt: z.string().min(1, 'Prompt é obrigatório'),
  imageUrl: z.string().url().nullish(),
  imageParamName: z.string().optional(), // nome do parâmetro de imagem do modelo (ex: 'image', 'start_image', 'first_frame_image')
  duration: z.number().optional(),
  personaId: z.string().optional(),
  cameraMovement: z.string().optional(),
});

export const POST = withCredits('video', async (req, { userId }) => {
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

    let input: Record<string, unknown> = { prompt: validated.prompt };
    if (validated.imageUrl) {
      const imageParam = validated.imageParamName || 'image';
      input[imageParam] = validated.imageUrl;
    }
    if (validated.duration) input.duration = validated.duration;

    // Veo 3 requer generate_audio: true para ativar a geração de áudio nativo
    if (validated.modelId.startsWith('google/veo-3')) {
      input.generate_audio = true;
    }

    if (validated.cameraMovement) {
      input = cameraControlService.buildCameraInput(
        validated.modelId,
        validated.cameraMovement as CameraMovement,
        input
      );
    }

    logger.info('Criando predição Replicate', { modelId: validated.modelId, userId });

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
    logger.error('Video generation error:', { error });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Falha ao gerar vídeo';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
