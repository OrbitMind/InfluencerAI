"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { ImageIcon, VideoIcon, Pencil, Megaphone, Mic, LayoutGrid, Camera, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PERSONA_NICHES, PERSONA_PLATFORMS, PERSONA_TONES } from "@/lib/types/persona"
import type { PersonaData } from "@/lib/types/persona"
import { toast } from "sonner"

interface PersonaHeaderProps {
  persona: PersonaData
  onEdit: () => void
  onLipSync?: () => void
  onRefresh?: () => void
}

export function PersonaHeader({ persona, onEdit, onLipSync, onRefresh }: PersonaHeaderProps) {
  const nicheLabel = PERSONA_NICHES.find((n) => n.value === persona.niche)?.label
  const platformLabel = PERSONA_PLATFORMS.find((p) => p.value === persona.targetPlatform)?.label
  const toneLabel = PERSONA_TONES.find((t) => t.value === persona.contentTone)?.label

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB')
      return
    }

    setIsUploading(true)
    try {
      // 1. Upload para Cloudinary
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/upload/image', { method: 'POST', body: formData })
      const uploadJson = await uploadRes.json()
      if (!uploadJson.url) throw new Error(uploadJson.error || 'Erro no upload')

      // 2. Salvar como referência da persona
      const refRes = await fetch(`/api/personas/${persona.id}/reference-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: uploadJson.url }),
      })
      const refJson = await refRes.json()
      if (!refJson.success) throw new Error(refJson.error || 'Erro ao salvar referência')

      toast.success('Imagem de referência atualizada!')
      onRefresh?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar imagem')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      {/* Avatar com botão de upload */}
      <div className="shrink-0 relative group">
        <div
          className="h-32 w-32 rounded-xl overflow-hidden bg-primary/10 cursor-pointer"
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {persona.referenceImageUrl ? (
            <img
              src={persona.referenceImageUrl}
              alt={persona.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-4xl font-bold text-primary">
                {persona.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Overlay de câmera */}
        <div
          className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{persona.name}</h1>
            {persona.bio && (
              <p className="text-muted-foreground mt-1">{persona.bio}</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {nicheLabel && <Badge variant="secondary">{nicheLabel}</Badge>}
          {platformLabel && <Badge variant="outline">{platformLabel}</Badge>}
          {toneLabel && <Badge variant="outline">{toneLabel}</Badge>}
          {persona.isArchived && <Badge variant="destructive">Arquivada</Badge>}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button asChild size="sm">
            <Link href="/dashboard/image-generator">
              <ImageIcon className="h-4 w-4 mr-2" />
              Gerar Imagem
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/video-generator">
              <VideoIcon className="h-4 w-4 mr-2" />
              Gerar Vídeo
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/campaigns/new?personaId=${persona.id}`}>
              <Megaphone className="h-4 w-4 mr-2" />
              Nova Campanha
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/personas/${persona.id}/moodboard`}>
              <LayoutGrid className="h-4 w-4 mr-2" />
              Moodboard
            </Link>
          </Button>
          {persona.referenceImageUrl && persona.voiceId && onLipSync && (
            <Button size="sm" variant="outline" onClick={onLipSync}>
              <Mic className="h-4 w-4 mr-2" />
              Gerar Vídeo Falando
              <Badge variant="outline" className="ml-1.5 text-[10px] px-1 py-0">Beta</Badge>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
