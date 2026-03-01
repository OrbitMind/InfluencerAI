import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/utils/auth'
import { CommunityPostService } from '@/lib/services/community/community-post.service'
import { createCommunityPostSchema, communityFiltersSchema } from '@/lib/validations/community'

const communityPostService = new CommunityPostService()

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const filters = communityFiltersSchema.parse(Object.fromEntries(searchParams))
    const result = await communityPostService.listPublic(filters)
    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar posts'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export const POST = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json()
    const validated = createCommunityPostSchema.parse(body)
    const post = await communityPostService.create(userId, validated)
    return NextResponse.json({ success: true, data: post }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Erro ao criar post'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})
