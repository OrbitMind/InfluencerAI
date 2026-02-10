import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { experimentService } from '@/lib/services/experiment/experiment-service'

function extractId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/')
  return parts[parts.length - 1]
}

// GET /api/experiments/[id]
// Gets experiment details with variants
async function getHandler(req: NextRequest, context: { userId: string }): Promise<NextResponse> {
  try {
    const experimentId = extractId(req)

    const experiment = await experimentService.getExperiment(context.userId, experimentId)

    return NextResponse.json({
      success: true,
      experiment,
    })
  } catch (error) {
    console.error('[Experiment Get Error]:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Falha ao buscar experimento' },
      { status: 500 }
    )
  }
}

// DELETE /api/experiments/[id]
// Deletes experiment
async function deleteHandler(req: NextRequest, context: { userId: string }): Promise<NextResponse> {
  try {
    const experimentId = extractId(req)

    await experimentService.deleteExperiment(context.userId, experimentId)

    return NextResponse.json({
      success: true,
      message: 'Experimento deletado com sucesso',
    })
  } catch (error) {
    console.error('[Experiment Delete Error]:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Falha ao deletar experimento' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getHandler)
export const DELETE = withAuth(deleteHandler)
