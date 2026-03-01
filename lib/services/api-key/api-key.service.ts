import { ApiKeyRepository } from '@/lib/repositories/api-key.repository';

/**
 * Serviço para gerenciamento de API Keys
 * Service Layer - Camada de lógica de negócio
 *
 * Princípios aplicados:
 * - Single Responsibility: Apenas lógica de negócio para API Keys
 * - Dependency Inversion: Usa abstração (repository)
 * - Separation of Concerns: Repository faz acesso a dados, Service faz regras de negócio
 */
export class ApiKeyService {
  private repository = new ApiKeyRepository();

  /**
   * Salva ou atualiza API key do usuário para um provider
   */
  async saveApiKey(
    userId: string,
    provider: 'replicate' | 'openai' | 'google' | 'elevenlabs',
    apiKey: string,
    name?: string
  ) {
    // Verificar se já existe uma chave para este provider
    const existing = await this.repository.findByUserAndProvider(userId, provider);

    if (existing) {
      // Se já existe, deletar a antiga e criar uma nova
      // (melhor que UPDATE para garantir nova criptografia)
      await this.repository.delete(existing.id, userId);
    }

    return this.repository.create(userId, provider, apiKey, name);
  }

  /**
   * Retorna API key descriptografada de um provider
   * Atualiza lastUsed automaticamente
   */
  async getApiKey(userId: string, provider: string): Promise<string | null> {
    return this.repository.getDecryptedKey(userId, provider);
  }

  /**
   * Retorna API key do banco (preferência) com fallback para variável de ambiente.
   * Prioridade: chave do usuário no banco > variável de ambiente > null
   */
  async getApiKeyWithEnvFallback(userId: string, provider: string): Promise<string | null> {
    const dbKey = await this.repository.getDecryptedKey(userId, provider);
    if (dbKey) return dbKey;

    const envFallbacks: Record<string, string | undefined> = {
      replicate: process.env.REPLICATE_API_TOKEN,
      openai: process.env.OPENAI_API_KEY,
      elevenlabs: process.env.ELEVENLABS_API_KEY,
      google: process.env.GOOGLE_GENERATIVE_AI_KEY,
    };

    return envFallbacks[provider] ?? null;
  }

  /**
   * Deleta uma API key
   */
  async deleteApiKey(id: string, userId: string) {
    return this.repository.delete(id, userId);
  }

  /**
   * Lista todas as API keys do usuário (sem expor dados sensíveis)
   */
  async listApiKeys(userId: string) {
    return this.repository.listByUser(userId);
  }

  /**
   * Verifica se usuário tem API key configurada para um provider
   */
  async hasApiKey(userId: string, provider: string): Promise<boolean> {
    const apiKey = await this.repository.findByUserAndProvider(userId, provider);
    return !!apiKey;
  }
}
