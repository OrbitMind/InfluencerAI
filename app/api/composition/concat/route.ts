import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { withCredits } from '@/lib/utils/billing-middleware'
import { VideoCompositionService } from '@/lib/services/composition/video-composition.service'
import { concatVideosSchema } from '@/lib/validations/composition'

// POST /api/composition/concat
// Concatenates multiple videos
async function handler(req: NextRequest, context: { userId: string }) {
  try {
    const body = await req.json()

    // Validate
    const validated = concatVideosSchema.parse(body)

    const videoCompositionService = VideoCompositionService.getInstance()

    // Check if FFmpeg is available
    if (!videoCompositionService.isFFmpegAvailable()) {
      return NextResponse.json(
        {
          error: 'FFmpeg not available on server. Video concatenation requires FFmpeg.',
          code: 'FFMPEG_NOT_AVAILABLE',
        },
        { status: 503 }
      )
    }

    // Concatenate videos
    const result = await videoCompositionService.concatenateVideos(validated)

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to concatenate videos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      composedUrl: result.url,
      publicId: result.publicId,
      duration: result.duration,
      width: result.width,
      height: result.height,
    })
  } catch (error: unknown) {
    console.error('[Concat Videos Error]:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      const zodErr = error as { errors?: unknown }
      return NextResponse.json(
        { error: 'Validation error', details: zodErr.errors },
        { status: 400 }
      )
    }

    const message = error instanceof Error ? error.message : 'Failed to concatenate videos'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export const POST = withCredits('composition', withAuth(handler))
