"use client"

import { REFINER_MODELS, type LLMModel } from "@/lib/types/models"
import { LocalStorageService } from "@/lib/utils/localStorageUtils"
import { createContext, useCallback, useContext, useState, type ReactNode } from "react"

/**
 * Contexto para gerenciamento de configurações LLM (Language Model)
 * Princípio: Single Responsibility Principle (SRP) refatorado
 * Responsabilidade: gerenciar modelo selecionado e suas configurações
 */

interface LLMContextType {
  selectedModel: LLMModel
  setSelectedModel: (model: LLMModel) => void
}

const LLMContext = createContext<LLMContextType | undefined>(undefined)

const STORAGE_KEY = 'refiner_model'

export function LLMProvider({ children }: { children: ReactNode }) {
  const [selectedModel, setSelectedModelState] = useState<LLMModel>(() => {
    const saved = LocalStorageService.get(STORAGE_KEY)
    if (saved) {
      const found = REFINER_MODELS.find((m) => m.id === saved)
      if (found) return found
    }
    return REFINER_MODELS[0]
  })

  const setSelectedModel = useCallback((model: LLMModel) => {
    setSelectedModelState(model)
    LocalStorageService.set(STORAGE_KEY, model.id)
  }, [])

  return (
    <LLMContext.Provider value={{ selectedModel, setSelectedModel }}>
      {children}
    </LLMContext.Provider>
  )
}

export function useLLM() {
  const context = useContext(LLMContext)
  if (context === undefined) {
    throw new Error("useLLM must be used within an LLMProvider")
  }
  return context
}
