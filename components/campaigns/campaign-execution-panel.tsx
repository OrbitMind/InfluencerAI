"use client"

import { useState, useEffect } from "react"
import { Play, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { CostEstimate } from "@/components/billing/cost-estimate"
import { FACE_CONSISTENCY_STRATEGY_LIST } from "@/lib/constants/face-consistency"
import type { TransformedModel } from "@/lib/types/replicateModels"
import type { CampaignData, CampaignStatus, ExecutionStep } from "@/lib/types/campaign"

interface ModelOptions {
  imageModel?: string
  videoModel?: string
  faceConsistencyStrategy?: string
}

interface CampaignExecutionPanelProps {
  campaign: CampaignData
  isExecuting: boolean
  onExecute: (steps: ExecutionStep[], options: ModelOptions) => void
}

const EXECUTION_STEPS: { key: ExecutionStep; label: string; description: string }[] = [
  { key: "image", label: "Gerar Imagem", description: "Cria a imagem da campanha com IA" },
  { key: "video", label: "Gerar Vídeo", description: "Cria o vídeo promocional" },
  { key: "audio", label: "Gerar Narração", description: "Gera áudio com voz da persona" },
  { key: "lip-sync", label: "Lip Sync", description: "Gera vídeo com sincronização labial (Beta)" },
  { key: "compose", label: "Compor Imagem", description: "Aplica texto overlay na imagem" },
  { key: "captions", label: "Gerar Legendas", description: "Cria legendas animadas estilo Reels" },
]

const DEFAULT_FACE_STRATEGY = "pulid"
const DEFAULT_IMAGE_MODEL = "google/nano-banana-pro"
const DEFAULT_VIDEO_MODEL = "google/veo-3.1"
const CREDIT_COSTS = { image: 1, video: 3 }

async function fetchModels(type: "image" | "video"): Promise<TransformedModel[]> {
  const res = await fetch(`/api/replicate/models?type=${type}`)
  if (!res.ok) return []
  const json = await res.json()
  return (json.data?.models as TransformedModel[]) ?? []
}

function CreditBadge({ credits }: { credits: number }) {
  return (
    <Badge variant="outline" className="text-xs font-mono ml-auto shrink-0">
      {credits} cr
    </Badge>
  )
}

function ModelSelect({
  label,
  credits,
  value,
  models,
  loading,
  disabled,
  onChange,
  hint,
}: {
  label: string
  credits?: number
  value: string
  models: TransformedModel[]
  loading: boolean
  disabled: boolean
  onChange: (v: string) => void
  hint?: string
}) {
  const isRecommended = models.length > 0 && value === models[0].id

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {credits !== undefined && <CreditBadge credits={credits} />}
      </div>
      {loading ? (
        <Skeleton className="h-9 w-full" />
      ) : models.length === 0 ? (
        <p className="text-xs text-destructive">Erro ao carregar modelos</p>
      ) : (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className="w-full text-sm h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {models.map((m, i) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
                {i === 0 && (
                  <span className="ml-1.5 text-xs opacity-60">(recomendado)</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {isRecommended && (
        <p className="text-xs text-primary font-medium">✓ Recomendado</p>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function CampaignExecutionPanel({
  campaign,
  isExecuting,
  onExecute,
}: CampaignExecutionPanelProps) {
  const defaultSteps: ExecutionStep[] = [
    "image",
    "video",
    "audio",
    ...(campaign.useLipSync ? ["lip-sync" as const] : []),
    "compose",
    "captions",
  ]
  const [selectedSteps, setSelectedSteps] = useState<ExecutionStep[]>(defaultSteps)
  const [faceStrategy, setFaceStrategy] = useState(DEFAULT_FACE_STRATEGY)

  const [imageModels, setImageModels] = useState<TransformedModel[]>([])
  const [videoModels, setVideoModels] = useState<TransformedModel[]>([])
  const [imageModel, setImageModel] = useState("")
  const [videoModel, setVideoModel] = useState("")
  const [loadingImage, setLoadingImage] = useState(true)
  const [loadingVideo, setLoadingVideo] = useState(true)

  useEffect(() => {
    fetchModels("image").then((models) => {
      setImageModels(models)
      const preferred = models.find((m) => m.id === DEFAULT_IMAGE_MODEL)
      setImageModel(preferred?.id ?? models[0]?.id ?? "")
      setLoadingImage(false)
    })
    fetchModels("video").then((models) => {
      // Only image-to-video models (preserve persona photo)
      const compatible = models.filter((m) => m.supportsImageInput)
      setVideoModels(compatible)
      const preferred = compatible.find((m) => m.id === DEFAULT_VIDEO_MODEL)
      setVideoModel(preferred?.id ?? compatible[0]?.id ?? "")
      setLoadingVideo(false)
    })
  }, [])

  const toggleStep = (step: ExecutionStep) => {
    setSelectedSteps((prev) =>
      prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step]
    )
  }

  const hasImage = selectedSteps.includes("image")
  const hasVideo = selectedSteps.includes("video")

  const canExecute = selectedSteps.length > 0 && !isExecuting
  const status = campaign.status as CampaignStatus
  const isRunning = status === "running" || isExecuting

  const handleExecute = () => {
    onExecute(selectedSteps, {
      imageModel: imageModel || undefined,
      videoModel: videoModel || undefined,
      faceConsistencyStrategy: campaign.persona.referenceImageUrl ? faceStrategy : undefined,
    })
  }

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
      <CardContent className="space-y-5">
        {/* Steps */}
        <div className="space-y-3">
          {EXECUTION_STEPS.map((step) => (
            <div key={step.key} className="flex items-start gap-3">
              <Checkbox
                id={step.key}
                checked={selectedSteps.includes(step.key)}
                onCheckedChange={() => toggleStep(step.key)}
                disabled={isRunning}
              />
              <div className="grid gap-0.5 min-w-0">
                <Label htmlFor={step.key} className="cursor-pointer">
                  {step.label}
                </Label>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Model selectors */}
        <div className="space-y-4">
          <p className="text-sm font-medium">Modelos</p>

          {hasImage && (
            <ModelSelect
              label="Modelo de Imagem"
              credits={CREDIT_COSTS.image}
              value={imageModel}
              models={imageModels}
              loading={loadingImage}
              disabled={isRunning}
              onChange={setImageModel}
            />
          )}

          {hasImage && campaign.persona.referenceImageUrl && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Preservação Facial</Label>
              <Select value={faceStrategy} onValueChange={setFaceStrategy} disabled={isRunning}>
                <SelectTrigger className="w-full text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FACE_CONSISTENCY_STRATEGY_LIST.map((s, i) => (
                    <SelectItem key={s.name} value={s.name}>
                      {s.label}
                      {i === 0 && (
                        <span className="ml-1.5 text-xs opacity-60">(recomendado)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {faceStrategy === DEFAULT_FACE_STRATEGY && (
                <p className="text-xs text-primary font-medium">✓ Recomendado</p>
              )}
            </div>
          )}

          {hasVideo && (
            <ModelSelect
              label="Modelo de Vídeo"
              credits={CREDIT_COSTS.video}
              value={videoModel}
              models={videoModels}
              loading={loadingVideo}
              disabled={isRunning}
              onChange={setVideoModel}
              hint="Apenas modelos image-to-video — preservam a persona"
            />
          )}
        </div>

        <Separator />

        <CostEstimate steps={selectedSteps} />

        <Button
          className="w-full"
          size="lg"
          onClick={handleExecute}
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
              {status === "completed"
                ? "Re-executar"
                : status === "failed"
                ? "Tentar Novamente"
                : "Executar Campanha"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
