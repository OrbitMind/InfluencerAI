import { PromptRefinerFactory } from "@/lib/services/prompt-refiners/PromptRefinerFactory"
import { ApiKeyService } from "@/lib/services/api-key/api-key.service"
import { withAuth } from "@/lib/utils/auth"
import { NextResponse } from "next/server"

const apiKeyService = new ApiKeyService()

/**
 * POST /api/refine-prompt
 * Refina um prompt usando LLM (OpenAI ou Google)
 * Busca a API key do provider do banco de dados
 */
export const POST = withAuth(async (request, { userId }) => {
  try {
    const { prompt, type, model, provider } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt é obrigatório" }, { status: 400 })
    }

    const activeProvider = provider || "openai"

    // Buscar API key do banco
    const activeApiKey = await apiKeyService.getApiKey(userId, activeProvider)

    if (!activeApiKey) {
      return NextResponse.json(
        { error: `Chave API do ${activeProvider === "google" ? "Google" : "OpenAI"} não configurada` },
        { status: 401 },
      )
    }

    const refiner = PromptRefinerFactory.create(activeProvider, activeApiKey, model)
    const refinedPrompt = await refiner.refine(prompt, type || "image")

    return NextResponse.json({ refinedPrompt })
  } catch (error) {
    console.error("Erro ao refinar prompt:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro interno ao refinar prompt"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
})
