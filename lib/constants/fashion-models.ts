export interface FashionTryOnModelConfig {
  id: string
  label: string
  replicateModelId: string
  description: string
  inputMapping: {
    personImage: string
    garmentImage: string
    prompt?: string
  }
}

export const FASHION_TRYON_MODELS: Record<string, FashionTryOnModelConfig> = {
  leffa: {
    id: 'leffa',
    label: 'LEFFA Try-On',
    replicateModelId: 'viktorfa/leffa',
    description: 'Virtual try-on de alta qualidade para roupas e acessórios (recomendado)',
    inputMapping: {
      personImage: 'human_image',
      garmentImage: 'garment_image',
    },
  },
  idm_vton: {
    id: 'idm_vton',
    label: 'IDM-VTON',
    replicateModelId: 'cuuupid/idm-vton',
    description: 'Try-on alternativo com alta fidelidade de textura',
    inputMapping: {
      personImage: 'human_img',
      garmentImage: 'garm_img',
      prompt: 'garment_des',
    },
  },
}

export const DEFAULT_TRYON_MODEL = 'leffa'

export const BACKGROUND_REMOVAL_MODEL = 'lucataco/rembg'

export const FASHION_TRYON_MODEL_LIST = Object.values(FASHION_TRYON_MODELS)
