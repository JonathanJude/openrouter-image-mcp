import { describe, it, expect, beforeEach } from 'vitest';
import { ImageProcessor } from '../../src/utils/image-processor.js';
import { Logger } from '../../src/utils/logger.js';

describe('ImageProcessor', () => {
  let imageProcessor: ImageProcessor;

  beforeEach(() => {
    // Mock logger to avoid console output during tests
    Logger.getInstance();
    imageProcessor = ImageProcessor.getInstance();
  });

  describe('isValidImageType', () => {
    it('should return true for valid image types', () => {
      expect(imageProcessor.isValidImageType('image/jpeg')).toBe(true);
      expect(imageProcessor.isValidImageType('image/png')).toBe(true);
      expect(imageProcessor.isValidImageType('image/webp')).toBe(true);
      expect(imageProcessor.isValidImageType('image/gif')).toBe(true);
    });

    it('should return false for invalid image types', () => {
      expect(imageProcessor.isValidImageType('application/pdf')).toBe(false);
      expect(imageProcessor.isValidImageType('text/plain')).toBe(false);
      expect(imageProcessor.isValidImageType('video/mp4')).toBe(false);
      expect(imageProcessor.isValidImageType('')).toBe(false);
    });
  });

  describe('processImage', () => {
    it('should process base64 image data correctly', async () => {
      // Simple 1x1 PNG pixel in base64
      const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const result = await imageProcessor.processImage({
        type: 'base64',
        data: base64Png,
        mimeType: 'image/png'
      });

      expect(result.data).toBe(base64Png);
      expect(result.mimeType).toBe('image/png');
      expect(result.size).toBeGreaterThan(0);
    });

    it('should auto-detect MIME type for base64 data', async () => {
      const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const result = await imageProcessor.processImage({
        type: 'base64',
        data: base64Png
      });

      expect(result.mimeType).toBe('image/png');
    });

    it('should remove data URL prefix from base64 input', async () => {
      const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const dataUrl = `data:image/png;base64,${base64Png}`;

      const result = await imageProcessor.processImage({
        type: 'base64',
        data: dataUrl
      });

      expect(result.data).toBe(base64Png);
      expect(result.mimeType).toBe('image/png');
    });
  });
});