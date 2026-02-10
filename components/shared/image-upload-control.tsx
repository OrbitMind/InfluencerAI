"use client"

import { useState, useRef } from "react"
import { Upload, Link2, X, Loader2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface ImageUploadControlProps {
  label: string
  description?: string
  value: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
}

export function ImageUploadControl({
  label,
  description,
  value,
  onChange,
  disabled = false,
}: ImageUploadControlProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadTab, setUploadTab] = useState<"url" | "file">("url")
  const [urlInput, setUrlInput] = useState(value || "")
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim())
      toast.success('URL adicionada!')
    }
  }

  const handleClear = () => {
    onChange(null)
    setUrlInput("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (value) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                <img
                  src={value}
                  alt={label}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="12" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EErro%3C/text%3E%3C/svg%3E'
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Imagem carregada</p>
                <p className="text-xs text-muted-foreground">Clique em remover para alterar</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={handleClear}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <Tabs value={uploadTab} onValueChange={(v) => setUploadTab(v as "url" | "file")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url" disabled={disabled}>
            <Link2 className="h-3 w-3 mr-1.5" />
            URL
          </TabsTrigger>
          <TabsTrigger value="file" disabled={disabled}>
            <Upload className="h-3 w-3 mr-1.5" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="mt-2">
          <div className="flex gap-2">
            <Input
              placeholder="https://exemplo.com/imagem.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleUrlSubmit()
                }
              }}
            />
            <Button
              size="sm"
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim() || disabled}
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="file" className="mt-2">
          <div className="flex flex-col items-center gap-2 py-4 border-2 border-dashed rounded-lg">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={disabled || isUploading}
            />
            <Button
              size="sm"
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
