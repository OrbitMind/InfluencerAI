"use client"

import { LocalStorageService } from "@/lib/utils/localStorageUtils"
import { createContext, useCallback, useContext, useState, type ReactNode } from "react"

/**
 * Contexto para gerenciamento de API Key do Google
 * Princípio: Single Responsibility Principle (SRP)
 * Responsabilidade: gerenciar APENAS API key do Google
 */

interface GoogleContextType {
  apiKey: string | null
  setApiKey: (key: string) => void
  clearApiKey: () => void
  isConfigured: boolean
}

const GoogleContext = createContext<GoogleContextType | undefined>(undefined)

const STORAGE_KEY = 'google_api_key'

export function GoogleProvider({ children }: { children: ReactNode }) {
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
    <GoogleContext.Provider
      value={{
        apiKey,
        setApiKey,
        clearApiKey,
        isConfigured,
      }}
    >
      {children}
    </GoogleContext.Provider>
  )
}

export function useGoogle() {
  const context = useContext(GoogleContext)
  if (context === undefined) {
    throw new Error("useGoogle must be used within a GoogleProvider")
  }
  return context
}
