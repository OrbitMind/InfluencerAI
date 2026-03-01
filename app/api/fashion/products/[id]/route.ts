import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { ProductAssetService } from '@/lib/services/fashion/product-asset.service'

const productAssetService = new ProductAssetService()

export const GET = withAuth(async (_req, { userId, params }) => {
  try {
    const id = (params as { id: string }).id
    const asset = await productAssetService.get(userId, id)
    return NextResponse.json({ success: true, data: asset })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar produto'
    const status = message.includes('não encontrado') ? 404 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
})

export const DELETE = withAuth(async (_req, { userId, params }) => {
  try {
    const id = (params as { id: string }).id
    await productAssetService.delete(userId, id)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao deletar produto'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})
