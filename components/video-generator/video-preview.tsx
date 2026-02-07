"use client"

import { Download, RotateCcw, VideoIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface VideoPreviewProps {
  videoUrl: string | null
  isLoading: boolean
  onRegenerate?: () => void
  className?: string
}

export function VideoPreview({ videoUrl, isLoading, onRegenerate, className }: VideoPreviewProps) {
  const handleDownload = async () => {
    if (!videoUrl) return

    try {
      const response = await fetch(videoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `influenciador-video-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Falha no download:", error)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="aspect-video w-full bg-muted rounded-xl overflow-hidden relative border border-border">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Gerando seu vídeo...</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Isso pode levar alguns minutos</p>
            </div>
          </div>
        ) : videoUrl ? (
          <video src={videoUrl} controls className="w-full h-full object-contain" playsInline>
            Seu navegador não suporta a tag de vídeo.
          </video>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <VideoIcon className="h-16 w-16 opacity-30" />
            <p className="text-sm">Seu vídeo gerado aparecerá aqui</p>
          </div>
        )}
      </div>

      {videoUrl && !isLoading && (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Baixar
          </Button>
          {onRegenerate && (
            <Button variant="outline" onClick={onRegenerate}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
