import { NextResponse } from 'next/server';
import { ApiKeyService } from '@/lib/services/api-key/api-key.service';
import { VoiceService } from '@/lib/services/voice/voice.service';
import { withAuth } from '@/lib/utils/auth';

const apiKeyService = new ApiKeyService();
const voiceService = VoiceService.getInstance();

export const GET = withAuth(async (req, { userId }) => {
  try {
    const elevenLabsKey = await apiKeyService.getApiKeyWithEnvFallback(userId, 'elevenlabs');
    if (!elevenLabsKey) {
      return NextResponse.json(
        { success: false, error: 'API key do ElevenLabs não configurada. Configure em Configurações.' },
        { status: 400 }
      );
    }

    const voices = await voiceService.listVoices(elevenLabsKey);

    return NextResponse.json({ success: true, data: { voices } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Falha ao listar vozes';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
