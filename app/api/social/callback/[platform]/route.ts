import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { socialAuthService } from '@/lib/services/social/social-auth-service'
import { oauthCallbackSchema } from '@/lib/validations/social'

// GET /api/social/callback/[platform] - OAuth callback handler
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ platform: string }> }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/social?error=unauthorized`
      )
    }

    const { platform } = await context.params
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    // Validate query parameters
    const validation = oauthCallbackSchema.safeParse({ code, state })
    if (!validation.success) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/social?error=invalid_callback`
      )
    }

    // Verify state (CSRF protection)
    const isStateValid = await socialAuthService.verifyState(state!, session.user.id)
    if (!isStateValid) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/social?error=invalid_state`
      )
    }

    // Exchange code for tokens and profile
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/callback/${platform}`
    const { tokens, profile } = await socialAuthService.handleCallback(
      platform,
      code!,
      redirectUri
    )

    // Save account
    await socialAuthService.connectAccount(session.user.id, platform, tokens, profile)

    // Redirect to social page with success
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/social?success=connected&platform=${platform}`
    )
  } catch (error: unknown) {
    console.error('OAuth callback error:', error)
    const message = error instanceof Error ? error.message : 'connection_failed'
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/social?error=${encodeURIComponent(message)}`
    )
  }
}
