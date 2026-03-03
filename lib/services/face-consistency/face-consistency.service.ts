import Replicate from 'replicate';
import { FACE_CONSISTENCY_STRATEGIES } from '@/lib/constants/face-consistency';
import { GenerationService } from '@/lib/services/generation/generation.service';
import { PersonaService } from '@/lib/services/persona-service';
import type {
  FaceConsistencyStrategyName,
  FaceConsistencyStrategyConfig,
  ConsistentImageParams,
  ConsistentImageResult,
} from '@/lib/types/face-consistency';
import { toJsonValue } from '@/lib/utils/prisma-helpers';

export class FaceConsistencyService {
  private static instance: FaceConsistencyService;
  private generationService = new GenerationService();
  private personaService = new PersonaService();

  private constructor() {}

  static getInstance(): FaceConsistencyService {
    if (!FaceConsistencyService.instance) {
      FaceConsistencyService.instance = new FaceConsistencyService();
    }
    return FaceConsistencyService.instance;
  }

  getStrategies(): FaceConsistencyStrategyConfig[] {
    return Object.values(FACE_CONSISTENCY_STRATEGIES);
  }

  getStrategy(name: FaceConsistencyStrategyName): FaceConsistencyStrategyConfig {
    const strategy = FACE_CONSISTENCY_STRATEGIES[name];
    if (!strategy) throw new Error(`Estratégia '${name}' não encontrada`);
    return strategy;
  }

  /**
   * Resolve o model identifier com version hash pinado.
   * Modelos community no Replicate exigem version hash para evitar 404.
   */
  private async resolveModelRef(apiKey: string, modelId: string): Promise<`${string}/${string}`> {
    const [owner, name] = modelId.split('/');
    try {
      const resp = await fetch(`https://api.replicate.com/v1/models/${owner}/${name}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        const versionId: string | undefined = data?.latest_version?.id;
        if (versionId) return `${modelId}:${versionId}` as `${string}/${string}`;
      }
    } catch { /* fall through to plain modelId */ }
    return modelId as `${string}/${string}`;
  }

  async generateConsistentImage(
    replicateAuth: string,
    userId: string,
    params: ConsistentImageParams
  ): Promise<ConsistentImageResult> {
    const strategy = this.getStrategy(params.strategy);
    const replicate = new Replicate({ auth: replicateAuth, useFileOutput: false });

    const input: Record<string, unknown> = {
      [strategy.inputMapping.faceImage]: params.faceImageUrl,
      [strategy.inputMapping.prompt]: params.prompt,
      [strategy.inputMapping.strength]: params.strength ?? strategy.defaultStrength,
    };

    if (params.aspectRatio) input.aspect_ratio = params.aspectRatio;
    if (params.negativePrompt) input.negative_prompt = params.negativePrompt;

    // PhotoMaker requer "img" no prompt
    if (params.strategy === 'photomaker' && !params.prompt.includes('img')) {
      input[strategy.inputMapping.prompt] = `img ${params.prompt}`;
    }

    // Pin version hash to avoid 404 on community models without official deployment
    const modelRef = await this.resolveModelRef(replicateAuth, strategy.modelId);

    const output = await replicate.run(modelRef, { input });

    const imageUrl = Array.isArray(output) ? output[0] : output;
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Output inválido do modelo de consistência facial');
    }

    const generation = await this.generationService.createGeneration({
      userId,
      type: 'image',
      modelId: strategy.modelId,
      prompt: params.prompt,
      settings: {
        strategy: params.strategy,
        strength: params.strength,
        faceImageUrl: params.faceImageUrl,
        faceConsistency: true,
      },
      replicateUrl: imageUrl,
      personaId: params.personaId,
    });

    await this.personaService.addAsset(userId, params.personaId, {
      type: 'generated_image',
      url: generation.outputUrl,
      publicId: generation.publicId,
      prompt: params.prompt,
      modelId: strategy.modelId,
      metadata: toJsonValue({
        strategy: params.strategy,
        strength: params.strength,
        faceConsistency: true,
      }),
    });

    return {
      imageUrl: generation.outputUrl,
      publicId: generation.publicId,
      modelId: strategy.modelId,
      strategy: params.strategy,
      strength: params.strength ?? strategy.defaultStrength,
      generationId: generation.id,
    };
  }
}
