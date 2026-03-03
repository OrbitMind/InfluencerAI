'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { MotionStyleSelector } from '@/components/motion/motion-style-selector'
import { MotionModelSelector } from '@/components/motion/motion-model-selector'
import { PersonaSelector } from '@/components/personas/persona-selector'
import { usePersona } from '@/lib/context/persona-context'
import { Loader2, Clapperboard, Download, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { AnimationStyle } from '@/lib/types/motion'
import type { MotionResult } from '@/lib/types/motion'

const POLL_INTERVAL_MS = 4_000
const POLL_TIMEOUT_MS = 10 * 60 * 1000 // 10 min

type GenerationStatus = 'idle' | 'creating' | 'processing' | 'done' | 'error'

export default function MotionPage() {
  const { selectedPersona } = usePersona()
  const [sourceImageUrl, setSourceImageUrl] = useState('')
  const [animationStyle, setAnimationStyle] = useState<AnimationStyle>('talk')
  const [customPrompt, setCustomPrompt] = useState('')
  const [duration, setDuration] = useState(5)
  const [modelId, setModelId] = useState<string | null>(null)
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [statusLabel, setStatusLabel] = useState('')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<MotionResult | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const deadlineRef = useRef<number>(0)

  // Sincroniza imagem de referência quando muda a persona selecionada
  const prevPersonaId = useRef<string | null>(null)
  useEffect(() => {
    const currentId = selectedPersona?.id ?? null
    if (currentId !== prevPersonaId.current) {
      prevPersonaId.current = currentId
      if (selectedPersona?.referenceImageUrl) {
        setSourceImageUrl(selectedPersona.referenceImageUrl)
      } else {
        setSourceImageUrl('')
      }
    }
  }, [selectedPersona])

  // Cleanup polling ao desmontar
  useEffect(() => {
    return () => { if (pollTimerRef.current) clearInterval(pollTimerRef.current) }
  }, [])

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }

  const startPolling = (predictionId: string, replicateModelId: string, prompt: string, personaId: string) => {
    deadlineRef.current = Date.now() + POLL_TIMEOUT_MS
    let tick = 0

    pollTimerRef.current = setInterval(async () => {
      tick++
      setProgress(Math.min(10 + tick * 4, 90))

      if (Date.now() > deadlineRef.current) {
        stopPolling()
        setStatus('error')
        setStatusLabel('Timeout — a animação demorou mais de 10 minutos')
        toast.error('Timeout na geração da animação')
        return
      }

      try {
        const params = new URLSearchParams({
          id: predictionId,
          modelId: replicateModelId,
          prompt,
          personaId,
          type: 'video',
        })
        const res = await fetch(`/api/replicate/prediction-status?${params}`)
        const data = await res.json()

        if (!data.success) {
          stopPolling()
          setStatus('error')
          setStatusLabel(data.error ?? 'Erro ao verificar status')
          toast.error(data.error ?? 'Erro ao verificar status')
          return
        }

        const { status: predStatus, outputUrl, error } = data.data

        if (predStatus === 'failed' || predStatus === 'canceled') {
          stopPolling()
          setStatus('error')
          setStatusLabel(error ?? `Predição ${predStatus}`)
          toast.error(error ?? `Predição ${predStatus}`)
          return
        }

        if ((predStatus === 'succeeded' || predStatus === 'done') && outputUrl) {
          stopPolling()
          setProgress(100)
          setStatus('done')
          setStatusLabel('Animação concluída!')
          setResult({
            generationId: data.data.generationId ?? '',
            outputUrl,
            thumbnailUrl: data.data.thumbnailUrl,
            modelId: replicateModelId,
            animationStyle,
          })
          toast.success('Animação gerada com sucesso!')
          return
        }

        setStatusLabel(predStatus === 'processing' ? 'Processando animação...' : 'Aguardando GPU...')
      } catch {
        // erro de rede temporário: mantém polling
      }
    }, POLL_INTERVAL_MS)
  }

  const handleGenerate = async () => {
    if (!selectedPersona) {
      toast.error('Selecione uma persona para gerar a animação')
      return
    }
    if (!modelId) {
      toast.error('Selecione um modelo de animação')
      return
    }

    stopPolling()
    setResult(null)
    setProgress(5)
    setStatus('creating')
    setStatusLabel('Criando predição...')

    try {
      const res = await fetch('/api/motion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId: selectedPersona.id,
          sourceImageUrl: sourceImageUrl || undefined,
          animationStyle,
          customPrompt: customPrompt || undefined,
          duration,
          modelId,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      const { predictionId, modelId: replicateModelId, prompt, personaId } = data.data
      setStatus('processing')
      setStatusLabel('Processando animação...')
      setProgress(10)
      startPolling(predictionId, replicateModelId, prompt, personaId)
    } catch (err: unknown) {
      setStatus('error')
      setStatusLabel(err instanceof Error ? err.message : 'Erro ao iniciar animação')
      toast.error(err instanceof Error ? err.message : 'Erro ao iniciar animação')
    }
  }

  const isGenerating = status === 'creating' || status === 'processing'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clapperboard className="h-6 w-6 text-primary" />
            Motion & Animação
          </h1>
          <p className="text-muted-foreground mt-1">
            Anime sua persona com movimentos naturais e expressivos usando IA.
          </p>
        </div>
        <PersonaSelector />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Configuração</CardTitle>
                {selectedPersona && (
                  <Badge variant="secondary">{selectedPersona.name}</Badge>
                )}
              </div>
              <CardDescription className="text-xs">Configure a animação da sua persona</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedPersona && (
                <div className="flex items-center gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3">
                  <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Selecione uma persona no seletor acima para continuar.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">URL da Imagem (opcional)</Label>
                <Input
                  type="url"
                  placeholder={selectedPersona?.referenceImageUrl ? 'Usando imagem de referência da persona' : 'URL da imagem a animar'}
                  value={sourceImageUrl}
                  onChange={(e) => setSourceImageUrl(e.target.value)}
                />
                {selectedPersona?.referenceImageUrl && !sourceImageUrl && (
                  <p className="text-xs text-muted-foreground">Usando imagem de referência da persona automaticamente.</p>
                )}
              </div>

              <MotionModelSelector
                selectedModelId={modelId}
                onModelSelect={setModelId}
                disabled={isGenerating}
              />
            </CardContent>
          </Card>

          <MotionStyleSelector value={animationStyle} onChange={setAnimationStyle} />

          {/* Prompt contextual — visível para todos os estilos */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {animationStyle === 'talk'
                ? 'Fala / Diálogo'
                : animationStyle === 'custom'
                ? 'Descrição do Movimento'
                : 'Contexto adicional (opcional)'}
            </Label>
            <Textarea
              placeholder={
                animationStyle === 'talk'
                  ? 'Ex: "Olá! Esse produto mudou minha pele. Recomendo muito!" (em inglês ou PT-BR)'
                  : animationStyle === 'custom'
                  ? 'Descreva o movimento desejado em inglês...'
                  : 'Detalhes extras para enriquecer a animação (opcional)...'
              }
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />
            {animationStyle === 'talk' && (
              <p className="text-[10px] text-muted-foreground">
                Dica: ~130 palavras/min → 8s ≈ 17 palavras. Fale naturalmente.
              </p>
            )}
          </div>

          {/* Duração */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Duração</Label>
              <span className="text-xs font-medium tabular-nums">{duration}s</span>
            </div>
            <Slider
              min={2}
              max={10}
              step={1}
              value={[duration]}
              onValueChange={([v]) => setDuration(v)}
              disabled={isGenerating}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>2s</span>
              <span>10s</span>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedPersona || !modelId}
            className="w-full"
          >
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Animando...</>
            ) : (
              <><Clapperboard className="h-4 w-4 mr-2" />Gerar Animação</>
            )}
          </Button>

          {isGenerating && (
            <div className="space-y-1.5">
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground text-center">{statusLabel}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{statusLabel}</p>
            </div>
          )}

          {status === 'done' && (
            <div className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 p-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <p className="text-xs text-green-600 dark:text-green-400">Animação concluída!</p>
            </div>
          )}
        </div>

        <div>
          {result ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-primary">Resultado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <video
                  src={result.outputUrl}
                  controls
                  className="w-full rounded-lg aspect-video object-cover bg-black"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const a = document.createElement('a')
                    a.href = result.outputUrl
                    a.download = 'motion.mp4'
                    a.click()
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download MP4
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed min-h-[300px] flex items-center justify-center">
              <CardContent className="text-center py-10">
                <Clapperboard className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">A animação aparecerá aqui</p>
                {isGenerating && (
                  <p className="text-xs text-muted-foreground mt-2">{statusLabel}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
