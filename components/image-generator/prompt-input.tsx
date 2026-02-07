"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { INFLUENCER_PROMPTS } from "@/lib/constants"
import { usePromptRefinement } from "@/lib/hooks/use-prompt-refinement"
import { usePromptRefiner } from "@/lib/hooks/use-prompt-refiner"
import { cn } from "@/lib/utils"
import { Loader2, Sparkles, Wand2 } from "lucide-react"

/**
 * Componente para input de prompt com refinamento
 * Princípio: Single Responsibility Principle (SRP) refatorado
 * Responsabilidade: UI para entrada de prompt
 * Lógica de refinamento extraída para hooks
 */

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function PromptInput({ value, onChange, disabled }: PromptInputProps) {
  const { canRefine, selectedModel } = usePromptRefinement()
  const { refinePrompt, isRefining, error, clearError } = usePromptRefiner({ type: "image" })

  const applyTemplate = (template: keyof typeof INFLUENCER_PROMPTS) => {
    onChange(INFLUENCER_PROMPTS[template])
  }

  const handleRefine = async () => {
    if (!canRefine) return
    const refined = await refinePrompt(value)
    if (refined) {
      onChange(refined)
    }
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Prompt</label>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            if (error) clearError()
          }}
          placeholder="Descreva seu influenciador digital em detalhes..."
          className="min-h-[120px] resize-none pr-12"
          disabled={disabled || isRefining}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleRefine}
                disabled={disabled || isRefining || !value.trim() || !canRefine}
                className={cn(
                  "absolute right-2 top-2 p-2 rounded-md transition-all",
                  canRefine
                    ? "hover:bg-primary/10 text-primary/70 hover:text-primary"
                    : "text-muted-foreground/40 cursor-not-allowed",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  isRefining && "animate-pulse text-primary",
                )}
              >
                {isRefining ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {canRefine ? (
                <p>Refinar com {selectedModel.name}</p>
              ) : (
                <p>Configure uma chave API (OpenAI ou Google) nas Configuracoes</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Templates rapidos:</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => applyTemplate("professional")}
            disabled={disabled || isRefining}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Profissional
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => applyTemplate("casual")}
            disabled={disabled || isRefining}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Casual
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => applyTemplate("glamorous")}
            disabled={disabled || isRefining}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Glamouroso
          </Button>
        </div>
      </div>
    </div>
  )
}
