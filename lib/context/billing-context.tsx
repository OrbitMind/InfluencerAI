"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { PlanInfo, SubscriptionInfo, CreditCost } from "@/lib/types/billing"

interface BillingContextType {
  balance: number
  subscription: SubscriptionInfo | null
  plans: PlanInfo[]
  costs: CreditCost | null
  isLoading: boolean
  showUpgrade: boolean

  fetchBalance: () => Promise<void>
  fetchPlans: () => Promise<void>
  setShowUpgrade: (show: boolean) => void
}

const BillingContext = createContext<BillingContextType | undefined>(undefined)

export function BillingProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(0)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [plans, setPlans] = useState<PlanInfo[]>([])
  const [costs, setCosts] = useState<CreditCost | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/balance")
      const json = await res.json()
      if (json.success) {
        setBalance(json.data.balance)
        setSubscription(json.data.subscription)
        setCosts(json.data.costs)
      }
    } catch (err) {
      console.error("Error fetching balance:", err)
    }
  }, [])

  const fetchPlans = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/billing/plans")
      const json = await res.json()
      if (json.success) {
        setPlans(json.data.plans)
      }
    } catch (err) {
      console.error("Error fetching plans:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load balance on mount
  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  return (
    <BillingContext.Provider
      value={{
        balance,
        subscription,
        plans,
        costs,
        isLoading,
        showUpgrade,
        fetchBalance,
        fetchPlans,
        setShowUpgrade,
      }}
    >
      {children}
    </BillingContext.Provider>
  )
}

export function useBilling() {
  const context = useContext(BillingContext)
  if (context === undefined) {
    throw new Error("useBilling must be used within a BillingProvider")
  }
  return context
}
