import Replicate from 'replicate'
import { GenerationService } from '@/lib/services/generation/generation.service'
import { PLACEMENT_SCENES } from '@/lib/constants/placement-scenes'
import type { PlacementParams, PlacementResult } from '@/lib/types/product-placement'

const INPAINTING_MODEL = 'stability-ai/stable-diffusion-inpainting'

/**
 * ProductPlacementService (SRP + Singleton)
 * Responsabilidade única: pipeline de product placement gerando imagens de cena
 * com o produto integrado via prompt engineering e geração de imagem.
 */
export class ProductPlacementService {
  private static instance: ProductPlacementService
  private generationService = new GenerationService()

  private constructor() {}

  static getInstance(): ProductPlacementService {
    if (!ProductPlacementService.instance) {
      ProductPlacementService.instance = new ProductPlacementService()
    }
    return ProductPlacementService.instance
  }

  async generatePlacement(
    replicateKey: string,
    userId: string,
    params: PlacementParams
  ): Promise<PlacementResult> {
    const scene = PLACEMENT_SCENES[params.scene]
    if (!scene) throw new Error(`Cena inválida: ${params.scene}`)

    const promptParts: string[] = [
      `${params.productName} product`,
      scene.promptSuffix,
    ]
    if (params.additionalPrompt) promptParts.push(params.additionalPrompt)
    const fullPrompt = promptParts.join(', ')

    const replicate = new Replicate({ auth: replicateKey, useFileOutput: false })

    const input: Record<string, unknown> = {
      prompt: fullPrompt,
      image: params.productImageUrl,
      num_inference_steps: 30,
      guidance_scale: 7.5,
    }

    const output = await replicate.run(
      INPAINTING_MODEL as `${string}/${string}`,
      { input }
    )

    const outputUrl = Array.isArray(output) ? (output[0] as unknown as string) : (output as unknown as string)
    if (!outputUrl || typeof outputUrl !== 'string') {
      throw new Error('Output inválido do modelo de placement')
    }

    const generation = await this.generationService.createGeneration({
      userId,
      type: 'image',
      modelId: INPAINTING_MODEL,
      prompt: fullPrompt,
      settings: {
        productImageUrl: params.productImageUrl,
        scene: params.scene,
        productName: params.productName,
      },
      replicateUrl: outputUrl,
      personaId: params.personaId,
    })

    return {
      generationId: generation.id,
      outputUrl: generation.outputUrl,
      publicId: generation.publicId,
      scene: params.scene,
    }
  }
}
