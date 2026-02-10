import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { batchService } from '@/lib/services/batch/batch-service'

function extractId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/')
  return parts[parts.length - 1]
}

// GET /api/batch/[id]
// Gets batch job status
async function getHandler(req: NextRequest, context: { userId: string }): Promise<NextResponse> {
  try {
    const batchId = extractId(req)

    const batchJob = await batchService.getBatchStatus(context.userId, batchId)

    return NextResponse.json({
      success: true,
      batchJob,
    })
  } catch (error) {
    console.error('[Batch Get Error]:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to get batch job' },
      { status: 500 }
    )
  }
}

// DELETE /api/batch/[id]
// Cancels batch job
async function deleteHandler(req: NextRequest, context: { userId: string }): Promise<NextResponse> {
  try {
    const batchId = extractId(req)

    const batchJob = await batchService.cancelBatch(context.userId, batchId)

    return NextResponse.json({
      success: true,
      batchJob,
    })
  } catch (error) {
    console.error('[Batch Cancel Error]:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to cancel batch job' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getHandler)
export const DELETE = withAuth(deleteHandler)
