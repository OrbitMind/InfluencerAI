"use client"

import Link from "next/link"
import { ImageIcon, VideoIcon, Settings, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const actions = [
  {
    title: "Gerar Imagem",
    description: "Crie um avatar de influenciador único com IA",
    href: "/dashboard/image-generator",
    icon: ImageIcon,
  },
  {
    title: "Criar Vídeo",
    description: "Produza conteúdo de vídeo promocional",
    href: "/dashboard/video-generator",
    icon: VideoIcon,
  },
  {
    title: "Configurar API",
    description: "Configure sua chave de API do Replicate",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
        <CardDescription>Comece a criar conteúdo</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <div className="group flex flex-col items-start gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent hover:border-accent">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium flex items-center gap-1">
                  {action.title}
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
