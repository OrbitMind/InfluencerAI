"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-destructive/10 border border-destructive/20">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-center text-destructive">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
      )}
    </div>
  )
}
