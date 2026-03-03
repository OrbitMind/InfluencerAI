export interface AIModel {
  id: string
  name: string
  description: string
  provider: string
  type: "image" | "video"
  sourceImageParam?: string  // param name for image-to-video source (default: 'image')
  supportsImageInput?: boolean
  requiresSourceImage?: boolean  // model only works with an input image (image-to-video only)
  inputSchema?: Record<string, unknown>
  runCount?: number
  coverImage?: string | null
}

export const IMAGE_MODELS: AIModel[] = [
  {
    id: "google/nano-banana-pro",
    name: "Nano Banana Pro",
    description: "Google DeepMind — Gemini 3 Pro, estado da arte em geração de imagens, 4K",
    provider: "google",
    type: "image",
  },
  {
    id: "google/nano-banana-2",
    name: "Nano Banana 2",
    description: "Google — edição conversacional, fusão multi-imagem, consistência de personagem",
    provider: "google",
    type: "image",
  },
  {
    id: "google/nano-banana",
    name: "Nano Banana",
    description: "Google Gemini 2.5 Flash — geração 2-3x mais rápida, multimodal",
    provider: "google",
    type: "image",
  },
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
    id: "google/veo-3.1",
    name: "Veo 3.1",
    description: "Melhor qualidade geral com áudio nativo — aceita imagem de referência",
    provider: "google",
    type: "video",
    sourceImageParam: "image",
    supportsImageInput: true,
  },
  {
    id: "google/veo-3",
    name: "Veo 3",
    description: "Alta qualidade com áudio nativo gerado automaticamente",
    provider: "google",
    type: "video",
    sourceImageParam: "image",
    supportsImageInput: true,
  },
  {
    id: "google/veo-3-fast",
    name: "Veo 3 Fast",
    description: "Versão rápida e econômica do Veo 3 com áudio nativo",
    provider: "google",
    type: "video",
    sourceImageParam: "image",
    supportsImageInput: true,
  },
  {
    id: "kwaivgi/kling-v1.6-pro",
    name: "Kling v1.6 Pro",
    description: "Alta fidelidade image-to-video com câmera cinematográfica nativa",
    provider: "kwaivgi",
    type: "video",
    sourceImageParam: "start_image",
    supportsImageInput: true,
    requiresSourceImage: true,
  },
  {
    id: "fofr/kling-v1.5-pro",
    name: "Kling v1.5 Pro",
    description: "Controle de câmera cinematográfico nativo (pan, tilt, zoom, orbit)",
    provider: "fofr",
    type: "video",
    sourceImageParam: "image",
    supportsImageInput: true,
    requiresSourceImage: true,
  },
  {
    id: "minimax/video-01",
    name: "MiniMax Video",
    description: "Geração de vídeo image-to-video com frame inicial",
    provider: "minimax",
    type: "video",
    sourceImageParam: "first_frame_image",
    supportsImageInput: true,
    requiresSourceImage: true,
  },
  {
    id: "luma/ray",
    name: "Luma Ray",
    description: "Geração de vídeo fotorrealista",
    provider: "luma",
    type: "video",
    sourceImageParam: "image",
    supportsImageInput: true,
  },
  {
    id: "stability-ai/wan-2.5",
    name: "Wan 2.5",
    description: "Especialista em image-to-video de alta fidelidade",
    provider: "stability-ai",
    type: "video",
    sourceImageParam: "image",
    supportsImageInput: true,
  },
  {
    id: "tencent/hunyuan-video",
    name: "HunyuanVideo",
    description: "Geração de vídeo open source da Tencent",
    provider: "tencent",
    type: "video",
    supportsImageInput: false,
  },
  {
    id: "genmo/mochi-1-preview",
    name: "Mochi 1",
    description: "Modelo de vídeo open source",
    provider: "genmo",
    type: "video",
    supportsImageInput: false,
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
