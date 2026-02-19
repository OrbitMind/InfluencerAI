"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

interface ReplicateContextType {
  isConfigured: boolean
  isLoading: boolean
  saveApiKey: (key: string) => Promise<boolean>
  clearApiKey: () => Promise<void>
  recheckKey: () => Promise<void>
}

const ReplicateContext = createContext<ReplicateContextType | undefined>(undefined)

export function ReplicateProvider({ children }: { children: ReactNode }) {
  const [isConfigured, setIsConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const checkApiKey = useCallback(async () => {
    try {
      const res = await fetch('/api/user/api-keys')
      const data = await res.json()
      if (data.success && data.data) {
        const hasReplicate = data.data.some((k: { provider: string }) => k.provider === 'replicate')
        setIsConfigured(hasReplicate)
      } else {
        setIsConfigured(false)
      }
    } catch {
      setIsConfigured(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkApiKey()
  }, [checkApiKey])

  const saveApiKey = useCallback(async (key: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'replicate', apiKey: key }),
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
        const replicateKey = data.data.find((k: { provider: string }) => k.provider === 'replicate')
        if (replicateKey) {
          await fetch(`/api/user/api-keys/${replicateKey.id}`, { method: 'DELETE' })
        }
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
    }
    setIsConfigured(false)
  }, [])

  // Clean up any legacy localStorage data
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("replicate_api_key")
    }
  }, [])

  return (
    <ReplicateContext.Provider
      value={{
        isConfigured,
        isLoading,
        saveApiKey,
        clearApiKey,
        recheckKey: checkApiKey,
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
