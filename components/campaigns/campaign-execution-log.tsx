"use client"

import { Check, X, Clock, Loader2, SkipForward } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ExecutionLogEntry } from "@/lib/types/campaign"
import { cn } from "@/lib/utils"

interface CampaignExecutionLogProps {
  log: ExecutionLogEntry[] | null
}

const STEP_LABELS: Record<string, string> = {
  image: "Gerar Imagem",
  video: "Gerar Vídeo",
  audio: "Gerar Narração",
  compose: "Compor Imagem",
}

function StatusIcon({ status }: { status: ExecutionLogEntry["status"] }) {
  switch (status) {
    case "completed":
      return <Check className="h-4 w-4 text-green-500" />
    case "failed":
      return <X className="h-4 w-4 text-destructive" />
    case "running":
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />
    case "skipped":
      return <SkipForward className="h-4 w-4 text-muted-foreground" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

function formatDuration(ms?: number): string {
  if (!ms) return ""
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function CampaignExecutionLog({ log }: CampaignExecutionLogProps) {
  if (!log || log.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Log de Execução</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {log.map((entry, index) => (
            <div key={`${entry.step}-${index}`} className="flex items-start gap-3">
              <div className="mt-0.5">
                <StatusIcon status={entry.status} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(
                    "text-sm font-medium",
                    entry.status === "failed" && "text-destructive",
                    entry.status === "skipped" && "text-muted-foreground"
                  )}>
                    {STEP_LABELS[entry.step] || entry.step}
                  </p>
                  {entry.durationMs && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDuration(entry.durationMs)}
                    </span>
                  )}
                </div>
                {entry.error && (
                  <p className="text-xs text-destructive mt-0.5">{entry.error}</p>
                )}
                {entry.details && entry.status === "skipped" && (
                  <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
