'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Shirt, Wand2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ProductUploader } from '@/components/fashion/product-uploader'
import { TryOnPreview } from '@/components/fashion/try-on-preview'
import { PersonaSelector } from '@/components/personas/persona-selector'
import { usePersona } from '@/lib/context/persona-context'
import { FASHION_STYLES, FASHION_OCCASIONS } from '@/lib/types/fashion'
import type { ProductAssetData, TryOnResult, FashionStyle, FashionOccasion } from '@/lib/types/fashion'

export default function FashionFactoryPage() {
  const { selectedPersona } = usePersona()
  const [products, setProducts] = useState<ProductAssetData[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ProductAssetData | null>(null)
  const [style, setStyle] = useState<FashionStyle>('casual')
  const [occasion, setOccasion] = useState<FashionOccasion>('everyday')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<TryOnResult | null>(null)

  // Limpa resultado quando troca de persona
  const prevPersonaId = useRef<string | null>(null)
  useEffect(() => {
    const currentId = selectedPersona?.id ?? null
    if (currentId !== prevPersonaId.current) {
      prevPersonaId.current = currentId
      setResult(null)
    }
  }, [selectedPersona])

  const handleProductCreated = (product: ProductAssetData) => {
    setProducts((prev) => [product, ...prev])
    setSelectedProduct(product)
  }

  const handleTryOn = async () => {
    if (!selectedPersona?.referenceImageUrl) {
      toast.error('A persona selecionada precisa ter uma imagem de referência')
      return
    }
    if (!selectedProduct) {
      toast.error('Selecione ou faça upload de um produto')
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
          personaImageUrl: selectedPersona.referenceImageUrl,
          productImageUrl: productUrl,
          style,
          occasion,
          personaId: selectedPersona.id,
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

  const personaImageUrl = selectedPersona?.referenceImageUrl ?? ''

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shirt className="h-6 w-6 text-primary" />
            Fashion Factory
          </h1>
          <p className="text-muted-foreground mt-1">
            Experimente roupas e acessórios virtualmente na sua persona com IA.
          </p>
        </div>
        <PersonaSelector />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {/* Aviso se persona sem imagem */}
          {!selectedPersona ? (
            <div className="flex items-center gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3">
              <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Selecione uma persona no seletor acima para continuar.
              </p>
            </div>
          ) : !selectedPersona.referenceImageUrl ? (
            <div className="flex items-center gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3">
              <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
              <p className="text-xs text-muted-foreground">
                A persona <strong>{selectedPersona.name}</strong> não tem imagem de referência. Adicione uma na página da persona.
              </p>
            </div>
          ) : null}

          {/* Upload de produto */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">1. Produto</CardTitle>
                {selectedProduct && (
                  <Badge variant="secondary" className="text-xs">{selectedProduct.name}</Badge>
                )}
              </div>
              <CardDescription className="text-xs">Faça upload da imagem da roupa ou acessório</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductUploader onProductCreated={handleProductCreated} />
            </CardContent>
          </Card>

          {/* Configuração de estilo */}
          {selectedProduct && selectedPersona && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">2. Estilo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <Button
                  onClick={handleTryOn}
                  disabled={isGenerating || !selectedPersona.referenceImageUrl}
                  className="w-full"
                >
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
                {isGenerating && (
                  <p className="text-xs text-muted-foreground mt-2">Processando...</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
