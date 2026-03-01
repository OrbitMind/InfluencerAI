import { z } from 'zod'
import { PLACEMENT_SCENE_IDS } from '@/lib/types/product-placement'

export const productPlacementSchema = z.object({
  productImageUrl: z.string().url('URL do produto inválida'),
  productName: z.string().min(1, 'Nome do produto é obrigatório').max(100),
  scene: z.enum(PLACEMENT_SCENE_IDS),
  personaId: z.string().optional(),
  additionalPrompt: z.string().max(500).optional(),
})

export type ProductPlacementInput = z.infer<typeof productPlacementSchema>
