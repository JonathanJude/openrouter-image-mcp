import { readFile } from 'fs/promises';
import sharp from 'sharp';
import axios from 'axios';
import { ImageInput } from '../types/index.js';
import { Logger } from './logger.js';

export class ImageProcessor {
  private static instance: ImageProcessor;
  private logger: Logger;

  private constructor() {
    this.logger = Logger.getInstance();
  }

  public static getInstance(): ImageProcessor {
    if (!ImageProcessor.instance) {
      ImageProcessor.instance = new ImageProcessor();
    }
    return ImageProcessor.instance;
  }

  public async processImage(input: ImageInput): Promise<{ data: string; mimeType: string; size: number }> {
    try {
      switch (input.type) {
        case 'base64':
          return this.processBase64Image(input.data, input.mimeType);
        case 'file':
          return this.processFileImage(input.data);
        case 'url':
          return this.processUrlImage(input.data);
        default:
          throw new Error(`Unsupported image input type: ${(input as any).type}`);
      }
    } catch (error) {
      this.logger.error('Failed to process image', error);
      throw error;
    }
  }

  private async processBase64Image(data: string, mimeType?: string): Promise<{ data: string; mimeType: string; size: number }> {
    try {
      // Remove data URL prefix if present
      const base64Data = data.replace(/^data:image\/[a-z]+;base64,/, '');

      // Validate base64 data
      if (!base64Data || base64Data.length === 0) {
        throw new Error('Empty or invalid base64 data provided');
      }

      // Check if base64 data is reasonable size (warn if >10MB)
      const estimatedSize = Math.ceil(base64Data.length * 0.75); // Base64 is ~33% larger
      if (estimatedSize > 10 * 1024 * 1024) {
        this.logger.warn(`Large base64 image detected: ${estimatedSize} bytes. Processing may take time.`);
      }

      // Create buffer and validate
      let buffer: Buffer;
      try {
        buffer = Buffer.from(base64Data, 'base64');
      } catch (error) {
        throw new Error('Invalid base64 encoding provided');
      }

      // Validate buffer size
      if (buffer.length === 0) {
        throw new Error('Base64 data resulted in empty buffer');
      }

      // Detect MIME type if not provided
      const detectedMimeType = mimeType || await this.detectMimeType(buffer);

      this.logger.debug(`Processed base64 image, size: ${buffer.length}, type: ${detectedMimeType}`);

      return {
        data: base64Data,
        mimeType: detectedMimeType,
        size: buffer.length,
      };
    } catch (error) {
      this.logger.error('Failed to process base64 image', error);
      throw new Error(`Base64 image processing failed: ${(error as Error).message}`);
    }
  }

  private async processFileImage(filePath: string): Promise<{ data: string; mimeType: string; size: number }> {
    try {
      const buffer = await readFile(filePath);
      const mimeType = await this.detectMimeType(buffer);
      const base64Data = buffer.toString('base64');

      this.logger.debug(`Processed file image: ${filePath}, size: ${buffer.length}, type: ${mimeType}`);

      return {
        data: base64Data,
        mimeType,
        size: buffer.length,
      };
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`);
    }
  }

  private async processUrlImage(url: string): Promise<{ data: string; mimeType: string; size: number }> {
    try {
      this.logger.debug(`Fetching image from URL: ${url}`);

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'OpenRouter-Image-MCP/1.0',
        },
      });

      const buffer = Buffer.from(response.data);
      const mimeType = this.detectMimeTypeFromHeaders(response.headers) || await this.detectMimeType(buffer);
      const base64Data = buffer.toString('base64');

      this.logger.debug(`Processed URL image: ${url}, size: ${buffer.length}, type: ${mimeType}`);

      return {
        data: base64Data,
        mimeType,
        size: buffer.length,
      };
    } catch (error) {
      throw new Error(`Failed to fetch image from URL ${url}: ${(error as Error).message}`);
    }
  }

  private async detectMimeType(buffer: Buffer): Promise<string> {
    try {
      const metadata = await sharp(buffer).metadata();

      switch (metadata.format) {
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'webp':
          return 'image/webp';
        case 'gif':
          return 'image/gif';
        default:
          // Fallback detection based on file signature
          return this.detectFromSignature(buffer);
      }
    } catch {
      return this.detectFromSignature(buffer);
    }
  }

  private detectFromSignature(buffer: Buffer): string {
    if (buffer.length < 4) return 'application/octet-stream';

    const signature = buffer.subarray(0, 4).toString('hex');

    // JPEG signature: FF D8 FF
    if (signature.startsWith('ffd8ff')) {
      return 'image/jpeg';
    }

    // PNG signature: 89 50 4E 47
    if (signature === '89504e47') {
      return 'image/png';
    }

    // GIF signature: 47 49 46 38
    if (signature.startsWith('47494638')) {
      return 'image/gif';
    }

    // WebP signature: 52 49 46 46 ... 57 45 42 50
    if (signature.startsWith('52494646') && buffer.length > 12) {
      const webpSignature = buffer.subarray(8, 12).toString('ascii');
      if (webpSignature === 'WEBP') {
        return 'image/webp';
      }
    }

    return 'application/octet-stream';
  }

  private detectMimeTypeFromHeaders(headers: any): string | null {
    const contentType = headers['content-type'];
    if (contentType && typeof contentType === 'string') {
      return contentType.split(';')[0].trim();
    }
    return null;
  }

  public isValidImageType(mimeType: string): boolean {
    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    return validTypes.includes(mimeType);
  }
}