'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SceneSelector } from '@/components/product-placement/scene-selector'
import { Loader2, Package, Wand2, Download } from 'lucide-react'
import { toast } from 'sonner'
import type { PlacementSceneId, PlacementResult } from '@/lib/types/product-placement'

export default function ProductPlacementPage() {
  const [productImageUrl, setProductImageUrl] = useState('')
  const [productName, setProductName] = useState('')
  const [scene, setScene] = useState<PlacementSceneId>('lifestyle')
  const [additionalPrompt, setAdditionalPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<PlacementResult | null>(null)

  const handleGenerate = async () => {
    if (!productImageUrl || !productName) {
      toast.error('Informe a URL do produto e o nome')
      return
    }

    setIsGenerating(true)
    setResult(null)

    try {
      const res = await fetch('/api/product-placement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productImageUrl, productName, scene, additionalPrompt: additionalPrompt || undefined }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setResult(data.data)
      toast.success('Placement gerado!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar placement')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Product Placement
        </h1>
        <p className="text-muted-foreground mt-1">
          Integre produtos em cenas cinematográficas geradas por IA.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Produto</CardTitle>
              <CardDescription className="text-xs">Use preferencialmente uma imagem sem background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome do Produto *</Label>
                <Input placeholder="Ex: iPhone 16 Pro" value={productName} onChange={(e) => setProductName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">URL da Imagem do Produto *</Label>
                <Input type="url" placeholder="https://..." value={productImageUrl} onChange={(e) => setProductImageUrl(e.target.value)} />
                <p className="text-xs text-muted-foreground">Imagem sem background dá resultado superior. Use o Fashion Factory para remover o BG.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Instrução Adicional (opcional)</Label>
                <Textarea placeholder="Ex: produto próximo a uma xícara de café..." rows={2} value={additionalPrompt} onChange={(e) => setAdditionalPrompt(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <SceneSelector value={scene} onChange={setScene} />

          <Button onClick={handleGenerate} disabled={isGenerating || !productImageUrl || !productName} className="w-full">
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando...</>
            ) : (
              <><Wand2 className="h-4 w-4 mr-2" />Gerar Placement</>
            )}
          </Button>
        </div>

        <div>
          {result ? (
            <Card>
              <CardHeader><CardTitle className="text-sm text-primary">Resultado</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <Image src={result.outputUrl} alt="Placement result" fill className="object-cover" />
                </div>
                <Button variant="outline" className="w-full" onClick={() => {
                  const a = document.createElement('a'); a.href = result.outputUrl; a.download = 'placement.png'; a.click()
                }}>
                  <Download className="h-4 w-4 mr-2" />Download
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed min-h-[300px] flex items-center justify-center">
              <CardContent className="text-center py-10">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">O resultado aparecerá aqui</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
