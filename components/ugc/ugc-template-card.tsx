'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { UGC_SUBCATEGORY_LABELS } from '@/lib/types/ugc'
import type { UGCSubcategory } from '@/lib/types/ugc'

interface UGCTemplateCardProps {
  template: {
    id: string
    name: string
    description: string | null
    icon: string | null
    category: string
    slug: string
  }
  onSelect: (templateId: string) => void
}

export function UGCTemplateCard({ template, onSelect }: UGCTemplateCardProps) {
  const subcategoryKey = template.slug.replace('ugc-', '') as UGCSubcategory
  const subcategoryLabel = UGC_SUBCATEGORY_LABELS[subcategoryKey] ?? template.name

  return (
    <Card className="group flex flex-col hover:shadow-md hover:border-primary/50 transition-all cursor-pointer" onClick={() => onSelect(template.id)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-3xl">{template.icon ?? '🎬'}</span>
          <Badge variant="secondary" className="text-xs">{subcategoryLabel}</Badge>
        </div>
        <CardTitle className="text-base mt-2">{template.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <CardDescription className="text-sm">{template.description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          Usar Template
          <ArrowRight className="h-3.5 w-3.5 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  )
}
