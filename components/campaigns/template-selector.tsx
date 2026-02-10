"use client"

import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { campaignApiService } from "@/lib/services/CampaignApiService"
import { CAMPAIGN_CATEGORIES, type CampaignTemplateData } from "@/lib/types/campaign"
import { cn } from "@/lib/utils"

interface TemplateSelectorProps {
  selectedId: string | null
  onSelect: (template: CampaignTemplateData) => void
  disabled?: boolean
}

export function TemplateSelector({ selectedId, onSelect, disabled }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<CampaignTemplateData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const res = await campaignApiService.listTemplates()
      if (res.success && res.data) {
        setTemplates(res.data)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const filtered = activeCategory
    ? templates.filter((t) => t.category === activeCategory)
    : templates

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={activeCategory === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setActiveCategory(null)}
        >
          Todos
        </Badge>
        {CAMPAIGN_CATEGORIES.map((cat) => (
          <Badge
            key={cat.value}
            variant={activeCategory === cat.value ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setActiveCategory(cat.value)}
          >
            {cat.label}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((template) => (
          <Card
            key={template.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedId === template.id && "ring-2 ring-primary",
              disabled && "opacity-50 pointer-events-none"
            )}
            onClick={() => onSelect(template)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm">{template.name}</h4>
                  {template.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                </div>
                {selectedId === template.id && (
                  <div className="shrink-0 rounded-full bg-primary p-1">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {CAMPAIGN_CATEGORIES.find((c) => c.value === template.category)?.label || template.category}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          Nenhum template encontrado nesta categoria.
        </p>
      )}
    </div>
  )
}
