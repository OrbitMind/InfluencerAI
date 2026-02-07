"use client"

import { useState } from "react"
import { Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModelSelector } from "./model-selector"
import { PromptInput } from "./prompt-input"
import { AspectRatioSelector } from "./aspect-ratio-selector"
import { ImagePreview } from "./image-preview"
import { ErrorMessage } from "@/components/shared/error-message"
import { useImageGeneration } from "@/lib/hooks/use-image-generation"
import { useReplicate } from "@/lib/context/replicate-context"
import Link from "next/link"

export function ImageGeneratorPanel() {
  const { isConfigured } = useReplicate()
  const { modelId, prompt, isLoading, imageUrl, error, setModelId, setPrompt, generate, reset } = useImageGeneration()
  const [aspectRatio, setAspectRatio] = useState("1:1")

  const handleGenerate = () => {
    generate({ aspectRatio })
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
      <Card>
        <CardHeader>
          <CardTitle>Gerar Imagem de Influenciador</CardTitle>
          <CardDescription>Crie um avatar único de influenciador digital com IA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ModelSelector selectedModelId={modelId} onModelSelect={setModelId} disabled={isLoading} />

          <PromptInput value={prompt} onChange={setPrompt} disabled={isLoading} />

          <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} disabled={isLoading} />

          {error && <ErrorMessage message={error} onRetry={reset} />}

          <Button className="w-full" size="lg" onClick={handleGenerate} disabled={isLoading || !prompt.trim()}>
            <Wand2 className="h-5 w-5 mr-2" />
            {isLoading ? "Gerando..." : "Gerar Imagem"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pré-visualização</CardTitle>
          <CardDescription>Sua imagem de influenciador gerada</CardDescription>
        </CardHeader>
        <CardContent>
          <ImagePreview imageUrl={imageUrl} isLoading={isLoading} onRegenerate={handleGenerate} />
        </CardContent>
      </Card>
    </div>
  )
}
