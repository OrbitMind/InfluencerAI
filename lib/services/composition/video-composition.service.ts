import { createLogger } from '@/lib/utils/logger';
import { execSync, execFile } from 'child_process';
import { writeFile, unlink, mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { v2 as cloudinary } from 'cloudinary';
import type {
  ConcatVideoParams,
  MergeAudioParams,
  TrimVideoParams,
  CompositionResult,
} from '@/lib/types/video-composition';

const logger = createLogger('VideoCompositionService');

export class VideoCompositionService {
  private static instance: VideoCompositionService;
  private ffmpegAvailable: boolean | null = null;

  private constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  static getInstance(): VideoCompositionService {
    if (!VideoCompositionService.instance) {
      VideoCompositionService.instance = new VideoCompositionService();
    }
    return VideoCompositionService.instance;
  }

  isFFmpegAvailable(): boolean {
    if (this.ffmpegAvailable !== null) return this.ffmpegAvailable;

    try {
      execSync('ffmpeg -version', { stdio: 'ignore', timeout: 5000 });
      this.ffmpegAvailable = true;
    } catch {
      this.ffmpegAvailable = false;
    }

    return this.ffmpegAvailable;
  }

  getCompositionCapabilities(): { ffmpeg: boolean; fallbackMode: 'srt-only' | 'full' } {
    const ffmpeg = this.isFFmpegAvailable();
    return {
      ffmpeg,
      fallbackMode: ffmpeg ? 'full' : 'srt-only',
    };
  }

  async composeVideoWithCaptions(
    videoUrl: string,
    assContent: string
  ): Promise<{ url: string; publicId: string } | null> {
    if (!this.isFFmpegAvailable()) return null;

    let tempDir: string | null = null;
    const tempFiles: string[] = [];

    try {
      tempDir = await mkdtemp(join(tmpdir(), 'caption-'));
      const videoPath = join(tempDir, 'input.mp4');
      const assPath = join(tempDir, 'subtitles.ass');
      const outputPath = join(tempDir, 'output.mp4');

      // Download video to temp
      const videoBuffer = await this.downloadToBuffer(videoUrl);
      await writeFile(videoPath, videoBuffer);
      tempFiles.push(videoPath);

      // Write ASS file
      await writeFile(assPath, assContent, 'utf-8');
      tempFiles.push(assPath);

      // Run ffmpeg
      await this.runFFmpeg(videoPath, assPath, outputPath);
      tempFiles.push(outputPath);

      // Upload result to Cloudinary
      const result = await cloudinary.uploader.upload(outputPath, {
        folder: 'influencer-ai/composed-videos',
        resource_type: 'video',
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      logger.error('[VideoCompositionService] ffmpeg composition failed:', { error });
      return null;
    } finally {
      await this.cleanupTemp(tempFiles);
    }
  }

  private async downloadToBuffer(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private runFFmpeg(
    videoPath: string,
    assPath: string,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-i', videoPath,
        '-vf', `ass=${assPath.replace(/\\/g, '/')}`,
        '-c:a', 'copy',
        '-y',
        outputPath,
      ];

      execFile('ffmpeg', args, { timeout: 120000 }, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  private async cleanupTemp(paths: string[]): Promise<void> {
    for (const p of paths) {
      try {
        await unlink(p);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  // ============================================
  // VIDEO CONCATENATION (Sprint 9)
  // ============================================

  /**
   * Concatenates multiple videos into one
   * Uses ffmpeg concat demuxer
   */
  async concatenateVideos(params: ConcatVideoParams): Promise<CompositionResult | null> {
    if (!this.isFFmpegAvailable()) return null;
    if (params.videoUrls.length < 2) {
      throw new Error('At least 2 videos are required for concatenation');
    }

    const tempFiles: string[] = [];
    let tempDir: string | null = null;

    try {
      tempDir = await mkdtemp(join(tmpdir(), 'concat-'));

      // Download all videos
      const videoPaths: string[] = [];
      for (let i = 0; i < params.videoUrls.length; i++) {
        const videoPath = join(tempDir, `video${i}.mp4`);
        const buffer = await this.downloadToBuffer(params.videoUrls[i]);
        await writeFile(videoPath, buffer);
        tempFiles.push(videoPath);
        videoPaths.push(videoPath);
      }

      // Create concat list file
      const listPath = join(tempDir, 'list.txt');
      const listContent = videoPaths.map((p) => `file '${p}'`).join('\n');
      await writeFile(listPath, listContent, 'utf-8');
      tempFiles.push(listPath);

      const outputPath = join(tempDir, 'output.mp4');
      tempFiles.push(outputPath);

      // Run ffmpeg concat
      await new Promise<void>((resolve, reject) => {
        const args = [
          '-f', 'concat',
          '-safe', '0',
          '-i', listPath,
          '-c', 'copy',
          '-y',
          outputPath,
        ];

        execFile('ffmpeg', args, { timeout: 300000 }, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(outputPath, {
        folder: 'influencer-ai/concat-videos',
        resource_type: 'video',
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        duration: result.duration,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      logger.error('[VideoCompositionService] concatenation failed:', { error });
      return null;
    } finally {
      await this.cleanupTemp(tempFiles);
    }
  }

  /**
   * Merges video with audio (voice-over or music)
   * Resolves TODO in composition.service.ts:107-109
   */
  async mergeVideoAudio(params: MergeAudioParams): Promise<CompositionResult | null> {
    if (!this.isFFmpegAvailable()) return null;

    const tempFiles: string[] = [];
    let tempDir: string | null = null;

    try {
      tempDir = await mkdtemp(join(tmpdir(), 'merge-'));

      // Download video and audio
      const videoPath = join(tempDir, 'video.mp4');
      const audioPath = join(tempDir, 'audio.mp3');
      const outputPath = join(tempDir, 'output.mp4');

      const videoBuffer = await this.downloadToBuffer(params.videoUrl);
      const audioBuffer = await this.downloadToBuffer(params.audioUrl);

      await writeFile(videoPath, videoBuffer);
      await writeFile(audioPath, audioBuffer);
      tempFiles.push(videoPath, audioPath, outputPath);

      // Build ffmpeg command
      const args: string[] = [
        '-i', videoPath,
        '-i', audioPath,
      ];

      if (params.keepOriginalAudio) {
        // Mix original video audio with new audio
        args.push(
          '-filter_complex',
          `[0:a][1:a]amix=inputs=2:duration=shortest:weights=${1.0 - (params.audioVolume || 1.0)} ${params.audioVolume || 1.0}`,
          '-c:v', 'copy'
        );
      } else {
        // Replace original audio with new audio
        args.push(
          '-c:v', 'copy',
          '-map', '0:v',
          '-map', '1:a',
          '-shortest'
        );

        if (params.audioVolume && params.audioVolume !== 1.0) {
          args.push('-filter:a', `volume=${params.audioVolume}`);
        }
      }

      args.push('-y', outputPath);

      await new Promise<void>((resolve, reject) => {
        execFile('ffmpeg', args, { timeout: 180000 }, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(outputPath, {
        folder: 'influencer-ai/merged-videos',
        resource_type: 'video',
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        duration: result.duration,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      logger.error('[VideoCompositionService] audio merge failed:', { error });
      return null;
    } finally {
      await this.cleanupTemp(tempFiles);
    }
  }

  /**
   * Trims video (cuts start/end)
   */
  async trimVideo(params: TrimVideoParams): Promise<CompositionResult | null> {
    if (!this.isFFmpegAvailable()) return null;
    if (params.endTime <= params.startTime) {
      throw new Error('endTime must be greater than startTime');
    }

    const tempFiles: string[] = [];
    let tempDir: string | null = null;

    try {
      tempDir = await mkdtemp(join(tmpdir(), 'trim-'));

      const videoPath = join(tempDir, 'input.mp4');
      const outputPath = join(tempDir, 'output.mp4');

      const videoBuffer = await this.downloadToBuffer(params.videoUrl);
      await writeFile(videoPath, videoBuffer);
      tempFiles.push(videoPath, outputPath);

      // Run ffmpeg trim
      await new Promise<void>((resolve, reject) => {
        const args = [
          '-ss', params.startTime.toString(),
          '-to', params.endTime.toString(),
          '-i', videoPath,
          '-c', 'copy',
          '-y',
          outputPath,
        ];

        execFile('ffmpeg', args, { timeout: 120000 }, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(outputPath, {
        folder: 'influencer-ai/trimmed-videos',
        resource_type: 'video',
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        duration: result.duration,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      logger.error('[VideoCompositionService] trim failed:', { error });
      return null;
    } finally {
      await this.cleanupTemp(tempFiles);
    }
  }
}
