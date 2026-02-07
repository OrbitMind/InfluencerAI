import type { ReplicateModel } from '@/lib/types/replicateModels'

/**
 * Serviço responsável por deduplicar modelos
 * Princípio: Single Responsibility Principle (SRP)
 * Responsabilidade: remover duplicatas de listas de modelos
 */
export class ModelDeduplicatorService {
  /**
   * Remove modelos duplicados baseado em owner/name
   */
  deduplicate(models: ReplicateModel[]): ReplicateModel[] {
    const idSet = new Set<string>()
    const uniqueModels: ReplicateModel[] = []

    for (const model of models) {
      const id = this.getModelId(model)
      
      if (!idSet.has(id)) {
        idSet.add(id)
        uniqueModels.push(model)
      }
    }

    return uniqueModels
  }

  /**
   * Mescla múltiplas listas de modelos removendo duplicatas
   */
  mergeAndDeduplicate(...modelLists: ReplicateModel[][]): ReplicateModel[] {
    const allModels = modelLists.flat()
    return this.deduplicate(allModels)
  }

  /**
   * Gera ID único do modelo
   */
  private getModelId(model: ReplicateModel): string {
    return `${model.owner}/${model.name}`
  }
}

// Singleton instance
export const modelDeduplicator = new ModelDeduplicatorService()
