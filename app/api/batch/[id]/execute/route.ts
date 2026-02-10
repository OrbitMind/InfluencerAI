import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { batchService } from '@/lib/services/batch/batch-service'

function extractId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/')
  // URL: /api/batch/[id]/execute
  return parts[parts.length - 2]
}

// POST /api/batch/[id]/execute
// Executes batch job (long-running, should poll for status)
async function handler(req: NextRequest, context: { userId: string }): Promise<NextResponse> {
  try {
    const batchId = extractId(req)

    // Get batch job to verify ownership
    const batchJob = await batchService.getBatchStatus(context.userId, batchId)

    if (batchJob.status !== 'queued') {
      return NextResponse.json(
        { error: `Cannot execute batch with status: ${batchJob.status}` },
        { status: 400 }
      )
    }

    // Execute batch asynchronously (fire-and-forget)
    // Frontend should poll /api/batch/[id] for status updates
    batchService.executeBatch(batchId).catch((error) => {
      console.error('[Batch Execute Background Error]:', error)
    })

    return NextResponse.json({
      success: true,
      message: 'Batch execution started. Poll /api/batch/[id] for status updates.',
      batchId,
    })
  } catch (error) {
    console.error('[Batch Execute Error]:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to execute batch job' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(handler)
