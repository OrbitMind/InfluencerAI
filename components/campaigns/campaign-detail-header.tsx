"use client"

import Link from "next/link"
import { ArrowLeft, Copy, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CampaignStatusBadge } from "./campaign-status-badge"
import type { CampaignData, CampaignStatus } from "@/lib/types/campaign"

interface CampaignDetailHeaderProps {
  campaign: CampaignData
  onDuplicate?: () => void
  onDelete?: () => void
}

export function CampaignDetailHeader({ campaign, onDuplicate, onDelete }: CampaignDetailHeaderProps) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/campaigns">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Link>
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <CampaignStatusBadge status={campaign.status as CampaignStatus} />
          </div>
          {campaign.description && (
            <p className="text-muted-foreground">{campaign.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{campaign.persona.name}</Badge>
            <Badge variant="secondary">{campaign.template.name}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onDuplicate && (
            <Button variant="outline" size="sm" onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="sm" className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
