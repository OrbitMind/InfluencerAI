import { NextRequest, NextResponse } from 'next/server';
import { CampaignService } from '@/lib/services/campaign/campaign.service';
import { SubtitleEngine } from '@/lib/services/subtitle/subtitle-engine';
import { withAuth } from '@/lib/utils/auth';
import type { CaptionSegment, CaptionStyle, SubtitleData } from '@/lib/types/caption';

const campaignService = new CampaignService();
const subtitleEngine = SubtitleEngine.getInstance();

function extractCampaignId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/');
  // /api/campaigns/[id]/subtitles → id is at index -2
  return parts[parts.length - 2];
}

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const campaignId = extractCampaignId(req);
    const format = req.nextUrl.searchParams.get('format') || 'srt';

    const campaign = await campaignService.getCampaign(userId, campaignId);

    if (!campaign.subtitleData) {
      return NextResponse.json(
        { success: false, error: 'Legendas não geradas para esta campanha' },
        { status: 404 }
      );
    }

    const data = campaign.subtitleData as unknown as SubtitleData;
    const segments: CaptionSegment[] = data.segments;

    let content: string;
    let filename: string;

    if (format === 'ass') {
      const style = subtitleEngine.resolveStyle(
        campaign.captionPresetId || undefined,
        (campaign.captionCustomStyle as Partial<CaptionStyle>) || undefined
      );
      content = subtitleEngine.generateASS(segments, style);
      filename = `campaign-${campaignId}.ass`;
    } else {
      content = subtitleEngine.generateSRT(segments);
      filename = `campaign-${campaignId}.srt`;
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao gerar legendas';
    const status = message.includes('não encontrada') ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
});
