'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Loader2, Wand2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { FASHION_CATEGORIES } from '@/lib/types/fashion'
import type { ProductAssetData } from '@/lib/types/fashion'

interface ProductUploaderProps {
  onProductCreated: (product: ProductAssetData) => void
}

export function ProductUploader({ onProductCreated }: ProductUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isRemovingBg, setIsRemovingBg] = useState(false)
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState<string>('')
  const [preview, setPreview] = useState<string | null>(null)
  const [createdProduct, setCreatedProduct] = useState<ProductAssetData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file || !name.trim()) {
      toast.error('Selecione um arquivo e informe o nome do produto')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'influencer_ai')

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()

      const res = await fetch('/api/fashion/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          imageUrl: uploadData.url,
          publicId: uploadData.publicId,
          brandName: brand.trim() || undefined,
          category: category || undefined,
        }),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      setCreatedProduct(data.data)
      onProductCreated(data.data)
      toast.success('Produto adicionado com sucesso')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao fazer upload do produto')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveBg = async () => {
    if (!createdProduct) return
    setIsRemovingBg(true)
    try {
      const res = await fetch(`/api/fashion/products/${createdProduct.id}/remove-bg`, { method: 'POST' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setCreatedProduct(data.data)
      onProductCreated(data.data)
      toast.success('Background removido com sucesso')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover background')
    } finally {
      setIsRemovingBg(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]) }}
        />
        {preview ? (
          <div className="relative mx-auto h-32 w-32">
            <Image src={preview} alt="Preview" fill className="object-contain rounded" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Clique para selecionar imagem do produto</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="product-name" className="text-xs">Nome *</Label>
          <Input id="product-name" placeholder="Ex: Camiseta Branca" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="product-brand" className="text-xs">Marca</Label>
          <Input id="product-brand" placeholder="Ex: Nike" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Categoria</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            {FASHION_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleUpload} disabled={isUploading || !preview} className="flex-1">
          {isUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</> : 'Adicionar Produto'}
        </Button>
        {createdProduct && !createdProduct.bgRemovedUrl && (
          <Button variant="outline" onClick={handleRemoveBg} disabled={isRemovingBg}>
            {isRemovingBg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          </Button>
        )}
        {createdProduct?.bgRemovedUrl && (
          <Button variant="outline" disabled className="text-green-600">
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
