import { NextRequest, NextResponse } from 'next/server'
import { engagementFetcherService } from '@/lib/services/analytics/engagement-fetcher'

// POST /api/cron/fetch-engagement
// Fetches engagement metrics for published posts (daily cron)
// Auth: CRON_SECRET header
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('[Fetch Engagement Cron] CRON_SECRET not configured')
      return NextResponse.json({ error: 'Cron not configured' }, { status: 500 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Fetch Engagement Cron] Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch engagement for all users
    const result = await engagementFetcherService.fetchAllEngagement()

    console.log('[Fetch Engagement Cron] Completed:', result)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[Fetch Engagement Cron] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch engagement metrics' },
      { status: 500 }
    )
  }
}
