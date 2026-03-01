import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiKeyService } from '@/lib/services/api-key/api-key.service';
import { PersonaService } from '@/lib/services/persona-service';
import { VoiceService } from '@/lib/services/voice/voice.service';
import { withAuth } from '@/lib/utils/auth';
import { generateSpeechSchema } from '@/lib/validations/voice';
import type { VoiceSettings } from '@/lib/types/voice';
import type { Prisma } from '@prisma/client';

const apiKeyService = new ApiKeyService();
const personaService = new PersonaService();
const voiceService = VoiceService.getInstance();

export const POST = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json();
    const validated = generateSpeechSchema.parse(body);

    const persona = await personaService.getPersona(userId, validated.personaId);
    if (!persona.voiceId) {
      return NextResponse.json(
        { success: false, error: 'Persona não tem voz configurada' },
        { status: 400 }
      );
    }

    const elevenLabsKey = await apiKeyService.getApiKeyWithEnvFallback(userId, 'elevenlabs');
    if (!elevenLabsKey) {
      return NextResponse.json(
        { success: false, error: 'API key do ElevenLabs não configurada' },
        { status: 400 }
      );
    }

    const savedSettings = (persona.voiceSettings as Record<string, unknown>) || {};
    const voiceSettings: VoiceSettings = {
      stability: (validated.voiceSettings?.stability ?? savedSettings.stability ?? 0.5) as number,
      similarity_boost: (validated.voiceSettings?.similarity_boost ?? savedSettings.similarity_boost ?? 0.75) as number,
      style: (validated.voiceSettings?.style ?? savedSettings.style ?? 0.0) as number,
      use_speaker_boost: (validated.voiceSettings?.use_speaker_boost ?? savedSettings.use_speaker_boost ?? true) as boolean,
    };

    const result = await voiceService.generateSpeech(elevenLabsKey, userId, {
      voiceId: persona.voiceId,
      text: validated.text,
      voiceSettings,
    });

    // Save as persona asset
    await personaService.addAsset(userId, validated.personaId, {
      type: 'generated_audio',
      url: result.audioUrl,
      publicId: result.publicId,
      metadata: {
        voiceId: persona.voiceId,
        text: validated.text,
      } as unknown as Prisma.InputJsonValue,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Falha ao gerar áudio';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
