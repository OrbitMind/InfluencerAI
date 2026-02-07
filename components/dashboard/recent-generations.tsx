"use client"

import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ImageIcon, VideoIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGeneration } from "@/lib/context/generation-context"
import { cn } from "@/lib/utils"

export function RecentGenerations() {
  const { history } = useGeneration()
  const recentItems = history.slice(0, 6)

  if (recentItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerações Recentes</CardTitle>
          <CardDescription>Seu conteúdo criado recentemente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Nenhuma geração ainda</p>
            <p className="text-xs text-muted-foreground">Comece criando uma imagem ou vídeo</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerações Recentes</CardTitle>
        <CardDescription>Seu conteúdo criado recentemente</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group relative overflow-hidden rounded-lg border border-border",
                item.type === "image" ? "aspect-square" : "aspect-video",
              )}
            >
              {item.type === "image" ? (
                <Image
                  src={item.outputUrl || "/placeholder.svg"}
                  alt={item.prompt}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <video src={item.outputUrl} className="w-full h-full object-cover" muted playsInline />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                  {item.type === "image" ? <ImageIcon className="h-4 w-4" /> : <VideoIcon className="h-4 w-4" />}
                  <span className="text-xs">
                    {formatDistanceToNow(item.createdAt, { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
