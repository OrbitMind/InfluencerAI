import { ImageGeneratorPanel } from "@/components/image-generator/image-generator-panel"

export default function ImageGeneratorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gerador de Imagem</h1>
        <p className="text-muted-foreground">
          Crie imagens impressionantes geradas por IA para seu influenciador digital
        </p>
      </div>
      <ImageGeneratorPanel />
    </div>
  )
}
