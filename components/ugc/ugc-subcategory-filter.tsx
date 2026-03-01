'use client'

import { Badge } from '@/components/ui/badge'
import { UGC_SUBCATEGORIES, UGC_SUBCATEGORY_LABELS, UGC_SUBCATEGORY_ICONS } from '@/lib/types/ugc'
import type { UGCSubcategory } from '@/lib/types/ugc'
import { cn } from '@/lib/utils'

interface UGCSubcategoryFilterProps {
  selected: UGCSubcategory | null
  onChange: (subcategory: UGCSubcategory | null) => void
}

export function UGCSubcategoryFilter({ selected, onChange }: UGCSubcategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant={selected === null ? 'default' : 'outline'}
        className="cursor-pointer px-3 py-1 text-sm"
        onClick={() => onChange(null)}
      >
        Todos
      </Badge>
      {UGC_SUBCATEGORIES.map((sub) => (
        <Badge
          key={sub}
          variant={selected === sub ? 'default' : 'outline'}
          className={cn('cursor-pointer px-3 py-1 text-sm', selected === sub && 'bg-primary text-primary-foreground')}
          onClick={() => onChange(selected === sub ? null : sub)}
        >
          {UGC_SUBCATEGORY_ICONS[sub]} {UGC_SUBCATEGORY_LABELS[sub]}
        </Badge>
      ))}
    </div>
  )
}
