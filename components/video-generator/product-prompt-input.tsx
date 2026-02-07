"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { usePromptRefinement } from "@/lib/hooks/use-prompt-refinement"
import { usePromptRefiner } from "@/lib/hooks/use-prompt-refiner"
import { cn } from "@/lib/utils"
import { buildProductVideoPrompt } from "@/lib/utils/promptUtils"
import { Loader2, Wand2 } from "lucide-react"

/**
 * Componente para input de prompt de produto
 * Princípio: Single Responsibility Principle (SRP) refatorado
 * Responsabilidade: UI para entrada de dados do produto
 * Lógica de construção de prompt extraída para promptUtils
 */

interface ProductPromptInputProps {
  productName: string
  productDescription: string
  callToAction: string
  additionalPrompt: string
  onProductNameChange: (value: string) => void
  onProductDescriptionChange: (value: string) => void
  onCallToActionChange: (value: string) => void
  onAdditionalPromptChange: (value: string) => void
  disabled?: boolean
}

export function ProductPromptInput({
  productName,
  productDescription,
  callToAction,
  additionalPrompt,
  onProductNameChange,
  onProductDescriptionChange,
  onCallToActionChange,
  onAdditionalPromptChange,
  disabled,
}: ProductPromptInputProps) {
  const { canRefine, selectedModel } = usePromptRefinement()
  const { refinePrompt, isRefining, error, clearError } = usePromptRefiner({ type: "video" })

  const handleRefineAll = async () => {
    // Usa utilitário para construir o prompt
    const fullPrompt = buildProductVideoPrompt(productName, productDescription, callToAction, additionalPrompt)

    const refined = await refinePrompt(fullPrompt)
    if (refined) {
      onAdditionalPromptChange(refined)
    }
  }

  const hasContent = productName || productDescription || callToAction

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="product-name">Nome do Produto</Label>
        <Input
          id="product-name"
          value={productName}
          onChange={(e) => {
            onProductNameChange(e.target.value)
            if (error) clearError()
          }}
          placeholder="ex: Sérum Luminoso para Pele"
          disabled={disabled || isRefining}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-description">Descrição do Produto</Label>
        <Textarea
          id="product-description"
          value={productDescription}
          onChange={(e) => {
            onProductDescriptionChange(e.target.value)
            if (error) clearError()
          }}
          placeholder="Descreva o produto e seus principais benefícios..."
          className="min-h-[80px] resize-none"
          disabled={disabled || isRefining}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="call-to-action">Chamada para Ação</Label>
        <Input
          id="call-to-action"
          value={callToAction}
          onChange={(e) => {
            onCallToActionChange(e.target.value)
            if (error) clearError()
          }}
          placeholder="ex: Compre agora com o código BRILHO20 e ganhe 20% de desconto!"
          disabled={disabled || isRefining}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="additional-prompt">Instruções Adicionais (Opcional)</Label>

        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <Textarea
            id="additional-prompt"
            value={additionalPrompt}
            onChange={(e) => {
              onAdditionalPromptChange(e.target.value)
              if (error) clearError()
            }}
            placeholder="Adicione instruções específicas para o estilo, humor ou ações do vídeo..."
            className="min-h-[80px] resize-none pr-12"
            disabled={disabled || isRefining}
          />
          {canRefine && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleRefineAll}
                    disabled={disabled || isRefining || !hasContent}
                    className={cn(
                      "absolute right-2 top-2 p-2 rounded-md transition-colors",
                      "hover:bg-primary/10 text-muted-foreground hover:text-primary",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      isRefining && "animate-pulse",
                    )}
                  >
                    {isRefining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Gerar prompt com {selectedModel.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  )
}
