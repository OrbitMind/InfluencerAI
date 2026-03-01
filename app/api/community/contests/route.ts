import { NextResponse } from 'next/server'
import { ContestService } from '@/lib/services/community/contest.service'

const contestService = new ContestService()

export async function GET() {
  try {
    const contests = await contestService.listActive()
    return NextResponse.json({ success: true, data: contests })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar contests'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
