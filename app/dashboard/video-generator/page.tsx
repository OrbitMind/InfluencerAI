import { VideoGeneratorPanel } from "@/components/video-generator/video-generator-panel"

export default function VideoGeneratorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gerador de Vídeo</h1>
        <p className="text-muted-foreground">Crie vídeos promocionais com seu influenciador digital</p>
      </div>
      <VideoGeneratorPanel />
    </div>
  )
}
