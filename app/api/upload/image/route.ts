import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { CloudinaryStorageService } from '@/lib/services/storage/cloudinary.service'

// POST /api/upload/image
// Uploads an image file to Cloudinary
async function handler(req: NextRequest, context: { userId: string }): Promise<NextResponse> {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Apenas imagens são permitidas' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 10MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Cloudinary
    const cloudinaryService = new CloudinaryStorageService()
    const result = await cloudinaryService.upload({
      buffer,
      userId: context.userId,
      type: 'image',
      folder: 'personas/references',
    })

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
    })
  } catch (error) {
    console.error('[Upload Image Error]:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Erro ao fazer upload da imagem' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(handler)
