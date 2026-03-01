'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wand2, Trash2, CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ProductAssetData } from '@/lib/types/fashion'

interface ProductAssetCardProps {
  product: ProductAssetData
  isSelected?: boolean
  onSelect?: (product: ProductAssetData) => void
  onDelete?: (id: string) => void
  onBgRemoved?: (product: ProductAssetData) => void
}

export function ProductAssetCard({ product, isSelected, onSelect, onDelete, onBgRemoved }: ProductAssetCardProps) {
  const [isRemovingBg, setIsRemovingBg] = useState(false)
  const [showBgRemoved, setShowBgRemoved] = useState(!!product.bgRemovedUrl)

  const displayUrl = showBgRemoved && product.bgRemovedUrl ? product.bgRemovedUrl : product.imageUrl

  const handleRemoveBg = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsRemovingBg(true)
    try {
      const res = await fetch(`/api/fashion/products/${product.id}/remove-bg`, { method: 'POST' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      onBgRemoved?.(data.data)
      setShowBgRemoved(true)
      toast.success('Background removido')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover background')
    } finally {
      setIsRemovingBg(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`/api/fashion/products/${product.id}`, { method: 'DELETE' })
      onDelete?.(product.id)
      toast.success('Produto removido')
    } catch {
      toast.error('Erro ao remover produto')
    }
  }

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary border-primary',
        onSelect && 'hover:border-primary/50'
      )}
      onClick={() => onSelect?.(product)}
    >
      <CardContent className="p-3 space-y-2">
        <div className="relative aspect-square rounded-md overflow-hidden bg-muted">
          <Image src={displayUrl} alt={product.name} fill className="object-contain" />
          {isSelected && (
            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium truncate">{product.name}</p>
          {product.brandName && <p className="text-xs text-muted-foreground truncate">{product.brandName}</p>}
          {product.category && <Badge variant="outline" className="text-xs capitalize mt-1">{product.category}</Badge>}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!product.bgRemovedUrl && (
            <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={handleRemoveBg} disabled={isRemovingBg}>
              {isRemovingBg ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Wand2 className="h-3 w-3 mr-1" />Remover BG</>}
            </Button>
          )}
          {product.bgRemovedUrl && (
            <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => setShowBgRemoved(!showBgRemoved)}>
              {showBgRemoved ? 'Ver Original' : 'Ver Sem BG'}
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
