import type { MotionModelInfo } from '@/lib/types/motion'

export const MOTION_MODELS: Record<string, MotionModelInfo> = {
  'animate-diff': {
    id: 'animate-diff',
    name: 'AnimateDiff',
    replicateModelId: 'lucataco/animate-diff',
    description: 'Anima imagens estáticas com movimentos fluidos e naturais',
    supportsReferenceVideo: false,
    supportsStylePrompt: true,
    pros: ['Movimentos suaves', 'Bom para expressões faciais', 'Rápido'],
    cons: ['Sem controle de pose'],
  },
  cogvideox: {
    id: 'cogvideox',
    name: 'CogVideoX',
    replicateModelId: 'devxpy/cogvideox-5b',
    description: 'Geração de vídeo de alta qualidade com controle por prompt',
    supportsReferenceVideo: true,
    supportsStylePrompt: true,
    pros: ['Alta qualidade', 'Controle detalhado por prompt', 'Coerência temporal'],
    cons: ['Mais lento'],
  },
  'live-portrait-motion': {
    id: 'live-portrait-motion',
    name: 'LivePortrait Motion',
    replicateModelId: 'fofr/live-portrait',
    description: 'Anima retratos com expressões e movimentos de vídeos de referência',
    supportsReferenceVideo: true,
    supportsStylePrompt: false,
    pros: ['Expressões ricas', 'Segue movimentos de referência', 'Visual cinematográfico'],
    cons: ['Requer imagem de alta qualidade'],
  },
}

export const DEFAULT_MOTION_MODEL = 'animate-diff'

export const MOTION_MODEL_LIST = Object.values(MOTION_MODELS)

export const ANIMATION_STYLE_PROMPTS: Record<string, string> = {
  walk: 'person walking naturally, smooth stride, confident posture',
  dance: 'person dancing gracefully, fluid body movement, rhythmic',
  wave: 'person waving hand at camera, friendly gesture, natural arm movement',
  nod: 'person nodding head in agreement, natural head movement',
  talk: 'person talking expressively to camera, mouth movement, hand gestures',
  laugh: 'person laughing naturally, joyful expression, authentic emotion',
  sit: 'person sitting down gracefully, relaxed posture, natural movement',
  'stand-up': 'person standing up from seated position, confident movement',
  custom: '',
}
