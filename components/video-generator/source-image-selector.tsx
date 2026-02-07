"use client"

import { ImageIcon, Upload, LinkIcon } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGeneration } from "@/lib/context/generation-context"
import { cn } from "@/lib/utils"

interface SourceImageSelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function SourceImageSelector({ value, onChange, disabled }: SourceImageSelectorProps) {
  const { generatedImageUrl } = useGeneration()

  const handleUseGenerated = () => {
    if (generatedImageUrl) {
      onChange(generatedImageUrl)
    }
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Imagem de Origem</label>

      <Tabs defaultValue={generatedImageUrl ? "generated" : "url"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generated" disabled={!generatedImageUrl}>
            Imagem Gerada
          </TabsTrigger>
          <TabsTrigger value="url">URL da Imagem</TabsTrigger>
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
      </Tabs>
    </div>
  )
}
