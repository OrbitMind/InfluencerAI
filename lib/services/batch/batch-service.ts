import { prisma } from '@/lib/db'
import type { BatchJob } from '@prisma/client'
import type {
  CampaignBatchParams,
  VariationBatchParams,
  BatchJobWithProgress,
  BatchJobStatus,
} from '@/lib/types/batch'
import { CreditService } from '@/lib/services/billing/credit.service'
import { CREDIT_COSTS } from '@/lib/types/billing'

// ============================================
// BATCH SERVICE (Sprint 9)
// ============================================

export class BatchService {
  private static instance: BatchService
  private creditService: CreditService

  private constructor() {
    this.creditService = new CreditService()
  }

  static getInstance(): BatchService {
    if (!BatchService.instance) {
      BatchService.instance = new BatchService()
    }
    return BatchService.instance
  }

  // ============================================
  // CREATE BATCH JOBS
  // ============================================

  /**
   * Creates a campaign batch job
   * Generates multiple campaigns for a persona using a template
   */
  async createCampaignBatch(params: CampaignBatchParams): Promise<BatchJob> {
    const { userId, personaId, templateId, items } = params

    // Validate persona and template exist
    const [persona, template] = await Promise.all([
      prisma.persona.findFirst({
        where: { id: personaId, userId },
      }),
      prisma.campaignTemplate.findUnique({
        where: { id: templateId },
      }),
    ])

    if (!persona) {
      throw new Error('Persona not found or unauthorized')
    }

    if (!template) {
      throw new Error('Template not found')
    }

    // Estimate credits needed
    const estimatedCredits = this.estimateCampaignCredits(items.length, template)

    // Check if user has enough credits
    const balance = await this.creditService.getBalance(userId)
    if (balance < estimatedCredits) {
      throw new Error(`Insufficient credits. Need ${estimatedCredits}, have ${balance}`)
    }

    // Create batch job
    const batchJob = await prisma.batchJob.create({
      data: {
        userId,
        type: 'campaign_batch',
        status: 'queued',
        config: {
          personaId,
          templateId,
          items,
        },
        totalItems: items.length,
        completedItems: 0,
        failedItems: 0,
        estimatedTime: this.estimateTime(items.length, true, false),
      },
    })

    return batchJob
  }

  /**
   * Creates a variation batch for A/B testing
   */
  async createVariationBatch(params: VariationBatchParams): Promise<BatchJob> {
    const { userId, personaId, templateId, baseVariables, variations } = params

    // Validate persona and template
    const [persona, template] = await Promise.all([
      prisma.persona.findFirst({
        where: { id: personaId, userId },
      }),
      prisma.campaignTemplate.findUnique({
        where: { id: templateId },
      }),
    ])

    if (!persona) {
      throw new Error('Persona not found or unauthorized')
    }

    if (!template) {
      throw new Error('Template not found')
    }

    // Estimate credits
    const estimatedCredits = this.estimateCampaignCredits(variations.length, template)

    const balance = await this.creditService.getBalance(userId)
    if (balance < estimatedCredits) {
      throw new Error(`Insufficient credits. Need ${estimatedCredits}, have ${balance}`)
    }

    // Create batch job
    const batchJob = await prisma.batchJob.create({
      data: {
        userId,
        type: 'variation_batch',
        status: 'queued',
        config: {
          personaId,
          templateId,
          baseVariables,
          variations,
        },
        totalItems: variations.length,
        completedItems: 0,
        failedItems: 0,
        estimatedTime: this.estimateTime(variations.length, true, false),
      },
    })

    return batchJob
  }

  // ============================================
  // EXECUTE BATCH
  // ============================================

  /**
   * Executes a batch job (processes all items)
   * This is a long-running operation - should be called asynchronously
   */
  async executeBatch(batchId: string): Promise<BatchJob> {
    const batchJob = await prisma.batchJob.findUnique({
      where: { id: batchId },
    })

    if (!batchJob) {
      throw new Error('Batch job not found')
    }

    if (batchJob.status !== 'queued') {
      throw new Error(`Cannot execute batch with status: ${batchJob.status}`)
    }

    // Update status to running
    await this.updateBatchStatus(batchId, 'running', { startedAt: new Date() })

    const config = batchJob.config as Record<string, unknown>
    const results: unknown[] = []
    const errors: Array<{ index: number; error: string }> = []

    try {
      switch (batchJob.type) {
        case 'campaign_batch':
          await this.executeCampaignBatch(batchJob, results, errors)
          break

        case 'variation_batch':
          await this.executeVariationBatch(batchJob, results, errors)
          break

        default:
          throw new Error(`Unknown batch type: ${batchJob.type}`)
      }

      // Update final status
      const finalStatus: BatchJobStatus = errors.length === batchJob.totalItems ? 'failed' : 'completed'

      return await prisma.batchJob.update({
        where: { id: batchId },
        data: {
          status: finalStatus,
          results,
          errorLog: errors,
          completedAt: new Date(),
        },
      })
    } catch (error) {
      // Mark as failed
      await this.updateBatchStatus(batchId, 'failed', {
        errorLog: [{ error: (error as Error).message }],
        completedAt: new Date(),
      })

      throw error
    }
  }

  /**
   * Executes campaign batch (creates and runs campaigns)
   */
  private async executeCampaignBatch(
    batchJob: BatchJob,
    results: unknown[],
    errors: Array<{ index: number; error: string }>
  ): Promise<void> {
    const config = batchJob.config as {
      personaId: string
      templateId: string
      items: Array<{ name: string; variables: Record<string, string> }>
    }

    for (let i = 0; i < config.items.length; i++) {
      const item = config.items[i]

      try {
        // Create campaign
        const campaign = await prisma.campaign.create({
          data: {
            userId: batchJob.userId,
            personaId: config.personaId,
            templateId: config.templateId,
            name: item.name,
            variables: item.variables,
            status: 'draft',
          },
        })

        results.push({ index: i, campaignId: campaign.id, success: true })

        // Update progress
        await this.incrementProgress(batchJob.id)

        // Note: Actual campaign execution would be triggered separately
        // to avoid blocking. This just creates the campaigns.

        // Rate limiting: 2s delay between items
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        errors.push({ index: i, error: (error as Error).message })
        await this.incrementFailures(batchJob.id)
      }
    }
  }

  /**
   * Executes variation batch (creates campaigns for A/B testing)
   */
  private async executeVariationBatch(
    batchJob: BatchJob,
    results: unknown[],
    errors: Array<{ index: number; error: string }>
  ): Promise<void> {
    const config = batchJob.config as {
      personaId: string
      templateId: string
      baseVariables: Record<string, string>
      variations: Array<{ label: string; variableOverrides: Record<string, string> }>
    }

    for (let i = 0; i < config.variations.length; i++) {
      const variation = config.variations[i]

      try {
        // Merge base variables with overrides
        const variables = { ...config.baseVariables, ...variation.variableOverrides }

        // Create campaign
        const campaign = await prisma.campaign.create({
          data: {
            userId: batchJob.userId,
            personaId: config.personaId,
            templateId: config.templateId,
            name: `Variation: ${variation.label}`,
            variables,
            status: 'draft',
          },
        })

        results.push({ index: i, label: variation.label, campaignId: campaign.id, success: true })

        await this.incrementProgress(batchJob.id)

        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        errors.push({ index: i, error: (error as Error).message })
        await this.incrementFailures(batchJob.id)
      }
    }
  }

  // ============================================
  // BATCH MANAGEMENT
  // ============================================

  /**
   * Cancels a batch job
   */
  async cancelBatch(userId: string, batchId: string): Promise<BatchJob> {
    const batchJob = await prisma.batchJob.findFirst({
      where: { id: batchId, userId },
    })

    if (!batchJob) {
      throw new Error('Batch job not found or unauthorized')
    }

    if (batchJob.status === 'completed' || batchJob.status === 'failed') {
      throw new Error('Cannot cancel a completed or failed batch')
    }

    return await prisma.batchJob.update({
      where: { id: batchId },
      data: {
        status: 'canceled',
        completedAt: new Date(),
      },
    })
  }

  /**
   * Gets batch job status
   */
  async getBatchStatus(userId: string, batchId: string): Promise<BatchJobWithProgress> {
    const batchJob = await prisma.batchJob.findFirst({
      where: { id: batchId, userId },
    })

    if (!batchJob) {
      throw new Error('Batch job not found or unauthorized')
    }

    const progressPercentage = batchJob.totalItems > 0
      ? Math.round((batchJob.completedItems / batchJob.totalItems) * 100)
      : 0

    return {
      ...batchJob,
      progressPercentage,
    }
  }

  /**
   * Lists batch jobs for user
   */
  async listBatches(userId: string): Promise<BatchJobWithProgress[]> {
    const batchJobs = await prisma.batchJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return batchJobs.map((job) => ({
      ...job,
      progressPercentage: job.totalItems > 0
        ? Math.round((job.completedItems / job.totalItems) * 100)
        : 0,
    }))
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Estimates credits needed for campaigns
   */
  private estimateCampaignCredits(itemCount: number, template: { defaultImageModel?: string | null }): number {
    // Base: image + video + audio
    let creditsPerItem = CREDIT_COSTS.image + CREDIT_COSTS.video + CREDIT_COSTS.audio

    // Add lip-sync if template uses it (simplified estimation)
    if (template.defaultImageModel?.includes('lip')) {
      creditsPerItem += CREDIT_COSTS['lip-sync']
    }

    return itemCount * creditsPerItem
  }

  /**
   * Estimates execution time
   */
  estimateTime(itemCount: number, hasNarration: boolean, hasLipSync: boolean): number {
    let timePerItem = 30 // Base: 30s for image
    timePerItem += 60 // +60s for video
    if (hasNarration) timePerItem += 15 // +15s for audio
    if (hasLipSync) timePerItem += 90 // +90s for lip sync
    timePerItem += 2 // +2s delay between items

    return itemCount * timePerItem
  }

  /**
   * Updates batch status
   */
  private async updateBatchStatus(
    batchId: string,
    status: BatchJobStatus,
    data?: Record<string, unknown>
  ): Promise<void> {
    await prisma.batchJob.update({
      where: { id: batchId },
      data: { status, ...data },
    })
  }

  /**
   * Increments completed items
   */
  private async incrementProgress(batchId: string): Promise<void> {
    await prisma.batchJob.update({
      where: { id: batchId },
      data: { completedItems: { increment: 1 } },
    })
  }

  /**
   * Increments failed items
   */
  private async incrementFailures(batchId: string): Promise<void> {
    await prisma.batchJob.update({
      where: { id: batchId },
      data: { failedItems: { increment: 1 } },
    })
  }
}

export const batchService = BatchService.getInstance()
