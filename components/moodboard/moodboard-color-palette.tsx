'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-react'

interface MoodboardColorPaletteProps {
  colors: string[]
  onChange: (colors: string[]) => void
}

export function MoodboardColorPalette({ colors, onChange }: MoodboardColorPaletteProps) {
  const [inputColor, setInputColor] = useState('#000000')

  const addColor = () => {
    if (!colors.includes(inputColor) && colors.length < 10) {
      onChange([...colors, inputColor])
    }
  }

  const removeColor = (color: string) => {
    onChange(colors.filter((c) => c !== color))
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Paleta de Cores</p>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <div key={color} className="relative group">
            <div
              className="h-8 w-8 rounded-full border-2 border-white shadow-md cursor-pointer"
              style={{ backgroundColor: color }}
            />
            <button
              onClick={() => removeColor(color)}
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
        {colors.length < 10 && (
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={inputColor}
              onChange={(e) => setInputColor(e.target.value)}
              className="h-8 w-8 rounded-full border cursor-pointer bg-transparent"
            />
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={addColor}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
