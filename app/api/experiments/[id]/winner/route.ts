import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { experimentService } from '@/lib/services/experiment/experiment-service'
import { declareWinnerSchema } from '@/lib/validations/experiment'

function extractId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/')
  // URL: /api/experiments/[id]/winner
  return parts[parts.length - 2]
}

// POST /api/experiments/[id]/winner
// Declares winner of A/B test (automatic or manual)
async function handler(req: NextRequest, context: { userId: string }): Promise<NextResponse> {
  try {
    const experimentId = extractId(req)
    const body = await req.json()
    const validated = declareWinnerSchema.parse(body)

    const experiment = await experimentService.declareWinner(
      context.userId,
      experimentId,
      validated.variantId
    )

    return NextResponse.json({
      success: true,
      experiment,
      message: 'Vencedor declarado com sucesso',
    })
  } catch (error) {
    console.error('[Experiment Winner Error]:', error)

    if (error instanceof Error && error.message.includes('Zod')) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: (error as Error).message || 'Falha ao declarar vencedor' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(handler)
