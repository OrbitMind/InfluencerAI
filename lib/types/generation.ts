export interface ImageGenerationState {
  modelId: string
  prompt: string
  isLoading: boolean
  imageUrl: string | null
  error: string | null
  generatedAt: Date | null
  requestId: string | null
  predictionId: string | null
  generationPhase: GenerationPhase
  generationLog: GenerationLogEntry[]
}

export type GenerationPhase =
  | 'idle'
  | 'creating'
  | 'starting'
  | 'processing'
  | 'uploading'
  | 'done'
  | 'failed'

export interface GenerationLogEntry {
  phase: GenerationPhase
  message: string
  timestamp: Date
}

export interface VideoGenerationState {
  modelId: string
  videoIntention: import('@/lib/constants/video-intentions').VideoIntention
  cameraMovement: import('@/lib/types/camera-control').CameraMovement | undefined
  productName: string
  productDescription: string
  callToAction: string
  additionalPrompt: string
  sourceImageUrl: string
  isLoading: boolean
  videoUrl: string | null
  error: string | null
  generatedAt: Date | null
  requestId: string | null
  predictionId: string | null
  generationPhase: GenerationPhase
  generationLog: GenerationLogEntry[]
}

export interface GenerationHistory {
  id: string
  type: "image" | "video"
  modelId: string
  prompt: string
  outputUrl: string
  createdAt: Date
}
