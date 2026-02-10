"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  CAPTION_PRESETS,
  CAPTION_ANIMATIONS,
  CAPTION_FONTS,
  SEGMENTATION_MODES,
  type CaptionStyle,
  type SegmentationMode,
} from "@/lib/types/caption"

interface CaptionStyleSelectorProps {
  presetId: string | null
  customStyle: Partial<CaptionStyle> | null
  segmentationMode: SegmentationMode
  onPresetChange: (presetId: string) => void
  onCustomStyleChange: (style: Partial<CaptionStyle>) => void
  onSegmentationModeChange: (mode: SegmentationMode) => void
}

export function CaptionStyleSelector({
  presetId,
  customStyle,
  segmentationMode,
  onPresetChange,
  onCustomStyleChange,
  onSegmentationModeChange,
}: CaptionStyleSelectorProps) {
  const [showCustomize, setShowCustomize] = useState(false)

  const updateCustom = (key: keyof CaptionStyle, value: unknown) => {
    onCustomStyleChange({ ...customStyle, [key]: value })
  }

  return (
    <div className="space-y-4">
      {/* Preset Grid */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Estilo de Legenda</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CAPTION_PRESETS.map((preset) => (
            <Card
              key={preset.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                presetId === preset.id && "ring-2 ring-primary"
              )}
              onClick={() => onPresetChange(preset.id)}
            >
              <CardContent className="p-3 text-center">
                <div className="text-2xl mb-1">{preset.preview}</div>
                <p className="font-medium text-sm">{preset.name}</p>
                <p className="text-xs text-muted-foreground">{preset.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Segmentation Mode */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Modo de Segmentação</Label>
        <Select value={segmentationMode} onValueChange={(v) => onSegmentationModeChange(v as SegmentationMode)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEGMENTATION_MODES.map((mode) => (
              <SelectItem key={mode.value} value={mode.value}>
                <div>
                  <span className="font-medium">{mode.label}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{mode.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Customize Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowCustomize(!showCustomize)}
        className="w-full"
      >
        {showCustomize ? (
          <>
            <ChevronUp className="h-4 w-4 mr-2" />
            Ocultar Personalização
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-2" />
            Personalizar Estilo
          </>
        )}
      </Button>

      {/* Customization Panel */}
      {showCustomize && (
        <div className="space-y-4 border rounded-lg p-4">
          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Cor do Texto</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customStyle?.color || "#FFFFFF"}
                  onChange={(e) => updateCustom("color", e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border"
                />
                <span className="text-xs text-muted-foreground">
                  {customStyle?.color || "#FFFFFF"}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cor de Fundo</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customStyle?.backgroundColor || "#000000"}
                  onChange={(e) => updateCustom("backgroundColor", e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border"
                />
                <span className="text-xs text-muted-foreground">
                  {customStyle?.backgroundColor || "#000000"}
                </span>
              </div>
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs">Tamanho da Fonte</Label>
              <span className="text-xs text-muted-foreground">
                {customStyle?.fontSize || 32}px
              </span>
            </div>
            <Slider
              value={[customStyle?.fontSize || 32]}
              min={16}
              max={64}
              step={1}
              onValueChange={([v]) => updateCustom("fontSize", v)}
            />
          </div>

          {/* Position */}
          <div className="space-y-1">
            <Label className="text-xs">Posição</Label>
            <Select
              value={customStyle?.position || "bottom"}
              onValueChange={(v) => updateCustom("position", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Topo</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="bottom">Base</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Animation */}
          <div className="space-y-1">
            <Label className="text-xs">Animação</Label>
            <Select
              value={customStyle?.animation || "fade-in"}
              onValueChange={(v) => updateCustom("animation", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAPTION_ANIMATIONS.map((anim) => (
                  <SelectItem key={anim.value} value={anim.value}>
                    {anim.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Family */}
          <div className="space-y-1">
            <Label className="text-xs">Fonte</Label>
            <Select
              value={customStyle?.fontFamily || "Inter"}
              onValueChange={(v) => updateCustom("fontFamily", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAPTION_FONTS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    <span style={{ fontFamily: font.value }}>{font.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}
