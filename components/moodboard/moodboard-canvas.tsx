'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, Loader2, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { MoodboardItemCard } from './moodboard-item-card'
import type { MoodboardItemData } from '@/lib/types/moodboard'

interface MoodboardCanvasProps {
  personaId: string
  items: MoodboardItemData[]
  onItemAdded: (item: MoodboardItemData) => void
  onItemDeleted: (id: string) => void
}

export function MoodboardCanvas({ personaId, items, onItemAdded, onItemDeleted }: MoodboardCanvasProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} não é uma imagem`)
          continue
        }

        // Upload via Cloudinary (usando o endpoint existente da plataforma)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', 'influencer_ai')

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) {
          toast.error(`Falha ao fazer upload de ${file.name}`)
          continue
        }

        const uploadData = await uploadRes.json()

        const res = await fetch(`/api/personas/${personaId}/moodboard/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: uploadData.url,
            publicId: uploadData.publicId,
          }),
        })

        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        onItemAdded(data.data)
      }
      toast.success('Imagens adicionadas ao moodboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao adicionar imagem')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/personas/${personaId}/moodboard/items?itemId=${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      onItemDeleted(id)
      toast.success('Imagem removida')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover imagem')
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFileUpload(e.dataTransfer.files) }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Enviando imagens...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Arraste imagens ou clique para adicionar</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP — múltiplas imagens suportadas</p>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground text-center">
              Nenhuma imagem no moodboard ainda.
              <br />
              Adicione fotos de referência para definir a identidade visual da persona.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => (
            <MoodboardItemCard key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
