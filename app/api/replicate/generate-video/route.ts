import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Replicate from 'replicate';
import { ApiKeyService } from '@/lib/services/api-key/api-key.service';
import { GenerationService } from '@/lib/services/generation/generation.service';
import { withCredits } from '@/lib/utils/billing-middleware';

const apiKeyService = new ApiKeyService();
const generationService = new GenerationService();

/**
 * POST /api/replicate/generate-video
 * Gera vídeo usando Replicate e salva no histórico do usuário
 *
 * Fluxo:
 * 1. Valida autenticação
 * 2. Busca API key do Replicate do usuário (descriptografada)
 * 3. Gera vídeo com Replicate
 * 4. Faz upload para Cloudinary
 * 5. Salva no histórico do banco de dados
 */
const schema = z.object({
  modelId: z.string().min(1, 'Model ID é obrigatório'),
  prompt: z.string().min(1, 'Prompt é obrigatório'),
  imageUrl: z.string().url().optional(),
  duration: z.number().optional(),
  personaId: z.string().optional()
});

export const POST = withCredits('video', async (req, { userId }) => {
  try {
    const body = await req.json();
    const validated = schema.parse(body);

    // 1. Buscar API key do Replicate (descriptografada)
    const replicateKey = await apiKeyService.getApiKey(userId, 'replicate');

    if (!replicateKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'API key do Replicate não configurada. Configure em /dashboard/settings'
        },
        { status: 400 }
      );
    }

    // 2. Criar cliente Replicate (useFileOutput: false retorna URLs diretas ao invés de FileOutput objects)
    const replicate = new Replicate({ auth: replicateKey, useFileOutput: false });

    // 3. Construir input
    const input: Record<string, unknown> = {
      prompt: validated.prompt
    };

    if (validated.imageUrl) input.image = validated.imageUrl;
    if (validated.duration) input.duration = validated.duration;

    // 4. Gerar vídeo
    const output = await replicate.run(
      validated.modelId as `${string}/${string}`,
      { input }
    );

    // Normalizar output (pode ser string ou array de strings)
    const videoUrl = Array.isArray(output) ? output[0] : output;

    if (!videoUrl || typeof videoUrl !== 'string') {
      console.error('Replicate output inesperado:', output);
      throw new Error('Output inválido do Replicate');
    }

    // 5. Salvar geração (upload + banco)
    const generation = await generationService.createGeneration({
      userId,
      type: 'video',
      modelId: validated.modelId,
      prompt: validated.prompt,
      settings: { imageUrl: validated.imageUrl, duration: validated.duration },
      replicateUrl: videoUrl,
      personaId: validated.personaId
    });

    return NextResponse.json({
      success: true,
      data: {
        id: generation.id,
        videoUrl: generation.outputUrl,
        thumbnailUrl: generation.thumbnailUrl,
        prompt: generation.prompt,
        modelId: generation.modelId,
        createdAt: generation.createdAt
      }
    });
  } catch (error: any) {
    console.error('Video generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Falha ao gerar vídeo' },
      { status: 500 }
    );
  }
});
