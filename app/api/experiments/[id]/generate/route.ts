import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { experimentService } from '@/lib/services/experiment/experiment-service'

function extractId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/')
  // URL: /api/experiments/[id]/generate
  return parts[parts.length - 2]
}

// POST /api/experiments/[id]/generate
// Generates content for all variants (creates campaigns)
async function handler(req: NextRequest, context: { userId: string }): Promise<NextResponse> {
  try {
    const experimentId = extractId(req)

    const experiment = await experimentService.generateVariants(context.userId, experimentId)

    return NextResponse.json({
      success: true,
      experiment,
      message: 'Variantes geradas com sucesso',
    })
  } catch (error) {
    console.error('[Experiment Generate Error]:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Falha ao gerar variantes' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(handler)
