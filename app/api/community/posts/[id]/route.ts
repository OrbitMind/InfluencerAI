import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/utils/auth'
import { CommunityPostService } from '@/lib/services/community/community-post.service'
import { updateCommunityPostSchema } from '@/lib/validations/community'

const communityPostService = new CommunityPostService()

export async function GET(_req: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params
    const post = await communityPostService.get(params.id)
    return NextResponse.json({ success: true, data: post })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar post'
    const status = message.includes('não encontrado') ? 404 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

export const PATCH = withAuth(async (req, { userId, params }) => {
  try {
    const id = (params as { id: string }).id
    const body = await req.json()
    const validated = updateCommunityPostSchema.parse(body)
    const post = await communityPostService.update(userId, id, validated)
    return NextResponse.json({ success: true, data: post })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Erro ao atualizar post'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})

export const DELETE = withAuth(async (_req, { userId, params }) => {
  try {
    const id = (params as { id: string }).id
    await communityPostService.delete(userId, id)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao deletar post'
    const status = message.includes('negado') ? 403 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
})
