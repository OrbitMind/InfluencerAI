import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { experimentService } from '@/lib/services/experiment/experiment-service'

function extractId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/')
  // URL: /api/experiments/[id]/metrics
  return parts[parts.length - 2]
}

// POST /api/experiments/[id]/metrics
// Updates engagement metrics for all variants
async function handler(req: NextRequest, context: { userId: string }): Promise<NextResponse> {
  try {
    const experimentId = extractId(req)

    const experiment = await experimentService.updateMetrics(context.userId, experimentId)

    return NextResponse.json({
      success: true,
      experiment,
      message: 'Métricas atualizadas com sucesso',
    })
  } catch (error) {
    console.error('[Experiment Metrics Error]:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Falha ao atualizar métricas' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(handler)
