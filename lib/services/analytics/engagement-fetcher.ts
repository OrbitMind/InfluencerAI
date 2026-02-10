import { prisma } from '@/lib/db'
import { socialAuthService } from '@/lib/services/social/social-auth-service'
import type { EngagementData } from '@/lib/types/analytics'

// ============================================
// ENGAGEMENT FETCHER SERVICE (Sprint 9)
// ============================================

export class EngagementFetcherService {
  private static instance: EngagementFetcherService

  private constructor() {}

  static getInstance(): EngagementFetcherService {
    if (!EngagementFetcherService.instance) {
      EngagementFetcherService.instance = new EngagementFetcherService()
    }
    return EngagementFetcherService.instance
  }

  /**
   * Fetches engagement metrics for all published posts
   * Called by cron job (daily)
   */
  async fetchAllEngagement(userId?: string): Promise<{ updated: number; failed: number }> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Find posts that need metrics update
    const where: Record<string, unknown> = {
      status: 'published',
      OR: [
        { metricsUpdatedAt: null },
        { metricsUpdatedAt: { lt: twentyFourHoursAgo } },
      ],
    }

    if (userId) {
      where.userId = userId
    }

    const posts = await prisma.scheduledPost.findMany({
      where,
      include: {
        socialAccount: true,
      },
      take: 100, // Process max 100 posts per run
    })

    let updated = 0
    let failed = 0

    for (const post of posts) {
      try {
        const engagement = await this.fetchPostEngagement(post)

        if (engagement) {
          await this.updatePostMetrics(post.id, engagement)
          updated++
        }
      } catch (error) {
        console.error(`[EngagementFetcher] Failed for post ${post.id}:`, error)
        failed++
      }

      // Rate limiting: wait 1s between requests
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    return { updated, failed }
  }

  /**
   * Fetches engagement for a single post
   */
  private async fetchPostEngagement(
    post: {
      id: string
      platformPostId: string | null
      socialAccount: {
        id: string
        platform: string
        accessTokenEncrypted: string | null
        accessTokenIv: string | null
        accessTokenAuthTag: string | null
      }
    }
  ): Promise<EngagementData | null> {
    if (!post.platformPostId) return null

    const { socialAccount } = post

    // Get decrypted access token
    const accessToken = await socialAuthService.getDecryptedToken(socialAccount as never)

    switch (socialAccount.platform) {
      case 'instagram':
        return this.fetchInstagramInsights(post.platformPostId, accessToken)

      case 'youtube':
        return this.fetchYouTubeStats(post.platformPostId, accessToken)

      case 'tiktok':
        // TikTok API doesn't provide post-level insights easily
        return null

      default:
        return null
    }
  }

  /**
   * Fetches Instagram insights
   */
  private async fetchInstagramInsights(mediaId: string, accessToken: string): Promise<EngagementData | null> {
    try {
      // Get basic metrics (like_count, comments_count)
      const basicResponse = await fetch(
        `https://graph.instagram.com/${mediaId}?fields=like_count,comments_count&access_token=${accessToken}`
      )

      if (!basicResponse.ok) {
        console.error('Instagram basic fetch failed:', await basicResponse.text())
        return null
      }

      const basicData = await basicResponse.json()

      // Try to get insights (reach, impressions) - only works for business/creator accounts
      let reach: number | undefined
      let impressions: number | undefined

      try {
        const insightsResponse = await fetch(
          `https://graph.instagram.com/${mediaId}/insights?metric=reach,impressions&access_token=${accessToken}`
        )

        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json()
          const metrics = insightsData.data || []

          reach = metrics.find((m: { name: string }) => m.name === 'reach')?.values?.[0]?.value
          impressions = metrics.find((m: { name: string }) => m.name === 'impressions')?.values?.[0]?.value
        }
      } catch {
        // Insights not available (personal account or permissions missing)
      }

      return {
        likes: basicData.like_count,
        comments: basicData.comments_count,
        reach,
        impressions,
      }
    } catch (error) {
      console.error('[EngagementFetcher] Instagram fetch error:', error)
      return null
    }
  }

  /**
   * Fetches YouTube statistics
   */
  private async fetchYouTubeStats(videoId: string, accessToken: string): Promise<EngagementData | null> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&access_token=${accessToken}`
      )

      if (!response.ok) {
        console.error('YouTube stats fetch failed:', await response.text())
        return null
      }

      const data = await response.json()

      if (!data.items || data.items.length === 0) {
        return null
      }

      const stats = data.items[0].statistics

      return {
        likes: parseInt(stats.likeCount || '0'),
        comments: parseInt(stats.commentCount || '0'),
        views: parseInt(stats.viewCount || '0'),
      }
    } catch (error) {
      console.error('[EngagementFetcher] YouTube fetch error:', error)
      return null
    }
  }

  /**
   * Updates post metrics in database
   */
  private async updatePostMetrics(postId: string, engagement: EngagementData): Promise<void> {
    const engagementRate = this.calculateEngagementRate(engagement)

    await prisma.scheduledPost.update({
      where: { id: postId },
      data: {
        likes: engagement.likes,
        comments: engagement.comments,
        shares: engagement.shares,
        views: engagement.views,
        reach: engagement.reach,
        impressions: engagement.impressions,
        engagementRate,
        metricsUpdatedAt: new Date(),
      },
    })
  }

  /**
   * Calculates engagement rate
   * Formula: (likes + comments) / reach (or impressions if reach not available)
   */
  private calculateEngagementRate(engagement: EngagementData): number | null {
    const interactions = (engagement.likes || 0) + (engagement.comments || 0)
    const denominator = engagement.reach || engagement.impressions

    if (!denominator || denominator === 0) {
      return null
    }

    return Math.round((interactions / denominator) * 10000) / 100 // Percentage with 2 decimals
  }
}

export const engagementFetcherService = EngagementFetcherService.getInstance()
