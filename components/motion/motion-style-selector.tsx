'use client'

import { Button } from '@/components/ui/button'
import { ANIMATION_STYLES, AnimationStyle } from '@/lib/types/motion'
import { cn } from '@/lib/utils'

const STYLE_LABELS: Record<AnimationStyle, string> = {
  walk: '🚶 Andar',
  dance: '💃 Dançar',
  wave: '👋 Acenar',
  nod: '😊 Concordar',
  talk: '💬 Falar',
  laugh: '😄 Rir',
  sit: '🪑 Sentar',
  'stand-up': '⬆️ Levantar',
  custom: '✍️ Personalizado',
}

interface MotionStyleSelectorProps {
  value: AnimationStyle
  onChange: (style: AnimationStyle) => void
}

export function MotionStyleSelector({ value, onChange }: MotionStyleSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Estilo de Animação</p>
      <div className="grid grid-cols-3 gap-2">
        {ANIMATION_STYLES.map((style) => (
          <Button
            key={style}
            type="button"
            variant={value === style ? 'default' : 'outline'}
            size="sm"
            className={cn('h-auto py-2 text-xs flex flex-col gap-1', value === style && 'ring-2 ring-primary ring-offset-1')}
            onClick={() => onChange(style)}
          >
            {STYLE_LABELS[style]}
          </Button>
        ))}
      </div>
    </div>
  )
}
