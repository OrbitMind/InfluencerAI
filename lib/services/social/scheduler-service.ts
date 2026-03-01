import { prisma } from '@/lib/db'
import { socialPublishService } from './social-publish-service'
import type {
  SchedulePostDTO,
  ScheduleFilters,
  PaginatedResult,
  ProcessResult,
  SuggestedTime,
} from '@/lib/types/social'
import type { ScheduledPost } from '@prisma/client'

// ============================================
// SCHEDULER SERVICE (Sprint 7)
// ============================================

export class SchedulerService {
  private static instance: SchedulerService

  private constructor() {}

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService()
    }
    return SchedulerService.instance
  }

  // ============================================
  // SCHEDULE POST
  // ============================================

  async schedulePost(userId: string, data: SchedulePostDTO): Promise<ScheduledPost> {
    // Validate scheduled time is in future
    if (data.scheduledFor <= new Date()) {
      throw new Error('Scheduled time must be in the future')
    }

    // Verify social account exists and belongs to user
    const account = await prisma.socialAccount.findFirst({
      where: {
        id: data.socialAccountId,
        userId,
      },
    })

    if (!account) {
      throw new Error('Social account not found or unauthorized')
    }

    if (!account.isActive) {
      throw new Error('Social account is disconnected. Please reconnect.')
    }

    // Validate media URL is accessible
    const isMediaValid = await socialPublishService.validateMediaUrl(data.mediaUrl)
    if (!isMediaValid) {
      throw new Error('Media URL is not accessible')
    }

    // Create scheduled post
    const post = await prisma.scheduledPost.create({
      data: {
        userId,
        socialAccountId: data.socialAccountId,
        campaignId: data.campaignId,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        caption: data.caption,
        hashtags: data.hashtags,
        scheduledFor: data.scheduledFor,
        status: 'scheduled',
      },
      include: {
        socialAccount: true,
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return post
  }

  // ============================================
  // CANCEL POST
  // ============================================

  async cancelPost(userId: string, postId: string): Promise<ScheduledPost> {
    // Verify post exists and belongs to user
    const post = await prisma.scheduledPost.findFirst({
      where: {
        id: postId,
        userId,
      },
    })

    if (!post) {
      throw new Error('Scheduled post not found or unauthorized')
    }

    if (post.status === 'published') {
      throw new Error('Cannot cancel a post that has already been published')
    }

    if (post.status === 'publishing') {
      throw new Error('Cannot cancel a post that is currently being published')
    }

    // Update status to canceled
    const updated = await prisma.scheduledPost.update({
      where: { id: postId },
      data: { status: 'canceled' },
    })

    return updated
  }

  // ============================================
  // RESCHEDULE POST
  // ============================================

  async reschedulePost(userId: string, postId: string, newDate: Date): Promise<ScheduledPost> {
    // Validate new date is in future
    if (newDate <= new Date()) {
      throw new Error('New scheduled time must be in the future')
    }

    // Verify post exists and belongs to user
    const post = await prisma.scheduledPost.findFirst({
      where: {
        id: postId,
        userId,
      },
    })

    if (!post) {
      throw new Error('Scheduled post not found or unauthorized')
    }

    if (post.status === 'published') {
      throw new Error('Cannot reschedule a post that has already been published')
    }

    if (post.status === 'publishing') {
      throw new Error('Cannot reschedule a post that is currently being published')
    }

    // Update scheduled time and reset status to scheduled
    const updated = await prisma.scheduledPost.update({
      where: { id: postId },
      data: {
        scheduledFor: newDate,
        status: 'scheduled',
        errorMessage: null, // Clear any previous errors
      },
    })

    return updated
  }

  // ============================================
  // LIST SCHEDULED POSTS
  // ============================================

  async listScheduled(
    userId: string,
    filters?: ScheduleFilters
  ): Promise<PaginatedResult<ScheduledPost>> {
    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const skip = (page - 1) * limit

    const where: any = { userId }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.platform) {
      where.socialAccount = {
        platform: filters.platform,
      }
    }

    const [posts, total] = await Promise.all([
      prisma.scheduledPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledFor: 'asc' },
        include: {
          socialAccount: true,
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.scheduledPost.count({ where }),
    ])

    return {
      data: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  // ============================================
  // PROCESS SCHEDULED POSTS (CRON)
  // ============================================

  async processScheduledPosts(): Promise<ProcessResult> {
    const now = new Date()

    // Find posts ready to publish
    const postsToPublish = await prisma.scheduledPost.findMany({
      where: {
        status: 'scheduled',
        scheduledFor: {
          lte: now,
        },
      },
      include: {
        socialAccount: true,
      },
      take: 50, // Process max 50 per cron run
    })

    const result: ProcessResult = {
      processed: postsToPublish.length,
      published: 0,
      failed: 0,
      errors: [],
    }

    // Process each post
    for (const post of postsToPublish) {
      try {
        // Update status to publishing (idempotency - prevents double publishing)
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: { status: 'publishing' },
        })

        // Publish via SocialPublishService
        const publishResult = await socialPublishService.publishNow({
          socialAccountId: post.socialAccountId,
          mediaUrl: post.mediaUrl,
          mediaType: post.mediaType as 'image' | 'video' | 'carousel',
          caption: post.caption || undefined,
          hashtags: post.hashtags || undefined,
        })

        // Update post with success
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: 'published',
            publishedAt: new Date(),
            platformPostId: publishResult.platformPostId,
            platformPostUrl: publishResult.platformPostUrl,
          },
        })

        result.published++
      } catch (error: unknown) {
        // Update post with failure
        const message = error instanceof Error ? error.message : 'Unknown error'
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: 'failed',
            errorMessage: message,
          },
        })

        result.failed++
        result.errors?.push({
          postId: post.id,
          error: message,
        })
      }
    }

    return result
  }

  // ============================================
  // SUGGESTED POSTING TIMES
  // ============================================

  getSuggestedTimes(platform: string): SuggestedTime[] {
    // Generic best posting times based on platform research
    const suggestions: Record<string, SuggestedTime[]> = {
      instagram: [
        {
          dayOfWeek: 'Segunda',
          time: '11:00',
          engagementLevel: 'high',
          description: 'Início do almoço',
        },
        {
          dayOfWeek: 'Terça',
          time: '11:00',
          engagementLevel: 'high',
          description: 'Início do almoço',
        },
        {
          dayOfWeek: 'Quarta',
          time: '11:00',
          engagementLevel: 'high',
          description: 'Início do almoço',
        },
        {
          dayOfWeek: 'Quinta',
          time: '11:00',
          engagementLevel: 'high',
          description: 'Início do almoço',
        },
        {
          dayOfWeek: 'Sexta',
          time: '10:00',
          engagementLevel: 'high',
          description: 'Final da semana',
        },
        {
          dayOfWeek: 'Sábado',
          time: '11:00',
          engagementLevel: 'medium',
          description: 'Fim de semana',
        },
        {
          dayOfWeek: 'Domingo',
          time: '19:00',
          engagementLevel: 'medium',
          description: 'Noite de domingo',
        },
      ],
      tiktok: [
        { dayOfWeek: 'Segunda', time: '06:00', engagementLevel: 'high', description: 'Manhã cedo' },
        { dayOfWeek: 'Segunda', time: '10:00', engagementLevel: 'medium', description: 'Meio da manhã' },
        { dayOfWeek: 'Segunda', time: '22:00', engagementLevel: 'high', description: 'Noite' },
        { dayOfWeek: 'Terça', time: '02:00', engagementLevel: 'high', description: 'Madrugada' },
        { dayOfWeek: 'Terça', time: '04:00', engagementLevel: 'medium', description: 'Madrugada tardia' },
        { dayOfWeek: 'Terça', time: '09:00', engagementLevel: 'high', description: 'Início do dia' },
        { dayOfWeek: 'Quarta', time: '07:00', engagementLevel: 'high', description: 'Manhã' },
        { dayOfWeek: 'Quarta', time: '08:00', engagementLevel: 'medium', description: 'Manhã' },
        { dayOfWeek: 'Quarta', time: '23:00', engagementLevel: 'high', description: 'Noite tardia' },
        { dayOfWeek: 'Quinta', time: '09:00', engagementLevel: 'high', description: 'Manhã' },
        { dayOfWeek: 'Quinta', time: '12:00', engagementLevel: 'high', description: 'Almoço' },
        { dayOfWeek: 'Quinta', time: '19:00', engagementLevel: 'high', description: 'Noite' },
        { dayOfWeek: 'Sexta', time: '05:00', engagementLevel: 'high', description: 'Madrugada' },
        { dayOfWeek: 'Sexta', time: '13:00', engagementLevel: 'medium', description: 'Tarde' },
        { dayOfWeek: 'Sexta', time: '15:00', engagementLevel: 'high', description: 'Tarde' },
        { dayOfWeek: 'Sábado', time: '11:00', engagementLevel: 'high', description: 'Fim de semana' },
        { dayOfWeek: 'Sábado', time: '19:00', engagementLevel: 'medium', description: 'Sábado à noite' },
        { dayOfWeek: 'Sábado', time: '20:00', engagementLevel: 'high', description: 'Sábado à noite' },
        { dayOfWeek: 'Domingo', time: '07:00', engagementLevel: 'medium', description: 'Manhã de domingo' },
        { dayOfWeek: 'Domingo', time: '08:00', engagementLevel: 'high', description: 'Manhã de domingo' },
        { dayOfWeek: 'Domingo', time: '16:00', engagementLevel: 'high', description: 'Tarde de domingo' },
      ],
      youtube: [
        { dayOfWeek: 'Segunda', time: '14:00', engagementLevel: 'high', description: 'Tarde' },
        { dayOfWeek: 'Segunda', time: '15:00', engagementLevel: 'high', description: 'Tarde' },
        { dayOfWeek: 'Segunda', time: '16:00', engagementLevel: 'high', description: 'Final da tarde' },
        { dayOfWeek: 'Terça', time: '14:00', engagementLevel: 'high', description: 'Tarde' },
        { dayOfWeek: 'Terça', time: '15:00', engagementLevel: 'high', description: 'Tarde' },
        { dayOfWeek: 'Terça', time: '16:00', engagementLevel: 'high', description: 'Final da tarde' },
        { dayOfWeek: 'Quarta', time: '14:00', engagementLevel: 'high', description: 'Tarde' },
        { dayOfWeek: 'Quarta', time: '15:00', engagementLevel: 'high', description: 'Tarde' },
        { dayOfWeek: 'Quarta', time: '16:00', engagementLevel: 'high', description: 'Final da tarde' },
        { dayOfWeek: 'Quinta', time: '12:00', engagementLevel: 'high', description: 'Almoço' },
        { dayOfWeek: 'Quinta', time: '14:00', engagementLevel: 'high', description: 'Tarde' },
        { dayOfWeek: 'Quinta', time: '15:00', engagementLevel: 'high', description: 'Tarde' },
        { dayOfWeek: 'Sexta', time: '12:00', engagementLevel: 'high', description: 'Almoço' },
        { dayOfWeek: 'Sexta', time: '14:00', engagementLevel: 'high', description: 'Tarde' },
        { dayOfWeek: 'Sexta', time: '15:00', engagementLevel: 'high', description: 'Tarde' },
        { dayOfWeek: 'Sábado', time: '09:00', engagementLevel: 'high', description: 'Manhã de sábado' },
        { dayOfWeek: 'Sábado', time: '10:00', engagementLevel: 'high', description: 'Manhã de sábado' },
        { dayOfWeek: 'Sábado', time: '11:00', engagementLevel: 'high', description: 'Fim de semana' },
        { dayOfWeek: 'Domingo', time: '09:00', engagementLevel: 'high', description: 'Manhã de domingo' },
        { dayOfWeek: 'Domingo', time: '10:00', engagementLevel: 'high', description: 'Manhã de domingo' },
        { dayOfWeek: 'Domingo', time: '11:00', engagementLevel: 'high', description: 'Domingo' },
      ],
    }

    return suggestions[platform] || []
  }

  // ============================================
  // STATISTICS
  // ============================================

  async getStats(userId: string): Promise<{
    scheduled: number
    published: number
    failed: number
  }> {
    const [scheduled, published, failed] = await Promise.all([
      prisma.scheduledPost.count({
        where: { userId, status: 'scheduled' },
      }),
      prisma.scheduledPost.count({
        where: { userId, status: 'published' },
      }),
      prisma.scheduledPost.count({
        where: { userId, status: 'failed' },
      }),
    ])

    return { scheduled, published, failed }
  }
}

export const schedulerService = SchedulerService.getInstance()
