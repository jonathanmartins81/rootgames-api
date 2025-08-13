import { promises as fs } from 'fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ImageOptimizer, { ImagePresets } from '../../src/utils/imageOptimizer';

// Mock do fs
vi.mock('fs', () => ({
  promises: { readFile: vi.fn(), writeFile: vi.fn(), stat: vi.fn(), mkdir: vi.fn(), readdir: vi.fn(), rm: vi.fn() },
}));

// Mock do sharp
vi.mock('sharp', () => {
  const mockSharp = vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    blur: vi.fn().mockReturnThis(),
    sharpen: vi.fn().mockReturnThis(),
    grayscale: vi.fn().mockReturnThis(),
    flip: vi.fn().mockReturnThis(),
    flop: vi.fn().mockReturnThis(),
    rotate: vi.fn().mockReturnThis(),
    tint: vi.fn().mockReturnThis(),
    negate: vi.fn().mockReturnThis(),
    normalize: vi.fn().mockReturnThis(),
    median: vi.fn().mockReturnThis(),
    modulate: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    avif: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-image-data')),
    metadata: vi
      .fn()
      .mockResolvedValue({ width: 800, height: 600, format: 'jpeg', hasAlpha: false, hasProfile: false }),
  }));
  return { default: mockSharp };
});

describe('ImageOptimizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('optimizeWithSharp', () => {
    it('should optimize an image with default options', async () => {
      const mockBuffer = Buffer.from('test-image-data');
      const mockStats = { size: 1000 };

      vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);
      vi.mocked(fs.stat).mockResolvedValue(mockStats as any);
      vi.mocked(fs.writeFile).mockResolvedValue();

      const result = await ImageOptimizer.optimizeWithSharp('input.jpg', 'output.jpg');

      expect(result).toEqual({
        originalSize: 1000,
        optimizedSize: expect.any(Number),
        compressionRatio: expect.any(Number),
        format: 'jpeg',
        dimensions: { width: 800, height: 600 },
        path: 'output.jpg',
      });
    });

    it('should optimize an image with custom options', async () => {
      const mockBuffer = Buffer.from('test-image-data');
      const mockStats = { size: 1000 };

      vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);
      vi.mocked(fs.stat).mockResolvedValue(mockStats as any);
      vi.mocked(fs.writeFile).mockResolvedValue();

      const result = await ImageOptimizer.optimizeWithSharp('input.jpg', 'output.webp', {
        width: 300,
        height: 200,
        quality: 90,
        format: 'webp',
      });

      expect(result.format).toBe('webp');
      expect(result.dimensions).toEqual({ width: 800, height: 600 });
    });
  });

  describe('createMultipleFormats', () => {
    it('should create multiple formats of an image', async () => {
      const mockBuffer = Buffer.from('test-image-data');
      const mockStats = { size: 1000 };

      vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);
      vi.mocked(fs.stat).mockResolvedValue(mockStats as any);
      vi.mocked(fs.writeFile).mockResolvedValue();
      vi.mocked(fs.mkdir).mockResolvedValue();

      const result = await ImageOptimizer.createMultipleFormats('input.jpg', './output/', ImagePresets.gameCard);

      expect(result.path).toContain('input.jpg');
      expect(result.webpPath).toContain('input.webp');
    });
  });

  describe('generateThumbnails', () => {
    it('should generate thumbnails of different sizes', async () => {
      const mockBuffer = Buffer.from('test-image-data');
      const mockStats = { size: 1000 };

      vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);
      vi.mocked(fs.stat).mockResolvedValue(mockStats as any);
      vi.mocked(fs.writeFile).mockResolvedValue();
      vi.mocked(fs.mkdir).mockResolvedValue();

      const sizes = [
        { width: 150, height: 150, suffix: '_thumb' },
        { width: 300, height: 200, suffix: '_card' },
      ];

      const results = await ImageOptimizer.generateThumbnails('input.jpg', './thumbnails/', sizes);

      expect(results).toHaveLength(2);
      expect(results[0].path).toContain('_thumb');
      expect(results[1].path).toContain('_card');
    });
  });

  describe('getImageInfo', () => {
    it('should get image information', async () => {
      const mockStats = { size: 1000 };

      vi.mocked(fs.stat).mockResolvedValue(mockStats as any);

      const info = await ImageOptimizer.getImageInfo('test.jpg');

      expect(info).toEqual({ width: 800, height: 600, format: 'jpeg', size: 1000, hasAlpha: false, hasProfile: false });
    });
  });

  describe('isValidImage', () => {
    it('should return true for valid image', async () => {
      const isValid = await ImageOptimizer.isValidImage('valid.jpg');
      expect(isValid).toBe(true);
    });

    it('should return false for invalid image', async () => {
      // Mock sharp to throw error
      const { default: sharp } = await import('sharp');
      vi.mocked(sharp).mockImplementation(() => {
        throw new Error('Invalid image');
      });

      const isValid = await ImageOptimizer.isValidImage('invalid.jpg');
      expect(isValid).toBe(false);
    });
  });

  describe('ImagePresets', () => {
    it('should have correct preset configurations', () => {
      expect(ImagePresets.thumbnail).toEqual({ width: 150, height: 150, quality: 85, format: 'jpeg', fit: 'cover' });

      expect(ImagePresets.gameCard).toEqual({ width: 300, height: 200, quality: 90, format: 'jpeg', fit: 'cover' });

      expect(ImagePresets.webp).toEqual({ quality: 80, format: 'webp' });
    });
  });
});
