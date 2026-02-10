"use client"

import Link from "next/link"
import { Coins } from "lucide-react"
import { useBilling } from "@/lib/context/billing-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function CreditIndicator() {
  const { balance, subscription } = useBilling()

  const planName = subscription?.plan?.name || "Gratuito"

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium bg-muted/50 hover:bg-muted transition-colors"
          >
            <Coins className="h-4 w-4 text-amber-500" />
            <span>{balance}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>Plano {planName} — {balance} créditos restantes</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
