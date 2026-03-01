'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { UGCTemplateCard } from '@/components/ugc/ugc-template-card'
import { UGCSubcategoryFilter } from '@/components/ugc/ugc-subcategory-filter'
import { Video, Sparkles } from 'lucide-react'
import type { UGCSubcategory } from '@/lib/types/ugc'
import { toast } from 'sonner'

interface UGCTemplate {
  id: string
  name: string
  description: string | null
  icon: string | null
  category: string
  slug: string
}

export default function UGCFactoryPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<UGCTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSubcategory, setSelectedSubcategory] = useState<UGCSubcategory | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/ugc/templates')
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setTemplates(data.data)

      if (data.data.length === 0) {
        await fetch('/api/ugc/seed', { method: 'POST' })
        const res2 = await fetch('/api/ugc/templates')
        const data2 = await res2.json()
        if (data2.success) setTemplates(data2.data)
      }
    } catch (err: unknown) {
      toast.error('Erro ao carregar templates UGC')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTemplates = selectedSubcategory
    ? templates.filter((t) => t.slug.includes(selectedSubcategory))
    : templates

  const handleSelectTemplate = (templateId: string) => {
    router.push(`/dashboard/campaigns/new?templateId=${templateId}`)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" />
            UGC Factory
          </h1>
          <p className="text-muted-foreground mt-1">
            Templates profissionais de UGC (User Generated Content) prontos para usar com sua persona.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 rounded-lg px-3 py-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>{templates.length} templates disponíveis</span>
        </div>
      </div>

      <UGCSubcategoryFilter selected={selectedSubcategory} onChange={setSelectedSubcategory} />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Video className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Nenhum template encontrado para esta categoria.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <UGCTemplateCard key={template.id} template={template} onSelect={handleSelectTemplate} />
          ))}
        </div>
      )}
    </div>
  )
}
