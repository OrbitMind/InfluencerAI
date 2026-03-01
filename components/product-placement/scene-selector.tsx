'use client'

import { Card, CardContent } from '@/components/ui/card'
import { PLACEMENT_SCENE_LIST } from '@/lib/constants/placement-scenes'
import type { PlacementSceneId } from '@/lib/types/product-placement'
import { cn } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'

interface SceneSelectorProps {
  value?: PlacementSceneId
  onChange: (scene: PlacementSceneId) => void
}

export function SceneSelector({ value, onChange }: SceneSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Cenário</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PLACEMENT_SCENE_LIST.map((scene) => (
          <Card
            key={scene.id}
            className={cn(
              'cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm',
              value === scene.id && 'border-primary ring-2 ring-primary ring-offset-1'
            )}
            onClick={() => onChange(scene.id)}
          >
            <CardContent className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-lg">{scene.icon}</span>
                {value === scene.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </div>
              <p className="text-xs font-medium">{scene.label}</p>
              <p className="text-[11px] text-muted-foreground line-clamp-2">{scene.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
