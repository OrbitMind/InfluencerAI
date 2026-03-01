'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MoodboardCanvas } from '@/components/moodboard/moodboard-canvas'
import { MoodboardStyleTags } from '@/components/moodboard/moodboard-style-tags'
import { MoodboardColorPalette } from '@/components/moodboard/moodboard-color-palette'
import { MoodboardAiSummary } from '@/components/moodboard/moodboard-ai-summary'
import { ArrowLeft, Palette, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import type { MoodboardData, MoodboardItemData } from '@/lib/types/moodboard'

export default function MoodboardPage() {
  const params = useParams()
  const personaId = params.id as string

  const [moodboard, setMoodboard] = useState<MoodboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [styleTags, setStyleTags] = useState<string[]>([])
  const [colorPalette, setColorPalette] = useState<string[]>([])

  useEffect(() => {
    fetchMoodboard()
  }, [personaId])

  const fetchMoodboard = async () => {
    try {
      const res = await fetch(`/api/personas/${personaId}/moodboard`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setMoodboard(data.data)
      setStyleTags(data.data.styleTags ?? [])
      setColorPalette((data.data.colorPalette as string[]) ?? [])
    } catch {
      toast.error('Erro ao carregar moodboard')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/personas/${personaId}/moodboard`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ styleTags, colorPalette }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setMoodboard(data.data)
      toast.success('Moodboard salvo')
    } catch {
      toast.error('Erro ao salvar moodboard')
    } finally {
      setIsSaving(false)
    }
  }

  const handleItemAdded = (item: MoodboardItemData) => {
    setMoodboard((prev) => prev ? { ...prev, items: [...prev.items, item] } : prev)
  }

  const handleItemDeleted = (id: string) => {
    setMoodboard((prev) => prev ? { ...prev, items: prev.items.filter((i) => i.id !== id) } : prev)
  }

  const handleSummaryGenerated = (summary: string) => {
    setMoodboard((prev) => prev ? { ...prev, aiSummary: summary } : prev)
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/personas/${personaId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Moodboard da Persona
          </h1>
          <p className="text-sm text-muted-foreground">Defina a identidade visual com referências de estilo</p>
        </div>
        <Button className="ml-auto cursor-pointer" onClick={handleSave} disabled={isSaving} size="sm">
          {isSaving ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Salvando...</> : <><Save className="h-3.5 w-3.5 mr-2" />Salvar</>}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MoodboardCanvas
            personaId={personaId}
            items={moodboard?.items ?? []}
            onItemAdded={handleItemAdded}
            onItemDeleted={handleItemDeleted}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Estilo Visual</CardTitle>
              <CardDescription className="text-xs">Tags que descrevem a estética da persona</CardDescription>
            </CardHeader>
            <CardContent>
              <MoodboardStyleTags selected={styleTags} onChange={setStyleTags} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Paleta de Cores</CardTitle>
              <CardDescription className="text-xs">Cores principais da identidade visual</CardDescription>
            </CardHeader>
            <CardContent>
              <MoodboardColorPalette colors={colorPalette} onChange={setColorPalette} />
            </CardContent>
          </Card>

          {moodboard && (
            <MoodboardAiSummary
              personaId={personaId}
              currentSummary={moodboard.aiSummary}
              onSummaryGenerated={handleSummaryGenerated}
            />
          )}
        </div>
      </div>
    </div>
  )
}
