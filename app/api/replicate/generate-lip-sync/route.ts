import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiKeyService } from '@/lib/services/api-key/api-key.service';
import { GenerationPipelineService } from '@/lib/services/pipeline/generation-pipeline.service';
import { withCredits } from '@/lib/utils/billing-middleware';
import type { LipSyncModel } from '@/lib/types/lip-sync';

const apiKeyService = new ApiKeyService();
const pipelineService = GenerationPipelineService.getInstance();

const schema = z.object({
  personaId: z.string().min(1, 'personaId é obrigatório'),
  imageUrl: z.string().url('imageUrl deve ser uma URL válida'),
  audioUrl: z.string().url('audioUrl deve ser uma URL válida'),
  model: z.enum(['sadtalker', 'wav2lip', 'liveportrait']).default('sadtalker'),
});

export const POST = withCredits('lip-sync', async (req, { userId }) => {
  try {
    const body = await req.json();
    const validated = schema.parse(body);

    const replicateKey = await apiKeyService.getApiKeyWithEnvFallback(userId, 'replicate');
    if (!replicateKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'API key do Replicate não configurada. Configure em /dashboard/settings',
        },
        { status: 400 }
      );
    }

    const result = await pipelineService.generatePersonaLipSyncVideo(
      userId,
      replicateKey,
      {
        personaId: validated.personaId,
        audioUrl: validated.audioUrl,
        sourceImageUrl: validated.imageUrl,
        model: validated.model as LipSyncModel,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        generationId: result.generationId,
        videoUrl: result.outputUrl,
        model: validated.model,
        personaId: result.personaId,
      },
    });
  } catch (error: unknown) {
    console.error('Lip sync generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Falha ao gerar lip sync';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
});
