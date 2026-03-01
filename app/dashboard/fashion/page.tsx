'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, Shirt, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { ProductUploader } from '@/components/fashion/product-uploader'
import { TryOnPreview } from '@/components/fashion/try-on-preview'
import { FASHION_STYLES, FASHION_OCCASIONS } from '@/lib/types/fashion'
import type { ProductAssetData, TryOnResult, FashionStyle, FashionOccasion } from '@/lib/types/fashion'

export default function FashionFactoryPage() {
  const [products, setProducts] = useState<ProductAssetData[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ProductAssetData | null>(null)
  const [personaImageUrl, setPersonaImageUrl] = useState('')
  const [style, setStyle] = useState<FashionStyle>('casual')
  const [occasion, setOccasion] = useState<FashionOccasion>('everyday')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<TryOnResult | null>(null)

  const handleProductCreated = (product: ProductAssetData) => {
    setProducts((prev) => [product, ...prev])
    setSelectedProduct(product)
  }

  const handleTryOn = async () => {
    if (!selectedProduct || !personaImageUrl) {
      toast.error('Selecione um produto e informe a URL da imagem da persona')
      return
    }

    const productUrl = selectedProduct.bgRemovedUrl ?? selectedProduct.imageUrl
    setIsGenerating(true)
    setResult(null)

    try {
      const res = await fetch('/api/fashion/try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaImageUrl,
          productImageUrl: productUrl,
          style,
          occasion,
          personaId: undefined,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setResult(data.data)
      toast.success('Try-on gerado com sucesso!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar try-on')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shirt className="h-6 w-6 text-primary" />
          Fashion Factory
        </h1>
        <p className="text-muted-foreground mt-1">
          Experimente roupas e acessórios virtualmente na sua persona com IA.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">1. Adicionar Produto</CardTitle>
              <CardDescription className="text-xs">Faça upload da imagem da roupa ou acessório</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductUploader onProductCreated={handleProductCreated} />
            </CardContent>
          </Card>

          {selectedProduct && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">2. Configurar Estilo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">URL da Imagem da Persona</Label>
                  <input
                    type="url"
                    placeholder="https://..."
                    className="w-full text-sm border rounded-md px-3 py-2 bg-background"
                    value={personaImageUrl}
                    onChange={(e) => setPersonaImageUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Cole a URL da imagem de referência da persona</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Estilo</Label>
                    <Select value={style} onValueChange={(v) => setStyle(v as FashionStyle)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FASHION_STYLES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Ocasião</Label>
                    <Select value={occasion} onValueChange={(v) => setOccasion(v as FashionOccasion)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FASHION_OCCASIONS.map((o) => (
                          <SelectItem key={o} value={o} className="capitalize text-xs">{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleTryOn} disabled={isGenerating || !personaImageUrl} className="w-full">
                  {isGenerating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando Try-On...</>
                  ) : (
                    <><Wand2 className="h-4 w-4 mr-2" />Gerar Virtual Try-On</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          {result && personaImageUrl ? (
            <TryOnPreview originalPersonaUrl={personaImageUrl} result={result} />
          ) : (
            <Card className="border-dashed h-full flex items-center justify-center min-h-[300px]">
              <CardContent className="text-center py-10">
                <Shirt className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  O resultado do try-on aparecerá aqui
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
