import { VIDEO_MODELS } from '@/lib/types/models'

/** Returns the correct input param name for passing a source image to a video model */
export function getVideoSourceImageParam(modelId: string): string {
  const model = VIDEO_MODELS.find(m => m.id === modelId)
  return model?.sourceImageParam ?? 'image'
}
