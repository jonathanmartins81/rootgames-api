import { promises as fs } from 'fs';
import imagemin from 'imagemin';
import imageminGifsicle from 'imagemin-gifsicle';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import imageminSvgo from 'imagemin-svgo';
import imageminWebp from 'imagemin-webp';
import path from 'path';
import sharp from 'sharp';

export interface ImageOptimizationOptions {
  quality?: number;
  width?: number;
  height?: number | undefined;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'center';
  background?: string;
  blur?: number;
  sharpen?: number;
  grayscale?: boolean;
  flip?: boolean;
  flop?: boolean;
  rotate?: number;
  tint?: string;
  negate?: boolean;
  normalize?: boolean;
  median?: number;
  modulate?: { brightness?: number; saturation?: number; hue?: number };
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
  dimensions: { width: number; height: number };
  path: string;
  webpPath?: string;
  avifPath?: string;
}

export class ImageOptimizer {
  private static readonly DEFAULT_OPTIONS: ImageOptimizationOptions = {
    quality: 80,
    format: 'jpeg',
    fit: 'cover',
    position: 'center',
  };

  /**
   * Otimiza uma imagem com Sharp
   */
  static async optimizeWithSharp(
    inputPath: string,
    outputPath: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizationResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const inputBuffer = await fs.readFile(inputPath);
    const originalStats = await fs.stat(inputPath);

    let sharpInstance = sharp(inputBuffer);

    // Aplicar transformações
    if (opts.width || opts.height) {
      sharpInstance = sharpInstance.resize(opts.width, opts.height, {
        fit: opts.fit,
        position: opts.position,
        background: opts.background,
      });
    }

    if (opts.blur) {
      sharpInstance = sharpInstance.blur(opts.blur);
    }

    if (opts.sharpen) {
      sharpInstance = sharpInstance.sharpen(opts.sharpen);
    }

    if (opts.grayscale) {
      sharpInstance = sharpInstance.grayscale();
    }

    if (opts.flip) {
      sharpInstance = sharpInstance.flip();
    }

    if (opts.flop) {
      sharpInstance = sharpInstance.flop();
    }

    if (opts.rotate) {
      sharpInstance = sharpInstance.rotate(opts.rotate);
    }

    if (opts.tint) {
      sharpInstance = sharpInstance.tint(opts.tint);
    }

    if (opts.negate) {
      sharpInstance = sharpInstance.negate();
    }

    if (opts.normalize) {
      sharpInstance = sharpInstance.normalize();
    }

    if (opts.median) {
      sharpInstance = sharpInstance.median(opts.median);
    }

    if (opts.modulate) {
      sharpInstance = sharpInstance.modulate(opts.modulate);
    }

    // Aplicar formato e qualidade
    let outputBuffer: Buffer;
    let format: string;

    switch (opts.format) {
      case 'jpeg':
        outputBuffer = await sharpInstance.jpeg({ quality: opts.quality }).toBuffer();
        format = 'jpeg';
        break;
      case 'png':
        outputBuffer = await sharpInstance.png({ quality: opts.quality }).toBuffer();
        format = 'png';
        break;
      case 'webp':
        outputBuffer = await sharpInstance.webp({ quality: opts.quality }).toBuffer();
        format = 'webp';
        break;
      case 'avif':
        outputBuffer = await sharpInstance.avif({ quality: opts.quality }).toBuffer();
        format = 'avif';
        break;
      default:
        outputBuffer = await sharpInstance.jpeg({ quality: opts.quality }).toBuffer();
        format = 'jpeg';
    }

    // Obter dimensões
    const metadata = await sharpInstance.metadata();

    // Salvar arquivo otimizado
    await fs.writeFile(outputPath, outputBuffer);

    const optimizedStats = await fs.stat(outputPath);
    const compressionRatio = ((originalStats.size - optimizedStats.size) / originalStats.size) * 100;

    return {
      originalSize: originalStats.size,
      optimizedSize: optimizedStats.size,
      compressionRatio,
      format,
      dimensions: { width: metadata.width || 0, height: metadata.height || 0 },
      path: outputPath,
    };
  }

  /**
   * Otimiza uma imagem com Imagemin (compressão adicional)
   */
  static async optimizeWithImagemin(
    inputPath: string,
    outputPath: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizationResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const originalStats = await fs.stat(inputPath);

    const plugins = [];

    // Adicionar plugins baseados no formato
    if (opts.format === 'jpeg' || path.extname(inputPath).toLowerCase() === '.jpg') {
      plugins.push(imageminMozjpeg({ quality: opts.quality }));
    } else if (opts.format === 'png' || path.extname(inputPath).toLowerCase() === '.png') {
      plugins.push(imageminPngquant({ quality: [opts.quality! / 100, opts.quality! / 100] }));
    } else if (opts.format === 'webp' || path.extname(inputPath).toLowerCase() === '.webp') {
      plugins.push(imageminWebp({ quality: opts.quality }));
    } else if (path.extname(inputPath).toLowerCase() === '.gif') {
      plugins.push(imageminGifsicle());
    } else if (path.extname(inputPath).toLowerCase() === '.svg') {
      plugins.push(imageminSvgo());
    }

    const files = await imagemin([inputPath], { destination: path.dirname(outputPath), plugins });

    if (files.length === 0) {
      throw new Error('Falha na otimização com Imagemin');
    }

    const optimizedStats = await fs.stat(outputPath);
    const compressionRatio = ((originalStats.size - optimizedStats.size) / originalStats.size) * 100;

    // Obter dimensões
    const metadata = await sharp(outputPath).metadata();

    return {
      originalSize: originalStats.size,
      optimizedSize: optimizedStats.size,
      compressionRatio,
      format: opts.format || path.extname(inputPath).substring(1),
      dimensions: { width: metadata.width || 0, height: metadata.height || 0 },
      path: outputPath,
    };
  }

  /**
   * Cria múltiplas versões de uma imagem (formato original + WebP + AVIF)
   */
  static async createMultipleFormats(
    inputPath: string,
    outputDir: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizationResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const filename = path.basename(inputPath, path.extname(inputPath));
    const originalExt = path.extname(inputPath);

    // Criar diretório se não existir
    await fs.mkdir(outputDir, { recursive: true });

    // Versão original otimizada
    const originalOutputPath = path.join(outputDir, `${filename}${originalExt}`);
    const result = await this.optimizeWithSharp(inputPath, originalOutputPath, opts);

    // Versão WebP
    const webpPath = path.join(outputDir, `${filename}.webp`);
    await this.optimizeWithSharp(inputPath, webpPath, { ...opts, format: 'webp' });
    result.webpPath = webpPath;

    // Versão AVIF (se suportado)
    try {
      const avifPath = path.join(outputDir, `${filename}.avif`);
      await this.optimizeWithSharp(inputPath, avifPath, { ...opts, format: 'avif' });
      result.avifPath = avifPath;
    } catch (error) {
      console.warn('AVIF não suportado, pulando...');
    }

    return result;
  }

  /**
   * Gera thumbnails de diferentes tamanhos
   */
  static async generateThumbnails(
    inputPath: string,
    outputDir: string,
    sizes: Array<{ width: number; height?: number; suffix: string }>,
    options: ImageOptimizationOptions = {}
  ): Promise<Array<OptimizationResult>> {
    const results: Array<OptimizationResult> = [];

    await fs.mkdir(outputDir, { recursive: true });

    for (const size of sizes) {
      const filename = path.basename(inputPath, path.extname(inputPath));
      const ext = path.extname(inputPath);
      const outputPath = path.join(outputDir, `${filename}${size.suffix}${ext}`);

      const result = await this.optimizeWithSharp(inputPath, outputPath, {
        ...options,
        width: size.width,
        height: size.height || undefined,
      });

      results.push(result);
    }

    return results;
  }

  /**
   * Otimiza todas as imagens em um diretório
   */
  static async optimizeDirectory(
    inputDir: string,
    outputDir: string,
    options: ImageOptimizationOptions = {}
  ): Promise<Array<OptimizationResult>> {
    const results: Array<OptimizationResult> = [];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

    const files = await fs.readdir(inputDir);
    const imageFiles = files.filter((file) => imageExtensions.includes(path.extname(file).toLowerCase()));

    await fs.mkdir(outputDir, { recursive: true });

    for (const file of imageFiles) {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file);

      try {
        const result = await this.optimizeWithSharp(inputPath, outputPath, options);
        results.push(result);
        console.log(`✅ Otimizada: ${file} (${result.compressionRatio.toFixed(1)}% menor)`);
      } catch (error) {
        console.error(`❌ Erro ao otimizar ${file}:`, error);
      }
    }

    return results;
  }

  /**
   * Obtém informações de uma imagem
   */
  static async getImageInfo(
    imagePath: string
  ): Promise<{ width: number; height: number; format: string; size: number; hasAlpha: boolean; hasProfile: boolean }> {
    const stats = await fs.stat(imagePath);
    const metadata = await sharp(imagePath).metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: stats.size,
      hasAlpha: metadata.hasAlpha || false,
      hasProfile: metadata.hasProfile || false,
    };
  }

  /**
   * Verifica se uma imagem é válida
   */
  static async isValidImage(imagePath: string): Promise<boolean> {
    try {
      await sharp(imagePath).metadata();
      return true;
    } catch {
      return false;
    }
  }
}

// Configurações predefinidas para diferentes casos de uso
export const ImagePresets = {
  // Thumbnails
  thumbnail: { width: 150, height: 150, quality: 85, format: 'jpeg' as const, fit: 'cover' as const },

  // Cards de jogo
  gameCard: { width: 300, height: 200, quality: 90, format: 'jpeg' as const, fit: 'cover' as const },

  // Hero images
  hero: { width: 1200, height: 600, quality: 85, format: 'jpeg' as const, fit: 'cover' as const },

  // Galeria
  gallery: { width: 800, height: 600, quality: 90, format: 'jpeg' as const, fit: 'inside' as const },

  // Avatar
  avatar: { width: 100, height: 100, quality: 90, format: 'jpeg' as const, fit: 'cover' as const },

  // WebP otimizado
  webp: { quality: 80, format: 'webp' as const },

  // AVIF otimizado
  avif: { quality: 75, format: 'avif' as const },
};

export default ImageOptimizer;
