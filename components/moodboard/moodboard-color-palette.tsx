'use client'

import { useRef, useEffect, useCallback } from 'react'
import { Plus, X } from 'lucide-react'

interface MoodboardColorPaletteProps {
  colors: string[]
  onChange: (colors: string[]) => void
}

export function MoodboardColorPalette({ colors, onChange }: MoodboardColorPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const addColor = useCallback((color: string) => {
    if (!colors.includes(color) && colors.length < 10) {
      onChange([...colors, color])
    }
  }, [colors, onChange])

  // Use native 'change' event (fires when picker closes) instead of React's
  // onChange (which maps to 'input' and fires on every drag movement)
  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    const handleChange = (e: Event) => addColor((e.target as HTMLInputElement).value)
    input.addEventListener('change', handleChange)
    return () => input.removeEventListener('change', handleChange)
  }, [addColor])

  const removeColor = (color: string) => {
    onChange(colors.filter((c) => c !== color))
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Paleta de Cores</p>
      <div className="flex flex-wrap gap-2 items-center">
        {colors.map((color) => (
          <div key={color} className="relative group">
            <div
              className="h-8 w-8 rounded-full border-2 border-white shadow-md"
              ref={(el) => { if (el) el.style.backgroundColor = color }}
            />
            <button
              type="button"
              onClick={() => removeColor(color)}
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label={`Remover cor ${color}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}

        {colors.length < 10 && (
          <label
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border hover:border-primary hover:bg-primary/10 transition-colors cursor-pointer"
            title="Clique para escolher e adicionar uma cor"
          >
            <input
              ref={inputRef}
              type="color"
              className="sr-only"
              aria-label="Adicionar cor à paleta"
            />
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </label>
        )}
      </div>
    </div>
  )
}
