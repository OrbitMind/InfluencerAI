import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/utils/auth'
import { MoodboardService } from '@/lib/services/moodboard/moodboard.service'
import { createMoodboardItemSchema, reorderItemsSchema } from '@/lib/validations/moodboard'

const moodboardService = new MoodboardService()

export const POST = withAuth(async (req, { userId, params }) => {
  try {
    const personaId = (params as { id: string }).id
    const body = await req.json()
    const validated = createMoodboardItemSchema.parse(body)
    const item = await moodboardService.addItem(personaId, validated)
    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Erro ao adicionar item'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})

export const DELETE = withAuth(async (req, { userId, params }) => {
  try {
    const personaId = (params as { id: string }).id
    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('itemId')
    if (!itemId) {
      return NextResponse.json({ success: false, error: 'itemId é obrigatório' }, { status: 400 })
    }
    await moodboardService.removeItem(personaId, itemId)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao remover item'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})

export const PATCH = withAuth(async (req, { userId, params }) => {
  try {
    const body = await req.json()
    const validated = reorderItemsSchema.parse(body)
    await moodboardService.reorderItems(validated.items)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Erro ao reordenar items'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})
