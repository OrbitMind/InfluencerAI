import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth'
import { batchService } from '@/lib/services/batch/batch-service'
import type { CampaignBatchParams, VariationBatchParams } from '@/lib/types/batch'

// POST /api/batch
// Creates a new batch job
async function postHandler(req: NextRequest, context: { userId: string }): Promise<NextResponse> {
  try {
    const body = await req.json()
    const { type, ...params } = body

    if (!type) {
      return NextResponse.json({ error: 'Batch type is required' }, { status: 400 })
    }

    let batchJob

    switch (type) {
      case 'campaign_batch': {
        const campaignParams: CampaignBatchParams = {
          userId: context.userId,
          ...params,
        }

        if (!campaignParams.personaId || !campaignParams.templateId || !campaignParams.items) {
          return NextResponse.json(
            { error: 'Missing required fields: personaId, templateId, items' },
            { status: 400 }
          )
        }

        batchJob = await batchService.createCampaignBatch(campaignParams)
        break
      }

      case 'variation_batch': {
        const variationParams: VariationBatchParams = {
          userId: context.userId,
          ...params,
        }

        if (!variationParams.personaId || !variationParams.templateId || !variationParams.variations) {
          return NextResponse.json(
            { error: 'Missing required fields: personaId, templateId, baseVariables, variations' },
            { status: 400 }
          )
        }

        batchJob = await batchService.createVariationBatch(variationParams)
        break
      }

      default:
        return NextResponse.json({ error: 'Invalid batch type' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      batchJob,
    })
  } catch (error) {
    console.error('[Batch Create Error]:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create batch job' },
      { status: 500 }
    )
  }
}

// GET /api/batch
// Lists batch jobs for user
async function getHandler(req: NextRequest, context: { userId: string }): Promise<NextResponse> {
  try {
    const batchJobs = await batchService.listBatches(context.userId)

    return NextResponse.json({
      success: true,
      batchJobs,
    })
  } catch (error) {
    console.error('[Batch List Error]:', error)
    return NextResponse.json(
      { error: 'Failed to list batch jobs' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(postHandler)
export const GET = withAuth(getHandler)
