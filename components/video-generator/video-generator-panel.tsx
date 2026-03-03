"use client"

import { useEffect, useRef } from "react"
import { Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VideoModelSelector } from "./video-model-selector"
import { VideoContextInput } from "./video-context-input"
import { SourceImageSelector } from "./source-image-selector"
import { VideoPreview } from "./video-preview"
import { NarrationControls } from "./narration-controls"
import { CameraControlSelector } from "./camera-control-selector"
import { ErrorMessage } from "@/components/shared/error-message"
import { GenerationProgress } from "./generation-progress"
import { useVideoGeneration } from "@/lib/hooks/use-video-generation"
import { useGenerationPipeline } from "@/lib/hooks/use-generation-pipeline"
import { useReplicate } from "@/lib/context/replicate-context"
import { usePersona } from "@/lib/context/persona-context"
import { VoicePlayer } from "@/components/voice/voice-player"
import { VIDEO_INTENTIONS } from "@/lib/constants/video-intentions"
import type { VideoIntention } from "@/lib/constants/video-intentions"
import type { CameraMovement } from "@/lib/types/camera-control"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

const INTENTION_ORDER: VideoIntention[] = ['product', 'lifestyle', 'social', 'testimonial', 'freestyle']

export function VideoGeneratorPanel() {
  const { isConfigured } = useReplicate()
  const { selectedPersona } = usePersona()
  const {
    modelId,
    videoIntention,
    cameraMovement,
    productName,
    productDescription,
    callToAction,
    additionalPrompt,
    sourceImageUrl,
    isLoading,
    videoUrl,
    error,
    generationPhase,
    generationLog,
    setModelId,
    setCameraMovement,
    setVideoIntention,
    setProductName,
    setProductDescription,
    setCallToAction,
    setAdditionalPrompt,
    setSourceImageUrl,
    generate,
    reset,
  } = useVideoGeneration()

  const pipeline = useGenerationPipeline()
  const prevPersonaId = useRef<string | null>(null)

  useEffect(() => {
    const currentId = selectedPersona?.id ?? null
    if (currentId !== prevPersonaId.current) {
      prevPersonaId.current = currentId
      if (selectedPersona?.referenceImageUrl) {
        setSourceImageUrl(selectedPersona.referenceImageUrl)
      }
    }
  }, [selectedPersona, setSourceImageUrl])

  const intentionConfig = VIDEO_INTENTIONS[videoIntention]
  const isVeo3 = modelId.startsWith('google/veo-3')

  const combinedLoading = isLoading || pipeline.isLoading
  const combinedError = error || pipeline.error
  const combinedVideoUrl = pipeline.result?.outputUrl || videoUrl

  const isE005 = !!(combinedError && (combinedError.includes('E005') || combinedError.toLowerCase().includes('flagged as sensitive')))

  const canGenerate = videoIntention === 'freestyle'
    ? additionalPrompt.trim().length > 0
    : (intentionConfig.field1 ? productName.trim().length > 0 : true) &&
      (intentionConfig.field2 ? productDescription.trim().length > 0 : true)

  const handleGenerate = async () => {
    if (pipeline.useNarration && pipeline.narrationText.trim()) {
      await pipeline.generateVideoWithVoice({
        promptContext: {
          productName,
          productDescription,
          action: callToAction,
          scenario: additionalPrompt,
        },
        modelId,
        sourceImageUrl: sourceImageUrl || undefined,
      })
    } else {
      generate()
    }
  }

  if (!isConfigured) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground text-center">
            Configure sua chave de API do Replicate para começar a gerar
          </p>
          <Button asChild>
            <Link href="/dashboard/settings">Ir para Configurações</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Configuração do Vídeo</CardTitle>
              {selectedPersona && (
                <Badge variant="secondary">{selectedPersona.name}</Badge>
              )}
            </div>
            <CardDescription>Selecione o modelo e a imagem de origem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <VideoModelSelector selectedModelId={modelId} onModelSelect={setModelId} disabled={combinedLoading} />
            <SourceImageSelector value={sourceImageUrl} onChange={setSourceImageUrl} disabled={combinedLoading} />
            <CameraControlSelector value={cameraMovement} onChange={(m: CameraMovement) => setCameraMovement(cameraMovement === m ? undefined : m)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Intenção do Vídeo</CardTitle>
            <CardDescription>O que você quer comunicar?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Intention pills */}
            <div className="flex flex-wrap gap-2">
              {INTENTION_ORDER.map((key) => {
                const cfg = VIDEO_INTENTIONS[key]
                const isSelected = videoIntention === key
                return (
                  <button
                    key={key}
                    onClick={() => setVideoIntention(key)}
                    disabled={combinedLoading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors disabled:opacity-50 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }`}
                  >
                    <span>{cfg.icon}</span>
                    {cfg.label}
                  </button>
                )
              })}
            </div>

            <p className="text-xs text-muted-foreground -mt-2">{intentionConfig.description}</p>

            {/* Dynamic fields */}
            <VideoContextInput
              intention={videoIntention}
              field1={productName}
              field2={productDescription}
              field3={callToAction}
              field4={additionalPrompt}
              onField1Change={setProductName}
              onField2Change={setProductDescription}
              onField3Change={setCallToAction}
              onField4Change={setAdditionalPrompt}
              disabled={combinedLoading}
            />

            {selectedPersona && (
              <NarrationControls
                enabled={pipeline.useNarration}
                onEnabledChange={pipeline.setUseNarration}
                text={pipeline.narrationText}
                onTextChange={pipeline.setNarrationText}
                persona={selectedPersona}
                disabled={combinedLoading}
              />
            )}

            <GenerationProgress phase={generationPhase} log={generationLog} />

            {combinedError && !isE005 && <ErrorMessage message={combinedError} onRetry={reset} />}
            {isE005 && (
              <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Conteúdo bloqueado pelo filtro de segurança (E005)</p>
                    {isVeo3 && (
                      <p className="text-xs text-muted-foreground">O Veo 3 tem filtros rigorosos. Tente remover a imagem de referência ou use um modelo alternativo.</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sourceImageUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => { setSourceImageUrl(''); reset(); }}
                    >
                      Remover imagem e tentar
                    </Button>
                  )}
                  {isVeo3 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => { setModelId('kwaivgi/kling-v1.6-pro'); reset(); }}
                    >
                      Usar Kling v1.6 Pro
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={reset}>
                    Limpar
                  </Button>
                </div>
              </div>
            )}

            <Button className="w-full" size="lg" onClick={handleGenerate} disabled={combinedLoading || !canGenerate}>
              <Video className="h-5 w-5 mr-2" />
              {combinedLoading
                ? "Gerando..."
                : pipeline.useNarration && pipeline.narrationText.trim()
                  ? "Gerar Vídeo com Narração"
                  : "Gerar Vídeo"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit sticky top-24">
        <CardHeader>
          <CardTitle>Pré-visualização</CardTitle>
          <CardDescription>Seu vídeo gerado</CardDescription>
        </CardHeader>
        <CardContent>
          <VideoPreview videoUrl={combinedVideoUrl} isLoading={combinedLoading} onRegenerate={handleGenerate} />
          {pipeline.result?.audioUrl && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Narração</p>
              <VoicePlayer src={pipeline.result.audioUrl} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
