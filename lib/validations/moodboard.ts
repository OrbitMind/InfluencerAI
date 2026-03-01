import { z } from 'zod'
import { MOODBOARD_CATEGORIES } from '@/lib/types/moodboard'

export const createMoodboardItemSchema = z.object({
  imageUrl: z.string().url('URL de imagem inválida'),
  publicId: z.string().min(1, 'Public ID é obrigatório'),
  caption: z.string().max(200).optional(),
  category: z.enum(MOODBOARD_CATEGORIES).optional(),
})

export const updateMoodboardSchema = z.object({
  colorPalette: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida')).max(10).optional(),
  styleTags: z.array(z.string().min(1).max(50)).max(20).optional(),
})

export const generateAiSummarySchema = z.object({
  personaId: z.string().min(1),
})

export const reorderItemsSchema = z.object({
  items: z.array(z.object({
    id: z.string().min(1),
    sortOrder: z.number().int().min(0),
  })).min(1),
})

export type CreateMoodboardItemInput = z.infer<typeof createMoodboardItemSchema>
export type UpdateMoodboardInput = z.infer<typeof updateMoodboardSchema>
