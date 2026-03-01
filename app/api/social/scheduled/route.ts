import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { schedulerService } from '@/lib/services/social/scheduler-service'
import { listScheduledSchema } from '@/lib/validations/social'

// GET /api/social/scheduled - List scheduled posts
async function handler(req: NextRequest, context: { userId: string }) {
  try {
    const { searchParams } = new URL(req.url)

    // Parse filters from query params
    const filters = {
      status: searchParams.get('status') || undefined,
      platform: searchParams.get('platform') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    }

    // Validate filters
    const validation = listScheduledSchema.safeParse(filters)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid filters',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const validatedFilters = validation.data

    // Get scheduled posts
    const result = await schedulerService.listScheduled(context.userId, validatedFilters)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: unknown) {
    console.error('List scheduled error:', error)
    const message = error instanceof Error ? error.message : 'Failed to list scheduled posts'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handler)
