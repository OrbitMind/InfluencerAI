import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { experimentService } from '@/lib/services/experiment/experiment-service'
import { createExperimentSchema } from '@/lib/validations/experiment'

// POST /api/experiments
// Creates a new A/B test experiment
async function postHandler(req: NextRequest, context: { userId: string }): Promise<NextResponse> {
  try {
    const body = await req.json()
    const validated = createExperimentSchema.parse(body)

    const experiment = await experimentService.createExperiment(context.userId, validated)

    return NextResponse.json({
      success: true,
      experiment,
    })
  } catch (error) {
    console.error('[Experiments Create Error]:', error)

    if (error instanceof Error && error.message.includes('Zod')) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: (error as Error).message || 'Falha ao criar experimento' },
      { status: 500 }
    )
  }
}

// GET /api/experiments
// Lists all experiments for user
async function getHandler(req: NextRequest, context: { userId: string }): Promise<NextResponse> {
  try {
    const experiments = await experimentService.listExperiments(context.userId)

    return NextResponse.json({
      success: true,
      experiments,
    })
  } catch (error) {
    console.error('[Experiments List Error]:', error)
    return NextResponse.json(
      { error: 'Falha ao listar experimentos' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(postHandler)
export const GET = withAuth(getHandler)
