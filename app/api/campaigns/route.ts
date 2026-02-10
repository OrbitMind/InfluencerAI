import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CampaignService } from '@/lib/services/campaign/campaign.service';
import { withAuth } from '@/lib/utils/auth';
import { createCampaignSchema, campaignFiltersSchema } from '@/lib/validations/campaign';

const campaignService = new CampaignService();

export const POST = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json();
    const validated = createCampaignSchema.parse(body);

    const campaign = await campaignService.createCampaign(userId, validated);

    return NextResponse.json({ success: true, data: campaign }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Erro ao criar campanha';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});

export const GET = withAuth(async (req, { userId }) => {
  try {
    const { searchParams } = new URL(req.url);
    const params: Record<string, unknown> = {};

    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }

    const filters = campaignFiltersSchema.parse(params);
    const result = await campaignService.listCampaigns(userId, filters);

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Erro ao listar campanhas';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
