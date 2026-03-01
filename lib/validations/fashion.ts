import { z } from 'zod'
import { FASHION_CATEGORIES, FASHION_STYLES, FASHION_OCCASIONS } from '@/lib/types/fashion'

export const createProductAssetSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  imageUrl: z.string().url('URL inválida'),
  publicId: z.string().min(1, 'Public ID é obrigatório'),
  brandName: z.string().max(100).optional(),
  category: z.enum(FASHION_CATEGORIES).optional(),
})

export const productAssetFiltersSchema = z.object({
  category: z.enum(FASHION_CATEGORIES).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
})

export const tryOnSchema = z.object({
  personaImageUrl: z.string().url('URL da persona inválida'),
  productImageUrl: z.string().url('URL do produto inválida'),
  personaId: z.string().optional(),
  style: z.enum(FASHION_STYLES).optional(),
  occasion: z.enum(FASHION_OCCASIONS).optional(),
  additionalPrompt: z.string().max(500).optional(),
  modelId: z.string().optional(),
})

export type CreateProductAssetInput = z.infer<typeof createProductAssetSchema>
export type TryOnInput = z.infer<typeof tryOnSchema>
