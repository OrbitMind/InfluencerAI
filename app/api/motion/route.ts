import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withCredits } from '@/lib/utils/billing-middleware'
import { MotionService } from '@/lib/services/motion/motion.service'
import { ApiKeyService } from '@/lib/services/api-key/api-key.service'
import { motionGenerationSchema } from '@/lib/validations/motion'

const motionService = MotionService.getInstance()
const apiKeyService = new ApiKeyService()

export const POST = withCredits('motion', async (req, { userId }) => {
  try {
    const body = await req.json()
    const validated = motionGenerationSchema.parse(body)

    const replicateKey = await apiKeyService.getApiKeyWithEnvFallback(userId, 'replicate')
    if (!replicateKey) {
      return NextResponse.json(
        { success: false, error: 'API key do Replicate não configurada. Configure em /dashboard/settings' },
        { status: 400 }
      )
    }

    const result = await motionService.generateMotion(replicateKey, userId, validated)
    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Erro ao gerar animação'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})
