"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Check, ChevronDown, Search, Loader2, RefreshCw, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useReplicateModels } from "@/lib/hooks/use-replicate-models"
import { MOTION_MODEL_LIST } from "@/lib/constants/motion-models"
import { cn } from "@/lib/utils"
import type { AIModel } from "@/lib/types/models"

interface MotionModelSelectorProps {
  selectedModelId: string | null
  onModelSelect: (modelId: string) => void
  disabled?: boolean
}

export function MotionModelSelector({ selectedModelId, onModelSelect, disabled = false }: MotionModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { models, isLoading, searchModels, refetch, totalCount } = useReplicateModels({ type: "video" })

  // Curated motion models converted to AIModel shape for unified rendering
  const curatedAsAIModels: AIModel[] = useMemo(() => MOTION_MODEL_LIST.map((m) => ({
    id: m.replicateModelId,
    name: m.name,
    description: m.description,
    provider: m.replicateModelId.split("/")[0],
    type: "video" as const,
  })), [])

  // When there's a search query, use Replicate API results; otherwise show curated first then API models
  const displayModels = useMemo(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return models.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.id.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query),
      )
    }
    // Merge: curated first, then API models (deduped)
    const curatedIds = new Set(curatedAsAIModels.map((m) => m.id))
    const rest = models.filter((m) => !curatedIds.has(m.id))
    return [...curatedAsAIModels, ...rest]
  }, [searchQuery, models, curatedAsAIModels])

  const selectedLabel = useMemo(() => {
    if (!selectedModelId) return "Selecionar modelo de animação"
    const curated = MOTION_MODEL_LIST.find((m) => m.replicateModelId === selectedModelId)
    if (curated) return curated.name
    const fromApi = models.find((m) => m.id === selectedModelId)
    return fromApi?.name ?? selectedModelId
  }, [selectedModelId, models])

  const isCurated = (modelId: string) => MOTION_MODEL_LIST.some((m) => m.replicateModelId === modelId)

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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Modelo de Animação</label>
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
              <span className="truncate">{selectedLabel}</span>
              {selectedModelId && isCurated(selectedModelId) && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                  <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                  Recomendado
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[420px] p-0" align="start">
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
                {displayModels.length} resultado(s) para &quot;{searchQuery}&quot;
              </p>
              <Button variant="ghost" size="sm" className="h-5 px-2 text-xs" onClick={handleClearSearch}>
                Limpar
              </Button>
            </div>
          )}

          {!searchQuery.trim() && (
            <div className="px-3 py-1.5 bg-muted/30 border-b">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                Recomendados para animação
              </p>
            </div>
          )}

          <ScrollArea className="h-[350px]">
            <div className="p-1">
              {displayModels.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <p className="text-sm text-muted-foreground">Nenhum modelo encontrado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pressione Enter para buscar na API do Replicate
                  </p>
                </div>
              ) : (
                <>
                  {displayModels.map((model, index) => {
                    const wasCurated = isCurated(model.id)
                    const prevWasCurated = index > 0 && isCurated(displayModels[index - 1].id)
                    const showDivider = !searchQuery.trim() && !wasCurated && prevWasCurated
                    return (
                      <div key={model.id}>
                        {showDivider && (
                          <div className="px-3 py-1.5 mt-1">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide border-t pt-1.5">
                              Todos os modelos de vídeo
                            </p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            onModelSelect(model.id)
                            setOpen(false)
                            setSearchQuery("")
                          }}
                          className={cn(
                            "group w-full flex flex-col items-start gap-0.5 p-2.5 rounded-md text-left hover:bg-accent transition-colors",
                            selectedModelId === model.id && "bg-accent",
                          )}
                        >
                          <div className="flex w-full items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-medium text-sm truncate">{model.name}</span>
                              {wasCurated && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0">
                                  <Star className="h-2 w-2 mr-0.5 fill-current" />
                                  Motion
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {(model as AIModel & { runCount?: number }).runCount != null && (
                                <span className="text-[10px] text-muted-foreground">
                                  {formatRunCount((model as AIModel & { runCount?: number }).runCount)}
                                </span>
                              )}
                              {selectedModelId === model.id && <Check className="h-4 w-4 text-primary" />}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {model.description}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 font-mono">
                            {model.id}
                          </span>
                        </button>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function formatRunCount(count?: number) {
  if (!count) return null
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M runs`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K runs`
  return `${count} runs`
}
