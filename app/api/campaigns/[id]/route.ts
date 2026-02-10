import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CampaignService } from '@/lib/services/campaign/campaign.service';
import { withAuth } from '@/lib/utils/auth';
import { updateCampaignSchema } from '@/lib/validations/campaign';

const campaignService = new CampaignService();

function extractId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/');
  return parts[parts.length - 1];
}

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const id = extractId(req);
    const campaign = await campaignService.getCampaign(userId, id);

    return NextResponse.json({ success: true, data: campaign });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar campanha';
    const status = message.includes('não encontrada') ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
});

export const PATCH = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const id = extractId(req);
    const body = await req.json();
    const validated = updateCampaignSchema.parse(body);

    const campaign = await campaignService.updateCampaign(userId, id, validated);

    return NextResponse.json({ success: true, data: campaign });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Erro ao atualizar campanha';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const id = extractId(req);
    await campaignService.deleteCampaign(userId, id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao deletar campanha';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
