"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LIP_SYNC_MODELS, type LipSyncModel } from "@/lib/types/lip-sync"

interface LipSyncToggleProps {
  enabled: boolean
  model: LipSyncModel
  personaHasImage: boolean
  personaHasVoice: boolean
  onToggle: (enabled: boolean) => void
  onModelChange: (model: LipSyncModel) => void
}

export function LipSyncToggle({
  enabled,
  model,
  personaHasImage,
  personaHasVoice,
  onToggle,
  onModelChange,
}: LipSyncToggleProps) {
  const canEnable = personaHasImage && personaHasVoice

  const disabledReason = !personaHasImage
    ? "Persona precisa de imagem de referência"
    : !personaHasVoice
    ? "Persona precisa de voz configurada"
    : undefined

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="lip-sync-toggle" className="text-sm font-medium">
            Lip Sync
          </Label>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            Beta
          </Badge>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Switch
                  id="lip-sync-toggle"
                  checked={enabled}
                  onCheckedChange={onToggle}
                  disabled={!canEnable}
                />
              </div>
            </TooltipTrigger>
            {disabledReason && (
              <TooltipContent>
                <p>{disabledReason}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      <p className="text-xs text-muted-foreground">
        Gera vídeo com a persona falando sincronizado com a narração
      </p>

      {enabled && (
        <div className="space-y-2 pt-1">
          <Label className="text-xs">Modelo</Label>
          <Select value={model} onValueChange={(v) => onModelChange(v as LipSyncModel)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIP_SYNC_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex flex-col">
                    <span>{m.name}</span>
                    <span className="text-[10px] text-muted-foreground">{m.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
