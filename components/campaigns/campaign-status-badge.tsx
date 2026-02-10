"use client"

import { Badge } from "@/components/ui/badge"
import type { CampaignStatus } from "@/lib/types/campaign"

const STATUS_CONFIG: Record<CampaignStatus, { label: string; variant: "secondary" | "default" | "destructive" | "outline" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  running: { label: "Executando", variant: "default" },
  completed: { label: "Concluída", variant: "outline" },
  failed: { label: "Falhou", variant: "destructive" },
}

interface CampaignStatusBadgeProps {
  status: CampaignStatus
}

export function CampaignStatusBadge({ status }: CampaignStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  return (
    <Badge variant={config.variant} className={status === "running" ? "animate-pulse" : ""}>
      {config.label}
    </Badge>
  )
}
