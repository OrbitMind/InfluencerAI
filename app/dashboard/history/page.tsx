"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGeneration } from "@/lib/context/generation-context"
import { cn } from "@/lib/utils"
import { downloadFile, generateFilename } from "@/lib/utils/downloadUtils"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Download, Filter, ImageIcon, Trash2, VideoIcon } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

/**
 * Página de Histórico
 * Princípio: Single Responsibility Principle (SRP) refatorado
 * Responsabilidade: UI para visualização de histórico
 * Lógica de download extraída para downloadUtils
 */

type FilterType = "all" | "image" | "video"

export default function HistoryPage() {
  const { history, clearHistory } = useGeneration()
  const [filter, setFilter] = useState<FilterType>("all")

  const filteredHistory = history.filter((item) => {
    if (filter === "all") return true
    return item.type === filter
  })

  const handleDownload = async (url: string, type: "image" | "video") => {
    try {
      const extension = type === "image" ? "png" : "mp4"
      const filename = generateFilename(type, extension)
      await downloadFile(url, filename)
    } catch (error) {
      console.error("Falha no download:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Histórico</h1>
          <p className="text-muted-foreground">Navegue por todo seu conteúdo gerado</p>
        </div>
        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearHistory}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Tudo
          </Button>
        )}
      </div>

      {history.length > 0 && (
        <div className="flex items-center gap-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList>
              <TabsTrigger value="all">Todos ({history.length})</TabsTrigger>
              <TabsTrigger value="image">Imagens ({history.filter((i) => i.type === "image").length})</TabsTrigger>
              <TabsTrigger value="video">Vídeos ({history.filter((i) => i.type === "video").length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {filteredHistory.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {history.length === 0 ? "Nenhuma geração ainda" : "Nenhum item corresponde a este filtro"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredHistory.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className={cn("relative bg-muted", item.type === "image" ? "aspect-square" : "aspect-video")}>
                {item.type === "image" ? (
                  <Image
                    src={item.outputUrl || "/placeholder.svg"}
                    alt={item.prompt}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <video src={item.outputUrl} className="w-full h-full object-cover" controls playsInline />
                )}
              </div>
              <CardHeader className="p-4">
                <div className="flex items-center gap-2">
                  {item.type === "image" ? (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <VideoIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <CardTitle className="text-sm capitalize">{item.type === "image" ? "Imagem" : "Vídeo"}</CardTitle>
                </div>
                <CardDescription className="text-xs line-clamp-2">{item.prompt}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(item.createdAt, { addSuffix: true, locale: ptBR })}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(item.outputUrl, item.type)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
