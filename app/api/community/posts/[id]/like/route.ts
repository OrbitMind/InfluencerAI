import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { CommunityPostService } from '@/lib/services/community/community-post.service'

const communityPostService = new CommunityPostService()

export const POST = withAuth(async (_req, { userId, params }) => {
  try {
    const id = (params as { id: string }).id
    await communityPostService.like(id)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao curtir post'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})
