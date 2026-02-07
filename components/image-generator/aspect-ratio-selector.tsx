"use client"

import { ASPECT_RATIOS } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface AspectRatioSelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function AspectRatioSelector({ value, onChange, disabled }: AspectRatioSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Proporção</label>
      <div className="flex flex-wrap gap-2">
        {ASPECT_RATIOS.map((ratio) => (
          <button
            key={ratio.value}
            type="button"
            onClick={() => onChange(ratio.value)}
            disabled={disabled}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md border transition-colors",
              value === ratio.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-secondary-foreground border-border hover:bg-accent hover:text-accent-foreground",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            {ratio.label}
          </button>
        ))}
      </div>
    </div>
  )
}
