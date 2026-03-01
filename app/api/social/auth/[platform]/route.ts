import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { socialAuthService } from '@/lib/services/social/social-auth-service'

function extractPlatform(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/')
  return parts[parts.length - 1]
}

// GET /api/social/auth/[platform] - Initiate OAuth flow
async function handler(
  req: NextRequest,
  context: { userId: string }
) {
  try {
    const platform = extractPlatform(req)

    // Validate platform
    const validPlatforms = ['instagram', 'tiktok', 'youtube']
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { success: false, error: 'Invalid platform' },
        { status: 400 }
      )
    }

    // Generate OAuth authorization URL
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/callback/${platform}`
    const authUrl = socialAuthService.getAuthorizationUrl(
      platform,
      context.userId,
      redirectUri
    )

    // Redirect to platform OAuth page
    return NextResponse.redirect(authUrl)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to initiate OAuth'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handler)
