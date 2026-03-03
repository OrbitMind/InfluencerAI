import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { ApiKeyService } from '@/lib/services/api-key/api-key.service';
import { GenerationService } from '@/lib/services/generation/generation.service';
import { withAuth } from '@/lib/utils/auth';

const logger = createLogger('prediction-status');
const apiKeyService = new ApiKeyService();
const generationService = new GenerationService();

/**
 * GET /api/replicate/prediction-status?id=xxx&modelId=xxx&prompt=xxx&personaId=xxx&type=image|video
 * Consulta o status de uma predição Replicate.
 * Quando succeeded, faz upload para Cloudinary + salva no banco e retorna a URL do output.
 */
export const GET = withAuth(async (req: NextRequest, { userId }: { userId: string }) => {
  try {
    const { searchParams } = new URL(req.url);
    const predictionId = searchParams.get('id');
    const modelId = searchParams.get('modelId');
    const prompt = searchParams.get('prompt');
    const personaId = searchParams.get('personaId') || undefined;
    const type = (searchParams.get('type') as 'image' | 'video') || 'video';

    if (!predictionId) {
      return NextResponse.json({ success: false, error: 'predictionId é obrigatório' }, { status: 400 });
    }

    const replicateKey = await apiKeyService.getApiKeyWithEnvFallback(userId, 'replicate');
    if (!replicateKey) {
      return NextResponse.json({ success: false, error: 'API key do Replicate não encontrada' }, { status: 400 });
    }

    const resp = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${replicateKey}` },
    });

    if (!resp.ok) {
      const body = await resp.text();
      logger.error('Erro ao consultar predição', { predictionId, status: resp.status, body });
      return NextResponse.json({ success: false, error: 'Erro ao consultar predição no Replicate' }, { status: 502 });
    }

    const prediction = await resp.json();
    const status: string = prediction.status; // 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'

    logger.info('Status da predição', { predictionId, status, type, userId });

    if (status === 'failed' || status === 'canceled') {
      const errorMsg = prediction.error || `Predição ${status}`;
      return NextResponse.json({ success: true, data: { status, error: errorMsg } });
    }

    if (status !== 'succeeded') {
      return NextResponse.json({ success: true, data: { status } });
    }

    // ─── succeeded ───
    const output = prediction.output;
    const outputUrl = Array.isArray(output) ? output[0] : output;

    if (!outputUrl || typeof outputUrl !== 'string') {
      logger.error('Output inválido da predição', { predictionId, output });
      return NextResponse.json({ success: false, error: 'Output inválido do Replicate' }, { status: 500 });
    }

    logger.info('Predição concluída, iniciando upload', { predictionId, type });

    const generation = await generationService.createGeneration({
      userId,
      type,
      modelId: modelId || prediction.model || 'unknown',
      prompt: prompt || '',
      settings: { predictionId },
      replicateUrl: outputUrl,
      personaId,
    });

    logger.info('Upload concluído', { generationId: generation.id, type });

    return NextResponse.json({
      success: true,
      data: {
        status: 'succeeded',
        outputUrl: generation.outputUrl,
        thumbnailUrl: generation.thumbnailUrl,
        generationId: generation.id,
      },
    });
  } catch (error: unknown) {
    logger.error('Erro no prediction-status', { error });
    const message = error instanceof Error ? error.message : 'Erro ao verificar predição';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
