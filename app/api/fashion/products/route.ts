import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/utils/auth'
import { ProductAssetService } from '@/lib/services/fashion/product-asset.service'
import { createProductAssetSchema, productAssetFiltersSchema } from '@/lib/validations/fashion'

const productAssetService = new ProductAssetService()

export const GET = withAuth(async (req, { userId }) => {
  try {
    const { searchParams } = new URL(req.url)
    const filters = productAssetFiltersSchema.parse(Object.fromEntries(searchParams))
    const result = await productAssetService.list(userId, filters)
    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar produtos'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})

export const POST = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json()
    const validated = createProductAssetSchema.parse(body)
    const asset = await productAssetService.create(userId, validated)
    return NextResponse.json({ success: true, data: asset }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Erro ao criar produto'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})
