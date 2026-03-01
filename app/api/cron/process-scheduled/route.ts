import { NextRequest, NextResponse } from 'next/server'
import { schedulerService } from '@/lib/services/social/scheduler-service'

// POST /api/cron/process-scheduled - Process scheduled posts (Cron job)
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET not configured')
      return NextResponse.json(
        { success: false, error: 'Cron not configured' },
        { status: 500 }
      )
    }

    // Check authorization header
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Process scheduled posts
    const result = await schedulerService.processScheduledPosts()

    console.log('Cron job completed:', result)

    return NextResponse.json({
      success: true,
      result,
      message: `Processed ${result.processed} posts: ${result.published} published, ${result.failed} failed`,
    })
  } catch (error: unknown) {
    console.error('Cron job error:', error)
    const message = error instanceof Error ? error.message : 'Cron job failed'
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    )
  }
}
