import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiKeyService } from '@/lib/services/api-key/api-key.service';
import { FaceConsistencyService } from '@/lib/services/face-consistency/face-consistency.service';
import { withAuth } from '@/lib/utils/auth';
import { consistentImageSchema } from '@/lib/validations/face-consistency';

const apiKeyService = new ApiKeyService();
const faceConsistencyService = FaceConsistencyService.getInstance();

export const POST = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json();
    const validated = consistentImageSchema.parse(body);

    const replicateKey = await apiKeyService.getApiKey(userId, 'replicate');
    if (!replicateKey) {
      return NextResponse.json(
        { success: false, error: 'API key do Replicate não configurada' },
        { status: 400 }
      );
    }

    const result = await faceConsistencyService.generateConsistentImage(
      replicateKey,
      userId,
      {
        ...validated,
        strength: validated.strength ?? 0.8,
        strategy: validated.strategy ?? 'pulid',
      }
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Falha ao gerar imagem consistente';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
