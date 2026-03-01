import { NextResponse } from 'next/server'
import { withCredits } from '@/lib/utils/billing-middleware'
import { ProductAssetService } from '@/lib/services/fashion/product-asset.service'
import { ApiKeyService } from '@/lib/services/api-key/api-key.service'

const productAssetService = new ProductAssetService()
const apiKeyService = new ApiKeyService()

export const POST = withCredits('image', async (_req, { userId, params }) => {
  try {
    const id = (params as { id: string }).id

    const replicateKey = await apiKeyService.getApiKeyWithEnvFallback(userId, 'replicate')
    if (!replicateKey) {
      return NextResponse.json(
        { success: false, error: 'API key do Replicate não configurada. Configure em /dashboard/settings' },
        { status: 400 }
      )
    }

    const asset = await productAssetService.removeBackground(userId, id, replicateKey)
    return NextResponse.json({ success: true, data: asset })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao remover background'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})
