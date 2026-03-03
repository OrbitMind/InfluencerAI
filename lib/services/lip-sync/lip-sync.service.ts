import Replicate from 'replicate';
import { getStorageService } from '@/lib/services/storage/factory';
import type {
  LipSyncModel,
  LipSyncModelInfo,
  LipSyncParams,
  LipSyncResult,
} from '@/lib/types/lip-sync';
import { LIP_SYNC_MODELS, DEFAULT_LIP_SYNC_MODEL } from '@/lib/types/lip-sync';

export class LipSyncService {
  private static instance: LipSyncService;

  private constructor() {}

  static getInstance(): LipSyncService {
    if (!LipSyncService.instance) {
      LipSyncService.instance = new LipSyncService();
    }
    return LipSyncService.instance;
  }

  getModels(): LipSyncModelInfo[] {
    return LIP_SYNC_MODELS;
  }

  getModel(id: LipSyncModel): LipSyncModelInfo | undefined {
    return LIP_SYNC_MODELS.find((m) => m.id === id);
  }

  private async resolveModelRef(apiKey: string, modelId: string): Promise<`${string}/${string}`> {
    const parts = modelId.split('/');
    if (parts.length < 2) return modelId as `${string}/${string}`;
    const [owner, name] = parts;
    try {
      const resp = await fetch(`https://api.replicate.com/v1/models/${owner}/${name}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        const versionId: string | undefined = data?.latest_version?.id;
        if (versionId) return `${modelId}:${versionId}` as `${string}/${string}`;
      }
    } catch { /* fall through */ }
    return modelId as `${string}/${string}`;
  }

  async generateLipSync(
    replicateKey: string,
    userId: string,
    params: LipSyncParams
  ): Promise<LipSyncResult> {
    const startTime = Date.now();
    const model = params.model || DEFAULT_LIP_SYNC_MODEL;
    const modelInfo = this.getModel(model);

    if (!modelInfo) {
      throw new Error(`Modelo de lip sync '${model}' não encontrado`);
    }

    const replicate = new Replicate({ auth: replicateKey, useFileOutput: false });
    const input = this.buildModelInput(model, params.imageUrl, params.audioUrl);

    const modelRef = await this.resolveModelRef(replicateKey, modelInfo.replicateModelId);
    const output = await replicate.run(modelRef, { input });

    const videoUrl = Array.isArray(output) ? output[0] : output;
    if (!videoUrl || typeof videoUrl !== 'string') {
      throw new Error('Output inválido do modelo de lip sync');
    }

    // Upload to storage
    const storage = getStorageService();
    const uploadResult = await storage.upload({
      url: videoUrl,
      userId,
      type: 'video',
      folder: 'influencer-ai/lip-sync',
    });

    const durationMs = Date.now() - startTime;

    return {
      videoUrl: uploadResult.url,
      publicId: uploadResult.publicId,
      model,
      durationMs,
    };
  }

  private buildModelInput(
    model: LipSyncModel,
    imageUrl: string,
    audioUrl: string
  ): Record<string, unknown> {
    switch (model) {
      case 'sadtalker':
        return {
          source_image: imageUrl,
          driven_audio: audioUrl,
          preprocess: 'crop',
        };
      case 'wav2lip':
        return {
          face: imageUrl,
          audio: audioUrl,
        };
      case 'liveportrait':
        return {
          image: imageUrl,
          audio: audioUrl,
        };
      default:
        throw new Error(`Modelo de lip sync '${model}' não suportado`);
    }
  }
}
