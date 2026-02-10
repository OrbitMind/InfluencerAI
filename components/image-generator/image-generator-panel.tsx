"use client"

import { useState, useEffect, useRef } from "react"
import { Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ModelSelector } from "./model-selector"
import { PromptInput } from "./prompt-input"
import { AspectRatioSelector } from "./aspect-ratio-selector"
import { ImagePreview } from "./image-preview"
import { FaceConsistencyControls } from "./face-consistency-controls"
import { ImageUploadControl } from "@/components/shared/image-upload-control"
import { ErrorMessage } from "@/components/shared/error-message"
import { useImageGeneration } from "@/lib/hooks/use-image-generation"
import { useGenerationPipeline } from "@/lib/hooks/use-generation-pipeline"
import { useReplicate } from "@/lib/context/replicate-context"
import { usePersona } from "@/lib/context/persona-context"
import Link from "next/link"

export function ImageGeneratorPanel() {
  const { isConfigured } = useReplicate()
  const { selectedPersona, getBasePrompt } = usePersona()
  const { modelId, prompt, isLoading, imageUrl, error, setModelId, setPrompt, generate, reset } = useImageGeneration()
  const pipeline = useGenerationPipeline()
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [customReferenceImage, setCustomReferenceImage] = useState<string | null>(null)
  const prevPersonaId = useRef<string | null>(null)

  // Auto-fill prompt when persona is selected
  useEffect(() => {
    const currentId = selectedPersona?.id ?? null
    if (currentId !== prevPersonaId.current) {
      prevPersonaId.current = currentId
      const basePrompt = getBasePrompt()
      if (basePrompt) {
        setPrompt(basePrompt)
      }
    }
  }, [selectedPersona, getBasePrompt, setPrompt])

  const handleGenerate = async () => {
    if (pipeline.shouldUsePipeline && pipeline.useFaceConsistency) {
      await pipeline.generateImage({
        promptContext: { additionalDetails: prompt },
        modelId,
        aspectRatio,
      })
    } else {
      generate({ aspectRatio })
    }
  }

  const combinedLoading = isLoading || pipeline.isLoading
  const combinedError = error || pipeline.error
  const combinedImageUrl = pipeline.result?.outputUrl || imageUrl

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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gerar Imagem de Influenciador</CardTitle>
            {selectedPersona && (
              <Badge variant="secondary">{selectedPersona.name}</Badge>
            )}
          </div>
          <CardDescription>Crie um avatar único de influenciador digital com IA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ModelSelector selectedModelId={modelId} onModelSelect={setModelId} disabled={combinedLoading} />

          <PromptInput value={prompt} onChange={setPrompt} disabled={combinedLoading} />

          {!selectedPersona && (
            <ImageUploadControl
              label="Imagem de Referência (Opcional)"
              description="Adicione uma imagem para manter consistência facial"
              value={customReferenceImage}
              onChange={setCustomReferenceImage}
              disabled={combinedLoading}
            />
          )}

          {selectedPersona && (
            <FaceConsistencyControls
              enabled={pipeline.useFaceConsistency}
              onEnabledChange={pipeline.setUseFaceConsistency}
              strategy={pipeline.faceConsistencyStrategy}
              onStrategyChange={pipeline.setFaceConsistencyStrategy}
              strength={pipeline.faceConsistencyStrength}
              onStrengthChange={pipeline.setFaceConsistencyStrength}
              hasReferenceImage={pipeline.capabilities.hasReferenceImage}
              referenceImageUrl={selectedPersona.referenceImageUrl}
              disabled={combinedLoading}
            />
          )}

          <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} disabled={combinedLoading} />

          {combinedError && <ErrorMessage message={combinedError} onRetry={reset} />}

          <Button className="w-full" size="lg" onClick={handleGenerate} disabled={combinedLoading || !prompt.trim()}>
            <Wand2 className="h-5 w-5 mr-2" />
            {combinedLoading ? "Gerando..." : "Gerar Imagem"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pré-visualização</CardTitle>
          <CardDescription>Sua imagem de influenciador gerada</CardDescription>
        </CardHeader>
        <CardContent>
          <ImagePreview imageUrl={combinedImageUrl} isLoading={combinedLoading} onRegenerate={handleGenerate} />
        </CardContent>
      </Card>
    </div>
  )
}
