import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiKeyService } from '@/lib/services/api-key/api-key.service';
import { VoiceService } from '@/lib/services/voice/voice.service';
import { PersonaService } from '@/lib/services/persona-service';
import { withAuth } from '@/lib/utils/auth';
import { DEFAULT_VOICE_SETTINGS } from '@/lib/types/voice';

const apiKeyService = new ApiKeyService();
const voiceService = VoiceService.getInstance();
const personaService = new PersonaService();

export const POST = withAuth(async (req, { userId }) => {
  try {
    const formData = await req.formData();

    const personaId = formData.get('personaId') as string;
    const name = formData.get('name') as string;
    const description = (formData.get('description') as string) || '';

    if (!personaId || !name) {
      return NextResponse.json(
        { success: false, error: 'personaId e name são obrigatórios' },
        { status: 400 }
      );
    }

    // Validate persona ownership
    await personaService.getPersona(userId, personaId);

    const elevenLabsKey = await apiKeyService.getApiKeyWithEnvFallback(userId, 'elevenlabs');
    if (!elevenLabsKey) {
      return NextResponse.json(
        { success: false, error: 'API key do ElevenLabs não configurada' },
        { status: 400 }
      );
    }

    const files = formData.getAll('files') as File[];
    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pelo menos uma amostra de áudio é necessária' },
        { status: 400 }
      );
    }

    const buffers: Buffer[] = [];
    const fileNames: string[] = [];
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      buffers.push(Buffer.from(arrayBuffer));
      fileNames.push(file.name);
    }

    const voice = await voiceService.cloneVoice(elevenLabsKey, name, description, buffers, fileNames);

    // Auto-assign cloned voice to persona
    await personaService.setVoice(userId, personaId, {
      voiceProvider: 'elevenlabs',
      voiceId: voice.voice_id,
      voiceName: voice.name,
      voicePreviewUrl: voice.preview_url,
      voiceSettings: DEFAULT_VOICE_SETTINGS,
    });

    return NextResponse.json({ success: true, data: { voice } }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Falha ao clonar voz';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
