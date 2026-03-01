import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiKeyService } from '@/lib/services/api-key/api-key.service';
import { GenerationPipelineService } from '@/lib/services/pipeline/generation-pipeline.service';
import { withAuth } from '@/lib/utils/auth';
import { pipelinePersonaImageSchema } from '@/lib/validations/pipeline';

const apiKeyService = new ApiKeyService();
const pipelineService = GenerationPipelineService.getInstance();

export const POST = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json();
    const validated = pipelinePersonaImageSchema.parse(body);

    const replicateKey = await apiKeyService.getApiKeyWithEnvFallback(userId, 'replicate');
    if (!replicateKey) {
      return NextResponse.json(
        { success: false, error: 'API key do Replicate não configurada' },
        { status: 400 }
      );
    }

    const result = await pipelineService.generatePersonaImage(userId, replicateKey, validated);

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Falha no pipeline de imagem';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
