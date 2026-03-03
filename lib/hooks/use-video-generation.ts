"use client"

import { useGeneration } from "@/lib/context/generation-context"
import { useReplicate } from "@/lib/context/replicate-context"
import { videoGenerationService } from "@/lib/services/VideoGenerationService"
import type { VideoGenerationState, GenerationPhase, GenerationLogEntry } from "@/lib/types/generation"
import type { GenerateVideoRequest } from "@/lib/types/replicate"
import type { VideoIntention } from "@/lib/constants/video-intentions"
import { buildVideoPrompt } from "@/lib/utils/promptUtils"
import { VIDEO_MODELS } from "@/lib/types/models"
import type { CameraMovement } from "@/lib/types/camera-control"
import { useCallback, useEffect, useRef, useState } from "react"

const POLL_INTERVAL_MS = 3000

const PHASE_MESSAGES: Record<string, { phase: GenerationPhase; message: string }> = {
  starting:   { phase: 'starting',    message: 'Aguardando GPU disponível...' },
  processing: { phase: 'processing',  message: 'Processando vídeo com IA...' },
  succeeded:  { phase: 'uploading',   message: 'Vídeo gerado! Fazendo upload...' },
  failed:     { phase: 'failed',      message: 'Falha na geração' },
  canceled:   { phase: 'failed',      message: 'Predição cancelada' },
}

const INITIAL_STATE: VideoGenerationState = {
  modelId: "google/veo-3",
  videoIntention: "product",
  cameraMovement: undefined,
  productName: "",
  productDescription: "",
  callToAction: "",
  additionalPrompt: "",
  sourceImageUrl: "",
  isLoading: false,
  videoUrl: null,
  error: null,
  generatedAt: null,
  requestId: null,
  predictionId: null,
  generationPhase: 'idle',
  generationLog: [],
}

export function useVideoGeneration() {
  const { isConfigured } = useReplicate()
  const { generatedImageUrl, addToHistory } = useGeneration()
  const [state, setState] = useState<VideoGenerationState>({
    ...INITIAL_STATE,
    sourceImageUrl: generatedImageUrl || "",
  })

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const predictionDataRef = useRef<{ modelId: string; prompt: string; personaId?: string } | null>(null)
  const lastPhaseRef = useRef<string>('')
  const finalizedRef = useRef(false)

  const setModelId = useCallback((modelId: string) => setState(p => ({ ...p, modelId })), [])
  const setCameraMovement = useCallback((cameraMovement: CameraMovement | undefined) => setState(p => ({ ...p, cameraMovement })), [])
  const setVideoIntention = useCallback((videoIntention: VideoIntention) => setState(p => ({ ...p, videoIntention, productName: '', productDescription: '', callToAction: '', additionalPrompt: '' })), [])
  const setProductName = useCallback((productName: string) => setState(p => ({ ...p, productName })), [])
  const setProductDescription = useCallback((productDescription: string) => setState(p => ({ ...p, productDescription })), [])
  const setCallToAction = useCallback((callToAction: string) => setState(p => ({ ...p, callToAction })), [])
  const setAdditionalPrompt = useCallback((additionalPrompt: string) => setState(p => ({ ...p, additionalPrompt })), [])
  const setSourceImageUrl = useCallback((sourceImageUrl: string) => setState(p => ({ ...p, sourceImageUrl })), [])

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

    const params = new URLSearchParams({ id: predictionId, modelId: data.modelId, prompt: data.prompt })
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

      const { status, outputUrl: videoUrl, error: predError } = json.data

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

      if (videoUrl && !finalizedRef.current) {
        finalizedRef.current = true
        stopPolling()
        addLog('done', 'Vídeo pronto!')
        setState(p => ({
          ...p,
          isLoading: false,
          videoUrl,
          generatedAt: new Date(),
          generationPhase: 'done',
        }))
        if (data) {
          addToHistory({ type: "video", modelId: data.modelId, prompt: data.prompt, outputUrl: videoUrl })
        }
      }
    } catch {
      // network hiccup — continue polling silently
    }
  }, [stopPolling, addLog, addToHistory])

  // Start polling when predictionId is set
  useEffect(() => {
    const { predictionId, isLoading } = state
    if (!predictionId || !isLoading) return

    pollStatus(predictionId)
    pollingRef.current = setInterval(() => pollStatus(predictionId), POLL_INTERVAL_MS)

    return () => stopPolling()
  }, [state.predictionId, state.isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const generate = useCallback(
    async (options?: Partial<GenerateVideoRequest>) => {
      if (!isConfigured) {
        setState(p => ({ ...p, error: "API key não configurada" }))
        return
      }

      const prompt = buildVideoPrompt(
        state.videoIntention,
        state.productName,
        state.productDescription,
        state.callToAction,
        state.additionalPrompt
      )

      predictionDataRef.current = { modelId: state.modelId, prompt }
      lastPhaseRef.current = ''
      finalizedRef.current = false

      setState(p => ({
        ...p,
        isLoading: true,
        error: null,
        videoUrl: null,
        predictionId: null,
        generationPhase: 'creating',
        generationLog: [{ phase: 'creating', message: 'Enviando para Replicate...', timestamp: new Date() }],
      }))

      try {
        const modelConfig = VIDEO_MODELS.find(m => m.id === state.modelId)
        const imageParamName = modelConfig?.sourceImageParam || 'image'

        const response = await videoGenerationService.generate({
          modelId: state.modelId,
          prompt,
          imageUrl: state.sourceImageUrl || generatedImageUrl || undefined,
          imageParamName,
          cameraMovement: state.cameraMovement,
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
    [isConfigured, state, generatedImageUrl, addLog],
  )

  const reset = useCallback(() => {
    stopPolling()
    predictionDataRef.current = null
    lastPhaseRef.current = ''
    finalizedRef.current = false
    setState({ ...INITIAL_STATE, sourceImageUrl: generatedImageUrl || "" })
  }, [stopPolling, generatedImageUrl])

  return {
    ...state,
    setModelId,
    setCameraMovement,
    setVideoIntention,
    setProductName,
    setProductDescription,
    setCallToAction,
    setAdditionalPrompt,
    setSourceImageUrl,
    generate,
    reset,
  }
}
