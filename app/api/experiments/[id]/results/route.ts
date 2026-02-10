import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { experimentService } from '@/lib/services/experiment/experiment-service'

function extractId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/')
  // URL: /api/experiments/[id]/results
  return parts[parts.length - 2]
}

// GET /api/experiments/[id]/results
// Gets experiment results summary
async function handler(req: NextRequest, context: { userId: string }): Promise<NextResponse> {
  try {
    const experimentId = extractId(req)

    const results = await experimentService.getExperimentResults(context.userId, experimentId)

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('[Experiment Results Error]:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Falha ao buscar resultados' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handler)
