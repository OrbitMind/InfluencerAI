'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MotionStyleSelector } from '@/components/motion/motion-style-selector'
import { Loader2, Clapperboard, Play, Download } from 'lucide-react'
import { toast } from 'sonner'
import { ANIMATION_STYLES, AnimationStyle } from '@/lib/types/motion'
import { MOTION_MODEL_LIST } from '@/lib/constants/motion-models'
import type { MotionResult } from '@/lib/types/motion'

export default function MotionPage() {
  const [personaId, setPersonaId] = useState('')
  const [sourceImageUrl, setSourceImageUrl] = useState('')
  const [animationStyle, setAnimationStyle] = useState<AnimationStyle>('talk')
  const [customPrompt, setCustomPrompt] = useState('')
  const [modelId, setModelId] = useState('animate-diff')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<MotionResult | null>(null)

  const handleGenerate = async () => {
    if (!personaId) {
      toast.error('Informe o ID da persona')
      return
    }

    setIsGenerating(true)
    setResult(null)

    try {
      const res = await fetch('/api/motion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId,
          sourceImageUrl: sourceImageUrl || undefined,
          animationStyle,
          customPrompt: customPrompt || undefined,
          modelId,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setResult(data.data)
      toast.success('Animação gerada com sucesso!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar animação')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Clapperboard className="h-6 w-6 text-primary" />
          Motion & Animação
        </h1>
        <p className="text-muted-foreground mt-1">
          Anime sua persona com movimentos naturais e expressivos usando IA.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configuração</CardTitle>
              <CardDescription className="text-xs">Configure a animação da sua persona</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">ID da Persona *</Label>
                <Input placeholder="Ex: clx..." value={personaId} onChange={(e) => setPersonaId(e.target.value)} />
                <p className="text-xs text-muted-foreground">Encontre o ID na URL da página da persona</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">URL da Imagem (opcional)</Label>
                <Input type="url" placeholder="Usa a referência da persona se vazio" value={sourceImageUrl} onChange={(e) => setSourceImageUrl(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Modelo de Animação</Label>
                <Select value={modelId} onValueChange={setModelId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTION_MODEL_LIST.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground ml-2 text-[11px]">{m.description}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <MotionStyleSelector value={animationStyle} onChange={setAnimationStyle} />

          {animationStyle === 'custom' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição do Movimento</Label>
              <Textarea placeholder="Descreva o movimento desejado em inglês..." rows={3} value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} />
            </div>
          )}

          <Button onClick={handleGenerate} disabled={isGenerating || !personaId} className="w-full">
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Animando...</>
            ) : (
              <><Clapperboard className="h-4 w-4 mr-2" />Gerar Animação</>
            )}
          </Button>
        </div>

        <div>
          {result ? (
            <Card>
              <CardHeader><CardTitle className="text-sm text-primary">Resultado</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <video
                  src={result.outputUrl}
                  controls
                  className="w-full rounded-lg aspect-video object-cover bg-black"
                />
                <Button variant="outline" className="w-full" onClick={() => {
                  const a = document.createElement('a'); a.href = result.outputUrl; a.download = 'motion.mp4'; a.click()
                }}>
                  <Download className="h-4 w-4 mr-2" />Download MP4
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed min-h-[300px] flex items-center justify-center">
              <CardContent className="text-center py-10">
                <Clapperboard className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">A animação aparecerá aqui</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
