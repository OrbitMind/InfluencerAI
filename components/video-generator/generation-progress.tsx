"use client"

import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GenerationLogEntry, GenerationPhase } from "@/lib/types/generation"

const PHASE_ORDER: GenerationPhase[] = ['creating', 'starting', 'processing', 'uploading', 'done']

const PHASE_LABELS_VIDEO: Record<GenerationPhase, string> = {
  idle:       'Ocioso',
  creating:   'Criando predição',
  starting:   'Aguardando GPU',
  processing: 'Gerando vídeo',
  uploading:  'Salvando',
  done:       'Concluído',
  failed:     'Falhou',
}

const PHASE_LABELS_IMAGE: Record<GenerationPhase, string> = {
  idle:       'Ocioso',
  creating:   'Criando predição',
  starting:   'Aguardando GPU',
  processing: 'Gerando imagem',
  uploading:  'Salvando',
  done:       'Concluído',
  failed:     'Falhou',
}

function PhaseIcon({ phase, currentPhase }: { phase: GenerationPhase; currentPhase: GenerationPhase }) {
  const currentIdx = PHASE_ORDER.indexOf(currentPhase)
  const phaseIdx = PHASE_ORDER.indexOf(phase)

  if (currentPhase === 'done') return <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
  if (currentPhase === 'failed') {
    return phaseIdx === currentIdx
      ? <XCircle className="h-4 w-4 text-destructive shrink-0" />
      : <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
  }
  if (phaseIdx < currentIdx) return <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
  if (phaseIdx === currentIdx) return <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
  return <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
}

interface GenerationProgressProps {
  phase: GenerationPhase
  log: GenerationLogEntry[]
  type?: 'image' | 'video'
  className?: string
}

export function GenerationProgress({ phase, log, type = 'video', className }: GenerationProgressProps) {
  if (phase === 'idle') return null

  const isFailed = phase === 'failed'
  const isDone = phase === 'done'
  const PHASE_LABELS = type === 'image' ? PHASE_LABELS_IMAGE : PHASE_LABELS_VIDEO

  return (
    <div className={cn("rounded-lg border bg-muted/30 p-4 space-y-4", className)}>
      {/* Phase steps */}
      <div className="space-y-2">
        {PHASE_ORDER.filter(p => p !== 'done' || isDone).map((p) => (
          <div key={p} className="flex items-center gap-2.5">
            <PhaseIcon phase={p} currentPhase={phase} />
            <span className={cn(
              "text-sm",
              PHASE_ORDER.indexOf(p) < PHASE_ORDER.indexOf(phase) && "text-foreground",
              PHASE_ORDER.indexOf(p) === PHASE_ORDER.indexOf(phase) && "text-foreground font-medium",
              PHASE_ORDER.indexOf(p) > PHASE_ORDER.indexOf(phase) && "text-muted-foreground/50",
            )}>
              {PHASE_LABELS[p]}
            </span>
          </div>
        ))}
        {isFailed && (
          <div className="flex items-center gap-2.5">
            <XCircle className="h-4 w-4 text-destructive shrink-0" />
            <span className="text-sm font-medium text-destructive">Falhou</span>
          </div>
        )}
      </div>

      {/* Timestamp log */}
      {log.length > 0 && (
        <div className="border-t pt-3 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Log</p>
          {log.map((entry, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-muted-foreground shrink-0 font-mono">
                {entry.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className={cn(
                "leading-relaxed",
                entry.phase === 'failed' ? "text-destructive" : "text-foreground/80"
              )}>
                {entry.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
