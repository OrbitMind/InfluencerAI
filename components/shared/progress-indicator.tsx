"use client"

import { cn } from "@/lib/utils"

interface ProgressIndicatorProps {
  progress?: number
  indeterminate?: boolean
  label?: string
  className?: string
}

export function ProgressIndicator({ progress = 0, indeterminate = false, label, className }: ProgressIndicatorProps) {
  return (
    <div className={cn("w-full space-y-2", className)}>
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          {!indeterminate && <span className="text-foreground">{Math.round(progress)}%</span>}
        </div>
      )}
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full bg-primary transition-all duration-300", indeterminate && "animate-pulse w-full")}
          style={{ width: indeterminate ? undefined : `${progress}%` }}
        />
      </div>
    </div>
  )
}
