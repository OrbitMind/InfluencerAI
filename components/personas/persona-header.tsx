"use client"

import Link from "next/link"
import { ImageIcon, VideoIcon, Pencil, Megaphone, Mic, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PERSONA_NICHES, PERSONA_PLATFORMS, PERSONA_TONES } from "@/lib/types/persona"
import type { PersonaData } from "@/lib/types/persona"

interface PersonaHeaderProps {
  persona: PersonaData
  onEdit: () => void
  onLipSync?: () => void
}

export function PersonaHeader({ persona, onEdit, onLipSync }: PersonaHeaderProps) {
  const nicheLabel = PERSONA_NICHES.find((n) => n.value === persona.niche)?.label
  const platformLabel = PERSONA_PLATFORMS.find((p) => p.value === persona.targetPlatform)?.label
  const toneLabel = PERSONA_TONES.find((t) => t.value === persona.contentTone)?.label

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      <div className="shrink-0">
        {persona.referenceImageUrl ? (
          <div className="h-32 w-32 rounded-xl overflow-hidden bg-muted">
            <img
              src={persona.referenceImageUrl}
              alt={persona.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const fallback = e.currentTarget.parentElement?.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
          </div>
        ) : null}
        {!persona.referenceImageUrl || true ? (
          <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-primary/10" style={{ display: persona.referenceImageUrl ? 'none' : 'flex' }}>
            <span className="text-4xl font-bold text-primary">
              {persona.name.charAt(0).toUpperCase()}
            </span>
          </div>
        ) : null}
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
