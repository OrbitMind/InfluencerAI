'use client'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CAMERA_MOVEMENT_LIST } from '@/lib/constants/camera-control'
import type { CameraMovement } from '@/lib/types/camera-control'
import {
  Square, ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
  ZoomIn, ZoomOut, RotateCcw, RotateCw,
  Maximize2, Minimize2, TrendingUp, TrendingDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, React.ElementType> = {
  Square, ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
  ZoomIn, ZoomOut, RotateCcw, RotateCw,
  Maximize2, Minimize2, TrendingUp, TrendingDown,
}

interface CameraControlSelectorProps {
  value?: CameraMovement
  onChange: (movement: CameraMovement) => void
}

export function CameraControlSelector({ value, onChange }: CameraControlSelectorProps) {
  return (
    <TooltipProvider>
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Movimento de Câmera</p>
        <div className="grid grid-cols-5 gap-1.5">
          {CAMERA_MOVEMENT_LIST.map((movement) => {
            const Icon = ICON_MAP[movement.icon] ?? Square
            const isSelected = value === movement.id
            return (
              <Tooltip key={movement.id}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      'h-9 w-full flex flex-col gap-0.5 px-1',
                      isSelected && 'ring-2 ring-primary ring-offset-1'
                    )}
                    onClick={() => onChange(movement.id)}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-[9px] leading-none truncate w-full text-center">
                      {movement.label.split(' ')[0]}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-medium">{movement.label}</p>
                  <p className="text-xs text-muted-foreground max-w-[180px]">{movement.promptText}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
