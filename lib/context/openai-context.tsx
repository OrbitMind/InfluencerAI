"use client"

import { LocalStorageService } from "@/lib/utils/localStorageUtils"
import { createContext, useCallback, useContext, useState, type ReactNode } from "react"

/**
 * Contexto para gerenciamento de API Key do OpenAI
 * Princípio: Single Responsibility Principle (SRP) refatorado
 * Responsabilidade: gerenciar APENAS API key do OpenAI
 */

interface OpenAIContextType {
  apiKey: string | null
  setApiKey: (key: string) => void
  clearApiKey: () => void
  isConfigured: boolean
}

const OpenAIContext = createContext<OpenAIContextType | undefined>(undefined)

const STORAGE_KEY = 'openai_api_key'

export function OpenAIProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    return LocalStorageService.get(STORAGE_KEY)
  })

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key)
    LocalStorageService.set(STORAGE_KEY, key)
  }, [])

  const clearApiKey = useCallback(() => {
    setApiKeyState(null)
    LocalStorageService.remove(STORAGE_KEY)
  }, [])

  const isConfigured = !!apiKey

  return (
    <OpenAIContext.Provider
      value={{
        apiKey,
        setApiKey,
        clearApiKey,
        isConfigured,
      }}
    >
      {children}
    </OpenAIContext.Provider>
  )
}

export function useOpenAI() {
  const context = useContext(OpenAIContext)
  if (context === undefined) {
    throw new Error("useOpenAI must be used within an OpenAIProvider")
  }
  return context
}
