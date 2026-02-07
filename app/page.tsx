import Link from "next/link"
import { ArrowRight, ImageIcon, VideoIcon, Sparkles, Zap, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">InfluencerAI</span>
          </div>
          <Button asChild>
            <Link href="/dashboard">
              Começar
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="container py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center space-y-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-balance">
              Crie Influenciadores Digitais com IA
            </h1>
            <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
              Gere avatares de influenciadores impressionantes e vídeos promocionais usando modelos de IA de ponta do
              Replicate. Construa sua presença digital em minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Começar a Criar
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard/settings">Configurar API</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container py-16 border-t border-border">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Geração de Imagem</h3>
              <p className="text-muted-foreground">
                Crie avatares de influenciadores fotorrealistas usando Flux Pro, Stable Diffusion, Hunyuan e outros
                modelos de última geração.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <VideoIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Criação de Vídeo</h3>
              <p className="text-muted-foreground">
                Transforme imagens em vídeos promocionais dinâmicos com HunyuanVideo, MiniMax, Luma e outros modelos
                líderes de IA para vídeo.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Múltiplos Modelos de IA</h3>
              <p className="text-muted-foreground">
                Acesse diversos modelos de IA do Replicate incluindo opções da Black Forest Labs, Tencent, Stability AI
                e mais.
              </p>
            </div>
          </div>
        </section>

        <section className="container py-16 border-t border-border">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Fluxo de Trabalho Simples em Duas Etapas</h2>
            <p className="text-muted-foreground">
              Crie seu influenciador digital e conteúdo promocional em apenas duas etapas fáceis.
            </p>
            <div className="grid gap-6 md:grid-cols-2 mt-8">
              <div className="relative p-6 rounded-xl border border-border bg-card">
                <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  1
                </div>
                <h3 className="text-lg font-semibold mt-2">Gerar Avatar</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Use IA para criar uma imagem única e fotorrealista de influenciador digital que combine com a visão da
                  sua marca.
                </p>
              </div>
              <div className="relative p-6 rounded-xl border border-border bg-card">
                <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  2
                </div>
                <h3 className="text-lg font-semibold mt-2">Criar Vídeo</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Transforme seu avatar em um vídeo promocional envolvente apresentando seu produto ou serviço.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-16 border-t border-border">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Seguro e Privado</h2>
            <p className="text-muted-foreground max-w-xl">
              Sua chave de API é armazenada localmente e nunca enviada aos nossos servidores. Todas as requisições de
              geração vão diretamente para o Replicate através de rotas de API seguras.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">InfluencerAI</span>
          </div>
          <p className="text-sm text-muted-foreground">Desenvolvido com modelos de IA Replicate</p>
        </div>
      </footer>
    </div>
  )
}
