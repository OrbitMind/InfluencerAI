import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withCredits } from '@/lib/utils/billing-middleware'
import { ProductPlacementService } from '@/lib/services/product-placement/product-placement.service'
import { ApiKeyService } from '@/lib/services/api-key/api-key.service'
import { productPlacementSchema } from '@/lib/validations/product-placement'

const productPlacementService = ProductPlacementService.getInstance()
const apiKeyService = new ApiKeyService()

export const POST = withCredits('product-placement', async (req, { userId }) => {
  try {
    const body = await req.json()
    const validated = productPlacementSchema.parse(body)

    const replicateKey = await apiKeyService.getApiKeyWithEnvFallback(userId, 'replicate')
    if (!replicateKey) {
      return NextResponse.json(
        { success: false, error: 'API key do Replicate não configurada. Configure em /dashboard/settings' },
        { status: 400 }
      )
    }

    const result = await productPlacementService.generatePlacement(replicateKey, userId, validated)
    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Erro ao gerar product placement'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})
