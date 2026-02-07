import type { IPromptRefinerService } from '../interfaces/IPromptRefinerService'
import { GooglePromptRefiner } from './GooglePromptRefiner'
import { OpenAIPromptRefiner } from './OpenAIPromptRefiner'

/**
 * Factory para criar instâncias de prompt refiner baseado no provider
 * Princípio: Factory Pattern + Open/Closed Principle (OCP)
 * Responsabilidade: criar a implementação correta de refiner
 */
export class PromptRefinerFactory {
  static create(
    provider: 'openai' | 'google',
    apiKey: string,
    model?: string
  ): IPromptRefinerService {
    const config = { apiKey, model }
    
    switch (provider) {
      case 'google':
        return new GooglePromptRefiner(config)
      case 'openai':
        return new OpenAIPromptRefiner(config)
      default:
        throw new Error(`Provider desconhecido: ${provider}`)
    }
  }
}
