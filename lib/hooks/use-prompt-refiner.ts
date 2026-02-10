"use client"

import { useState, useCallback } from "react"
import { useOpenAI } from "@/lib/context/openai-context"

interface UsePromptRefinerOptions {
  type: "image" | "video"
}

interface UsePromptRefinerReturn {
  refinePrompt: (prompt: string) => Promise<string | null>
  isRefining: boolean
  error: string | null
  clearError: () => void
}

export function usePromptRefiner({ type }: UsePromptRefinerOptions): UsePromptRefinerReturn {
  const { apiKey, isConfigured } = useOpenAI()
  const [isRefining, setIsRefining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const refinePrompt = useCallback(
    async (prompt: string): Promise<string | null> => {
      if (!isConfigured) {
        setError("Configure sua chave API do OpenAI nas configurações")
        return null
      }

      if (!prompt.trim()) {
        setError("Digite um prompt para refinar")
        return null
      }

      setIsRefining(true)
      setError(null)

      try {
        const response = await fetch("/api/refine-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            type,
            apiKey,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Erro ao refinar prompt")
        }

        return data.refinedPrompt
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao refinar prompt"
        setError(message)
        return null
      } finally {
        setIsRefining(false)
      }
    },
    [apiKey, isConfigured, type],
  )

  return { refinePrompt, isRefining, error, clearError }
}
