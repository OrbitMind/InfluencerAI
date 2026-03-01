import { createLogger } from '@/lib/utils/logger';
import { v2 as cloudinary } from 'cloudinary';
import { IStorageService, UploadParams, StorageResult } from '../interfaces/storage.interface';

const logger = createLogger('CloudinaryStorageService');

/**
 * Implementação do serviço de storage usando Cloudinary
 * Princípios SOLID aplicados:
 * - Single Responsibility: Apenas gerenciamento de storage no Cloudinary
 * - Open/Closed: Implementa interface, fechado para modificação
 * - Liskov Substitution: Pode ser substituído por qualquer IStorageService
 * - Dependency Inversion: Depende da abstração IStorageService
 */
export class CloudinaryStorageService implements IStorageService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }

  async upload(params: UploadParams): Promise<StorageResult> {
    const { url, buffer, userId, type, folder = 'influencer-ai' } = params;

    if (!url && !buffer) {
      throw new Error('url ou buffer é obrigatório para upload');
    }

    try {
      let result;

      if (buffer) {
        // Upload de buffer (áudio do ElevenLabs, etc)
        result = await new Promise<Record<string, unknown>>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: `${folder}/${userId}`,
              resource_type: 'auto',
            },
            (error, uploadResult) => {
              if (error) reject(error);
              else resolve(uploadResult as Record<string, unknown>);
            }
          );
          stream.end(buffer);
        });
      } else {
        // Upload via URL (fluxo original)
        result = await cloudinary.uploader.upload(url!, {
          folder: `${folder}/${userId}`,
          resource_type: 'auto',
          transformation: type === 'video' ? [
            { quality: 'auto', fetch_format: 'auto' }
          ] : undefined
        });
      }

      // Gerar thumbnail para vídeos
      let thumbnailUrl: string | undefined;
      if (type === 'video') {
        thumbnailUrl = cloudinary.url(result.public_id as string, {
          resource_type: 'video',
          format: 'jpg',
          start_offset: '0',
          transformation: [{ width: 400, crop: 'scale' }]
        });
      }

      return {
        url: result.secure_url as string,
        publicId: result.public_id as string,
        fileSize: result.bytes as number,
        width: result.width as number | undefined,
        height: result.height as number | undefined,
        duration: result.duration as number | undefined,
        thumbnailUrl
      };
    } catch (error) {
      logger.error('Cloudinary upload failed:', { error });
      throw new Error('Falha ao fazer upload para Cloudinary');
    }
  }

  async delete(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'auto'
      });
    } catch (error) {
      logger.error('Cloudinary delete failed:', { error });
      throw new Error('Falha ao deletar do Cloudinary');
    }
  }

  getUrl(publicId: string, transformations?: object): string {
    return cloudinary.url(publicId, {
      resource_type: 'auto',
      ...transformations
    });
  }

  async generateThumbnail(publicId: string): Promise<string> {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'jpg',
      start_offset: '0',
      transformation: [{ width: 400, crop: 'scale' }]
    });
  }
}
