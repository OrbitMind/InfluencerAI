import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { socialAuthService } from '@/lib/services/social/social-auth-service'

// GET /api/social/accounts - List connected accounts
async function handler(req: NextRequest, context: { userId: string }) {
  try {
    const accounts = await socialAuthService.listAccounts(context.userId)

    // Don't return encrypted tokens
    const sanitized = accounts.map((account) => ({
      id: account.id,
      platform: account.platform,
      platformUserId: account.platformUserId,
      platformUsername: account.platformUsername,
      displayName: account.displayName,
      avatarUrl: account.avatarUrl,
      isActive: account.isActive,
      lastSyncAt: account.lastSyncAt,
      tokenExpiresAt: account.tokenExpiresAt,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }))

    return NextResponse.json({ success: true, data: sanitized })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list accounts'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handler)
