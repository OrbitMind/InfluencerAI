"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PersonaHeader } from "@/components/personas/persona-header"
import { PersonaAssetGallery } from "@/components/personas/persona-asset-gallery"
import { PersonaInfoCard } from "@/components/personas/persona-info-card"
import { PersonaPromptCard } from "@/components/personas/persona-prompt-card"
import { PersonaEditModal } from "@/components/personas/persona-edit-modal"
import { VoiceConfigurator } from "@/components/voice/voice-configurator"
import { LipSyncDialog } from "@/components/personas/lip-sync-dialog"
import { usePersona } from "@/lib/context/persona-context"
import type { PersonaData } from "@/lib/types/persona"

export default function PersonaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { selectPersona } = usePersona()
  const [persona, setPersona] = useState<PersonaData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showLipSync, setShowLipSync] = useState(false)

  const personaId = params.id as string

  const loadPersona = useCallback(async () => {
    try {
      const res = await fetch(`/api/personas/${personaId}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setPersona(json.data)
      selectPersona(json.data)
    } catch {
      router.push("/dashboard/personas")
    } finally {
      setIsLoading(false)
    }
  }, [personaId, selectPersona, router])

  useEffect(() => {
    loadPersona()
  }, [loadPersona])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-6">
          <Skeleton className="h-32 w-32 rounded-xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96" />
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
      </div>
    )
  }

  if (!persona) return null

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/personas">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Personas
        </Link>
      </Button>

      <PersonaHeader
        persona={persona}
        onEdit={() => setShowEdit(true)}
        onLipSync={() => setShowLipSync(true)}
        onRefresh={loadPersona}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PersonaAssetGallery
            assets={persona.assets}
            personaId={persona.id}
            onRefresh={loadPersona}
          />
        </div>

        <div className="space-y-4">
          <PersonaPromptCard basePrompt={persona.basePrompt} />
          <VoiceConfigurator persona={persona} onRefresh={loadPersona} />
          <PersonaInfoCard persona={persona} />
        </div>
      </div>

      {showEdit && (
        <PersonaEditModal
          persona={persona}
          open={showEdit}
          onOpenChange={setShowEdit}
          onUpdated={loadPersona}
        />
      )}

      {persona && (
        <LipSyncDialog
          persona={persona}
          open={showLipSync}
          onOpenChange={setShowLipSync}
          onComplete={loadPersona}
        />
      )}
    </div>
  )
}
