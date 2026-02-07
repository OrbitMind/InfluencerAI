import { getSystemPrompt } from '@/lib/utils/promptUtils'
import type { IPromptRefinerService, PromptRefinerConfig } from '../interfaces/IPromptRefinerService'

/**
 * Implementação de refinamento de prompts usando Google Gemini
 * Princípio: Single Responsibility Principle (SRP) + Strategy Pattern
 * Responsabilidade: refinar prompts usando API Google Gemini
 */
export class GooglePromptRefiner implements IPromptRefinerService {
  constructor(private config: PromptRefinerConfig) {}

  async refine(prompt: string, type: 'image' | 'video'): Promise<string> {
    const systemPrompt = getSystemPrompt(type)
    const modelName = this.config.model || 'gemini-1.5-flash'

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${systemPrompt}\n\nPrompt do usuário: ${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Erro ao refinar prompt com Gemini')
    }

    const data = await response.json()
    const refinedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
    
    return refinedPrompt
  }
}
