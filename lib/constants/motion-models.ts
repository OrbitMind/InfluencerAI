import type { MotionModelInfo } from '@/lib/types/motion'

export const MOTION_MODELS: Record<string, MotionModelInfo> = {
  'stable-video-diffusion': {
    id: 'stable-video-diffusion',
    name: 'Stable Video Diffusion',
    replicateModelId: 'stability-ai/stable-video-diffusion',
    description: 'Anima imagens com movimento físico realista e fluido',
    supportsReferenceVideo: false,
    supportsStylePrompt: false,
    pros: ['Movimento físico realista', 'Muito rápido', 'Alta consistência'],
    cons: ['Sem controle por texto', 'Curta duração (~2s)'],
  },

  'minimax-video': {
    id: 'minimax-video',
    name: 'MiniMax Video',
    replicateModelId: 'minimax/video-01-live',
    description: 'Anima personas com controle detalhado por prompt de texto',
    supportsReferenceVideo: false,
    supportsStylePrompt: true,
    recommended: true,
    pros: ['Controle por texto', 'Mantém identidade da persona', 'Boa qualidade'],
    cons: ['Mais lento'],
  },

  'live-portrait-motion': {
    id: 'live-portrait-motion',
    name: 'LivePortrait Motion',
    replicateModelId: 'fofr/live-portrait',
    description: 'Anima retratos seguindo movimentos de um vídeo de referência',
    supportsReferenceVideo: true,
    supportsStylePrompt: false,
    pros: ['Expressões ricas', 'Sincroniza com vídeo de referência', 'Visual cinematográfico'],
    cons: ['Requer vídeo de referência', 'Requer imagem de alta qualidade'],
  },
}

export const DEFAULT_MOTION_MODEL = 'minimax-video'

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
