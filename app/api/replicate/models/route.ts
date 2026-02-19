import { modelDeduplicator } from "@/lib/services/ModelDeduplicatorService"
import { modelSorter } from "@/lib/services/ModelSorterService"
import { modelTransformer } from "@/lib/services/ModelTransformerService"
import { ReplicateModelsService } from "@/lib/services/ReplicateModelsService"
import { ApiKeyService } from "@/lib/services/api-key/api-key.service"
import { withAuth } from "@/lib/utils/auth"
import { NextResponse } from "next/server"

const apiKeyService = new ApiKeyService()

/**
 * Rota de API para buscar modelos do Replicate
 * Princípio: Single Responsibility Principle (SRP) refatorado
 * Responsabilidades reduzidas:
 * - Validação de entrada
 * - Orquestração de serviços
 * - Formatação de resposta
 * Responsabilidades extraídas:
 * - Busca de modelos → ReplicateModelsService
 * - Deduplicação → ModelDeduplicatorService
 * - Transformação → ModelTransformerService
 * - Ordenação → ModelSorterService
 */
export const GET = withAuth(async (request, { userId }) => {
  const { searchParams } = new URL(request.url)
  const type = (searchParams.get("type") || "image") as 'image' | 'video'
  const query = searchParams.get("query") || ""

  const apiKey = await apiKeyService.getApiKey(userId, 'replicate')

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key do Replicate não configurada" },
      { status: 400 },
    )
  }

  try {
    // Cria instância do serviço de busca
    const modelsService = new ReplicateModelsService(apiKey)

    // Busca modelos (com ou sem query)
    const rawModels = query.trim()
      ? await modelsService.searchModels(query)
      : await modelsService.fetchWithFallback(type)

    // Processa modelos: deduplica → transforma → ordena
    const uniqueModels = modelDeduplicator.deduplicate(rawModels)
    const transformedModels = modelTransformer.transformMany(uniqueModels, type)
    const sortedModels = modelSorter.sortByPopularity(transformedModels)

    return NextResponse.json({
      success: true,
      data: {
        models: sortedModels,
        total: sortedModels.length
      },
    })
  } catch (error) {
    console.error("Erro ao buscar modelos:", error)

    return NextResponse.json(
      { error: "Erro interno ao buscar modelos" },
      { status: 500 },
    )
  }
})
