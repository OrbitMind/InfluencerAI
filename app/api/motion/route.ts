import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createLogger } from '@/lib/utils/logger'
import { withCredits } from '@/lib/utils/billing-middleware'
import { MotionService } from '@/lib/services/motion/motion.service'
import { ApiKeyService } from '@/lib/services/api-key/api-key.service'
import { motionGenerationSchema } from '@/lib/validations/motion'

const logger = createLogger('motion')
const motionService = MotionService.getInstance()
const apiKeyService = new ApiKeyService()

/**
 * POST /api/motion
 * Cria uma predição de animação no Replicate e retorna o predictionId imediatamente.
 * O cliente faz polling em /api/replicate/prediction-status?type=video para acompanhar.
 */
export const POST = withCredits('motion', async (req, { userId }) => {
  try {
    const body = await req.json()
    logger.info('Solicitação de animação recebida', { userId })

    const validated = motionGenerationSchema.parse(body)
    logger.info('Parâmetros validados', {
      modelId: validated.modelId,
      animationStyle: validated.animationStyle,
      personaId: validated.personaId,
      userId,
    })

    const replicateKey = await apiKeyService.getApiKeyWithEnvFallback(userId, 'replicate')
    if (!replicateKey) {
      return NextResponse.json(
        { success: false, error: 'API key do Replicate não configurada. Configure em /dashboard/settings' },
        { status: 400 }
      )
    }

    const predictionData = await motionService.createMotionPrediction(replicateKey, userId, validated)

    logger.info('Predição de motion iniciada com sucesso', {
      predictionId: predictionData.predictionId,
      modelId: predictionData.modelId,
      userId,
    })

    return NextResponse.json({ success: true, data: predictionData })
  } catch (error: unknown) {
    logger.error('Erro ao criar predição de motion', { error, userId })

    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Erro ao gerar animação'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})
