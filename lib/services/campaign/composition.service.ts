import { v2 as cloudinary } from 'cloudinary';
import type { OverlayConfig } from '@/lib/types/campaign';

const PLATFORM_DIMENSIONS: Record<string, { width: number; height: number }> = {
  'instagram-feed': { width: 1080, height: 1080 },
  'instagram-story': { width: 1080, height: 1920 },
  'instagram-reel': { width: 1080, height: 1920 },
  'tiktok': { width: 1080, height: 1920 },
  'youtube-thumbnail': { width: 1280, height: 720 },
  'youtube-short': { width: 1080, height: 1920 },
  'twitter': { width: 1200, height: 675 },
};

export class CompositionService {
  private static instance: CompositionService;

  private constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  static getInstance(): CompositionService {
    if (!CompositionService.instance) {
      CompositionService.instance = new CompositionService();
    }
    return CompositionService.instance;
  }

  async applyTextOverlay(
    imagePublicId: string,
    text: string,
    config: OverlayConfig
  ): Promise<{ url: string; publicId: string }> {
    const gravity = this.positionToGravity(config.position);

    // Build Cloudinary transformation URL with text overlay
    const transformedUrl = cloudinary.url(imagePublicId, {
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
        {
          overlay: {
            font_family: config.fontFamily || 'Arial',
            font_size: config.fontSize || 32,
            text: text.replace(/,/g, '%2C').replace(/\//g, '%2F'),
          },
          color: config.color || '#FFFFFF',
          gravity,
          y: config.padding || 16,
          x: config.padding || 16,
          background: config.backgroundColor || '#00000080',
          opacity: Math.round((config.opacity || 0.9) * 100),
        },
      ],
    });

    // Re-upload the transformed image as a persistent asset
    const result = await cloudinary.uploader.upload(transformedUrl, {
      folder: 'influencer-ai/composed',
      resource_type: 'image',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  formatForPlatform(
    publicId: string,
    platform: string
  ): string {
    const dims = PLATFORM_DIMENSIONS[platform];
    if (!dims) return cloudinary.url(publicId, { quality: 'auto', fetch_format: 'auto' });

    return cloudinary.url(publicId, {
      transformation: [
        { width: dims.width, height: dims.height, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
  }

  async uploadSRT(
    srtContent: string,
    campaignId: string
  ): Promise<{ url: string; publicId: string }> {
    const buffer = Buffer.from(srtContent, 'utf-8');
    const base64 = buffer.toString('base64');
    const dataUri = `data:text/plain;base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'influencer-ai/subtitles',
      public_id: `campaign-${campaignId}`,
      resource_type: 'raw',
      overwrite: true,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  getVideoAudioLimitations(): string {
    return 'Video+audio merge não é suportado via Cloudinary transformations. O áudio e vídeo são entregues como arquivos separados para composição manual ou via ferramenta externa.';
  }

  private positionToGravity(position: OverlayConfig['position']): string {
    const map: Record<string, string> = {
      'top-left': 'north_west',
      'top-center': 'north',
      'top-right': 'north_east',
      'center': 'center',
      'bottom-left': 'south_west',
      'bottom-center': 'south',
      'bottom-right': 'south_east',
    };
    return map[position] || 'south';
  }
}
