import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { withCredits } from '@/lib/utils/billing-middleware'
import { VideoCompositionService } from '@/lib/services/composition/video-composition.service'
import { mergeAudioSchema } from '@/lib/validations/composition'

// POST /api/composition/merge-audio
// Merges video with audio
async function handler(req: NextRequest, context: { userId: string }) {
  try {
    const body = await req.json()

    // Validate
    const validated = mergeAudioSchema.parse(body)

    const videoCompositionService = VideoCompositionService.getInstance()

    // Check if FFmpeg is available
    if (!videoCompositionService.isFFmpegAvailable()) {
      return NextResponse.json(
        {
          error: 'FFmpeg not available on server. Audio merging requires FFmpeg.',
          code: 'FFMPEG_NOT_AVAILABLE',
        },
        { status: 503 }
      )
    }

    // Merge audio
    const result = await videoCompositionService.mergeVideoAudio(validated)

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to merge audio' },
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
    console.error('[Merge Audio Error]:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      const zodErr = error as { errors?: unknown }
      return NextResponse.json(
        { error: 'Validation error', details: zodErr.errors },
        { status: 400 }
      )
    }

    const message = error instanceof Error ? error.message : 'Failed to merge audio'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export const POST = withCredits('composition', withAuth(handler))
