"use client"

import { useState, useRef } from "react"
import { Upload, ImageIcon, Sparkles, Check, Loader2, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PromptBuilderService } from "@/lib/services/prompt-builder-service"
import { toast } from "sonner"
import type { CreatePersonaDTO } from "@/lib/types/persona"

interface PersonaReferenceStepProps {
  data: CreatePersonaDTO
  referenceUrl: string
  onReferenceUrlChange: (url: string) => void
}

export function PersonaReferenceStep({ data, referenceUrl, onReferenceUrlChange }: PersonaReferenceStepProps) {
  const [inputMode, setInputMode] = useState<"url" | "preview">(referenceUrl ? "preview" : "url")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadTab, setUploadTab] = useState<"url" | "file">("url")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const basePrompt = PromptBuilderService.buildBasePrompt(data)

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
      onReferenceUrlChange(data.url)
      setInputMode("preview")
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
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Imagem de Referência</Label>
        <p className="text-sm text-muted-foreground">
          Adicione uma imagem de referência para manter consistência visual nas gerações futuras.
          Esta etapa é opcional — você pode adicionar depois.
        </p>
      </div>

      {inputMode === "preview" && referenceUrl ? (
        <Card>
          <CardContent className="p-4">
            <div className="aspect-square max-w-sm mx-auto relative rounded-lg overflow-hidden bg-muted">
              <img
                src={referenceUrl}
                alt="Referência"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImagem não disponível%3C/text%3E%3C/svg%3E'
                  toast.error('Erro ao carregar imagem. Verifique a URL.')
                }}
              />
              <div className="absolute top-2 right-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-center">
              <Button variant="outline" size="sm" onClick={() => { setInputMode("url"); onReferenceUrlChange(""); }}>
                Alterar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Tabs value={uploadTab} onValueChange={(v) => setUploadTab(v as "url" | "file")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url">
                <Link2 className="h-4 w-4 mr-2" />
                URL
              </TabsTrigger>
              <TabsTrigger value="file">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url">
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Link2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Cole uma URL de imagem</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use uma URL pública de imagem como referência
                    </p>
                  </div>
                  <div className="w-full max-w-md">
                    <Input
                      placeholder="https://exemplo.com/imagem.jpg"
                      value={referenceUrl}
                      onChange={(e) => onReferenceUrlChange(e.target.value)}
                    />
                  </div>
                  {referenceUrl && (
                    <Button size="sm" onClick={() => setInputMode("preview")}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="file">
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Faça upload de uma imagem</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, WEBP até 10MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <Button
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou gere depois</span>
            </div>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Gerar com IA depois</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Após criar a persona, use o Gerador de Imagem com o prompt base para criar a imagem de referência.
                  </p>
                  {basePrompt && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Prompt: &quot;{basePrompt}&quot;
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
