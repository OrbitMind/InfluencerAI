import Replicate from 'replicate'
import { createLogger } from '@/lib/utils/logger'
import { PersonaService } from '@/lib/services/persona-service'
import { MOTION_MODELS, DEFAULT_MOTION_MODEL, ANIMATION_STYLE_PROMPTS } from '@/lib/constants/motion-models'
import type { MotionParams, MotionPredictionData } from '@/lib/types/motion'

const logger = createLogger('motion-service')

/**
 * Ordem de prioridade para detectar o parâmetro de imagem de entrada do modelo.
 * A detecção é feita via OpenAPI schema do Replicate — este array serve apenas
 * como fallback se o schema não estiver disponível.
 */
const IMAGE_PARAM_PRIORITY = [
  'first_frame_image',
  'image',
  'input_image',
  'face_image',
  'start_image',
  'prompt_image',
  'img',
  'source_image',
  'reference_image',
]

const PROMPT_PARAM_PRIORITY = [
  'prompt',
  'text_prompt',
  'caption',
  'description',
]

interface DetectedParams {
  imageParam: string
  promptParam: string | null
}

/**
 * MotionService (SRP + Singleton)
 * Responsabilidade única: criar predições de animação de persona no Replicate.
 *
 * Os nomes dos parâmetros de entrada (ex: "first_frame_image", "prompt") variam
 * por modelo — são descobertos dinamicamente via OpenAPI schema do Replicate
 * e cacheados em memória para evitar chamadas extras.
 */
export class MotionService {
  private static instance: MotionService
  private personaService = new PersonaService()

  /** Cache: replicateModelId → params detectados */
  private schemaCache = new Map<string, DetectedParams>()

  private constructor() {}

  static getInstance(): MotionService {
    if (!MotionService.instance) {
      MotionService.instance = new MotionService()
    }
    return MotionService.instance
  }

  /**
   * Detecta dinamicamente os nomes dos parâmetros de imagem e prompt
   * a partir do OpenAPI schema do modelo no Replicate.
   * Resultado é cacheado em memória por replicateModelId.
   */
  private async detectInputParams(replicate: Replicate, replicateModelId: string): Promise<DetectedParams> {
    if (this.schemaCache.has(replicateModelId)) {
      return this.schemaCache.get(replicateModelId)!
    }

    logger.info('Buscando schema do modelo no Replicate', { replicateModelId })

    try {
      const [owner, name] = replicateModelId.split('/')
      const model = await replicate.models.get(owner, name)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inputProps: Record<string, any> =
        (model.latest_version as any)?.openapi_schema?.components?.schemas?.Input?.properties ?? {}

      // Detecta parâmetro de imagem
      let imageParam = IMAGE_PARAM_PRIORITY.find((p) => p in inputProps)
      if (!imageParam) {
        // Fallback: primeiro campo do tipo string/uri com "image" no nome ou descrição
        imageParam = Object.entries(inputProps).find(([key, val]) => {
          const v = val as { type?: string; format?: string; description?: string }
          const looksLikeImage =
            key.toLowerCase().includes('image') ||
            v.description?.toLowerCase().includes('image')
          return looksLikeImage && v.type === 'string'
        })?.[0]
      }

      // Detecta parâmetro de prompt
      let promptParam: string | null = PROMPT_PARAM_PRIORITY.find((p) => p in inputProps) ?? null
      if (!promptParam) {
        promptParam = Object.keys(inputProps).find((k) => k.toLowerCase().includes('prompt')) ?? null
      }

      const detected: DetectedParams = {
        imageParam: imageParam ?? 'image',
        promptParam,
      }

      logger.info('Params detectados via schema', { replicateModelId, ...detected })
      this.schemaCache.set(replicateModelId, detected)
      return detected
    } catch (err) {
      // Se falhar (modelo sem versão publicada, rede, etc), usa fallback por lista de prioridade
      logger.warn('Falha ao buscar schema — usando fallback IMAGE_PARAM_PRIORITY', {
        replicateModelId,
        error: err instanceof Error ? err.message : String(err),
      })
      const fallback: DetectedParams = { imageParam: 'image', promptParam: 'prompt' }
      this.schemaCache.set(replicateModelId, fallback)
      return fallback
    }
  }

  async createMotionPrediction(
    replicateKey: string,
    userId: string,
    params: MotionParams
  ): Promise<MotionPredictionData> {
    const modelId = params.modelId ?? DEFAULT_MOTION_MODEL
    // Aceita tanto ID interno (ex: 'minimax-video') quanto Replicate model ID direto (ex: 'minimax/video-01-live')
    const modelConfig = MOTION_MODELS[modelId]
    const replicateId = modelConfig
      ? modelConfig.replicateModelId
      : modelId // se não está no registro, trata como ID do Replicate diretamente
    const supportsStylePrompt = modelConfig?.supportsStylePrompt ?? true
    const supportsReferenceVideo = modelConfig?.supportsReferenceVideo ?? false

    logger.info('Buscando persona', { userId, personaId: params.personaId })
    const persona = await this.personaService.getPersona(userId, params.personaId)
    const sourceImage = params.sourceImageUrl ?? persona.referenceImageUrl

    if (!sourceImage) {
      throw new Error('Persona sem imagem de referência. Adicione uma imagem de referência primeiro.')
    }

    const stylePrompt = params.animationStyle === 'custom'
      ? (params.customPrompt ?? '')
      : ANIMATION_STYLE_PROMPTS[params.animationStyle] ?? ''
    const fullPrompt = [stylePrompt, params.customPrompt].filter(Boolean).join(', ') || 'person moving naturally'

    const replicate = new Replicate({ auth: replicateKey, useFileOutput: false })

    // Detecta nomes dos parâmetros de entrada a partir do schema real do modelo
    const { imageParam, promptParam } = await this.detectInputParams(replicate, replicateId)

    const input: Record<string, unknown> = {
      [imageParam]: sourceImage,
    }

    if (promptParam && supportsStylePrompt) {
      input[promptParam] = fullPrompt
    }

    if (params.duration) {
      input.num_frames = params.duration * 8
    }

    if (params.referenceVideoUrl && supportsReferenceVideo) {
      input.driving_video = params.referenceVideoUrl
    }

    logger.info('Criando predição de motion no Replicate', {
      model: replicateId,
      animationStyle: params.animationStyle,
      imageParam,
      promptParam,
      userId,
    })

    const prediction = await replicate.predictions.create({
      model: replicateId as `${string}/${string}`,
      input,
    })

    logger.info('Predição de motion criada', {
      predictionId: prediction.id,
      status: prediction.status,
      model: replicateId,
    })

    return {
      predictionId: prediction.id,
      modelId: replicateId,
      prompt: fullPrompt,
      personaId: params.personaId,
    }
  }
}
