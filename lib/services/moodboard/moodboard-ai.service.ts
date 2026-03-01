import { MoodboardRepository } from '@/lib/repositories/moodboard.repository'
import { prisma } from '@/lib/db'

/**
 * MoodboardAiService (SRP)
 * Responsabilidade única: gerar AI summary visual do moodboard usando OpenAI
 * e atualizar o basePrompt da persona com o resultado.
 */
export class MoodboardAiService {
  private repository = new MoodboardRepository()

  async generateAndApplySummary(
    userId: string,
    personaId: string,
    openaiKey: string
  ): Promise<string> {
    const moodboard = await this.repository.findByPersonaId(personaId)

    if (!moodboard || moodboard.items.length === 0) {
      throw new Error('Moodboard vazio — adicione imagens antes de gerar o resumo')
    }

    const imageUrls = moodboard.items.map((item) => item.imageUrl)
    const styleTags = moodboard.styleTags.join(', ')
    const colorPalette = Array.isArray(moodboard.colorPalette)
      ? (moodboard.colorPalette as string[]).join(', ')
      : ''

    const systemPrompt = `You are a creative director and AI prompt engineer. Analyze the provided reference images and visual style information to create a concise, detailed visual identity summary for an AI influencer.
Focus on: lighting style, color grading, composition, mood, clothing aesthetic, and overall visual vibe.
Output a single paragraph of 2-3 sentences that can be appended to an AI image generation prompt to ensure visual consistency.
Be specific about visual attributes. Do not mention the word "moodboard". Write in English.`

    const userContent: Array<{type: string; text?: string; image_url?: {url: string}}> = [
      {
        type: 'text',
        text: `Style tags: ${styleTags || 'none'}. Color palette: ${colorPalette || 'not defined'}. Analyze these ${imageUrls.length} reference image(s) and create a visual identity summary.`,
      },
      ...imageUrls.slice(0, 6).map((url) => ({
        type: 'image_url',
        image_url: { url },
      })),
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: 300,
        temperature: 0.6,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Erro ao gerar resumo com OpenAI Vision')
    }

    const data = await response.json()
    const summary: string = data.choices[0]?.message?.content?.trim() || ''

    if (!summary) throw new Error('OpenAI retornou resposta vazia')

    await this.repository.updateAiSummary(personaId, summary)

    await prisma.persona.update({
      where: { id: personaId },
      data: {
        basePrompt: {
          set: await this.buildEnhancedBasePrompt(personaId, summary),
        },
      },
    })

    return summary
  }

  private async buildEnhancedBasePrompt(personaId: string, summary: string): Promise<string> {
    const persona = await prisma.persona.findUnique({ where: { id: personaId } })
    if (!persona) return summary

    const parts: string[] = []
    if (persona.basePrompt) parts.push(persona.basePrompt)
    parts.push(`Visual style: ${summary}`)
    return parts.join('. ')
  }
}
