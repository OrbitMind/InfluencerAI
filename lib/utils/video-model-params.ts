import { VIDEO_MODELS } from '@/lib/types/models'

/** Returns the correct input param name for passing a source image to a video model */
export function getVideoSourceImageParam(modelId: string): string {
  const model = VIDEO_MODELS.find(m => m.id === modelId)
  return model?.sourceImageParam ?? 'image'
}

/**
 * Valid duration values per model (seconds).
 * If not listed, any duration is accepted.
 */
const VIDEO_DURATION_CONSTRAINTS: Record<string, number[]> = {
  'google/veo-3':       [4, 6, 8],
  'google/veo-3-fast':  [4, 6, 8],
  'google/veo-3.1':     [4, 6, 8],
  'google/veo-3.1-fast':[4, 6, 8],
}

/**
 * Snaps the requested duration to the nearest valid value for the model.
 * Returns the original duration if the model has no constraints.
 */
export function normalizeVideoDuration(modelId: string, duration: number): number {
  const valid = VIDEO_DURATION_CONSTRAINTS[modelId]
  if (!valid?.length) return duration
  return valid.reduce((prev, curr) =>
    Math.abs(curr - duration) < Math.abs(prev - duration) ? curr : prev
  )
}
