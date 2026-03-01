import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { schedulerService } from '@/lib/services/social/scheduler-service'
import { rescheduleSchema } from '@/lib/validations/social'

function extractId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/')
  return parts[parts.length - 1]
}

// PATCH /api/social/scheduled/[id] - Reschedule a post
async function patchHandler(
  req: NextRequest,
  context: { userId: string }
) {
  try {
    const postId = extractId(req)
    const body = await req.json()

    // Validate input
    const validation = rescheduleSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Reschedule post
    const post = await schedulerService.reschedulePost(
      context.userId,
      postId,
      data.scheduledFor
    )

    return NextResponse.json({
      success: true,
      data: post,
      message: 'Post rescheduled successfully',
    })
  } catch (error: unknown) {
    console.error('Reschedule error:', error)

    const message = error instanceof Error ? error.message : 'Failed to reschedule post'

    if (message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 404 }
      )
    }

    if (message.includes('Cannot reschedule')) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

// DELETE /api/social/scheduled/[id] - Cancel a post
async function deleteHandler(
  req: NextRequest,
  context: { userId: string }
) {
  try {
    const postId = extractId(req)

    // Cancel post
    const post = await schedulerService.cancelPost(context.userId, postId)

    return NextResponse.json({
      success: true,
      data: post,
      message: 'Post canceled successfully',
    })
  } catch (error: unknown) {
    console.error('Cancel error:', error)

    const message = error instanceof Error ? error.message : 'Failed to cancel post'

    if (message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 404 }
      )
    }

    if (message.includes('Cannot cancel')) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

export const PATCH = withAuth(patchHandler)
export const DELETE = withAuth(deleteHandler)
