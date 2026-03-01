import type { FaceConsistencyStrategyName } from './face-consistency';
import type { VoiceSettings } from './voice';
import type { ImagePromptContext, VideoPromptContext } from './persona';
import type { LipSyncModel } from './lip-sync';

export interface PipelinePersonaImageParams {
  personaId: string;
  promptContext: ImagePromptContext;
  modelId: string;
  aspectRatio?: string;
  useFaceConsistency: boolean;
  faceConsistencyStrategy?: FaceConsistencyStrategyName;
  faceConsistencyStrength?: number;
}

export interface PipelinePersonaVideoParams {
  personaId: string;
  promptContext: VideoPromptContext;
  modelId: string;
  sourceImageUrl?: string;
  duration?: number;
  sourceImageParam?: string; // override auto-detected param name (e.g. 'first_frame_image')
}

export interface PipelinePersonaVideoWithVoiceParams extends PipelinePersonaVideoParams {
  narrationText: string;
  voiceSettings?: Partial<VoiceSettings>;
}

export interface PipelineLipSyncParams {
  personaId: string;
  audioUrl: string;
  sourceImageUrl?: string;
  model?: LipSyncModel;
}

export interface PipelineResult {
  generationId: string;
  outputUrl: string;
  thumbnailUrl?: string;
  audioUrl?: string;
  personaId: string;
  assetId?: string;
  metadata: {
    modelId: string;
    prompt: string;
    strategy?: FaceConsistencyStrategyName;
    strength?: number;
    voiceId?: string;
    [key: string]: unknown;
  };
}
