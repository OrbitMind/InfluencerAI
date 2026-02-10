import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CampaignService } from '@/lib/services/campaign/campaign.service';
import { withAuth } from '@/lib/utils/auth';
import { executeCampaignSchema } from '@/lib/validations/campaign';

const campaignService = new CampaignService();

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const id = parts[parts.length - 2]; // /api/campaigns/[id]/execute

    const body = await req.json().catch(() => ({}));
    const validated = executeCampaignSchema.parse(body);

    const campaign = await campaignService.executeCampaign(userId, id, validated);

    return NextResponse.json({ success: true, data: campaign });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Erro ao executar campanha';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
