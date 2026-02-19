import type { APIResponse, GenerateVideoRequest, ReplicateResponse } from '@/lib/types/replicate'
import type { IVideoGenerationService } from './interfaces/IGenerationService'

/**
 * Serviço responsável APENAS por fazer chamadas à API de geração de vídeos
 * Princípio: Single Responsibility Principle (SRP)
 * Responsabilidade: comunicação com API de geração de vídeos
 */
export class VideoGenerationService implements IVideoGenerationService {
  private readonly endpoint = '/api/replicate/generate-video'

  async generate(
    request: GenerateVideoRequest & { apiKey?: string }
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
        error: error instanceof Error ? error.message : 'Failed to generate video',
      }
    }
  }
}

// Singleton instance para reuso
export const videoGenerationService = new VideoGenerationService()
