"use client"

import { useState, useRef } from "react"
import { ImageIcon, Upload, LinkIcon, Loader2 } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGeneration } from "@/lib/context/generation-context"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface SourceImageSelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function SourceImageSelector({ value, onChange, disabled }: SourceImageSelectorProps) {
  const { generatedImageUrl } = useGeneration()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUseGenerated = () => {
    if (generatedImageUrl) {
      onChange(generatedImageUrl)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho máximo: 10MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao fazer upload')
      }

      const data = await response.json()
      onChange(data.url)
      toast.success('Imagem carregada com sucesso!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Imagem de Origem</label>

      <Tabs defaultValue={generatedImageUrl ? "generated" : "url"} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generated" disabled={!generatedImageUrl}>
            <ImageIcon className="h-3 w-3 mr-1" />
            Gerada
          </TabsTrigger>
          <TabsTrigger value="url">
            <LinkIcon className="h-3 w-3 mr-1" />
            URL
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="h-3 w-3 mr-1" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generated" className="space-y-3">
          {generatedImageUrl ? (
            <div className="space-y-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
                <Image
                  src={generatedImageUrl || "/placeholder.svg"}
                  alt="Influenciador gerado"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <Button
                variant="outline"
                className={cn("w-full", value === generatedImageUrl && "border-primary bg-primary/10")}
                onClick={handleUseGenerated}
                disabled={disabled}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                {value === generatedImageUrl ? "Usando Imagem Gerada" : "Usar Esta Imagem"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground border border-dashed rounded-lg">
              <Upload className="h-8 w-8 opacity-50" />
              <p className="text-sm text-center">Gere uma imagem primeiro no Gerador de Imagem</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="url" className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                className="pl-10"
                disabled={disabled}
              />
            </div>
          </div>
          {value && value !== generatedImageUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
              <Image
                src={value || "/placeholder.svg"}
                alt="Imagem de origem"
                fill
                className="object-cover"
                unoptimized
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="upload" className="space-y-3">
          <div className="flex flex-col items-center gap-3 py-6 border-2 border-dashed rounded-lg">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={disabled || isUploading}
              aria-label="Selecionar arquivo de imagem"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Arquivo
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP até 10MB</p>
          </div>
          {value && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
              <Image
                src={value || "/placeholder.svg"}
                alt="Imagem enviada"
                fill
                className="object-cover"
                unoptimized
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
