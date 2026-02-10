import { CampaignRepository } from '@/lib/repositories/campaign.repository';
import { TemplateService } from './template.service';
import { CompositionService } from './composition.service';
import { PersonaService } from '@/lib/services/persona-service';
import { GenerationPipelineService } from '@/lib/services/pipeline/generation-pipeline.service';
import { VoiceService } from '@/lib/services/voice/voice.service';
import { ApiKeyService } from '@/lib/services/api-key/api-key.service';
import { getStorageService } from '@/lib/services/storage/factory';
import { SubtitleEngine } from '@/lib/services/subtitle/subtitle-engine';
import { VideoCompositionService } from '@/lib/services/composition/video-composition.service';
import type {
  CampaignFilters,
  CreateCampaignDTO,
  ExecuteCampaignOptions,
  ExecutionLogEntry,
  ExecutionStep,
  OverlayConfig,
  TemplateVariable,
} from '@/lib/types/campaign';
import type { CaptionStyle, SegmentationMode } from '@/lib/types/caption';
import type { LipSyncModel } from '@/lib/types/lip-sync';

const DEFAULT_STEPS: ExecutionStep[] = ['image', 'video', 'audio', 'lip-sync', 'compose', 'captions'];

export class CampaignService {
  private repository = new CampaignRepository();
  private templateService = new TemplateService();
  private personaService = new PersonaService();
  private pipelineService = GenerationPipelineService.getInstance();
  private compositionService = CompositionService.getInstance();
  private voiceService = VoiceService.getInstance();
  private subtitleEngine = SubtitleEngine.getInstance();
  private videoCompositionService = VideoCompositionService.getInstance();
  private apiKeyService = new ApiKeyService();

  async createCampaign(userId: string, data: CreateCampaignDTO) {
    // Validate persona exists
    await this.personaService.getPersona(userId, data.personaId);

    // Validate template exists
    const template = await this.templateService.getTemplate(data.templateId);

    // Validate variables
    if (data.variables) {
      const vars = (template.variables ?? []) as unknown as TemplateVariable[];
      const errors = this.templateService.validateVariables(vars, data.variables);
      if (errors.length > 0) {
        throw new Error(errors.join('; '));
      }
    }

    return this.repository.create(userId, {
      ...data,
      captionCustomStyle: data.captionCustomStyle as unknown as import('@prisma/client').Prisma.InputJsonValue | undefined,
      useLipSync: data.useLipSync,
      lipSyncModel: data.lipSyncModel,
    });
  }

  async getCampaign(userId: string, id: string) {
    const campaign = await this.repository.findById(id, userId);
    if (!campaign) throw new Error('Campanha não encontrada');
    return campaign;
  }

  async listCampaigns(userId: string, filters?: CampaignFilters) {
    const { campaigns, total } = await this.repository.findAllByUser(userId, filters);
    const page = filters?.page || 1;
    const limit = filters?.limit || 12;

    return {
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateCampaign(userId: string, id: string, data: Record<string, unknown>) {
    const campaign = await this.repository.findById(id, userId);
    if (!campaign) throw new Error('Campanha não encontrada');
    if (campaign.status !== 'draft') throw new Error('Apenas campanhas em rascunho podem ser editadas');

    return this.repository.update(id, userId, data);
  }

  async deleteCampaign(userId: string, id: string) {
    const campaign = await this.repository.findById(id, userId);
    if (!campaign) throw new Error('Campanha não encontrada');

    const storage = getStorageService();
    const publicIds = [
      campaign.imagePublicId,
      campaign.videoPublicId,
      campaign.audioPublicId,
      campaign.composedImagePublicId,
      campaign.composedVideoPublicId,
      campaign.lipSyncVideoPublicId,
    ].filter(Boolean) as string[];

    for (const publicId of publicIds) {
      try { await storage.delete(publicId); } catch { /* continue */ }
    }

    await this.repository.delete(id, userId);
  }

  async executeCampaign(userId: string, campaignId: string, options?: ExecuteCampaignOptions) {
    const campaign = await this.repository.findById(campaignId, userId);
    if (!campaign) throw new Error('Campanha não encontrada');

    const template = campaign.template;
    const persona = await this.personaService.getPersona(userId, campaign.personaId);
    const variables = (campaign.variables as Record<string, string>) || {};

    // Get API keys
    const replicateKey = await this.apiKeyService.getApiKey(userId, 'replicate');
    if (!replicateKey) throw new Error('API key do Replicate não configurada');

    const steps = options?.steps || DEFAULT_STEPS;
    const executionLog: ExecutionLogEntry[] = [];
    let hasAnySuccess = false;

    // Update status to running
    await this.repository.updateStatus(campaignId, userId, 'running', {
      startedAt: new Date(),
      errorMessage: null,
    });

    // Step 1: IMAGE
    if (steps.includes('image') && template.imagePromptTemplate) {
      const entry = await this.executeStep(
        'image',
        async () => {
          const prompt = this.templateService.resolvePrompt(
            template.imagePromptTemplate!,
            variables,
            persona.basePrompt || undefined
          );
          const result = await this.pipelineService.generatePersonaImage(userId, replicateKey, {
            personaId: campaign.personaId,
            promptContext: { additionalDetails: prompt },
            modelId: options?.imageModel || template.defaultImageModel || 'black-forest-labs/flux-schnell',
            aspectRatio: options?.aspectRatio || template.defaultAspectRatio || '1:1',
            useFaceConsistency: !!persona.referenceImageUrl,
          });
          await this.repository.update(campaignId, userId, {
            imageUrl: result.outputUrl,
            imagePublicId: result.metadata?.publicId || null,
          });
          return `Imagem gerada: ${result.outputUrl}`;
        }
      );
      executionLog.push(entry);
      if (entry.status === 'completed') hasAnySuccess = true;
    }

    // Step 2: VIDEO
    if (steps.includes('video') && template.videoPromptTemplate) {
      const entry = await this.executeStep(
        'video',
        async () => {
          const prompt = this.templateService.resolvePrompt(
            template.videoPromptTemplate!,
            variables,
            persona.basePrompt || undefined
          );
          // Use the generated image as source if available
          const currentCampaign = await this.repository.findById(campaignId, userId);
          const sourceImage = currentCampaign?.imageUrl || persona.referenceImageUrl || undefined;
          const result = await this.pipelineService.generatePersonaVideo(userId, replicateKey, {
            personaId: campaign.personaId,
            promptContext: { scenario: prompt },
            modelId: options?.videoModel || template.defaultVideoModel || 'minimax/video-01',
            sourceImageUrl: sourceImage,
            duration: options?.videoDuration || template.defaultVideoDuration || 5,
          });
          await this.repository.update(campaignId, userId, {
            videoUrl: result.outputUrl,
            videoPublicId: result.metadata?.publicId || null,
            videoThumbnailUrl: result.thumbnailUrl || null,
          });
          return `Vídeo gerado: ${result.outputUrl}`;
        }
      );
      executionLog.push(entry);
      if (entry.status === 'completed') hasAnySuccess = true;
    }

    // Step 3: AUDIO
    if (steps.includes('audio') && template.narrationTemplate && persona.voiceId) {
      const entry = await this.executeStep(
        'audio',
        async () => {
          const elevenLabsKey = await this.apiKeyService.getApiKey(userId, 'elevenlabs');
          if (!elevenLabsKey) throw new Error('API key do ElevenLabs não configurada');

          const narration = this.templateService.resolveNarration(
            template.narrationTemplate!,
            variables
          );
          const result = await this.voiceService.generateSpeech(elevenLabsKey, userId, {
            voiceId: persona.voiceId!,
            text: narration,
          });
          await this.repository.update(campaignId, userId, {
            audioUrl: result.audioUrl,
            audioPublicId: result.publicId,
          });
          return `Áudio gerado: ${result.audioUrl}`;
        }
      );
      executionLog.push(entry);
      if (entry.status === 'completed') hasAnySuccess = true;
    } else if (steps.includes('audio') && (!template.narrationTemplate || !persona.voiceId)) {
      executionLog.push({
        step: 'audio',
        status: 'skipped',
        details: !persona.voiceId ? 'Persona sem voz configurada' : 'Template sem narração',
      });
    }

    // Step 4: LIP SYNC
    if (steps.includes('lip-sync')) {
      const currentCampaignLS = await this.repository.findById(campaignId, userId);
      const shouldRunLipSync = (options?.useLipSync ?? currentCampaignLS?.useLipSync)
        && currentCampaignLS?.audioUrl
        && persona.referenceImageUrl;

      if (shouldRunLipSync) {
        const entry = await this.executeStep(
          'lip-sync',
          async () => {
            const model = (options?.lipSyncModel || currentCampaignLS!.lipSyncModel || 'sadtalker') as LipSyncModel;
            const result = await this.pipelineService.generatePersonaLipSyncVideo(userId, replicateKey, {
              personaId: campaign.personaId,
              audioUrl: currentCampaignLS!.audioUrl!,
              sourceImageUrl: currentCampaignLS!.imageUrl || persona.referenceImageUrl || undefined,
              model,
            });
            await this.repository.update(campaignId, userId, {
              lipSyncVideoUrl: result.outputUrl,
              lipSyncVideoPublicId: result.metadata?.publicId || null,
            });
            return `Vídeo lip sync gerado: ${result.outputUrl}`;
          }
        );
        executionLog.push(entry);
        if (entry.status === 'completed') hasAnySuccess = true;
      } else {
        executionLog.push({
          step: 'lip-sync',
          status: 'skipped',
          details: !(options?.useLipSync ?? currentCampaignLS?.useLipSync)
            ? 'Lip sync desabilitado'
            : !currentCampaignLS?.audioUrl
            ? 'Sem áudio gerado'
            : 'Persona sem imagem de referência',
        });
      }
    }

    // Step 5: COMPOSE
    if (steps.includes('compose')) {
      const currentCampaign = await this.repository.findById(campaignId, userId);
      const overlayConfig = template.overlayConfig as OverlayConfig | null;

      if (currentCampaign?.imagePublicId && overlayConfig?.enabled && overlayConfig?.text) {
        const entry = await this.executeStep(
          'compose',
          async () => {
            const overlayText = this.templateService.resolvePrompt(
              overlayConfig.text!,
              variables
            );
            const result = await this.compositionService.applyTextOverlay(
              currentCampaign.imagePublicId!,
              overlayText,
              overlayConfig
            );
            await this.repository.update(campaignId, userId, {
              composedImageUrl: result.url,
              composedImagePublicId: result.publicId,
            });
            return `Imagem composta gerada: ${result.url}`;
          }
        );
        executionLog.push(entry);
        if (entry.status === 'completed') hasAnySuccess = true;
      } else {
        executionLog.push({
          step: 'compose',
          status: 'skipped',
          details: !currentCampaign?.imagePublicId
            ? 'Sem imagem para compor'
            : !overlayConfig?.enabled
            ? 'Overlay desabilitado'
            : 'Sem texto para overlay',
        });
      }
    }

    // Step 5: CAPTIONS
    if (steps.includes('captions') && template.narrationTemplate) {
      const currentCampaign = await this.repository.findById(campaignId, userId);
      const hasAudio = !!currentCampaign?.audioUrl;

      if (hasAudio) {
        const entry = await this.executeStep(
          'captions',
          async () => {
            const narration = this.templateService.resolveNarration(
              template.narrationTemplate!,
              variables
            );

            const segMode = (currentCampaign.captionSegmentationMode as SegmentationMode) || 'timed';
            // Estimate duration: ~150 words/min for narration
            const wordCount = narration.split(/\s+/).length;
            const estimatedDuration = Math.max((wordCount / 150) * 60, 5);

            const segments = this.subtitleEngine.generateSegments(narration, estimatedDuration, segMode);
            const srtContent = this.subtitleEngine.generateSRT(segments);

            // Upload SRT to Cloudinary
            const srtResult = await this.compositionService.uploadSRT(srtContent, campaignId);

            // Resolve caption style
            const presetId = options?.captionPresetId || (currentCampaign.captionPresetId as string | undefined);
            const customStyle = options?.captionCustomStyle || (currentCampaign.captionCustomStyle as Partial<CaptionStyle> | undefined);
            const resolvedStyle = this.subtitleEngine.resolveStyle(presetId, customStyle ?? undefined);

            const subtitleData = {
              segments,
              totalDuration: estimatedDuration,
              segmentationMode: segMode,
              generatedAt: new Date().toISOString(),
            };

            const updateData: Record<string, unknown> = {
              subtitleData,
              srtUrl: srtResult.url,
            };

            // Try video composition with ffmpeg if video exists
            if (currentCampaign.videoUrl) {
              const assContent = this.subtitleEngine.generateASS(segments, resolvedStyle);
              const videoResult = await this.videoCompositionService.composeVideoWithCaptions(
                currentCampaign.videoUrl,
                assContent
              );
              if (videoResult) {
                updateData.composedVideoUrl = videoResult.url;
                updateData.composedVideoPublicId = videoResult.publicId;
              }
            }

            await this.repository.update(campaignId, userId, updateData);

            const hasComposedVideo = !!updateData.composedVideoUrl;
            return hasComposedVideo
              ? `Legendas geradas com vídeo composto: ${updateData.composedVideoUrl}`
              : `Legendas geradas (SRT): ${srtResult.url}`;
          }
        );
        executionLog.push(entry);
        if (entry.status === 'completed') hasAnySuccess = true;
      } else {
        executionLog.push({
          step: 'captions',
          status: 'skipped',
          details: 'Sem áudio gerado para criar legendas',
        });
      }
    } else if (steps.includes('captions') && !template.narrationTemplate) {
      executionLog.push({
        step: 'captions',
        status: 'skipped',
        details: 'Template sem narração para legendas',
      });
    }

    // Final status
    const allFailed = executionLog.every(e => e.status === 'failed' || e.status === 'skipped');
    const finalStatus = allFailed && executionLog.some(e => e.status === 'failed') ? 'failed' : hasAnySuccess ? 'completed' : 'failed';
    const errorMessages = executionLog
      .filter(e => e.status === 'failed')
      .map(e => `[${e.step}] ${e.error}`)
      .join('; ');

    await this.repository.update(campaignId, userId, {
      status: finalStatus,
      completedAt: new Date(),
      executionLog,
      errorMessage: errorMessages || null,
    });

    return this.repository.findById(campaignId, userId);
  }

  async duplicateCampaign(userId: string, campaignId: string) {
    const campaign = await this.repository.findById(campaignId, userId);
    if (!campaign) throw new Error('Campanha não encontrada');

    return this.repository.create(userId, {
      name: `${campaign.name} (cópia)`,
      description: campaign.description || undefined,
      personaId: campaign.personaId,
      templateId: campaign.templateId,
      variables: (campaign.variables as Record<string, string>) || undefined,
      captionPresetId: campaign.captionPresetId || undefined,
      captionCustomStyle: (campaign.captionCustomStyle as unknown as import('@prisma/client').Prisma.InputJsonValue) || undefined,
      captionSegmentationMode: campaign.captionSegmentationMode || undefined,
      useLipSync: campaign.useLipSync,
      lipSyncModel: campaign.lipSyncModel || undefined,
    });
  }

  private async executeStep(
    step: ExecutionStep,
    fn: () => Promise<string>
  ): Promise<ExecutionLogEntry> {
    const startedAt = new Date().toISOString();
    try {
      const details = await fn();
      const completedAt = new Date().toISOString();
      return {
        step,
        status: 'completed',
        startedAt,
        completedAt,
        durationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
        details,
      };
    } catch (error) {
      const completedAt = new Date().toISOString();
      return {
        step,
        status: 'failed',
        startedAt,
        completedAt,
        durationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }
}
