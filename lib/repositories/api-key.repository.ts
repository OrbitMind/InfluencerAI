import { prisma } from '@/lib/db';
import { getEncryptionService } from '../services/encryption/aes-encryption.service';

/**
 * Repository para gerenciamento de API Keys
 * Data Access Layer - Camada de acesso a dados
 *
 * Princípios aplicados:
 * - Single Responsibility: Apenas operações de banco relacionadas a API Keys
 * - Separation of Concerns: Lógica de negócio fica nos Services
 */
export class ApiKeyRepository {
  private encryption = getEncryptionService();

  async create(userId: string, provider: string, apiKey: string, name?: string) {
    const encrypted = this.encryption.encrypt(apiKey);

    return prisma.apiKey.create({
      data: {
        userId,
        provider,
        encrypted: encrypted.encrypted,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        name
      }
    });
  }

  async findByUserAndProvider(userId: string, provider: string) {
    return prisma.apiKey.findFirst({
      where: { userId, provider }
    });
  }

  async getDecryptedKey(userId: string, provider: string): Promise<string | null> {
    const apiKey = await this.findByUserAndProvider(userId, provider);

    if (!apiKey) {
      return null;
    }

    const decrypted = this.encryption.decrypt({
      encrypted: apiKey.encrypted,
      iv: apiKey.iv,
      authTag: apiKey.authTag
    });

    // Atualizar lastUsed
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsed: new Date() }
    });

    return decrypted;
  }

  async delete(id: string, userId: string) {
    return prisma.apiKey.delete({
      where: { id, userId }
    });
  }

  async listByUser(userId: string) {
    return prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        name: true,
        lastUsed: true,
        createdAt: true,
        updatedAt: true
        // NÃO retornar dados criptografados (encrypted, iv, authTag)
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
