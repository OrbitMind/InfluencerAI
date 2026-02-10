"use client"

import { useState } from "react"
import { Play, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { CostEstimate } from "@/components/billing/cost-estimate"
import type { CampaignData, CampaignStatus, ExecutionStep } from "@/lib/types/campaign"

interface CampaignExecutionPanelProps {
  campaign: CampaignData
  isExecuting: boolean
  onExecute: (steps: ExecutionStep[]) => void
}

const EXECUTION_STEPS: { key: ExecutionStep; label: string; description: string }[] = [
  { key: "image", label: "Gerar Imagem", description: "Cria a imagem da campanha com IA" },
  { key: "video", label: "Gerar Vídeo", description: "Cria o vídeo promocional" },
  { key: "audio", label: "Gerar Narração", description: "Gera áudio com voz da persona" },
  { key: "lip-sync", label: "Lip Sync", description: "Gera vídeo com sincronização labial (Beta)" },
  { key: "compose", label: "Compor Imagem", description: "Aplica texto overlay na imagem" },
  { key: "captions", label: "Gerar Legendas", description: "Cria legendas animadas estilo Reels" },
]

export function CampaignExecutionPanel({
  campaign,
  isExecuting,
  onExecute,
}: CampaignExecutionPanelProps) {
  const defaultSteps: ExecutionStep[] = ["image", "video", "audio", ...(campaign.useLipSync ? ["lip-sync" as const] : []), "compose", "captions"]
  const [selectedSteps, setSelectedSteps] = useState<ExecutionStep[]>(defaultSteps)

  const toggleStep = (step: ExecutionStep) => {
    setSelectedSteps((prev) =>
      prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step]
    )
  }

  const canExecute = selectedSteps.length > 0 && !isExecuting
  const status = campaign.status as CampaignStatus
  const isRunning = status === "running" || isExecuting

  return (
    <Card>
      <CardHeader>
        <CardTitle>Execução</CardTitle>
        <CardDescription>
          {status === "completed"
            ? "Campanha concluída. Re-execute para gerar novos conteúdos."
            : status === "failed"
            ? "A execução falhou. Tente novamente."
            : "Selecione os passos e execute a campanha."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {EXECUTION_STEPS.map((step) => (
            <div key={step.key} className="flex items-start gap-3">
              <Checkbox
                id={step.key}
                checked={selectedSteps.includes(step.key)}
                onCheckedChange={() => toggleStep(step.key)}
                disabled={isRunning}
              />
              <div className="grid gap-0.5">
                <Label htmlFor={step.key} className="cursor-pointer">
                  {step.label}
                </Label>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <CostEstimate steps={selectedSteps} />

        <Button
          className="w-full"
          size="lg"
          onClick={() => onExecute(selectedSteps)}
          disabled={!canExecute}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Executando...
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              {status === "completed" ? "Re-executar" : status === "failed" ? "Tentar Novamente" : "Executar Campanha"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
