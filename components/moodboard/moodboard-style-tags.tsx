'use client'

import { Badge } from '@/components/ui/badge'
import { MOODBOARD_STYLE_TAGS } from '@/lib/types/moodboard'
import { cn } from '@/lib/utils'

interface MoodboardStyleTagsProps {
  selected: string[]
  onChange: (tags: string[]) => void
}

export function MoodboardStyleTags({ selected, onChange }: MoodboardStyleTagsProps) {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag))
    } else {
      onChange([...selected, tag])
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Style Tags</p>
      <div className="flex flex-wrap gap-1.5">
        {MOODBOARD_STYLE_TAGS.map((tag) => {
          const isSelected = selected.includes(tag)
          return (
            <Badge
              key={tag}
              variant={isSelected ? 'default' : 'outline'}
              className={cn('cursor-pointer capitalize transition-colors hover:bg-primary hover:text-primary-foreground', isSelected && 'bg-primary text-primary-foreground')}
              onClick={() => toggle(tag)}
            >
              {tag}
            </Badge>
          )
        })}
      </div>
    </div>
  )
}
