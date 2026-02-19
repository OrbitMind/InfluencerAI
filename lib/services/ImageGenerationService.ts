import type { APIResponse, GenerateImageRequest, ReplicateResponse } from '@/lib/types/replicate'
import type { IImageGenerationService } from './interfaces/IGenerationService'

/**
 * Serviço responsável APENAS por fazer chamadas à API de geração de imagens
 * Princípio: Single Responsibility Principle (SRP)
 * Responsabilidade: comunicação com API de geração de imagens
 */
export class ImageGenerationService implements IImageGenerationService {
  private readonly endpoint = '/api/replicate/generate-image'

  async generate(
    request: GenerateImageRequest & { apiKey?: string }
  ): Promise<APIResponse<ReplicateResponse>> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = await response.json()
      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image',
      }
    }
  }
}

// Singleton instance para reuso
export const imageGenerationService = new ImageGenerationService()
