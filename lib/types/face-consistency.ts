export type FaceConsistencyStrategyName = 'pulid' | 'instant-id' | 'photomaker';

export interface FaceConsistencyStrategyConfig {
  name: FaceConsistencyStrategyName;
  label: string;
  modelId: string;
  description: string;
  inputMapping: {
    faceImage: string;
    prompt: string;
    strength: string;
  };
  defaultStrength: number;
  minStrength: number;
  maxStrength: number;
  strengthStep: number;
}

export interface ConsistentImageParams {
  personaId: string;
  strategy: FaceConsistencyStrategyName;
  prompt: string;
  faceImageUrl: string;
  strength: number;
  aspectRatio?: string;
  negativePrompt?: string;
}

export interface ConsistentImageResult {
  imageUrl: string;
  publicId: string;
  modelId: string;
  strategy: FaceConsistencyStrategyName;
  strength: number;
  generationId: string;
}
