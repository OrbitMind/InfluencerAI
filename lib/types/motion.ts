export type MotionModelId = 'stable-video-diffusion' | 'minimax-video' | 'live-portrait-motion'

export const ANIMATION_STYLES = [
  'walk', 'dance', 'wave', 'nod', 'talk', 'laugh', 'sit', 'stand-up', 'custom',
] as const
export type AnimationStyle = typeof ANIMATION_STYLES[number]

export interface MotionModelInfo {
  id: MotionModelId
  name: string
  replicateModelId: string
  description: string
  supportsReferenceVideo: boolean
  supportsStylePrompt: boolean
  recommended?: boolean  // destaque como opção recomendada na UI
  pros: string[]
  cons: string[]
}

export interface MotionParams {
  personaId: string
  sourceImageUrl?: string     // imagem da persona (usa referenceImageUrl se omitido)
  animationStyle: AnimationStyle
  customPrompt?: string       // usado quando style = 'custom' ou para enriquecer
  referenceVideoUrl?: string  // vídeo de referência para motion capture
  duration?: number
  modelId?: string            // ID interno (ex: 'minimax-video') ou Replicate ID direto (ex: 'minimax/video-01-live')
}

/** Retorno imediato do POST /api/motion (predição criada, ainda processando) */
export interface MotionPredictionData {
  predictionId: string
  modelId: string
  prompt: string
  personaId: string
}

export interface MotionResult {
  generationId: string
  outputUrl: string
  thumbnailUrl?: string
  modelId: string
  animationStyle: AnimationStyle
}
