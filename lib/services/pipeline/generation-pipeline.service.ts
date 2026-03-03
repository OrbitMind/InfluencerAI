import Replicate from 'replicate';
import { PersonaService } from '@/lib/services/persona-service';
import { GenerationService } from '@/lib/services/generation/generation.service';
import { FaceConsistencyService } from '@/lib/services/face-consistency/face-consistency.service';
import { VoiceService } from '@/lib/services/voice/voice.service';
import { PromptBuilderService } from '@/lib/services/prompt-builder-service';
import { ApiKeyService } from '@/lib/services/api-key/api-key.service';
import { LipSyncService } from '@/lib/services/lip-sync/lip-sync.service';
import { CameraControlService } from '@/lib/services/camera-control/camera-control.service';
import type {
  PipelinePersonaImageParams,
  PipelinePersonaVideoParams,
  PipelinePersonaVideoWithVoiceParams,
  PipelineLipSyncParams,
  PipelineResult,
} from '@/lib/types/pipeline';
import type { VoiceSettings } from '@/lib/types/voice';
import type { CameraMovement } from '@/lib/types/camera-control'
import { getVideoSourceImageParam, normalizeVideoDuration } from '@/lib/utils/video-model-params';
import type { Prisma } from '@prisma/client';
import { toJsonValue } from '@/lib/utils/prisma-helpers';

export class GenerationPipelineService {
  private static instance: GenerationPipelineService;
  private personaService = new PersonaService();
  private generationService = new GenerationService();
  private faceConsistencyService = FaceConsistencyService.getInstance();
  private voiceService = VoiceService.getInstance();
  private apiKeyService = new ApiKeyService();
  private lipSyncService = LipSyncService.getInstance();
  private cameraControlService = CameraControlService.getInstance();

  private constructor() {}

  static getInstance(): GenerationPipelineService {
    if (!GenerationPipelineService.instance) {
      GenerationPipelineService.instance = new GenerationPipelineService();
    }
    return GenerationPipelineService.instance;
  }

  private buildPersonaAttrs(persona: Awaited<ReturnType<PersonaService['getPersona']>>) {
    return {
      name: persona.name ?? undefined,
      bio: persona.bio ?? undefined,
      gender: persona.gender ?? undefined,
      ageRange: persona.ageRange ?? undefined,
      ethnicity: persona.ethnicity ?? undefined,
      bodyType: persona.bodyType ?? undefined,
      hairColor: persona.hairColor ?? undefined,
      hairStyle: persona.hairStyle ?? undefined,
      eyeColor: persona.eyeColor ?? undefined,
      distinctiveFeatures: persona.distinctiveFeatures ?? undefined,
      styleDescription: persona.styleDescription ?? undefined,
      niche: persona.niche ?? undefined,
      contentTone: persona.contentTone ?? undefined,
      language: persona.language ?? undefined,
    };
  }

  async generatePersonaImage(
    userId: string,
    replicateKey: string,
    params: PipelinePersonaImageParams
  ): Promise<PipelineResult> {
    const persona = await this.personaService.getPersona(userId, params.personaId);
    const personaAttrs = this.buildPersonaAttrs(persona);
    const basePrompt = persona.basePrompt || PromptBuilderService.buildBasePrompt(personaAttrs);
    const fullPrompt = PromptBuilderService.buildImagePrompt(basePrompt, params.promptContext);

    // Face consistency path
    if (params.useFaceConsistency && persona.referenceImageUrl) {
      const result = await this.faceConsistencyService.generateConsistentImage(
        replicateKey,
        userId,
        {
          personaId: params.personaId,
          strategy: params.faceConsistencyStrategy || 'pulid',
          prompt: fullPrompt,
          faceImageUrl: persona.referenceImageUrl,
          strength: params.faceConsistencyStrength ?? 0.8,
          aspectRatio: params.aspectRatio,
        }
      );

      return {
        generationId: result.generationId,
        outputUrl: result.imageUrl,
        personaId: params.personaId,
        metadata: {
          modelId: result.modelId,
          prompt: fullPrompt,
          strategy: result.strategy,
          strength: result.strength,
        },
      };
    }

    // Standard generation path
    const replicate = new Replicate({ auth: replicateKey, useFileOutput: false });
    const input: Record<string, unknown> = { prompt: fullPrompt };
    if (params.aspectRatio) input.aspect_ratio = params.aspectRatio;

    const output = await replicate.run(
      params.modelId as `${string}/${string}`,
      { input }
    );

    const imageUrl = Array.isArray(output) ? output[0] : output;
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Output inválido do modelo');
    }

    const generation = await this.generationService.createGeneration({
      userId,
      type: 'image',
      modelId: params.modelId,
      prompt: fullPrompt,
      settings: { promptContext: params.promptContext, aspectRatio: params.aspectRatio },
      replicateUrl: imageUrl,
      personaId: params.personaId,
    });

    await this.personaService.addAsset(userId, params.personaId, {
      type: 'generated_image',
      url: generation.outputUrl,
      publicId: generation.publicId,
      prompt: fullPrompt,
      modelId: params.modelId,
    });

    return {
      generationId: generation.id,
      outputUrl: generation.outputUrl,
      personaId: params.personaId,
      metadata: { modelId: params.modelId, prompt: fullPrompt },
    };
  }

  async generatePersonaVideo(
    userId: string,
    replicateKey: string,
    params: PipelinePersonaVideoParams,
    preloadedPersona?: Awaited<ReturnType<PersonaService['getPersona']>>
  ): Promise<PipelineResult> {
    const persona = preloadedPersona ?? await this.personaService.getPersona(userId, params.personaId);
    const personaAttrs = this.buildPersonaAttrs(persona);
    const basePrompt = persona.basePrompt || PromptBuilderService.buildBasePrompt(personaAttrs);
    const fullPrompt = PromptBuilderService.buildVideoPrompt(basePrompt, params.promptContext);

    const replicate = new Replicate({ auth: replicateKey, useFileOutput: false });
    let input: Record<string, unknown> = { prompt: fullPrompt };

    const sourceImage = params.sourceImageUrl || persona.referenceImageUrl;
    if (sourceImage) {
      // Use explicit override → then registry → fallback 'image'
      const sourceImageParam = params.sourceImageParam ?? getVideoSourceImageParam(params.modelId);
      input[sourceImageParam] = sourceImage;
    }
    if (params.duration) input.duration = normalizeVideoDuration(params.modelId, params.duration);

    // Veo 3 requer generate_audio: true para ativar áudio nativo
    if (params.modelId.startsWith('google/veo-3')) {
      input.generate_audio = true;
    }

    // Enriquecer com camera control se especificado
    const cameraMovement = params.promptContext?.cameraMovement as CameraMovement | undefined;
    if (cameraMovement) {
      input = this.cameraControlService.buildCameraInput(params.modelId, cameraMovement, input);
    }

    const output = await replicate.run(
      params.modelId as `${string}/${string}`,
      { input }
    );

    const videoUrl = Array.isArray(output) ? output[0] : output;
    if (!videoUrl || typeof videoUrl !== 'string') {
      throw new Error('Output inválido do modelo');
    }

    const generation = await this.generationService.createGeneration({
      userId,
      type: 'video',
      modelId: params.modelId,
      prompt: fullPrompt,
      settings: { promptContext: params.promptContext, sourceImageUrl: sourceImage },
      replicateUrl: videoUrl,
      personaId: params.personaId,
    });

    await this.personaService.addAsset(userId, params.personaId, {
      type: 'generated_video',
      url: generation.outputUrl,
      publicId: generation.publicId,
      prompt: fullPrompt,
      modelId: params.modelId,
    });

    return {
      generationId: generation.id,
      outputUrl: generation.outputUrl,
      thumbnailUrl: generation.thumbnailUrl ?? undefined,
      personaId: params.personaId,
      metadata: { modelId: params.modelId, prompt: fullPrompt },
    };
  }

  async generatePersonaVideoWithVoice(
    userId: string,
    replicateKey: string,
    params: PipelinePersonaVideoWithVoiceParams
  ): Promise<PipelineResult> {
    const persona = await this.personaService.getPersona(userId, params.personaId);
    if (!persona.voiceId) {
      throw new Error('Persona não tem voz configurada');
    }

    const videoResult = await this.generatePersonaVideo(userId, replicateKey, params, persona);

    const elevenLabsKey = await this.apiKeyService.getApiKey(userId, 'elevenlabs');
    if (!elevenLabsKey) {
      throw new Error('API key do ElevenLabs não configurada');
    }

    const savedSettings = (persona.voiceSettings as Record<string, unknown>) || {};
    const mergedSettings: VoiceSettings = {
      stability: (params.voiceSettings?.stability ?? savedSettings.stability ?? 0.5) as number,
      similarity_boost: (params.voiceSettings?.similarity_boost ?? savedSettings.similarity_boost ?? 0.75) as number,
      style: (params.voiceSettings?.style ?? savedSettings.style ?? 0.0) as number,
      use_speaker_boost: (params.voiceSettings?.use_speaker_boost ?? savedSettings.use_speaker_boost ?? true) as boolean,
    };

    const audioResult = await this.voiceService.generateSpeech(
      elevenLabsKey,
      userId,
      {
        voiceId: persona.voiceId,
        text: params.narrationText,
        voiceSettings: mergedSettings,
      }
    );

    await this.personaService.addAsset(userId, params.personaId, {
      type: 'generated_audio',
      url: audioResult.audioUrl,
      publicId: audioResult.publicId,
      metadata: toJsonValue({
        voiceId: persona.voiceId,
        text: params.narrationText,
        associatedVideoId: videoResult.generationId,
      }),
    });

    return {
      ...videoResult,
      audioUrl: audioResult.audioUrl,
      metadata: {
        ...videoResult.metadata,
        voiceId: persona.voiceId,
        narrationText: params.narrationText,
      },
    };
  }

  async generatePersonaMotionVideo(
    userId: string,
    replicateKey: string,
    params: import('@/lib/types/motion').MotionParams
  ): Promise<import('@/lib/types/motion').MotionPredictionData> {
    const { MotionService } = await import('@/lib/services/motion/motion.service');
    const motionService = MotionService.getInstance();
    return motionService.createMotionPrediction(replicateKey, userId, params);
  }

  async generatePersonaLipSyncVideo(
    userId: string,
    replicateKey: string,
    params: PipelineLipSyncParams
  ): Promise<PipelineResult> {
    const persona = await this.personaService.getPersona(userId, params.personaId);
    const sourceImage = params.sourceImageUrl || persona.referenceImageUrl;

    if (!sourceImage) {
      throw new Error('Persona sem imagem de referência para lip sync');
    }

    const model = params.model || 'sadtalker';
    const modelInfo = this.lipSyncService.getModel(model);
    const replicateModelId = modelInfo?.replicateModelId || 'lucataco/sadtalker';

    const result = await this.lipSyncService.generateLipSync(replicateKey, userId, {
      personaId: params.personaId,
      imageUrl: sourceImage,
      audioUrl: params.audioUrl,
      model,
    });

    const generation = await this.generationService.createGeneration({
      userId,
      type: 'video',
      modelId: replicateModelId,
      prompt: `Lip sync generation (${model})`,
      settings: {
        sourceImageUrl: sourceImage,
        audioUrl: params.audioUrl,
        lipSyncModel: model,
      },
      replicateUrl: result.videoUrl,
      personaId: params.personaId,
    });

    await this.personaService.addAsset(userId, params.personaId, {
      type: 'generated_video',
      url: generation.outputUrl,
      publicId: generation.publicId,
      metadata: toJsonValue({
        lipSync: true,
        model,
        audioUrl: params.audioUrl,
      }),
    });

    return {
      generationId: generation.id,
      outputUrl: generation.outputUrl,
      personaId: params.personaId,
      metadata: {
        modelId: replicateModelId,
        prompt: `Lip sync generation (${model})`,
        lipSyncModel: model,
      },
    };
  }
}
