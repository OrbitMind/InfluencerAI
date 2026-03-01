import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/utils/auth'
import { MoodboardService } from '@/lib/services/moodboard/moodboard.service'
import { updateMoodboardSchema } from '@/lib/validations/moodboard'

const moodboardService = new MoodboardService()

export const GET = withAuth(async (_req, { userId, params }) => {
  try {
    const personaId = (params as { id: string }).id
    const moodboard = await moodboardService.getMoodboard(personaId)
    return NextResponse.json({ success: true, data: moodboard })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar moodboard'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})

export const PATCH = withAuth(async (req, { userId, params }) => {
  try {
    const personaId = (params as { id: string }).id
    const body = await req.json()
    const validated = updateMoodboardSchema.parse(body)
    const moodboard = await moodboardService.updateMoodboard(personaId, validated)
    return NextResponse.json({ success: true, data: moodboard })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Erro ao atualizar moodboard'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})
