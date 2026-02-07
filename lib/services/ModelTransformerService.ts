import type { ReplicateModel, TransformedModel } from '@/lib/types/replicateModels'

/**
 * Serviço responsável por transformar modelos da API Replicate
 * Princípio: Single Responsibility Principle (SRP)
 * Responsabilidade: transformar dados brutos em formato adequado para UI
 */
export class ModelTransformerService {
  /**
   * Transforma um modelo bruto do Replicate em formato padronizado
   */
  transform(model: ReplicateModel, type: 'image' | 'video'): TransformedModel {
    return {
      id: `${model.owner}/${model.name}`,
      name: this.formatName(model.name),
      description: this.truncateDescription(model.description),
      provider: model.owner,
      type,
      runCount: model.run_count,
      coverImage: model.cover_image_url,
    }
  }

  /**
   * Transforma múltiplos modelos
   */
  transformMany(models: ReplicateModel[], type: 'image' | 'video'): TransformedModel[] {
    return models
      .filter(model => model.latest_version !== null)
      .map(model => this.transform(model, type))
  }

  /**
   * Formata o nome do modelo para melhor legibilidade
   */
  private formatName(name: string): string {
    return name
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * Trunca a descrição para um tamanho máximo
   */
  private truncateDescription(description: string | undefined, maxLength = 120): string {
    if (!description) return 'Sem descrição'
    return description.slice(0, maxLength)
  }
}

// Singleton instance
export const modelTransformer = new ModelTransformerService()
