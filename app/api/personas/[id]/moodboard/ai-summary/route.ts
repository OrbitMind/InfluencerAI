import { NextResponse } from 'next/server'
import { withCredits } from '@/lib/utils/billing-middleware'
import { MoodboardAiService } from '@/lib/services/moodboard/moodboard-ai.service'
import { ApiKeyService } from '@/lib/services/api-key/api-key.service'

const moodboardAiService = new MoodboardAiService()
const apiKeyService = new ApiKeyService()

export const POST = withCredits('image', async (req, { userId, params }) => {
  try {
    const personaId = (params as { id: string }).id

    const openaiKey = await apiKeyService.getApiKeyWithEnvFallback(userId, 'openai')
    if (!openaiKey) {
      return NextResponse.json(
        { success: false, error: 'API key do OpenAI não configurada. Configure em /dashboard/settings' },
        { status: 400 }
      )
    }

    const summary = await moodboardAiService.generateAndApplySummary(userId, personaId, openaiKey)

    return NextResponse.json({ success: true, data: { summary } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao gerar resumo visual'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})
