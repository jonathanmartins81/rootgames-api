/**
 * 🖼️ RootGames - Utilitário de Otimização de Imagens
 *
 * Este arquivo contém utilitários para otimização e processamento de imagens:
 * - Otimização com Sharp (principal)
 * - Geração de múltiplos formatos
 * - Criação de thumbnails
 * - Processamento em lote
 * - Validação de imagens
 *
 * @author Jonathan Martins
 * @version 1.0.0
 * @since 2025
 */

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

/**
 * ⚙️ Interface - Opções de Otimização de Imagem
 *
 * Define todas as opções disponíveis para otimização de imagens
 */
export interface ImageOptimizationOptions {
  quality?: number; // Qualidade da imagem (0-100)
  width?: number; // Largura desejada
  height?: number | undefined; // Altura desejada
  format?: 'jpeg' | 'png' | 'webp' | 'avif'; // Formato de saída
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'; // Modo de redimensionamento
  position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'center'; // Posição do crop
  background?: string; // Cor de fundo para transparência
  blur?: number; // Intensidade do blur
  sharpen?: number; // Intensidade do sharpen
  grayscale?: boolean; // Converter para escala de cinza
  flip?: boolean; // Inverter verticalmente
  flop?: boolean; // Inverter horizontalmente
  rotate?: number; // Rotação em graus
  tint?: string; // Cor de tint
  negate?: boolean; // Negativar cores
  normalize?: boolean; // Normalizar histograma
  median?: number; // Filtro mediano
  modulate?: {
    // Modulação de cores
    brightness?: number;
    saturation?: number;
    hue?: number;
  };
}

/**
 * 📊 Interface - Resultado da Otimização
 *
 * Resultado detalhado do processo de otimização
 */
export interface OptimizationResult {
  originalSize: number; // Tamanho original em bytes
  optimizedSize: number; // Tamanho otimizado em bytes
  compressionRatio: number; // Percentual de compressão
  format: string; // Formato final
  dimensions: { width: number; height: number }; // Dimensões finais
  path: string; // Caminho do arquivo otimizado
  webpPath?: string; // Caminho da versão WebP (se gerada)
  avifPath?: string; // Caminho da versão AVIF (se gerada)
}

/**
 * 🖼️ Classe - Otimizador de Imagens
 *
 * Classe principal para otimização e processamento de imagens
 */
export class ImageOptimizer {
  // Opções padrão para otimização
  private static readonly DEFAULT_OPTIONS: ImageOptimizationOptions = {
    quality: 85, // Qualidade padrão
    format: 'jpeg', // Formato padrão
    fit: 'cover', // Modo de redimensionamento padrão
  };

  /**
   * 🔧 Método - Otimização com Sharp
   *
   * Otimiza imagem usando a biblioteca Sharp (mais rápida e eficiente)
   *
   * @param inputPath - Caminho da imagem de entrada
   * @param outputPath - Caminho da imagem de saída
   * @param options - Opções de otimização
   * @returns Promise com resultado da otimização
   */
  static async optimizeWithSharp(
    inputPath: string,
    outputPath: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizationResult> {
    try {
      // eslint-disable-next-line no-console
      console.log(`🖼️ Otimizando imagem: ${path.basename(inputPath)}`);

      // Obter informações da imagem original
      const originalStats = await fs.stat(inputPath);
      const originalSize = originalStats.size;

      // Configurar pipeline do Sharp
      let sharpInstance = sharp(inputPath);

      // Aplicar redimensionamento se especificado
      if (options.width || options.height) {
        sharpInstance = sharpInstance.resize({
          width: options.width,
          height: options.height,
          fit: options.fit || 'cover',
          position: options.position || 'center',
          background: options.background,
        });
      }

      // Aplicar efeitos visuais
      if (options.blur) {
        sharpInstance = sharpInstance.blur(options.blur);
      }

      if (options.sharpen) {
        sharpInstance = sharpInstance.sharpen(options.sharpen);
      }

      if (options.grayscale) {
        sharpInstance = sharpInstance.grayscale();
      }

      if (options.flip) {
        sharpInstance = sharpInstance.flip();
      }

      if (options.flop) {
        sharpInstance = sharpInstance.flop();
      }

      if (options.rotate) {
        sharpInstance = sharpInstance.rotate(options.rotate);
      }

      if (options.tint) {
        sharpInstance = sharpInstance.tint(options.tint);
      }

      if (options.negate) {
        sharpInstance = sharpInstance.negate();
      }

      if (options.normalize) {
        sharpInstance = sharpInstance.normalize();
      }

      if (options.median) {
        sharpInstance = sharpInstance.median(options.median);
      }

      if (options.modulate) {
        sharpInstance = sharpInstance.modulate(options.modulate);
      }

      // Configurar formato de saída
      const format = options.format || 'jpeg';
      const quality = options.quality || 85;

      switch (format) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({ quality });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality });
          break;
        case 'avif':
          sharpInstance = sharpInstance.avif({ quality });
          break;
        default:
          sharpInstance = sharpInstance.jpeg({ quality });
      }

      // Processar e salvar imagem
      await sharpInstance.toFile(outputPath);

      // Obter estatísticas da imagem otimizada
      const optimizedStats = await fs.stat(outputPath);
      const optimizedSize = optimizedStats.size;

      // Calcular taxa de compressão
      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

      // Obter dimensões finais
      const finalMetadata = await sharp(outputPath).metadata();
      const finalDimensions = {
        width: finalMetadata.width || 0,
        height: finalMetadata.height || 0,
      };

      // eslint-disable-next-line no-console
      console.log(`✅ Otimização concluída: ${compressionRatio.toFixed(1)}% de compressão`);

      return {
        originalSize,
        optimizedSize,
        compressionRatio,
        format,
        dimensions: finalDimensions,
        path: outputPath,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`❌ Erro na otimização: ${error}`);
      throw error;
    }
  }

  /**
   * 🔧 Método - Criar Múltiplos Formatos
   *
   * Gera versões da imagem em diferentes formatos (JPEG, WebP, AVIF)
   *
   * @param inputPath - Caminho da imagem de entrada
   * @param outputDir - Diretório de saída
   * @param options - Opções de otimização
   * @returns Promise com resultado da otimização
   */
  static async createMultipleFormats(
    inputPath: string,
    outputDir: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizationResult> {
    try {
      // eslint-disable-next-line no-console
      console.log(`🖼️ Criando múltiplos formatos: ${path.basename(inputPath)}`);

      // Garantir que o diretório de saída existe
      await fs.mkdir(outputDir, { recursive: true });

      // Nome base do arquivo
      const baseName = path.basename(inputPath, path.extname(inputPath));

      // Gerar versão JPEG
      const jpegPath = path.join(outputDir, `${baseName}.jpg`);
      const jpegResult = await this.optimizeWithSharp(inputPath, jpegPath, {
        ...options,
        format: 'jpeg',
      });

      // Gerar versão WebP
      let webpPath: string | undefined;
      try {
        webpPath = path.join(outputDir, `${baseName}.webp`);
        await this.optimizeWithSharp(inputPath, webpPath, {
          ...options,
          format: 'webp',
        });
        console.log(`✅ WebP criado com sucesso: ${webpPath}`);
      } catch (error) {
        console.warn(`⚠️ WebP não suportado ou erro na criação: ${error}`);
        webpPath = undefined;
      }

      // Gerar versão AVIF (se suportado)
      let avifPath: string | undefined;
      try {
        avifPath = path.join(outputDir, `${baseName}.avif`);
        await this.optimizeWithSharp(inputPath, avifPath, {
          ...options,
          format: 'avif',
        });
        console.log(`✅ AVIF criado com sucesso: ${avifPath}`);
      } catch (error) {
        console.warn(`⚠️ AVIF não suportado: ${error}`);
        avifPath = undefined;
      }

      console.log(
        `✅ Múltiplos formatos criados: JPEG, ${webpPath ? 'WebP' : 'WebP (falhou)'}${avifPath ? ', AVIF' : ', AVIF (falhou)'}`
      );

      return {
        ...jpegResult,
        ...(webpPath && { webpPath }),
        ...(avifPath && { avifPath }),
      };
    } catch (error) {
      console.error(`❌ Erro ao criar múltiplos formatos: ${error}`);
      throw error;
    }
  }

  /**
   * 🔧 Método - Gerar Thumbnails
   *
   * Cria thumbnails em diferentes tamanhos para uma imagem
   *
   * @param inputPath - Caminho da imagem de entrada
   * @param outputDir - Diretório de saída
   * @param sizes - Array com tamanhos desejados
   * @param options - Opções de otimização
   * @returns Promise com array de resultados
   */
  static async generateThumbnails(
    inputPath: string,
    outputDir: string,
    sizes: Array<{ width: number; height?: number; suffix: string }>,
    options: ImageOptimizationOptions = {}
  ): Promise<Array<OptimizationResult>> {
    try {
      console.log(`🖼️ Gerando thumbnails: ${path.basename(inputPath)}`);

      // Garantir que o diretório de saída existe
      await fs.mkdir(outputDir, { recursive: true });

      const results: Array<OptimizationResult> = [];

      // Gerar thumbnail para cada tamanho
      for (const size of sizes) {
        const outputPath = path.join(
          outputDir,
          `${path.basename(inputPath, path.extname(inputPath))}_${size.suffix}${path.extname(inputPath)}`
        );

        const result = await this.optimizeWithSharp(inputPath, outputPath, {
          ...options,
          width: size.width,
          height: size.height,
        });

        results.push(result);
      }

      console.log(`✅ ${results.length} thumbnails gerados`);

      return results;
    } catch (error) {
      console.error(`❌ Erro ao gerar thumbnails: ${error}`);
      throw error;
    }
  }

  /**
   * 🔧 Método - Otimizar Diretório
   *
   * Otimiza todas as imagens em um diretório
   *
   * @param inputDir - Diretório de entrada
   * @param outputDir - Diretório de saída
   * @param options - Opções de otimização
   * @returns Promise com array de resultados
   */
  static async optimizeDirectory(
    inputDir: string,
    outputDir: string,
    options: ImageOptimizationOptions = {}
  ): Promise<Array<OptimizationResult>> {
    try {
      // eslint-disable-next-line no-console
      console.log(`🖼️ Otimizando diretório: ${inputDir}`);

      // Garantir que o diretório de saída existe
      await fs.mkdir(outputDir, { recursive: true });

      // Listar arquivos de imagem
      const files = await fs.readdir(inputDir);
      const imageFiles = files.filter(file => /\.(jpg|jpeg|png|webp|gif|bmp|tiff)$/i.test(file));

      const results: Array<OptimizationResult> = [];

      // Otimizar cada imagem
      for (const file of imageFiles) {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, file);

        try {
          const result = await this.optimizeWithSharp(inputPath, outputPath, options);
          results.push(result);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`❌ Erro ao otimizar ${file}: ${error}`);
        }
      }

      // eslint-disable-next-line no-console
      console.log(`✅ ${results.length} imagens otimizadas`);

      return results;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`❌ Erro ao otimizar diretório: ${error}`);
      throw error;
    }
  }

  /**
   * 🔍 Método - Obter Informações da Imagem
   *
   * Obtém informações detalhadas sobre uma imagem
   *
   * @param imagePath - Caminho da imagem
   * @returns Promise com informações da imagem
   */
  static async getImageInfo(
    imagePath: string
  ): Promise<{ width: number; height: number; format: string; size: number; hasAlpha: boolean; hasProfile: boolean }> {
    try {
      // Obter estatísticas do arquivo
      const stats = await fs.stat(imagePath);

      // Obter metadados da imagem
      const metadata = await sharp(imagePath).metadata();

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: stats.size,
        hasAlpha: metadata.hasAlpha || false,
        hasProfile: metadata.hasProfile || false,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`❌ Erro ao obter informações da imagem: ${error}`);
      throw error;
    }
  }

  /**
   * ✅ Método - Validar Imagem
   *
   * Verifica se um arquivo é uma imagem válida
   *
   * @param imagePath - Caminho da imagem
   * @returns Promise com boolean indicando se é válida
   */
  static async isValidImage(imagePath: string): Promise<boolean> {
    try {
      await sharp(imagePath).metadata();
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * ⚙️ Configurações Predefinidas - Presets para diferentes casos de uso
 *
 * Configurações otimizadas para diferentes tipos de imagem e contextos
 */
export const ImagePresets = {
  // 📱 Thumbnails pequenos
  thumbnail: {
    width: 150,
    height: 150,
    quality: 85,
    format: 'jpeg' as const,
    fit: 'cover' as const,
  },

  // 🎮 Cards de jogo
  gameCard: {
    width: 300,
    height: 200,
    quality: 90,
    format: 'jpeg' as const,
    fit: 'cover' as const,
  },

  // 🖼️ Hero images (banners)
  hero: {
    width: 1200,
    height: 600,
    quality: 85,
    format: 'jpeg' as const,
    fit: 'cover' as const,
  },

  // 🖼️ Galeria
  gallery: {
    width: 800,
    height: 600,
    quality: 90,
    format: 'jpeg' as const,
    fit: 'inside' as const,
  },

  // 👤 Avatar
  avatar: {
    width: 100,
    height: 100,
    quality: 90,
    format: 'jpeg' as const,
    fit: 'cover' as const,
  },

  // 🌐 WebP otimizado
  webp: {
    quality: 80,
    format: 'webp' as const,
  },

  // 🆕 AVIF otimizado
  avif: {
    quality: 75,
    format: 'avif' as const,
  },
};

export default ImageOptimizer;
