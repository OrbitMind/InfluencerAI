import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { socialAuthService } from '@/lib/services/social/social-auth-service'

function extractId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/')
  return parts[parts.length - 1]
}

// DELETE /api/social/accounts/[id] - Disconnect account
async function handler(
  req: NextRequest,
  context: { userId: string }
) {
  try {
    const accountId = extractId(req)

    await socialAuthService.disconnectAccount(context.userId, accountId)

    return NextResponse.json({
      success: true,
      message: 'Account disconnected successfully',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to disconnect account'
    return NextResponse.json(
      { success: false, error: message },
      { status: message.includes('not found') ? 404 : 500 }
    )
  }
}

export const DELETE = withAuth(handler)
