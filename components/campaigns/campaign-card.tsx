"use client"

import Link from "next/link"
import { MoreHorizontal, Copy, Trash2, Play } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CampaignStatusBadge } from "./campaign-status-badge"
import type { CampaignData, CampaignStatus } from "@/lib/types/campaign"

interface CampaignCardProps {
  campaign: CampaignData
  onDelete?: (id: string) => void
  onDuplicate?: (id: string) => void
}

export function CampaignCard({ campaign, onDelete, onDuplicate }: CampaignCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/dashboard/campaigns/${campaign.id}`} className="flex-1 min-w-0">
            <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
              {campaign.name}
            </h3>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/campaigns/${campaign.id}`}>
                  <Play className="h-4 w-4 mr-2" />
                  {campaign.status === "draft" ? "Executar" : "Ver Detalhes"}
                </Link>
              </DropdownMenuItem>
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(campaign.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(campaign.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {campaign.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {campaign.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <CampaignStatusBadge status={campaign.status as CampaignStatus} />
          <Badge variant="outline">{campaign.persona.name}</Badge>
          <Badge variant="secondary">{campaign.template.name}</Badge>
        </div>

        {campaign.imageUrl && (
          <div className="mt-3">
            <img
              src={campaign.imageUrl}
              alt={campaign.name}
              className="w-full h-32 object-cover rounded-md"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
