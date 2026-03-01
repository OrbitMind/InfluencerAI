import Replicate from 'replicate'
import { PersonaService } from '@/lib/services/persona-service'
import { GenerationService } from '@/lib/services/generation/generation.service'
import { MOTION_MODELS, DEFAULT_MOTION_MODEL, ANIMATION_STYLE_PROMPTS } from '@/lib/constants/motion-models'
import type { MotionParams, MotionResult } from '@/lib/types/motion'

/**
 * MotionService (SRP + Singleton)
 * Responsabilidade única: pipeline de animação de persona usando modelos de motion/animation.
 */
export class MotionService {
  private static instance: MotionService
  private personaService = new PersonaService()
  private generationService = new GenerationService()

  private constructor() {}

  static getInstance(): MotionService {
    if (!MotionService.instance) {
      MotionService.instance = new MotionService()
    }
    return MotionService.instance
  }

  async generateMotion(
    replicateKey: string,
    userId: string,
    params: MotionParams
  ): Promise<MotionResult> {
    const modelId = params.modelId ?? DEFAULT_MOTION_MODEL
    const modelConfig = MOTION_MODELS[modelId] ?? MOTION_MODELS[DEFAULT_MOTION_MODEL]

    const persona = await this.personaService.getPersona(userId, params.personaId)
    const sourceImage = params.sourceImageUrl ?? persona.referenceImageUrl

    if (!sourceImage) {
      throw new Error('Persona sem imagem de referência. Adicione uma imagem de referência primeiro.')
    }

    const stylePrompt = params.animationStyle === 'custom'
      ? (params.customPrompt ?? '')
      : ANIMATION_STYLE_PROMPTS[params.animationStyle] ?? ''

    const fullPrompt = [stylePrompt, params.customPrompt].filter(Boolean).join(', ')

    const replicate = new Replicate({ auth: replicateKey, useFileOutput: false })

    const input: Record<string, unknown> = {
      image: sourceImage,
      prompt: fullPrompt || 'person moving naturally',
    }

    if (params.duration) input.num_frames = params.duration * 8
    if (params.referenceVideoUrl && modelConfig.supportsReferenceVideo) {
      input.driving_video = params.referenceVideoUrl
    }

    const output = await replicate.run(
      modelConfig.replicateModelId as `${string}/${string}`,
      { input }
    )

    const videoUrl = Array.isArray(output) ? output[0] : (output as string)
    if (!videoUrl || typeof videoUrl !== 'string') {
      throw new Error('Output inválido do modelo de animação')
    }

    const generation = await this.generationService.createGeneration({
      userId,
      type: 'video',
      modelId: modelConfig.replicateModelId,
      prompt: fullPrompt,
      settings: {
        sourceImageUrl: sourceImage,
        animationStyle: params.animationStyle,
        modelId,
      },
      replicateUrl: videoUrl,
      personaId: params.personaId,
    })

    await this.personaService.addAsset(userId, params.personaId, {
      type: 'generated_video',
      url: generation.outputUrl,
      publicId: generation.publicId,
      prompt: fullPrompt,
      modelId: modelConfig.replicateModelId,
      metadata: { animationStyle: params.animationStyle } as unknown as import('@prisma/client').Prisma.InputJsonValue,
    })

    return {
      generationId: generation.id,
      outputUrl: generation.outputUrl,
      thumbnailUrl: generation.thumbnailUrl ?? undefined,
      modelId: modelConfig.replicateModelId,
      animationStyle: params.animationStyle,
    }
  }
}
