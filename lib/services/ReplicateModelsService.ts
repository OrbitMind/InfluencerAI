import type { ReplicateCollectionResponse, ReplicateModel, ReplicateSearchResponse } from '@/lib/types/replicateModels'

/**
 * Configuração de coleções por tipo de modelo
 * Princípio: Open/Closed Principle (OCP)
 * Permite extensão sem modificar código existente
 */
const COLLECTION_CONFIG = {
  video: [
    'text-to-video',
    'image-to-video',
    'video-generation',
  ],
  image: [
    'text-to-image',
    'image-generation',
    'diffusion-models',
  ],
} as const

const FALLBACK_SEARCH_QUERIES = {
  video: 'video generation',
  image: 'image generation',
} as const

/**
 * Serviço responsável por buscar modelos da API Replicate
 * Princípio: Single Responsibility Principle (SRP)
 * Responsabilidade: comunicação com API Replicate para busca de modelos
 */
export class ReplicateModelsService {
  private readonly baseUrl = 'https://api.replicate.com/v1'
  private readonly maxSearchPages = 10

  constructor(private apiKey: string) {}

  /**
   * Busca modelos de uma coleção específica
   */
  async fetchCollection(slug: string): Promise<ReplicateModel[]> {
    const response = await fetch(`${this.baseUrl}/collections/${slug}`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      return []
    }

    const data: ReplicateCollectionResponse = await response.json()
    return data.models || []
  }

  /**
   * Busca modelos por múltiplas coleções
   */
  async fetchCollections(slugs: string[]): Promise<ReplicateModel[]> {
    const promises = slugs.map(slug => this.fetchCollection(slug))
    const results = await Promise.all(promises)
    return results.flat()
  }

  /**
   * Busca modelos por tipo (image ou video)
   */
  async fetchByType(type: 'image' | 'video'): Promise<ReplicateModel[]> {
    const collections = COLLECTION_CONFIG[type]
    return this.fetchCollections(collections)
  }

  /**
   * Busca modelos por query de texto
   */
  async searchModels(query: string): Promise<ReplicateModel[]> {
    const allModels: ReplicateModel[] = []
    let nextUrl: string | null = `${this.baseUrl}/models?query=${encodeURIComponent(query)}`
    let pageCount = 0

    while (nextUrl && pageCount < this.maxSearchPages) {
      const response = await fetch(nextUrl, {
        headers: this.getHeaders(),
      })

      if (!response.ok) break

      const data: ReplicateSearchResponse = await response.json()
      allModels.push(...data.results)
      nextUrl = data.next
      pageCount++
    }

    return allModels
  }

  /**
   * Busca modelos com fallback para busca por texto se poucos resultados
   */
  async fetchWithFallback(
    type: 'image' | 'video',
    minResults = 5
  ): Promise<ReplicateModel[]> {
    let models = await this.fetchByType(type)

    if (models.length < minResults) {
      const fallbackQuery = FALLBACK_SEARCH_QUERIES[type]
      const searchResults = await this.searchModels(fallbackQuery)
      models = [...models, ...searchResults]
    }

    return models
  }

  /**
   * Gera headers para requisições à API
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }
}
