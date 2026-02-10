"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { campaignApiService } from "@/lib/services/CampaignApiService"
import type { CampaignData, CampaignFilters, CreateCampaignDTO } from "@/lib/types/campaign"

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface CampaignContextType {
  campaigns: CampaignData[]
  isLoading: boolean
  error: string | null
  pagination: PaginationInfo | null

  fetchCampaigns: (filters?: CampaignFilters) => Promise<void>
  createCampaign: (data: CreateCampaignDTO) => Promise<CampaignData>
  deleteCampaign: (id: string) => Promise<void>
  refreshCampaign: (id: string) => Promise<CampaignData | null>
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined)

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)

  const fetchCampaigns = useCallback(async (filters?: CampaignFilters) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await campaignApiService.listCampaigns(filters)
      if (!res.success) throw new Error(res.error)

      setCampaigns(res.data!.campaigns)
      setPagination(res.data!.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar campanhas")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createCampaign = useCallback(async (data: CreateCampaignDTO): Promise<CampaignData> => {
    const res = await campaignApiService.createCampaign(data)
    if (!res.success) throw new Error(res.error)

    setCampaigns((prev) => [res.data!, ...prev])
    return res.data!
  }, [])

  const deleteCampaign = useCallback(async (id: string) => {
    const res = await campaignApiService.deleteCampaign(id)
    if (!res.success) throw new Error(res.error)

    setCampaigns((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const refreshCampaign = useCallback(async (id: string): Promise<CampaignData | null> => {
    const res = await campaignApiService.getCampaign(id)
    if (!res.success) return null

    setCampaigns((prev) => prev.map((c) => (c.id === id ? res.data! : c)))
    return res.data!
  }, [])

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        isLoading,
        error,
        pagination,
        fetchCampaigns,
        createCampaign,
        deleteCampaign,
        refreshCampaign,
      }}
    >
      {children}
    </CampaignContext.Provider>
  )
}

export function useCampaign() {
  const context = useContext(CampaignContext)
  if (context === undefined) {
    throw new Error("useCampaign must be used within a CampaignProvider")
  }
  return context
}
