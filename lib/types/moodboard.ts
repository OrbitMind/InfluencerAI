export const MOODBOARD_CATEGORIES = ['lighting', 'outfit', 'background', 'pose', 'color_scheme'] as const
export type MoodboardCategory = typeof MOODBOARD_CATEGORIES[number]

export const MOODBOARD_STYLE_TAGS = [
  'cinematic', 'golden hour', 'minimalist', 'editorial', 'moody', 'vibrant',
  'dark academia', 'soft girl', 'street style', 'luxury', 'natural light',
  'studio lit', 'bokeh', 'high contrast', 'pastel', 'dramatic',
] as const
export type MoodboardStyleTag = typeof MOODBOARD_STYLE_TAGS[number]

export interface MoodboardItemData {
  id: string
  moodboardId: string
  imageUrl: string
  publicId: string
  caption: string | null
  category: string | null
  sortOrder: number
  createdAt: Date
}

export interface MoodboardData {
  id: string
  personaId: string
  items: MoodboardItemData[]
  colorPalette: string[] | null
  styleTags: string[]
  aiSummary: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateMoodboardItemDTO {
  imageUrl: string
  publicId: string
  caption?: string
  category?: MoodboardCategory
}

export interface UpdateMoodboardDTO {
  colorPalette?: string[]
  styleTags?: string[]
}
