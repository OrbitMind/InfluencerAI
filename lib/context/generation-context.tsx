"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { GenerationHistory } from "@/lib/types/generation"

interface GenerationContextType {
  generatedImageUrl: string | null
  setGeneratedImageUrl: (url: string | null) => void
  history: GenerationHistory[]
  addToHistory: (item: Omit<GenerationHistory, "id" | "createdAt">) => void
  clearHistory: () => void
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined)

export function GenerationProvider({ children }: { children: ReactNode }) {
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [history, setHistory] = useState<GenerationHistory[]>([])

  const addToHistory = useCallback((item: Omit<GenerationHistory, "id" | "createdAt">) => {
    const newItem: GenerationHistory = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    }
    setHistory((prev) => [newItem, ...prev])
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  return (
    <GenerationContext.Provider
      value={{
        generatedImageUrl,
        setGeneratedImageUrl,
        history,
        addToHistory,
        clearHistory,
      }}
    >
      {children}
    </GenerationContext.Provider>
  )
}

export function useGeneration() {
  const context = useContext(GenerationContext)
  if (context === undefined) {
    throw new Error("useGeneration must be used within a GenerationProvider")
  }
  return context
}
