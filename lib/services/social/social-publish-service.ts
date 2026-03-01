import { prisma } from '@/lib/db'
import { socialAuthService } from './social-auth-service'
import type {
  PublishParams,
  PublishResult,
  InstagramPublishParams,
  TikTokPublishParams,
  YouTubePublishParams,
  SocialPublishError,
} from '@/lib/types/social'
import type { SocialAccount } from '@prisma/client'

// ============================================
// SOCIAL PUBLISH SERVICE (Sprint 7)
// ============================================

export class SocialPublishService {
  private static instance: SocialPublishService

  private constructor() {}

  static getInstance(): SocialPublishService {
    if (!SocialPublishService.instance) {
      SocialPublishService.instance = new SocialPublishService()
    }
    return SocialPublishService.instance
  }

  // ============================================
  // MAIN PUBLISH ORCHESTRATOR
  // ============================================

  async publishNow(params: PublishParams): Promise<PublishResult> {
    // 1. Get social account
    const account = await prisma.socialAccount.findUnique({
      where: { id: params.socialAccountId },
    })

    if (!account) {
      throw new Error('Social account not found')
    }

    if (!account.isActive) {
      throw new Error('Social account is disconnected. Please reconnect.')
    }

    // 2. Refresh token if needed
    const refreshedAccount = await socialAuthService.refreshTokenIfNeeded(account)

    // 3. Get decrypted token
    const accessToken = await socialAuthService.getDecryptedToken(refreshedAccount)

    // 4. Publish to platform
    return this.publishWithRetry(async () => {
      switch (account.platform) {
        case 'instagram':
          return this.publishToInstagram({
            accessToken,
            mediaUrl: params.mediaUrl,
            mediaType: this.mapMediaTypeToInstagram(params.mediaType),
            caption: this.buildCaption(params.caption, params.hashtags),
            userId: account.platformUserId,
          })

        case 'tiktok':
          return this.publishToTikTok({
            accessToken,
            videoUrl: params.mediaUrl,
            caption: this.buildCaption(params.caption, params.hashtags),
          })

        case 'youtube':
          return this.publishToYouTube({
            accessToken,
            videoUrl: params.mediaUrl,
            title: params.caption || 'Untitled',
            description: params.hashtags,
            isShort: true,
          })

        default:
          throw new Error(`Publishing not supported for platform: ${account.platform}`)
      }
    }, account.platform)
  }

  // ============================================
  // INSTAGRAM PUBLISHING
  // ============================================

  private async publishToInstagram(params: InstagramPublishParams): Promise<PublishResult> {
    // Instagram publishing is a 2-step process:
    // 1. Create media container
    // 2. Publish the container

    // Step 1: Create container
    const containerResponse = await fetch(
      `https://graph.instagram.com/v21.0/${params.userId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [params.mediaType === 'IMAGE' ? 'image_url' : 'video_url']: params.mediaUrl,
          media_type: params.mediaType,
          caption: params.caption,
          access_token: params.accessToken,
        }),
      }
    )

    if (!containerResponse.ok) {
      const error = await containerResponse.text()
      throw this.createPublishError(
        `Instagram container creation failed: ${error}`,
        'instagram',
        containerResponse.status
      )
    }

    const containerData = await containerResponse.json()
    const containerId = containerData.id

    // Step 2: Publish container
    const publishResponse = await fetch(
      `https://graph.instagram.com/v21.0/${params.userId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: params.accessToken,
        }),
      }
    )

    if (!publishResponse.ok) {
      const error = await publishResponse.text()
      throw this.createPublishError(
        `Instagram publish failed: ${error}`,
        'instagram',
        publishResponse.status
      )
    }

    const publishData = await publishResponse.json()
    const mediaId = publishData.id

    // Construct post URL (approximate - Instagram doesn't return direct URL)
    const postUrl = `https://www.instagram.com/p/${this.shortcodeFromMediaId(mediaId)}/`

    return {
      platformPostId: mediaId,
      platformPostUrl: postUrl,
    }
  }

  // ============================================
  // TIKTOK PUBLISHING
  // ============================================

  private async publishToTikTok(params: TikTokPublishParams): Promise<PublishResult> {
    // TikTok Direct Post API - 3-step process

    // Step 1: Initialize upload
    const initResponse = await fetch(
      'https://open.tiktokapis.com/v2/post/publish/video/init/',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${params.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_info: {
            title: params.caption ? params.caption.substring(0, 150) : 'Video',
            privacy_level: 'PUBLIC_TO_EVERYONE',
            disable_duet: false,
            disable_stitch: false,
            disable_comment: false,
            video_cover_timestamp_ms: 0,
          },
          source_info: {
            source: 'PULL_FROM_URL',
            video_url: params.videoUrl,
          },
        }),
      }
    )

    if (!initResponse.ok) {
      const error = await initResponse.text()
      throw this.createPublishError(
        `TikTok init upload failed: ${error}`,
        'tiktok',
        initResponse.status
      )
    }

    const initData = await initResponse.json()
    const publishId = initData.data.publish_id

    // Step 2: Poll for status (max 60s, check every 5s)
    const maxAttempts = 12 // 12 * 5s = 60s
    let attempts = 0
    let status = 'PROCESSING_UPLOAD'

    while (attempts < maxAttempts && status === 'PROCESSING_UPLOAD') {
      await new Promise((resolve) => setTimeout(resolve, 5000)) // 5s delay

      const statusResponse = await fetch(
        'https://open.tiktokapis.com/v2/post/publish/status/fetch/',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${params.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            publish_id: publishId,
          }),
        }
      )

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        status = statusData.data.status
      }

      attempts++
    }

    if (status !== 'PUBLISH_COMPLETE') {
      throw this.createPublishError(
        `TikTok publish timeout or failed. Status: ${status}`,
        'tiktok'
      )
    }

    // Step 3: Return result
    // Note: TikTok API doesn't return a direct URL
    // The video goes to the creator's inbox for review
    return {
      platformPostId: publishId,
      platformPostUrl: '', // TikTok doesn't provide URL via API
    }
  }

  // ============================================
  // YOUTUBE PUBLISHING
  // ============================================

  private async publishToYouTube(params: YouTubePublishParams): Promise<PublishResult> {
    // YouTube Resumable Upload - 2-phase process

    // Prepare metadata
    const isShort = params.isShort
    const description = isShort
      ? `#Shorts\n\n${params.description || ''}`
      : params.description || ''

    const tags = this.extractTags(params.description || '')

    // Phase 1: Initialize resumable upload
    const initResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${params.accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': 'video/mp4',
        },
        body: JSON.stringify({
          snippet: {
            title: params.title.substring(0, 100),
            description: description.substring(0, 5000),
            tags,
            categoryId: '22', // People & Blogs
            defaultLanguage: 'pt-BR',
          },
          status: {
            privacyStatus: 'public',
            selfDeclaredMadeForKids: false,
            embeddable: true,
          },
        }),
      }
    )

    if (!initResponse.ok) {
      const error = await initResponse.text()
      throw this.createPublishError(
        `YouTube init upload failed: ${error}`,
        'youtube',
        initResponse.status
      )
    }

    const uploadUrl = initResponse.headers.get('Location')
    if (!uploadUrl) {
      throw this.createPublishError('YouTube upload URL not returned', 'youtube')
    }

    // Phase 2: Download video and upload to YouTube
    const videoBuffer = await this.downloadToBuffer(params.videoUrl)

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoBuffer.length.toString(),
      },
      body: videoBuffer as unknown as BodyInit,
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text()
      throw this.createPublishError(
        `YouTube video upload failed: ${error}`,
        'youtube',
        uploadResponse.status
      )
    }

    const uploadData = await uploadResponse.json()
    const videoId = uploadData.id

    return {
      platformPostId: videoId,
      platformPostUrl: `https://www.youtube.com/watch?v=${videoId}`,
    }
  }

  // Helper: Download video to buffer
  private async downloadToBuffer(url: string): Promise<Buffer> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  // Helper: Extract tags from description
  private extractTags(description: string): string[] {
    const hashtagRegex = /#(\w+)/g
    const tags: string[] = []
    let match

    while ((match = hashtagRegex.exec(description)) !== null) {
      tags.push(match[1])
    }

    return tags.slice(0, 15) // YouTube max 15 tags
  }

  // ============================================
  // RETRY LOGIC
  // ============================================

  private async publishWithRetry<T>(
    publishFn: () => Promise<T>,
    platform: string,
    maxRetries = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await publishFn()
      } catch (error: unknown) {
        const isRetryable = this.isRetryableError(error)
        const isLastAttempt = attempt === maxRetries

        if (!isRetryable || isLastAttempt) {
          throw error
        }

        // Exponential backoff: 2^attempt seconds
        const delayMs = Math.pow(2, attempt) * 1000
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    throw new Error('Retry logic exhausted')
  }

  private isRetryableError(error: any): boolean {
    // Retry on rate limits, server errors, timeouts
    const retryableStatusCodes = [429, 500, 502, 503, 504]

    if (error.statusCode && retryableStatusCodes.includes(error.statusCode)) {
      return true
    }

    if (error.message?.includes('timeout')) {
      return true
    }

    return false
  }

  // ============================================
  // HELPERS
  // ============================================

  private buildCaption(caption?: string, hashtags?: string): string {
    const parts: string[] = []

    if (caption) {
      parts.push(caption.trim())
    }

    if (hashtags) {
      parts.push(hashtags.trim())
    }

    return parts.join('\n\n')
  }

  private mapMediaTypeToInstagram(
    mediaType: 'image' | 'video' | 'carousel'
  ): 'IMAGE' | 'REELS' | 'STORIES' {
    switch (mediaType) {
      case 'image':
        return 'IMAGE'
      case 'video':
        return 'REELS'
      case 'carousel':
        return 'IMAGE' // Carousel requires different API flow
      default:
        return 'IMAGE'
    }
  }

  private shortcodeFromMediaId(mediaId: string): string {
    // Instagram media ID to shortcode conversion (approximate)
    // This is a simplified version - actual conversion is more complex
    return mediaId.substring(0, 11)
  }

  private createPublishError(
    message: string,
    platform: string,
    statusCode?: number
  ): Error {
    const error: any = new Error(message)
    error.platform = platform
    error.statusCode = statusCode
    error.name = 'SocialPublishError'
    return error
  }

  // ============================================
  // URL VALIDATION
  // ============================================

  async validateMediaUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }
}

export const socialPublishService = SocialPublishService.getInstance()
