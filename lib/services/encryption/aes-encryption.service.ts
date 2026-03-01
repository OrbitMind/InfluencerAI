import { createLogger } from '@/lib/utils/logger';
import crypto from 'crypto';
import { IEncryptionService, EncryptedData } from '../interfaces/encryption.interface';

const logger = createLogger('AESEncryptionService');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits

/**
 * Serviço de criptografia usando AES-256-GCM
 *
 * AES-256-GCM oferece:
 * - Confidencialidade (criptografia forte)
 * - Integridade (authentication tag previne modificações)
 * - Segurança (padrão militar)
 *
 * Princípios SOLID aplicados:
 * - Single Responsibility: Apenas criptografia/descriptografia
 * - Open/Closed: Implementa interface, fechado para modificação
 * - Dependency Inversion: Depende da abstração IEncryptionService
 */
export class AESEncryptionService implements IEncryptionService {
  private key: Buffer;

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;

    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY não configurada no .env');
    }

    // Validar tamanho da chave (deve ser 64 caracteres hex = 32 bytes)
    if (encryptionKey.length !== KEY_LENGTH * 2) {
      throw new Error('ENCRYPTION_KEY deve ter 64 caracteres hexadecimais (openssl rand -hex 32)');
    }

    this.key = Buffer.from(encryptionKey, 'hex');
  }

  encrypt(plaintext: string): EncryptedData {
    // Gerar IV (Initialization Vector) aleatório único para cada criptografia
    // Isso garante que a mesma chave + mesmo texto = ciphertext diferente
    const iv = crypto.randomBytes(16);

    // Criar cipher
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

    // Criptografar
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);

    // Obter authentication tag (garante integridade dos dados)
    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(data: EncryptedData): string {
    try {
      // Converter de hex para Buffer
      const encrypted = Buffer.from(data.encrypted, 'hex');
      const iv = Buffer.from(data.iv, 'hex');
      const authTag = Buffer.from(data.authTag, 'hex');

      // Criar decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(authTag);

      // Descriptografar
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      logger.error('Decryption failed:', { error });
      throw new Error('Falha ao descriptografar dados - dados corrompidos ou chave inválida');
    }
  }
}

/**
 * Singleton instance para reutilização
 */
let encryptionService: IEncryptionService | null = null;

export function getEncryptionService(): IEncryptionService {
  if (!encryptionService) {
    encryptionService = new AESEncryptionService();
  }
  return encryptionService;
}
