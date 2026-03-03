"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, Wand2 } from "lucide-react"
import { usePromptRefinement } from "@/lib/hooks/use-prompt-refinement"
import { usePromptRefiner } from "@/lib/hooks/use-prompt-refiner"
import { buildVideoPrompt } from "@/lib/utils/promptUtils"
import { cn } from "@/lib/utils"
import { VIDEO_INTENTIONS } from "@/lib/constants/video-intentions"
import type { VideoIntention } from "@/lib/constants/video-intentions"

interface VideoContextInputProps {
  intention: VideoIntention
  field1: string
  field2: string
  field3: string
  field4: string
  onField1Change: (v: string) => void
  onField2Change: (v: string) => void
  onField3Change: (v: string) => void
  onField4Change: (v: string) => void
  disabled?: boolean
}

export function VideoContextInput({
  intention,
  field1, field2, field3, field4,
  onField1Change, onField2Change, onField3Change, onField4Change,
  disabled,
}: VideoContextInputProps) {
  const config = VIDEO_INTENTIONS[intention]
  const { canRefine, selectedModel } = usePromptRefinement()
  const { refinePrompt, isRefining, error, clearError } = usePromptRefiner({ type: "video" })

  const handleRefine = async () => {
    const fullPrompt = buildVideoPrompt(intention, field1, field2, field3, field4)
    const refined = await refinePrompt(fullPrompt)
    if (refined) onField4Change(refined)
  }

  const hasContent = field1 || field2 || field3 || field4

  return (
    <div className="space-y-4">
      {config.field1 && (
        <div className="space-y-2">
          <Label>{config.field1.label}{config.field1.required && <span className="text-destructive ml-1">*</span>}</Label>
          <Input
            value={field1}
            onChange={e => { onField1Change(e.target.value); if (error) clearError() }}
            placeholder={config.field1.placeholder}
            disabled={disabled || isRefining}
          />
        </div>
      )}

      {config.field2 && (
        <div className="space-y-2">
          <Label>{config.field2.label}{config.field2.required && <span className="text-destructive ml-1">*</span>}</Label>
          <Textarea
            value={field2}
            onChange={e => { onField2Change(e.target.value); if (error) clearError() }}
            placeholder={config.field2.placeholder}
            className="min-h-[80px] resize-none"
            disabled={disabled || isRefining}
          />
        </div>
      )}

      {config.field3 && (
        <div className="space-y-2">
          <Label>{config.field3.label}</Label>
          <Input
            value={field3}
            onChange={e => { onField3Change(e.target.value); if (error) clearError() }}
            placeholder={config.field3.placeholder}
            disabled={disabled || isRefining}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>
          {config.field4.label}
          {config.field4.required && <span className="text-destructive ml-1">*</span>}
          {!config.field4.required && !config.field1 && !config.field2 && ''}
          {config.field1 && <span className="text-muted-foreground text-xs ml-2">(Opcional)</span>}
        </Label>

        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <Textarea
            value={field4}
            onChange={e => { onField4Change(e.target.value); if (error) clearError() }}
            placeholder={config.field4.placeholder}
            className="min-h-[80px] resize-none pr-12"
            disabled={disabled || isRefining}
          />
          {canRefine && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleRefine}
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
                  <p>Refinar prompt com {selectedModel.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  )
}
