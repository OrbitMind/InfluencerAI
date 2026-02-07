import { getSystemPrompt } from '@/lib/utils/promptUtils'
import type { IPromptRefinerService, PromptRefinerConfig } from '../interfaces/IPromptRefinerService'

/**
 * Implementação de refinamento de prompts usando OpenAI
 * Princípio: Single Responsibility Principle (SRP) + Strategy Pattern
 * Responsabilidade: refinar prompts usando API OpenAI
 */
export class OpenAIPromptRefiner implements IPromptRefinerService {
  constructor(private config: PromptRefinerConfig) {}

  async refine(prompt: string, type: 'image' | 'video'): Promise<string> {
    const systemPrompt = getSystemPrompt(type)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Erro ao refinar prompt com OpenAI')
    }

    const data = await response.json()
    const refinedPrompt = data.choices[0]?.message?.content?.trim() || ''
    
    return refinedPrompt
  }
}
