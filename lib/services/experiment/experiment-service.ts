import { prisma } from '@/lib/db'
import type {
  CreateExperimentParams,
  ExperimentWithVariants,
  ExperimentResult,
} from '@/lib/types/experiment'
import type { Experiment, ExperimentVariant } from '@prisma/client'

// ============================================
// EXPERIMENT SERVICE (Sprint 9)
// ============================================

export class ExperimentService {
  private static instance: ExperimentService

  private constructor() {}

  static getInstance(): ExperimentService {
    if (!ExperimentService.instance) {
      ExperimentService.instance = new ExperimentService()
    }
    return ExperimentService.instance
  }

  // ============================================
  // CREATE EXPERIMENT
  // ============================================

  /**
   * Creates a new A/B test experiment with variants
   */
  async createExperiment(userId: string, params: CreateExperimentParams): Promise<ExperimentWithVariants> {
    const { name, description, personaId, testVariable, variants } = params

    // Validate persona exists and belongs to user
    const persona = await prisma.persona.findFirst({
      where: { id: personaId, userId },
    })

    if (!persona) {
      throw new Error('Persona not found or unauthorized')
    }

    // Validate variants count (2-4)
    if (variants.length < 2 || variants.length > 4) {
      throw new Error('Experiment must have 2-4 variants')
    }

    // Create experiment with variants in a transaction
    const experiment = await prisma.experiment.create({
      data: {
        userId,
        name,
        description,
        personaId,
        testVariable,
        status: 'draft',
        variants: {
          create: variants.map((variant) => ({
            label: variant.label,
            config: variant.config,
            isWinner: false,
          })),
        },
      },
      include: {
        variants: true,
      },
    })

    return experiment
  }

  // ============================================
  // GENERATE VARIANTS
  // ============================================

  /**
   * Generates content for all variants (creates campaigns)
   */
  async generateVariants(userId: string, experimentId: string): Promise<ExperimentWithVariants> {
    const experiment = await this.getExperiment(userId, experimentId)

    if (experiment.status !== 'draft') {
      throw new Error(`Cannot generate variants for experiment with status: ${experiment.status}`)
    }

    // Update status to generating
    await prisma.experiment.update({
      where: { id: experimentId },
      data: { status: 'generating' },
    })

    // For each variant, create a campaign
    // Note: Actual campaign execution would be handled separately
    for (const variant of experiment.variants) {
      const config = variant.config as Record<string, unknown>

      try {
        // Create campaign based on variant config
        const campaign = await prisma.campaign.create({
          data: {
            userId,
            personaId: experiment.personaId,
            templateId: config.templateId as string || '',
            name: `${experiment.name} - ${variant.label}`,
            variables: config.variables as Record<string, unknown> || {},
            status: 'draft',
          },
        })

        // Link campaign to variant
        await prisma.experimentVariant.update({
          where: { id: variant.id },
          data: { campaignId: campaign.id },
        })
      } catch (error) {
        console.error(`[ExperimentService] Failed to create campaign for variant ${variant.id}:`, error)
      }
    }

    // Update status to active
    await prisma.experiment.update({
      where: { id: experimentId },
      data: { status: 'active' },
    })

    return await this.getExperiment(userId, experimentId)
  }

  // ============================================
  // UPDATE METRICS
  // ============================================

  /**
   * Updates engagement metrics for variants
   * Fetches from linked campaigns' published posts
   */
  async updateMetrics(userId: string, experimentId: string): Promise<ExperimentWithVariants> {
    const experiment = await this.getExperiment(userId, experimentId)

    for (const variant of experiment.variants) {
      if (!variant.campaignId) continue

      // Find published posts for this campaign
      const posts = await prisma.scheduledPost.findMany({
        where: {
          campaignId: variant.campaignId,
          status: 'published',
        },
      })

      if (posts.length === 0) continue

      // Aggregate metrics
      const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0)
      const totalComments = posts.reduce((sum, p) => sum + (p.comments || 0), 0)
      const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0)
      const totalShares = posts.reduce((sum, p) => sum + (p.shares || 0), 0)

      // Calculate average engagement rate
      const postsWithEngagement = posts.filter((p) => p.engagementRate !== null)
      const avgEngagementRate = postsWithEngagement.length > 0
        ? postsWithEngagement.reduce((sum, p) => sum + (p.engagementRate || 0), 0) / postsWithEngagement.length
        : null

      // Update variant metrics
      await prisma.experimentVariant.update({
        where: { id: variant.id },
        data: {
          likes: totalLikes,
          comments: totalComments,
          views: totalViews,
          shares: totalShares,
          engagementRate: avgEngagementRate,
        },
      })
    }

    return await this.getExperiment(userId, experimentId)
  }

  // ============================================
  // DECLARE WINNER
  // ============================================

  /**
   * Declares winner of A/B test
   * If variantId not provided, automatically selects based on engagement rate
   */
  async declareWinner(userId: string, experimentId: string, variantId?: string): Promise<Experiment> {
    const experiment = await this.getExperiment(userId, experimentId)

    if (experiment.status !== 'active') {
      throw new Error('Experiment must be active to declare winner')
    }

    let winnerId: string

    if (variantId) {
      // Manual winner selection
      const variant = experiment.variants.find((v) => v.id === variantId)
      if (!variant) {
        throw new Error('Variant not found')
      }
      winnerId = variantId
    } else {
      // Automatic winner selection (highest engagement rate)
      const variantsWithEngagement = experiment.variants.filter((v) => v.engagementRate !== null)

      if (variantsWithEngagement.length === 0) {
        throw new Error('No variants have engagement metrics yet')
      }

      const winner = variantsWithEngagement.reduce((best, current) => {
        return (current.engagementRate || 0) > (best.engagementRate || 0) ? current : best
      })

      winnerId = winner.id
    }

    // Update experiment and variants
    await prisma.$transaction([
      // Set winner flag on winning variant
      prisma.experimentVariant.update({
        where: { id: winnerId },
        data: { isWinner: true },
      }),

      // Clear winner flag on other variants
      prisma.experimentVariant.updateMany({
        where: {
          experimentId,
          id: { not: winnerId },
        },
        data: { isWinner: false },
      }),

      // Update experiment
      prisma.experiment.update({
        where: { id: experimentId },
        data: {
          winnerId,
          status: 'completed',
        },
      }),
    ])

    return await prisma.experiment.findUniqueOrThrow({
      where: { id: experimentId },
    })
  }

  // ============================================
  // GETTERS
  // ============================================

  /**
   * Gets experiment with variants
   */
  async getExperiment(userId: string, experimentId: string): Promise<ExperimentWithVariants> {
    const experiment = await prisma.experiment.findFirst({
      where: { id: experimentId, userId },
      include: {
        variants: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!experiment) {
      throw new Error('Experiment not found or unauthorized')
    }

    return experiment
  }

  /**
   * Lists experiments for user
   */
  async listExperiments(userId: string): Promise<ExperimentWithVariants[]> {
    const experiments = await prisma.experiment.findMany({
      where: { userId },
      include: {
        variants: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return experiments
  }

  /**
   * Gets experiment results summary
   */
  async getExperimentResults(userId: string, experimentId: string): Promise<ExperimentResult> {
    const experiment = await this.getExperiment(userId, experimentId)

    return {
      experimentId: experiment.id,
      winnerId: experiment.winnerId,
      variants: experiment.variants.map((v) => ({
        id: v.id,
        label: v.label,
        likes: v.likes || 0,
        comments: v.comments || 0,
        views: v.views || 0,
        engagementRate: v.engagementRate,
        isWinner: v.isWinner,
      })),
    }
  }

  /**
   * Deletes experiment
   */
  async deleteExperiment(userId: string, experimentId: string): Promise<void> {
    const experiment = await prisma.experiment.findFirst({
      where: { id: experimentId, userId },
    })

    if (!experiment) {
      throw new Error('Experiment not found or unauthorized')
    }

    await prisma.experiment.delete({
      where: { id: experimentId },
    })
  }
}

export const experimentService = ExperimentService.getInstance()
