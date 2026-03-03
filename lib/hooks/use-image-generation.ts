"use client"

import { useGeneration } from "@/lib/context/generation-context"
import { useReplicate } from "@/lib/context/replicate-context"
import { imageGenerationService } from "@/lib/services/ImageGenerationService"
import type { ImageGenerationState, GenerationPhase, GenerationLogEntry } from "@/lib/types/generation"
import type { GenerateImageRequest } from "@/lib/types/replicate"
import { useCallback, useEffect, useRef, useState } from "react"

const POLL_INTERVAL_MS = 3000

const PHASE_MESSAGES: Record<string, { phase: GenerationPhase; message: string }> = {
  starting:   { phase: 'starting',   message: 'Aguardando GPU disponível...' },
  processing: { phase: 'processing', message: 'Processando imagem com IA...' },
  succeeded:  { phase: 'uploading',  message: 'Imagem gerada! Fazendo upload...' },
  failed:     { phase: 'failed',     message: 'Falha na geração' },
  canceled:   { phase: 'failed',     message: 'Predição cancelada' },
}

const INITIAL_STATE: ImageGenerationState = {
  modelId: "black-forest-labs/flux-schnell",
  prompt: "",
  isLoading: false,
  imageUrl: null,
  error: null,
  generatedAt: null,
  requestId: null,
  predictionId: null,
  generationPhase: 'idle',
  generationLog: [],
}

export function useImageGeneration() {
  const { isConfigured } = useReplicate()
  const { setGeneratedImageUrl, addToHistory } = useGeneration()
  const [state, setState] = useState<ImageGenerationState>(INITIAL_STATE)

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const predictionDataRef = useRef<{ modelId: string; prompt: string; personaId?: string } | null>(null)
  const lastPhaseRef = useRef<string>('')
  const finalizedRef = useRef(false)

  const setModelId = useCallback((modelId: string) => setState(p => ({ ...p, modelId })), [])
  const setPrompt = useCallback((prompt: string) => setState(p => ({ ...p, prompt })), [])

  const addLog = useCallback((phase: GenerationPhase, message: string) => {
    const entry: GenerationLogEntry = { phase, message, timestamp: new Date() }
    setState(p => ({ ...p, generationLog: [...p.generationLog, entry], generationPhase: phase }))
  }, [])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const pollStatus = useCallback(async (predictionId: string) => {
    const data = predictionDataRef.current
    if (!data) return

    const params = new URLSearchParams({
      id: predictionId,
      modelId: data.modelId,
      prompt: data.prompt,
      type: 'image',
    })
    if (data.personaId) params.set('personaId', data.personaId)

    try {
      const res = await fetch(`/api/replicate/prediction-status?${params}`)
      const json = await res.json()

      if (!json.success) {
        stopPolling()
        setState(p => ({ ...p, isLoading: false, error: json.error || 'Erro ao verificar status', generationPhase: 'failed' }))
        addLog('failed', json.error || 'Erro ao verificar status')
        return
      }

      const { status, outputUrl, error: predError } = json.data

      const phaseInfo = PHASE_MESSAGES[status]
      if (phaseInfo && lastPhaseRef.current !== status) {
        lastPhaseRef.current = status
        addLog(phaseInfo.phase, phaseInfo.message)
      }

      if (status === 'failed' || status === 'canceled') {
        stopPolling()
        setState(p => ({ ...p, isLoading: false, error: predError || 'Geração falhou', generationPhase: 'failed' }))
        return
      }

      if (outputUrl && !finalizedRef.current) {
        finalizedRef.current = true
        stopPolling()
        addLog('done', 'Imagem pronta!')
        setState(p => ({
          ...p,
          isLoading: false,
          imageUrl: outputUrl,
          generatedAt: new Date(),
          generationPhase: 'done',
        }))
        setGeneratedImageUrl(outputUrl)
        if (data) {
          addToHistory({ type: "image", modelId: data.modelId, prompt: data.prompt, outputUrl })
        }
      }
    } catch {
      // network hiccup — continue polling silently
    }
  }, [stopPolling, addLog, setGeneratedImageUrl, addToHistory])

  // Start polling when predictionId is set
  useEffect(() => {
    const { predictionId, isLoading } = state
    if (!predictionId || !isLoading) return

    pollStatus(predictionId)
    pollingRef.current = setInterval(() => pollStatus(predictionId), POLL_INTERVAL_MS)

    return () => stopPolling()
  }, [state.predictionId, state.isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const generate = useCallback(
    async (options?: Partial<GenerateImageRequest>) => {
      if (!isConfigured) {
        setState(p => ({ ...p, error: "API key não configurada" }))
        return
      }

      predictionDataRef.current = { modelId: state.modelId, prompt: state.prompt }
      lastPhaseRef.current = ''
      finalizedRef.current = false

      setState(p => ({
        ...p,
        isLoading: true,
        error: null,
        imageUrl: null,
        predictionId: null,
        generationPhase: 'creating',
        generationLog: [{ phase: 'creating', message: 'Enviando para Replicate...', timestamp: new Date() }],
      }))

      try {
        const response = await imageGenerationService.generate({
          modelId: state.modelId,
          prompt: state.prompt,
          ...options,
        })

        if (!response.success || !response.data) {
          setState(p => ({ ...p, isLoading: false, error: (response as { error?: string }).error || 'Falha ao criar predição', generationPhase: 'failed' }))
          return
        }

        const { predictionId } = response.data as unknown as { predictionId: string }
        addLog('starting', 'Predição criada! Aguardando GPU...')
        lastPhaseRef.current = 'starting'
        setState(p => ({ ...p, predictionId, requestId: predictionId }))
      } catch (error) {
        setState(p => ({
          ...p,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
          generationPhase: 'failed',
        }))
      }
    },
    [isConfigured, state.modelId, state.prompt, addLog],
  )

  const reset = useCallback(() => {
    stopPolling()
    predictionDataRef.current = null
    lastPhaseRef.current = ''
    finalizedRef.current = false
    setState(INITIAL_STATE)
  }, [stopPolling])

  return {
    ...state,
    setModelId,
    setPrompt,
    generate,
    reset,
  }
}
