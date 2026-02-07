"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface ReplicateContextType {
  apiKey: string | null
  setApiKey: (key: string) => void
  clearApiKey: () => void
  isConfigured: boolean
}

const ReplicateContext = createContext<ReplicateContextType | undefined>(undefined)

export function ReplicateProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("replicate_api_key")
    }
    return null
  })

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key)
    if (typeof window !== "undefined") {
      localStorage.setItem("replicate_api_key", key)
    }
  }, [])

  const clearApiKey = useCallback(() => {
    setApiKeyState(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("replicate_api_key")
    }
  }, [])

  return (
    <ReplicateContext.Provider
      value={{
        apiKey,
        setApiKey,
        clearApiKey,
        isConfigured: !!apiKey,
      }}
    >
      {children}
    </ReplicateContext.Provider>
  )
}

export function useReplicate() {
  const context = useContext(ReplicateContext)
  if (context === undefined) {
    throw new Error("useReplicate must be used within a ReplicateProvider")
  }
  return context
}
