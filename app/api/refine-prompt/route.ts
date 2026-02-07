import { PromptRefinerFactory } from "@/lib/services/prompt-refiners/PromptRefinerFactory"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Rota de API para refinamento de prompts
 * Princípio: Single Responsibility Principle (SRP) refatorado
 * Responsabilidades reduzidas:
 * - Validação de entrada
 * - Roteamento para serviço apropriado
 * - Formatação de resposta
 * Responsabilidades extraídas:
 * - Lógica de refinamento → PromptRefinerService (Strategy Pattern)
 * - System prompts → promptUtils
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt, type, apiKey, googleApiKey, model, provider } = await request.json()

    // Validação de entrada
    if (!prompt) {
      return NextResponse.json({ error: "Prompt é obrigatório" }, { status: 400 })
    }

    const activeProvider = provider || "openai"
    const activeApiKey = activeProvider === "google" ? googleApiKey : apiKey

    if (!activeApiKey) {
      return NextResponse.json(
        { error: `Chave API do ${activeProvider === "google" ? "Google" : "OpenAI"} não configurada` },
        { status: 401 },
      )
    }

    // Usa Factory Pattern para criar o refiner apropriado
    const refiner = PromptRefinerFactory.create(activeProvider, activeApiKey, model)

    // Delega a responsabilidade de refinamento para o serviço
    const refinedPrompt = await refiner.refine(prompt, type || "image")

    return NextResponse.json({ refinedPrompt })
  } catch (error) {
    console.error("Erro ao refinar prompt:", error)
    
    const errorMessage = error instanceof Error ? error.message : "Erro interno ao refinar prompt"
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
