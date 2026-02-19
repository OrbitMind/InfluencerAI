"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Trash2 } from "lucide-react"
import { useState } from "react"

/**
 * Componente para gerenciar uma API key
 * Princípio: Single Responsibility Principle (SRP)
 * Responsabilidade: UI para configurar/remover uma API key
 */

interface ApiKeyManagerProps {
  label: string
  placeholder: string
  helpText: string
  helpLink: string
  isConfigured: boolean
  onSave: (key: string) => void | Promise<boolean>
  onClear: () => void | Promise<void>
}

export function ApiKeyManager({
  label,
  placeholder,
  helpText,
  helpLink,
  isConfigured,
  onSave,
  onClear,
}: ApiKeyManagerProps) {
  const [input, setInput] = useState("")

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (input.trim()) {
      setIsSaving(true)
      try {
        await onSave(input.trim())
        setInput("")
      } finally {
        setIsSaving(false)
      }
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {isConfigured ? (
        <div className="flex items-center justify-between p-3 rounded-md bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-500">Chave configurada</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button onClick={handleSave} disabled={!input.trim() || isSaving}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {helpText}{" "}
        <a
          href={helpLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {helpLink.replace("https://", "")}
        </a>
      </p>
    </div>
  )
}
