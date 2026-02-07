"use client"

import { Download, RotateCcw, ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImagePreviewProps {
  imageUrl: string | null
  isLoading: boolean
  onRegenerate?: () => void
  className?: string
}

export function ImagePreview({ imageUrl, isLoading, onRegenerate, className }: ImagePreviewProps) {
  const handleDownload = async () => {
    if (!imageUrl) return

    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `influenciador-${Date.now()}.png`
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
      <div className="aspect-square w-full bg-muted rounded-xl overflow-hidden relative border border-border">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Gerando seu influenciador...</p>
          </div>
        ) : imageUrl ? (
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt="Influenciador gerado"
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="h-16 w-16 opacity-30" />
            <p className="text-sm">Sua imagem gerada aparecerá aqui</p>
          </div>
        )}
      </div>

      {imageUrl && !isLoading && (
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
