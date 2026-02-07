"use client"

import { CheckCircle2, Circle, ImageIcon, VideoIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGeneration } from "@/lib/context/generation-context"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function WorkflowSteps() {
  const { generatedImageUrl, history } = useGeneration()

  const hasImage = !!generatedImageUrl
  const hasVideo = history.some((item) => item.type === "video")

  const steps = [
    {
      title: "Etapa 1: Gerar Imagem",
      description: "Crie seu avatar de influenciador digital",
      completed: hasImage,
      href: "/dashboard/image-generator",
      icon: ImageIcon,
    },
    {
      title: "Etapa 2: Criar Vídeo",
      description: "Produza conteúdo promocional com seu influenciador",
      completed: hasVideo,
      href: "/dashboard/video-generator",
      icon: VideoIcon,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seu Fluxo de Trabalho</CardTitle>
        <CardDescription>Siga estas etapas para criar seu influenciador digital</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <Link
              key={step.title}
              href={step.href}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                step.completed
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-accent/50",
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-current">
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{step.title}</h3>
                  {step.completed && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Concluído</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              <step.icon className="h-5 w-5 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
