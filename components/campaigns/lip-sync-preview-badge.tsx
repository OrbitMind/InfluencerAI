"use client"

import { Mic } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface LipSyncPreviewBadgeProps {
  lipSyncVideoUrl?: string | null
}

export function LipSyncPreviewBadge({ lipSyncVideoUrl }: LipSyncPreviewBadgeProps) {
  if (!lipSyncVideoUrl) return null

  return (
    <Badge variant="secondary" className="gap-1">
      <Mic className="h-3 w-3" />
      Lip Sync
    </Badge>
  )
}
