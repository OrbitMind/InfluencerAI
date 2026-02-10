import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { analyticsService } from '@/lib/services/analytics/analytics-service'
import type { AnalyticsPeriod } from '@/lib/types/analytics'

// GET /api/analytics/costs?period=30d
// Returns cost/credit usage metrics
async function handler(req: NextRequest, context: { userId: string }): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url)
    const period = (searchParams.get('period') as AnalyticsPeriod) || '30d'

    // Validate period
    const validPeriods: AnalyticsPeriod[] = ['7d', '30d', '90d', 'all']
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be one of: 7d, 30d, 90d, all' },
        { status: 400 }
      )
    }

    const metrics = await analyticsService.getCostMetrics(context.userId, period)

    return NextResponse.json({
      success: true,
      period,
      metrics,
    })
  } catch (error) {
    console.error('[Analytics Costs Error]:', error)
    return NextResponse.json(
      { error: 'Failed to get cost metrics' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handler)
