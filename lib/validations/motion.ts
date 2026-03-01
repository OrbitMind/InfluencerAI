import { z } from 'zod'
import { ANIMATION_STYLES } from '@/lib/types/motion'

export const motionGenerationSchema = z.object({
  personaId: z.string().min(1, 'Persona é obrigatória'),
  sourceImageUrl: z.string().url().optional(),
  animationStyle: z.enum(ANIMATION_STYLES),
  customPrompt: z.string().max(1000).optional(),
  referenceVideoUrl: z.string().url().optional(),
  duration: z.number().int().min(2).max(10).optional(),
  modelId: z.string().optional(),
})

export type MotionGenerationInput = z.infer<typeof motionGenerationSchema>
