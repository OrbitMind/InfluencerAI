import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { UGCSeedService } from '@/lib/services/ugc/ugc-seed.service'

const ugcSeedService = new UGCSeedService()

export const GET = withAuth(async (_req, { userId }) => {
  try {
    const templates = await ugcSeedService.getUGCTemplates()
    return NextResponse.json({ success: true, data: templates })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar templates UGC'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})
