import Replicate from 'replicate'
import { GenerationService } from '@/lib/services/generation/generation.service'
import { FASHION_TRYON_MODELS, DEFAULT_TRYON_MODEL } from '@/lib/constants/fashion-models'
import type { TryOnParams, TryOnResult } from '@/lib/types/fashion'

/**
 * FashionTryOnService (SRP + Singleton)
 * Responsabilidade única: pipeline de virtual try-on usando modelos Replicate.
 */
export class FashionTryOnService {
  private static instance: FashionTryOnService
  private generationService = new GenerationService()

  private constructor() {}

  static getInstance(): FashionTryOnService {
    if (!FashionTryOnService.instance) {
      FashionTryOnService.instance = new FashionTryOnService()
    }
    return FashionTryOnService.instance
  }

  async generateTryOn(
    replicateKey: string,
    userId: string,
    params: TryOnParams,
    modelKey = DEFAULT_TRYON_MODEL
  ): Promise<TryOnResult> {
    const modelConfig = FASHION_TRYON_MODELS[modelKey] ?? FASHION_TRYON_MODELS[DEFAULT_TRYON_MODEL]

    const replicate = new Replicate({ auth: replicateKey, useFileOutput: false })

    const input: Record<string, unknown> = {
      [modelConfig.inputMapping.personImage]: params.personaImageUrl,
      [modelConfig.inputMapping.garmentImage]: params.productImageUrl,
    }

    if (modelConfig.inputMapping.prompt) {
      const promptParts: string[] = ['wearing the clothing item']
      if (params.style) promptParts.push(`${params.style} style`)
      if (params.occasion) promptParts.push(`${params.occasion} occasion`)
      if (params.additionalPrompt) promptParts.push(params.additionalPrompt)
      input[modelConfig.inputMapping.prompt] = promptParts.join(', ')
    }

    const output = await replicate.run(
      modelConfig.replicateModelId as `${string}/${string}`,
      { input }
    )

    const outputUrl = Array.isArray(output) ? output[0] : (output as string)
    if (!outputUrl || typeof outputUrl !== 'string') {
      throw new Error('Output inválido do modelo de try-on')
    }

    const generation = await this.generationService.createGeneration({
      userId,
      type: 'image',
      modelId: modelConfig.replicateModelId,
      prompt: `Fashion try-on: ${params.style ?? 'casual'} style`,
      settings: {
        personaImageUrl: params.personaImageUrl,
        productImageUrl: params.productImageUrl,
        style: params.style,
        occasion: params.occasion,
      },
      replicateUrl: outputUrl,
      personaId: params.personaId,
    })

    return {
      generationId: generation.id,
      outputUrl: generation.outputUrl,
      publicId: generation.publicId,
      modelId: modelConfig.replicateModelId,
    }
  }
}
