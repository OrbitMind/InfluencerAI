export interface AIModel {
  id: string
  name: string
  description: string
  provider: string
  type: "image" | "video"
  inputSchema?: Record<string, unknown>
  runCount?: number
  coverImage?: string | null
}

export const IMAGE_MODELS: AIModel[] = [
  {
    id: "black-forest-labs/flux-pro",
    name: "Flux Pro",
    description: "Geração de imagens de alta qualidade",
    provider: "black-forest-labs",
    type: "image",
  },
  {
    id: "black-forest-labs/flux-schnell",
    name: "Flux Schnell",
    description: "Geração de imagens rápida",
    provider: "black-forest-labs",
    type: "image",
  },
  {
    id: "black-forest-labs/flux-dev",
    name: "Flux Dev",
    description: "Modelo de desenvolvimento Flux",
    provider: "black-forest-labs",
    type: "image",
  },
  {
    id: "stability-ai/stable-diffusion-3",
    name: "Stable Diffusion 3",
    description: "Última versão do Stable Diffusion",
    provider: "stability-ai",
    type: "image",
  },
  {
    id: "bytedance/sdxl-lightning-4step",
    name: "SDXL Lightning",
    description: "Geração ultra-rápida em 4 passos",
    provider: "bytedance",
    type: "image",
  },
]

export const VIDEO_MODELS: AIModel[] = [
  {
    id: "tencent/hunyuan-video",
    name: "HunyuanVideo",
    description: "Geração de vídeo open source da Tencent",
    provider: "tencent",
    type: "video",
  },
  {
    id: "minimax/video-01",
    name: "MiniMax Video",
    description: "Geração de vídeo de alta qualidade",
    provider: "minimax",
    type: "video",
  },
  {
    id: "luma/ray",
    name: "Luma Ray",
    description: "Geração de vídeo fotorrealista",
    provider: "luma",
    type: "video",
  },
  {
    id: "genmo/mochi-1-preview",
    name: "Mochi 1",
    description: "Modelo de vídeo open source",
    provider: "genmo",
    type: "video",
  },
  {
    id: "fofr/kling-v1.5-pro",
    name: "Kling v1.5 Pro",
    description: "Controle de câmera cinematográfico nativo (pan, tilt, zoom, orbit)",
    provider: "fofr",
    type: "video",
  },
  {
    id: "stability-ai/wan-2.5",
    name: "Wan 2.5",
    description: "Geração de vídeo image-to-video de alta fidelidade",
    provider: "stability-ai",
    type: "video",
  },
]

export interface LLMModel {
  id: string
  name: string
  provider: "openai" | "google"
  description: string
}

export const REFINER_MODELS: LLMModel[] = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Rápido e econômico",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Mais inteligente e criativo",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    description: "Alta performance",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "google",
    description: "Rápido e versátil",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    description: "Mais capaz e preciso",
  },
  {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    provider: "google",
    description: "Última versão experimental",
  },
]
