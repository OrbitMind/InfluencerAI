import type { PlacementScene } from '@/lib/types/product-placement'

export const PLACEMENT_SCENES: Record<string, PlacementScene> = {
  lifestyle: {
    id: 'lifestyle',
    label: 'Lifestyle',
    description: 'Produto integrado em cena de estilo de vida',
    promptSuffix: 'product placed naturally in a lifestyle setting, bright airy indoor space, warm natural light, authentic everyday environment',
    icon: '🏡',
  },
  home: {
    id: 'home',
    label: 'Home',
    description: 'Produto em ambiente doméstico elegante',
    promptSuffix: 'product displayed on a clean modern surface at home, minimal background, professional home staging, soft window light',
    icon: '🛋️',
  },
  cafe: {
    id: 'cafe',
    label: 'Café',
    description: 'Produto em mesa de café moderno',
    promptSuffix: 'product on a cafe table, artisan coffee shop setting, warm ambient light, wooden table, bokeh background, cozy atmosphere',
    icon: '☕',
  },
  outdoor: {
    id: 'outdoor',
    label: 'Outdoor',
    description: 'Produto em ambiente externo natural',
    promptSuffix: 'product in an outdoor setting, natural environment, golden hour lighting, fresh open air, lifestyle outdoor photography',
    icon: '🌿',
  },
  studio: {
    id: 'studio',
    label: 'Studio',
    description: 'Produto em fundo estúdio profissional',
    promptSuffix: 'product on clean white or gradient studio background, professional product photography, studio lighting setup, commercial quality',
    icon: '📸',
  },
  fashion: {
    id: 'fashion',
    label: 'Fashion',
    description: 'Produto em contexto fashion editorial',
    promptSuffix: 'product in a high fashion editorial setting, dramatic lighting, luxury aesthetic, magazine-quality photography, editorial style',
    icon: '👗',
  },
}

export const PLACEMENT_SCENE_LIST = Object.values(PLACEMENT_SCENES)
