'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Share2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ShareToCommunityDialogProps {
  mediaUrl: string
  mediaType: 'image' | 'video'
  thumbnailUrl?: string
  generationId?: string
  campaignId?: string
}

export function ShareToCommunityDialog({
  mediaUrl, mediaType, thumbnailUrl, generationId, campaignId,
}: ShareToCommunityDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)

      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaUrl,
          mediaType,
          thumbnailUrl,
          generationId,
          campaignId,
          title: title || undefined,
          description: description || undefined,
          tags,
        }),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      toast.success('Publicado na comunidade com sucesso!')
      setOpen(false)
      setTitle('')
      setDescription('')
      setTagsInput('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao publicar')
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-3.5 w-3.5 mr-2" />
          Compartilhar na Comunidade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar na Galeria</DialogTitle>
          <DialogDescription>
            Publique este conteúdo na galeria pública da comunidade InfluencerAI.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="share-title">Título (opcional)</Label>
            <Input id="share-title" placeholder="Ex: Resultado incrível com Flux Pro" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="share-desc">Descrição (opcional)</Label>
            <Textarea id="share-desc" placeholder="Conte como foi criado este conteúdo..." rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="share-tags">Tags (separadas por vírgula)</Label>
            <Input id="share-tags" placeholder="Ex: fashion, beauty, lifestyle" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleShare} disabled={isSharing}>
            {isSharing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Publicando...</> : 'Publicar na Comunidade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
