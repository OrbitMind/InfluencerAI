import { NextRequest, NextResponse } from 'next/server';
import { CampaignService } from '@/lib/services/campaign/campaign.service';
import { withAuth } from '@/lib/utils/auth';

const campaignService = new CampaignService();

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const id = parts[parts.length - 2]; // /api/campaigns/[id]/duplicate

    const campaign = await campaignService.duplicateCampaign(userId, id);

    return NextResponse.json({ success: true, data: campaign }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao duplicar campanha';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
