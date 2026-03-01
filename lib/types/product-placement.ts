export const PLACEMENT_SCENE_IDS = ['lifestyle', 'home', 'cafe', 'outdoor', 'studio', 'fashion'] as const
export type PlacementSceneId = typeof PLACEMENT_SCENE_IDS[number]

export interface PlacementScene {
  id: PlacementSceneId
  label: string
  description: string
  promptSuffix: string    // texto adicionado ao prompt para criar a cena
  icon: string
}

export interface PlacementParams {
  productImageUrl: string   // URL da imagem do produto (sem bg)
  productName: string
  scene: PlacementSceneId
  personaId?: string
  additionalPrompt?: string
}

export interface PlacementResult {
  generationId: string
  outputUrl: string
  publicId: string
  scene: PlacementSceneId
}
