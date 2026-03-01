'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import type { MoodboardItemData } from '@/lib/types/moodboard'
import { cn } from '@/lib/utils'

interface MoodboardItemCardProps {
  item: MoodboardItemData
  onDelete: (id: string) => void
  className?: string
}

export function MoodboardItemCard({ item, onDelete, className }: MoodboardItemCardProps) {
  return (
    <div className={cn('group relative rounded-lg overflow-hidden border bg-card', className)}>
      <div className="relative aspect-square">
        <Image
          src={item.imageUrl}
          alt={item.caption ?? 'Moodboard image'}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {(item.category || item.caption) && (
        <div className="p-2 space-y-1">
          {item.category && (
            <Badge variant="secondary" className="text-xs capitalize">
              {item.category.replace('_', ' ')}
            </Badge>
          )}
          {item.caption && (
            <p className="text-xs text-muted-foreground line-clamp-2">{item.caption}</p>
          )}
        </div>
      )}
    </div>
  )
}
