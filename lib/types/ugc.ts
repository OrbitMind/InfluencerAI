export const UGC_SUBCATEGORIES = [
  'unboxing',
  'review',
  'testimonial',
  'pov',
  'day-in-life',
  'before-after',
  'grwm',
] as const
export type UGCSubcategory = typeof UGC_SUBCATEGORIES[number]

export const UGC_SUBCATEGORY_LABELS: Record<UGCSubcategory, string> = {
  unboxing: 'Unboxing',
  review: 'Review',
  testimonial: 'Testemunho',
  pov: 'POV',
  'day-in-life': 'Day in My Life',
  'before-after': 'Before & After',
  grwm: 'Get Ready With Me',
}

export const UGC_SUBCATEGORY_ICONS: Record<UGCSubcategory, string> = {
  unboxing: '📦',
  review: '⭐',
  testimonial: '💬',
  pov: '🤳',
  'day-in-life': '🌅',
  'before-after': '✨',
  grwm: '💄',
}

export interface UGCTemplateDefinition {
  slug: string
  name: string
  description: string
  subcategory: UGCSubcategory
  icon: string
  imagePromptTemplate: string
  videoPromptTemplate: string
  narrationTemplate?: string
  defaultCameraMovement: string
  variables: Array<{
    name: string
    label: string
    required: boolean
    type: 'text' | 'textarea' | 'select'
    placeholder?: string
    options?: string[]
  }>
}
