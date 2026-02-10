import type { ReplicateModel } from '@/lib/types/replicateModels'

/**
 * Palavras-chave para identificar modelos de vídeo
 */
const VIDEO_KEYWORDS = [
  'video',
  'vid',
  'animation',
  'movie',
  'film',
  'motion',
  'animate',
  'clip',
] as const

/**
 * Palavras-chave para identificar modelos de imagem
 */
const IMAGE_KEYWORDS = [
  'image',
  'img',
  'photo',
  'picture',
  'pic',
  'diffusion',
  'flux',
  'sdxl',
  'stable-diffusion',
  'sd',
] as const

/**
 * Serviço responsável por filtrar modelos por tipo
 * Princípio: Single Responsibility Principle (SRP)
 * Responsabilidade: determinar se um modelo é de imagem ou vídeo
 */
export class ModelFilterService {
  /**
   * Filtra modelos que correspondem ao tipo especificado
   */
  filterByType(models: ReplicateModel[], type: 'image' | 'video'): ReplicateModel[] {
    return models.filter(model => this.matchesType(model, type))
  }

  /**
   * Verifica se um modelo corresponde ao tipo especificado
   */
  private matchesType(model: ReplicateModel, type: 'image' | 'video'): boolean {
    const searchText = this.getSearchableText(model).toLowerCase()

    if (type === 'video') {
      // Se contém palavras-chave de vídeo e NÃO é explicitamente só de imagem
      const hasVideoKeyword = VIDEO_KEYWORDS.some(keyword =>
        searchText.includes(keyword)
      )
      const hasOnlyImageKeyword = this.isExplicitlyImageOnly(searchText)
      return hasVideoKeyword && !hasOnlyImageKeyword
    } else {
      // Para imagem: ou tem palavra-chave de imagem, ou não tem de vídeo
      const hasImageKeyword = IMAGE_KEYWORDS.some(keyword =>
        searchText.includes(keyword)
      )
      const hasVideoKeyword = VIDEO_KEYWORDS.some(keyword =>
        searchText.includes(keyword)
      )

      // Se tem palavra de imagem, é imagem
      // Se não tem palavra de vídeo e não tem de imagem, considera imagem (padrão)
      return hasImageKeyword || !hasVideoKeyword
    }
  }

  /**
   * Verifica se o modelo é explicitamente apenas de imagem
   */
  private isExplicitlyImageOnly(searchText: string): boolean {
    // Verifica se tem "to-image" ou "image-generation" mas não tem "to-video"
    const hasImageGeneration = searchText.includes('to-image') ||
                                searchText.includes('image-generation') ||
                                searchText.includes('text2img')

    const hasVideoGeneration = searchText.includes('to-video') ||
                                searchText.includes('video-generation') ||
                                searchText.includes('text2video')

    return hasImageGeneration && !hasVideoGeneration
  }

  /**
   * Combina nome, descrição e owner em um texto pesquisável
   */
  private getSearchableText(model: ReplicateModel): string {
    return [
      model.name,
      model.description || '',
      model.owner,
    ].join(' ')
  }
}

// Singleton instance
export const modelFilter = new ModelFilterService()
