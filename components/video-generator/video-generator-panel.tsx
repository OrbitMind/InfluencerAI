"use client"

import { Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VideoModelSelector } from "./video-model-selector"
import { ProductPromptInput } from "./product-prompt-input"
import { SourceImageSelector } from "./source-image-selector"
import { VideoPreview } from "./video-preview"
import { ErrorMessage } from "@/components/shared/error-message"
import { useVideoGeneration } from "@/lib/hooks/use-video-generation"
import { useReplicate } from "@/lib/context/replicate-context"
import Link from "next/link"

export function VideoGeneratorPanel() {
  const { isConfigured } = useReplicate()
  const {
    modelId,
    productName,
    productDescription,
    callToAction,
    additionalPrompt,
    sourceImageUrl,
    isLoading,
    videoUrl,
    error,
    setModelId,
    setProductName,
    setProductDescription,
    setCallToAction,
    setAdditionalPrompt,
    setSourceImageUrl,
    generate,
    reset,
  } = useVideoGeneration()

  const canGenerate = productName.trim() && productDescription.trim()

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
            <CardTitle>Configuração do Vídeo</CardTitle>
            <CardDescription>Selecione o modelo e a imagem de origem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <VideoModelSelector selectedModelId={modelId} onModelSelect={setModelId} disabled={isLoading} />

            <SourceImageSelector value={sourceImageUrl} onChange={setSourceImageUrl} disabled={isLoading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Produto</CardTitle>
            <CardDescription>Defina o produto que seu influenciador vai promover</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProductPromptInput
              productName={productName}
              productDescription={productDescription}
              callToAction={callToAction}
              additionalPrompt={additionalPrompt}
              onProductNameChange={setProductName}
              onProductDescriptionChange={setProductDescription}
              onCallToActionChange={setCallToAction}
              onAdditionalPromptChange={setAdditionalPrompt}
              disabled={isLoading}
            />

            {error && <ErrorMessage message={error} onRetry={reset} />}

            <Button className="w-full" size="lg" onClick={() => generate()} disabled={isLoading || !canGenerate}>
              <Video className="h-5 w-5 mr-2" />
              {isLoading ? "Gerando..." : "Gerar Vídeo"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit sticky top-24">
        <CardHeader>
          <CardTitle>Pré-visualização</CardTitle>
          <CardDescription>Seu vídeo promocional gerado</CardDescription>
        </CardHeader>
        <CardContent>
          <VideoPreview videoUrl={videoUrl} isLoading={isLoading} onRegenerate={() => generate()} />
        </CardContent>
      </Card>
    </div>
  )
}
