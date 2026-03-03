export type ReplicateStatus = "starting" | "processing" | "succeeded" | "failed" | "canceled"

export interface ReplicateResponse {
  id: string
  model: string
  created_at: string
  updated_at: string
  status: ReplicateStatus
  input: Record<string, unknown>
  output: string | string[] | null
  error: string | null
  urls?: {
    get: string
    cancel: string
  }
}

export interface GenerateImageRequest {
  modelId: string
  prompt: string
  aspectRatio?: string
  width?: number
  height?: number
}

export interface GenerateVideoRequest {
  modelId: string
  prompt: string
  imageUrl?: string
  imageParamName?: string
  duration?: number
  cameraMovement?: string
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
}
