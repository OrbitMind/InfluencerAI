import type { TransformedModel } from '@/lib/types/replicateModels'

/**
 * Serviço responsável por ordenar modelos
 * Princípio: Single Responsibility Principle (SRP)
 * Responsabilidade: ordenar listas de modelos por diferentes critérios
 */
export class ModelSorterService {
  /**
   * Ordena modelos por run count (decrescente)
   */
  sortByPopularity(models: TransformedModel[]): TransformedModel[] {
    return [...models].sort((a, b) => b.runCount - a.runCount)
  }

  /**
   * Ordena modelos por nome (alfabético)
   */
  sortByName(models: TransformedModel[]): TransformedModel[] {
    return [...models].sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * Ordena modelos por provider
   */
  sortByProvider(models: TransformedModel[]): TransformedModel[] {
    return [...models].sort((a, b) => a.provider.localeCompare(b.provider))
  }
}

// Singleton instance
export const modelSorter = new ModelSorterService()
