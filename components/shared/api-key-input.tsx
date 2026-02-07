"use client"

import { useState } from "react"
import { Eye, EyeOff, Key, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useReplicate } from "@/lib/context/replicate-context"

export function ApiKeyInput() {
  const { apiKey, setApiKey, isConfigured } = useReplicate()
  const [showKey, setShowKey] = useState(false)
  const [inputValue, setInputValue] = useState(apiKey || "")

  const handleSave = () => {
    if (inputValue.trim()) {
      setApiKey(inputValue.trim())
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="api-key" className="flex items-center gap-2">
          <Key className="h-4 w-4" />
          Chave de API Replicate
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="api-key"
              type={showKey ? "text" : "password"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="r8_xxxxxxxxxxxx"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          <Button onClick={handleSave} disabled={!inputValue.trim()}>
            {isConfigured ? <Check className="h-4 w-4" /> : "Salvar"}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Obtenha sua chave de API em{" "}
        <a
          href="https://replicate.com/account/api-tokens"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          replicate.com
        </a>
      </p>
    </div>
  )
}
