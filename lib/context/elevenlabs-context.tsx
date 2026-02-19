"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

interface ElevenLabsContextType {
  isConfigured: boolean
  isLoading: boolean
  saveApiKey: (key: string) => Promise<boolean>
  clearApiKey: () => Promise<void>
}

const ElevenLabsContext = createContext<ElevenLabsContextType | undefined>(undefined)

export function ElevenLabsProvider({ children }: { children: ReactNode }) {
  const [isConfigured, setIsConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/api-keys')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setIsConfigured(data.data.some((k: { provider: string }) => k.provider === 'elevenlabs'))
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const saveApiKey = useCallback(async (key: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'elevenlabs', apiKey: key }),
      })
      if (!res.ok) return false
      setIsConfigured(true)
      return true
    } catch {
      return false
    }
  }, [])

  const clearApiKey = useCallback(async () => {
    try {
      const res = await fetch('/api/user/api-keys')
      const data = await res.json()
      if (data.success && data.data) {
        const key = data.data.find((k: { provider: string }) => k.provider === 'elevenlabs')
        if (key) await fetch(`/api/user/api-keys/${key.id}`, { method: 'DELETE' })
      }
    } catch (error) {
      console.error('Error deleting ElevenLabs API key:', error)
    }
    setIsConfigured(false)
  }, [])

  // Clean up legacy localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("elevenlabs_api_key")
    }
  }, [])

  return (
    <ElevenLabsContext.Provider value={{ isConfigured, isLoading, saveApiKey, clearApiKey }}>
      {children}
    </ElevenLabsContext.Provider>
  )
}

export function useElevenLabs() {
  const context = useContext(ElevenLabsContext)
  if (context === undefined) {
    throw new Error("useElevenLabs must be used within an ElevenLabsProvider")
  }
  return context
}
