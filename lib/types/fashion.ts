export const FASHION_CATEGORIES = ['clothing', 'accessories', 'beauty', 'electronics', 'food'] as const
export type FashionCategory = typeof FASHION_CATEGORIES[number]

export const FASHION_STYLES = ['casual', 'formal', 'street', 'luxury', 'sport', 'bohemian'] as const
export type FashionStyle = typeof FASHION_STYLES[number]

export const FASHION_OCCASIONS = ['everyday', 'night', 'event', 'beach', 'work', 'workout'] as const
export type FashionOccasion = typeof FASHION_OCCASIONS[number]

export interface ProductAssetData {
  id: string
  userId: string
  name: string
  imageUrl: string
  publicId: string
  bgRemovedUrl: string | null
  bgRemovedId: string | null
  brandName: string | null
  category: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateProductAssetDTO {
  name: string
  imageUrl: string
  publicId: string
  brandName?: string
  category?: FashionCategory
}

export interface ProductAssetFilters {
  category?: FashionCategory
  search?: string
  page?: number
  limit?: number
}

export interface TryOnParams {
  personaImageUrl: string
  productImageUrl: string    // preferencialmente sem background
  personaId?: string
  style?: FashionStyle
  occasion?: FashionOccasion
  additionalPrompt?: string
}

export interface TryOnResult {
  generationId: string
  outputUrl: string
  publicId: string
  modelId: string
}
