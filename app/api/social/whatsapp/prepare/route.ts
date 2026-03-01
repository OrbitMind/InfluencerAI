import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { whatsAppShareService } from '@/lib/services/social/whatsapp-share-service'

// POST /api/social/whatsapp/prepare
// Prepares media for WhatsApp Status
async function handler(req: NextRequest, context: { userId: string }) {
  try {
    const body = await req.json()
    const { mediaUrl, mediaType } = body

    if (!mediaUrl || !mediaType) {
      return NextResponse.json(
        { error: 'mediaUrl and mediaType are required' },
        { status: 400 }
      )
    }

    if (mediaType !== 'image' && mediaType !== 'video') {
      return NextResponse.json(
        { error: 'mediaType must be "image" or "video"' },
        { status: 400 }
      )
    }

    // Prepare media
    const whatsAppMedia = await whatsAppShareService.prepareForWhatsAppStatus(
      mediaUrl,
      mediaType
    )

    // Generate share link
    const shareLink = whatsAppShareService.generateShareLink({
      mediaUrl,
      text: 'Confira este conteúdo!',
    })

    return NextResponse.json({
      success: true,
      optimizedUrl: whatsAppMedia.optimizedUrl,
      shareLink,
      fileSize: whatsAppMedia.fileSize,
      needsTrim: whatsAppMedia.needsTrim,
      instructions: whatsAppMedia.instructions,
    })
  } catch (error: unknown) {
    console.error('[WhatsApp Prepare Error]:', error)
    const message = error instanceof Error ? error.message : 'Failed to prepare media for WhatsApp'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export const POST = withAuth(handler)
