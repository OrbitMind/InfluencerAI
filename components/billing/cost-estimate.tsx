"use client"

import { Coins, AlertTriangle } from "lucide-react"
import { useBilling } from "@/lib/context/billing-context"
import { CREDIT_COSTS, type CreditOperationType } from "@/lib/types/billing"

interface CostEstimateProps {
  steps?: string[]
  operationType?: CreditOperationType
}

export function CostEstimate({ steps, operationType }: CostEstimateProps) {
  const { balance } = useBilling()

  let cost = 0
  if (steps) {
    cost = steps.reduce((total, step) => {
      return total + (CREDIT_COSTS[step as CreditOperationType] ?? 0)
    }, 0)
  } else if (operationType) {
    cost = CREDIT_COSTS[operationType] ?? 0
  }

  if (cost === 0) return null

  const hasEnough = balance >= cost

  return (
    <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
      hasEnough ? "bg-muted/50" : "bg-destructive/10 text-destructive"
    }`}>
      {hasEnough ? (
        <Coins className="h-4 w-4 text-amber-500 shrink-0" />
      ) : (
        <AlertTriangle className="h-4 w-4 shrink-0" />
      )}
      <span>
        Custo: <strong>{cost}</strong> {cost === 1 ? "crédito" : "créditos"}
      </span>
      <span className="text-muted-foreground">|</span>
      <span className={hasEnough ? "text-muted-foreground" : ""}>
        Saldo: <strong>{balance}</strong>
      </span>
      {!hasEnough && (
        <span className="font-medium ml-1">— Créditos insuficientes</span>
      )}
    </div>
  )
}
