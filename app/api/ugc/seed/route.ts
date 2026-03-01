import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { UGCSeedService } from '@/lib/services/ugc/ugc-seed.service'

const ugcSeedService = new UGCSeedService()

export const POST = withAuth(async (req, { userId }) => {
  try {
    // Proteção simples: apenas em ambiente de desenvolvimento ou com secret
    const adminSecret = req.headers.get('x-admin-secret')
    const envSecret = process.env.ADMIN_SECRET

    if (process.env.NODE_ENV === 'production' && (!envSecret || adminSecret !== envSecret)) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 })
    }

    const result = await ugcSeedService.seedUGCTemplates()
    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao fazer seed dos templates UGC'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})
