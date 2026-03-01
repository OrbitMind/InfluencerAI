import type { FaceConsistencyStrategyConfig, FaceConsistencyStrategyName } from '@/lib/types/face-consistency';

export const FACE_CONSISTENCY_STRATEGIES: Record<FaceConsistencyStrategyName, FaceConsistencyStrategyConfig> = {
  'pulid': {
    name: 'pulid',
    label: 'PuLID',
    modelId: 'bytedance/pulid',
    description: 'Alta preservação de identidade facial com qualidade superior (recomendado)',
    inputMapping: {
      faceImage: 'main_face_image',
      prompt: 'prompt',
      strength: 'identity_scale',
    },
    defaultStrength: 0.8,
    minStrength: 0.0,
    maxStrength: 5.0,
    strengthStep: 0.1,
  },
  'instant-id': {
    name: 'instant-id',
    label: 'InstantID',
    modelId: 'zsxkib/instant-id',
    description: 'Alta fidelidade facial, ideal para retratos realistas',
    inputMapping: {
      faceImage: 'image',
      prompt: 'prompt',
      strength: 'controlnet_conditioning_scale',
    },
    defaultStrength: 0.8,
    minStrength: 0.0,
    maxStrength: 1.0,
    strengthStep: 0.05,
  },
  'photomaker': {
    name: 'photomaker',
    label: 'PhotoMaker',
    modelId: 'tencentarc/photomaker',
    description: 'Versátil para diferentes estilos e contextos. Inclua "img" no prompt.',
    inputMapping: {
      faceImage: 'input_image',
      prompt: 'prompt',
      strength: 'style_strength_ratio',
    },
    defaultStrength: 20,
    minStrength: 15,
    maxStrength: 50,
    strengthStep: 1,
  },
};

export const DEFAULT_STRATEGY: FaceConsistencyStrategyName = 'pulid';

export const FACE_CONSISTENCY_STRATEGY_LIST = Object.values(FACE_CONSISTENCY_STRATEGIES);
