import { prisma } from '@/lib/db'
import type {
  TrackEventParams,
  DashboardMetrics,
  EngagementMetrics,
  CostMetrics,
  AnalyticsPeriod,
} from '@/lib/types/analytics'
import { CreditService } from '@/lib/services/billing/credit.service'

// ============================================
// ANALYTICS SERVICE (Sprint 9)
// ============================================

export class AnalyticsService {
  private static instance: AnalyticsService
  private creditService: CreditService

  private constructor() {
    this.creditService = new CreditService()
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  // ============================================
  // EVENT TRACKING
  // ============================================

  /**
   * Tracks analytics event (fire-and-forget)
   * Never throws - logs errors internally
   */
  async trackEvent(params: TrackEventParams): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          userId: params.userId,
          eventType: params.eventType,
          eventData: params.eventData || null,
          personaId: params.personaId || null,
          campaignId: params.campaignId || null,
          platform: params.platform || null,
          creditsUsed: params.creditsUsed || 0,
          durationMs: params.durationMs || null,
        },
      })
    } catch (error) {
      // Fire-and-forget: log but don't throw
      console.error('[AnalyticsService] Failed to track event:', error)
    }
  }

  // ============================================
  // DASHBOARD METRICS
  // ============================================

  /**
   * Gets comprehensive dashboard metrics for user
   */
  async getDashboardMetrics(userId: string, period: AnalyticsPeriod = '30d'): Promise<DashboardMetrics> {
    const startDate = this.getPeriodStartDate(period)

    // Parallel queries for performance
    const [
      totalGenerations,
      generationEvents,
      totalCampaigns,
      campaigns,
      totalPublished,
      publishEvents,
      creditsUsed,
      creditsRemaining,
      executionEvents,
      topPersonasData,
      topTemplatesData,
      dailyEvents,
    ] = await Promise.all([
      // Total generations
      prisma.generation.count({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
      }),

      // Generations by type
      prisma.generation.groupBy({
        by: ['type'],
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),

      // Total campaigns
      prisma.campaign.count({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
      }),

      // Campaigns by status
      prisma.campaign.groupBy({
        by: ['status'],
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),

      // Total published posts
      prisma.scheduledPost.count({
        where: {
          userId,
          status: 'published',
          publishedAt: { gte: startDate },
        },
      }),

      // Published by platform
      prisma.scheduledPost.groupBy({
        by: ['socialAccountId'],
        where: {
          userId,
          status: 'published',
          publishedAt: { gte: startDate },
        },
        _count: { id: true },
        _max: { socialAccountId: true },
      }),

      // Credits used
      prisma.analyticsEvent.aggregate({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        _sum: { creditsUsed: true },
      }),

      // Credits remaining
      this.creditService.getBalance(userId),

      // Execution times
      prisma.analyticsEvent.aggregate({
        where: {
          userId,
          createdAt: { gte: startDate },
          durationMs: { not: null },
        },
        _avg: { durationMs: true },
      }),

      // Top personas
      prisma.generation.groupBy({
        by: ['personaId'],
        where: {
          userId,
          personaId: { not: null },
          createdAt: { gte: startDate },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),

      // Top templates
      prisma.campaign.groupBy({
        by: ['templateId'],
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),

      // Daily activity
      prisma.analyticsEvent.findMany({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        select: {
          eventType: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    // Process generations by type
    const generationsByType: Record<string, number> = {}
    generationEvents.forEach((item) => {
      generationsByType[item.type] = item._count.id
    })

    // Process campaigns by status
    const campaignsByStatus: Record<string, number> = {}
    campaigns.forEach((item) => {
      campaignsByStatus[item.status] = item._count.id
    })

    // Process published by platform
    const publishedByPlatform: Record<string, number> = {}
    const socialAccountIds = publishEvents.map((e) => e._max.socialAccountId).filter(Boolean) as string[]
    if (socialAccountIds.length > 0) {
      const accounts = await prisma.socialAccount.findMany({
        where: { id: { in: socialAccountIds } },
        select: { id: true, platform: true },
      })
      const accountMap = new Map(accounts.map((a) => [a.id, a.platform]))

      publishEvents.forEach((item) => {
        const accountId = item._max.socialAccountId
        if (accountId) {
          const platform = accountMap.get(accountId) || 'unknown'
          publishedByPlatform[platform] = (publishedByPlatform[platform] || 0) + item._count.id
        }
      })
    }

    // Process top personas
    const topPersonas = await this.enrichTopPersonas(topPersonasData)

    // Process top templates
    const topTemplates = await this.enrichTopTemplates(topTemplatesData)

    // Process daily activity
    const dailyActivity = this.processDailyActivity(dailyEvents, startDate)

    return {
      totalGenerations,
      generationsByType,
      totalCampaigns,
      campaignsByStatus,
      totalPublished,
      publishedByPlatform,
      creditsUsed: creditsUsed._sum.creditsUsed || 0,
      creditsRemaining,
      avgGenerationTime: Math.round(executionEvents._avg.durationMs || 0),
      topPersonas,
      topTemplates,
      dailyActivity,
    }
  }

  // ============================================
  // ENGAGEMENT METRICS
  // ============================================

  /**
   * Gets engagement metrics from published posts
   */
  async getEngagementMetrics(userId: string, period: AnalyticsPeriod = '30d'): Promise<EngagementMetrics> {
    const startDate = this.getPeriodStartDate(period)

    const posts = await prisma.scheduledPost.findMany({
      where: {
        userId,
        status: 'published',
        publishedAt: { gte: startDate },
      },
      include: {
        socialAccount: { select: { platform: true } },
      },
      orderBy: { publishedAt: 'desc' },
    })

    const totalPosts = posts.length
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0)
    const totalComments = posts.reduce((sum, p) => sum + (p.comments || 0), 0)
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0)

    const postsWithEngagement = posts.filter((p) => p.engagementRate !== null)
    const avgEngagementRate = postsWithEngagement.length > 0
      ? postsWithEngagement.reduce((sum, p) => sum + (p.engagementRate || 0), 0) / postsWithEngagement.length
      : 0

    // Best performing post
    const bestPost = posts.reduce((best, current) => {
      const currentLikes = current.likes || 0
      const bestLikes = best?.likes || 0
      return currentLikes > bestLikes ? current : best
    }, posts[0] || null)

    const bestPerformingPost = bestPost
      ? {
          id: bestPost.id,
          platformPostUrl: bestPost.platformPostUrl || undefined,
          likes: bestPost.likes || 0,
          platform: bestPost.socialAccount.platform,
        }
      : null

    // Engagement by platform
    const platformGroups = new Map<string, { posts: number; totalEngagement: number }>()
    posts.forEach((post) => {
      const platform = post.socialAccount.platform
      const engagement = (post.likes || 0) + (post.comments || 0)
      const existing = platformGroups.get(platform) || { posts: 0, totalEngagement: 0 }
      platformGroups.set(platform, {
        posts: existing.posts + 1,
        totalEngagement: existing.totalEngagement + engagement,
      })
    })

    const engagementByPlatform = Array.from(platformGroups.entries()).map(([platform, data]) => ({
      platform,
      posts: data.posts,
      avgEngagement: data.posts > 0 ? Math.round(data.totalEngagement / data.posts) : 0,
    }))

    // Engagement over time (daily)
    const engagementOverTime = this.processEngagementOverTime(posts, startDate)

    return {
      totalPosts,
      totalLikes,
      totalComments,
      totalViews,
      avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
      bestPerformingPost,
      engagementByPlatform,
      engagementOverTime,
    }
  }

  // ============================================
  // COST METRICS
  // ============================================

  /**
   * Gets cost/credit usage metrics
   */
  async getCostMetrics(userId: string, period: AnalyticsPeriod = '30d'): Promise<CostMetrics> {
    const startDate = this.getPeriodStartDate(period)

    const [events, campaigns] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where: {
          userId,
          createdAt: { gte: startDate },
          creditsUsed: { gt: 0 },
        },
        select: {
          eventType: true,
          creditsUsed: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),

      prisma.campaign.count({
        where: {
          userId,
          status: 'completed',
          completedAt: { gte: startDate },
        },
      }),
    ])

    const totalSpent = events.reduce((sum, e) => sum + e.creditsUsed, 0)

    // Spent by type
    const spentByType: Record<string, number> = {}
    events.forEach((event) => {
      spentByType[event.eventType] = (spentByType[event.eventType] || 0) + event.creditsUsed
    })

    // Average cost per campaign
    const averageCostPerCampaign = campaigns > 0 ? Math.round(totalSpent / campaigns) : 0

    // Cost over time (daily)
    const costOverTime = this.processCostOverTime(events, startDate)

    // Projected monthly usage (extrapolate from current period)
    const daysInPeriod = Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const dailyAverage = daysInPeriod > 0 ? totalSpent / daysInPeriod : 0
    const projectedMonthlyUsage = Math.round(dailyAverage * 30)

    return {
      totalSpent,
      spentByType,
      averageCostPerCampaign,
      costOverTime,
      projectedMonthlyUsage,
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private getPeriodStartDate(period: AnalyticsPeriod): Date {
    const now = new Date()
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      case 'all':
        return new Date(0) // Beginning of time
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  private async enrichTopPersonas(
    data: Array<{ personaId: string | null; _count: { id: number } }>
  ): Promise<Array<{ id: string; name: string; count: number }>> {
    const personaIds = data.map((d) => d.personaId).filter(Boolean) as string[]
    if (personaIds.length === 0) return []

    const personas = await prisma.persona.findMany({
      where: { id: { in: personaIds } },
      select: { id: true, name: true },
    })

    const personaMap = new Map(personas.map((p) => [p.id, p.name]))

    return data
      .filter((d) => d.personaId)
      .map((d) => ({
        id: d.personaId!,
        name: personaMap.get(d.personaId!) || 'Unknown',
        count: d._count.id,
      }))
  }

  private async enrichTopTemplates(
    data: Array<{ templateId: string; _count: { id: number } }>
  ): Promise<Array<{ id: string; name: string; count: number }>> {
    const templateIds = data.map((d) => d.templateId)
    if (templateIds.length === 0) return []

    const templates = await prisma.campaignTemplate.findMany({
      where: { id: { in: templateIds } },
      select: { id: true, name: true },
    })

    const templateMap = new Map(templates.map((t) => [t.id, t.name]))

    return data.map((d) => ({
      id: d.templateId,
      name: templateMap.get(d.templateId) || 'Unknown',
      count: d._count.id,
    }))
  }

  private processDailyActivity(
    events: Array<{ eventType: string; createdAt: Date }>,
    startDate: Date
  ): Array<{ date: string; generations: number; campaigns: number; publishes: number }> {
    const dailyMap = new Map<string, { generations: number; campaigns: number; publishes: number }>()

    // Initialize all days in period
    const days = Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      dailyMap.set(dateStr, { generations: 0, campaigns: 0, publishes: 0 })
    }

    // Count events by day
    events.forEach((event) => {
      const dateStr = event.createdAt.toISOString().split('T')[0]
      const day = dailyMap.get(dateStr) || { generations: 0, campaigns: 0, publishes: 0 }

      if (event.eventType === 'generation') day.generations++
      if (event.eventType === 'campaign_execution') day.campaigns++
      if (event.eventType === 'publish') day.publishes++

      dailyMap.set(dateStr, day)
    })

    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private processEngagementOverTime(
    posts: Array<{
      publishedAt: Date | null
      likes: number | null
      comments: number | null
      views: number | null
    }>,
    startDate: Date
  ): Array<{ date: string; likes: number; comments: number; views: number }> {
    const dailyMap = new Map<string, { likes: number; comments: number; views: number }>()

    posts.forEach((post) => {
      if (!post.publishedAt) return

      const dateStr = post.publishedAt.toISOString().split('T')[0]
      const day = dailyMap.get(dateStr) || { likes: 0, comments: 0, views: 0 }

      day.likes += post.likes || 0
      day.comments += post.comments || 0
      day.views += post.views || 0

      dailyMap.set(dateStr, day)
    })

    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private processCostOverTime(
    events: Array<{ creditsUsed: number; createdAt: Date }>,
    startDate: Date
  ): Array<{ date: string; credits: number }> {
    const dailyMap = new Map<string, number>()

    events.forEach((event) => {
      const dateStr = event.createdAt.toISOString().split('T')[0]
      const current = dailyMap.get(dateStr) || 0
      dailyMap.set(dateStr, current + event.creditsUsed)
    })

    return Array.from(dailyMap.entries())
      .map(([date, credits]) => ({ date, credits }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }
}

export const analyticsService = AnalyticsService.getInstance()
