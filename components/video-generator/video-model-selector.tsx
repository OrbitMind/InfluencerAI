"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Check, ChevronDown, Search, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useReplicateModels } from "@/lib/hooks/use-replicate-models"
import { cn } from "@/lib/utils"

interface VideoModelSelectorProps {
  selectedModelId: string
  onModelSelect: (modelId: string) => void
  disabled?: boolean
}

export function VideoModelSelector({ selectedModelId, onModelSelect, disabled = false }: VideoModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { models, isLoading, searchModels, refetch, totalCount } = useReplicateModels({ type: "video" })

  const selectedModel = models.find((m) => m.id === selectedModelId)

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return models
    const query = searchQuery.toLowerCase()
    return models.filter(
      (model) =>
        model.name.toLowerCase().includes(query) ||
        model.id.toLowerCase().includes(query) ||
        model.provider.toLowerCase().includes(query) ||
        model.description.toLowerCase().includes(query),
    )
  }, [models, searchQuery])

  const handleSearchKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault()
      await searchModels(searchQuery)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    refetch()
  }

  const formatRunCount = (count?: number) => {
    if (!count) return null
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
    return count.toString()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Modelo de Video</label>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {totalCount} modelos
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-6 px-2 text-xs text-muted-foreground"
          >
            <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-transparent"
            disabled={disabled}
            role="combobox"
            aria-expanded={open}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="truncate">{selectedModel?.name || selectedModelId || "Selecionar modelo"}</span>
              {selectedModel?.provider && (
                <span className="text-xs text-muted-foreground shrink-0">({selectedModel.provider})</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="flex items-center border-b px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
            <Input
              placeholder="Buscar modelos... (Enter para buscar na API)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="h-8 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2 shrink-0" />}
          </div>
          {searchQuery.trim() && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b">
              <p className="text-xs text-muted-foreground">
                {filteredModels.length} resultado(s) para &quot;{searchQuery}&quot;
              </p>
              <Button variant="ghost" size="sm" className="h-5 px-2 text-xs" onClick={handleClearSearch}>
                Limpar
              </Button>
            </div>
          )}
          <ScrollArea className="h-[350px]">
            <div className="p-1">
              {filteredModels.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <p className="text-sm text-muted-foreground">Nenhum modelo encontrado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pressione Enter para buscar na API do Replicate
                  </p>
                </div>
              ) : (
                filteredModels.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onModelSelect(model.id)
                      setOpen(false)
                    }}
                    className={cn(
                      "w-full flex flex-col items-start gap-0.5 p-2.5 rounded-md text-left hover:bg-accent transition-colors",
                      selectedModelId === model.id && "bg-accent",
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-medium text-sm">{model.name}</span>
                      <div className="flex items-center gap-2">
                        {model.runCount != null && (
                          <span className="text-[10px] text-muted-foreground/60">
                            {formatRunCount(model.runCount)} runs
                          </span>
                        )}
                        {selectedModelId === model.id && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-1">{model.description}</span>
                    <span className="text-[10px] text-muted-foreground/60 font-mono">{model.id}</span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  )
}
