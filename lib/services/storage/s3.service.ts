import { createLogger } from '@/lib/utils/logger';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { IStorageService, UploadParams, StorageResult } from '../interfaces/storage.interface';

const logger = createLogger('S3StorageService');

/**
 * Implementação do serviço de storage usando AWS S3
 * Preparado para migração futura do Cloudinary
 *
 * Princípios SOLID aplicados:
 * - Single Responsibility: Apenas gerenciamento de storage no S3
 * - Open/Closed: Implementa interface, fechado para modificação
 * - Liskov Substitution: Pode substituir CloudinaryStorageService
 * - Dependency Inversion: Depende da abstração IStorageService
 */
export class S3StorageService implements IStorageService {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET!;
    this.region = process.env.AWS_REGION || 'us-east-1';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
  }

  async upload(params: UploadParams): Promise<StorageResult> {
    const { url, userId, type } = params;

    try {
      // 1. Download da URL temporária
      if (!url) throw new Error('URL é obrigatória para upload via S3');
      const response = await fetch(url);
      const buffer = Buffer.from(await response.arrayBuffer());

      // 2. Gerar key única
      const ext = type === 'image' ? 'png' : 'mp4';
      const key = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      // 3. Upload para S3
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: type === 'image' ? 'image/png' : 'video/mp4',
        ACL: 'public-read'
      }));

      // 4. Gerar URL (com CloudFront se configurado)
      const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;
      const baseUrl = cloudFrontDomain
        ? `https://${cloudFrontDomain}`
        : `https://${this.bucket}.s3.${this.region}.amazonaws.com`;

      return {
        url: `${baseUrl}/${key}`,
        publicId: key,
        fileSize: buffer.length,
        width: undefined, // Precisaria de processamento adicional com Sharp
        height: undefined,
        duration: undefined
      };
    } catch (error) {
      logger.error('S3 upload failed:', { error });
      throw new Error('Falha ao fazer upload para S3');
    }
  }

  async delete(publicId: string): Promise<void> {
    try {
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: publicId
      }));
    } catch (error) {
      logger.error('S3 delete failed:', { error });
      throw new Error('Falha ao deletar do S3');
    }
  }

  getUrl(publicId: string): string {
    const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;
    const baseUrl = cloudFrontDomain
      ? `https://${cloudFrontDomain}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com`;

    return `${baseUrl}/${publicId}`;
  }
}
