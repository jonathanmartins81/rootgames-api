/**
 * 🎮 Game Service - Serviço para Entidade de Jogos
 *
 * Este serviço estende o serviço padrão do Strapi com funcionalidades
 * específicas para o catálogo de jogos, incluindo:
 * - Integração com API GOG para importação de dados
 * - Otimização automática de imagens
 * - Criação de entidades relacionadas
 * - Processamento de metadados de jogos
 *
 * @author Jonathan Martins
 * @version 1.0.0
 * @since 2025
 */

import { factories } from '@strapi/strapi';
import axios from 'axios';
import FormData from 'form-data';
import { promises as fs } from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';
import qs from 'querystring';
import slugify from 'slugify';
import ImageOptimizer, { ImagePresets } from '../../../utils/imageOptimizer';

// 🔧 Constantes de Serviços
const gameService = 'api::game.game';
const publisherService = 'api::publisher.publisher';
const developerService = 'api::developer.developer';
const categoryService = 'api::category.category';
const platformService = 'api::platform.platform';

/**
 * 🛠️ Função de Tratamento de Exceções
 *
 * Padroniza o tratamento de erros em toda a aplicação
 *
 * @param e - Erro capturado
 * @returns Objeto com erro e dados relacionados
 */
function Exception(e: any): { e: any; data: any } {
  return {
    e,
    data: e.data && e.data.errors && e.data.errors,
  };
}

/**
 * 📖 Obter Informações do Jogo - Busca dados detalhados do GOG
 *
 * Faz scraping da página do jogo no GOG para obter:
 * - Descrição completa
 * - Descrição curta
 * - Classificação indicativa
 *
 * @param slug - Slug do jogo no GOG
 * @returns Objeto com informações do jogo
 */
async function getGameInfo(slug: string): Promise<any> {
  try {
    const gogSlug = slug.replaceAll('-', '_').toLowerCase();
    const gogUrl = `https://www.gog.com/game/${gogSlug}`;

    console.log(`🔍 Buscando informações do jogo: ${gogUrl}`);

    const body = await axios.get(gogUrl, {
      timeout: 10000, // Timeout de 10 segundos
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RootGames-Bot/1.0)',
      },
    });

    const dom = new JSDOM(body.data);

    // Extrair descrição
    const raw_description = dom.window.document.querySelector('.description');
    const description = raw_description?.innerHTML || '';
    const short_description = raw_description?.textContent?.slice(0, 160) || '';

    // Extrair classificação indicativa
    const ratingElement = dom.window.document.querySelector('.age-restrictions__icon use');
    const rating = ratingElement
      ? ratingElement?.getAttribute('xlink:href')?.replace(/_/g, '')?.replace('#', '') || 'BR0'
      : 'BR0';

    console.log(`✅ Informações extraídas para: ${slug}`);

    return {
      description,
      short_description,
      rating,
    };
  } catch (error) {
    console.error(`❌ Erro ao obter informações do jogo ${slug}:`, Exception(error));
    return {
      description: '',
      short_description: '',
      rating: 'BR0',
    };
  }
}

/**
 * 🔍 Buscar por Nome - Busca entidade por nome
 *
 * @param name - Nome da entidade
 * @param entityService - Serviço da entidade
 * @returns Entidade encontrada ou null
 */
async function getByName(name: string, entityService: string): Promise<any> {
  try {
    const item = await (strapi as any).service(entityService).find({
      filters: { name },
    });

    return item.results.length > 0 ? item.results[0] : null;
  } catch (error) {
    console.error(`❌ Erro ao buscar ${name} em ${entityService}:`, Exception(error));
    return null;
  }
}

/**
 * 🖼️ Otimizar e Fazer Upload de Imagem
 *
 * Processo completo de otimização de imagem:
 * 1. Download da imagem original
 * 2. Otimização com Sharp
 * 3. Criação de múltiplos formatos (JPEG, WebP, AVIF)
 * 4. Upload para o Strapi
 * 5. Limpeza de arquivos temporários
 *
 * @param imageUrl - URL da imagem original
 * @param gameSlug - Slug do jogo
 * @param field - Campo da imagem (cover, gallery, etc.)
 */
async function optimizeAndUploadImage(imageUrl: string, gameSlug: string, field: string = 'cover'): Promise<void> {
  try {
    console.log(`📸 Iniciando otimização de ${field} para: ${gameSlug}`);

    // 📥 Download da imagem
    const { data } = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
    });
    const buffer = Buffer.from(data, 'binary');

    // 📁 Criar diretório temporário para otimização
    const tempDir = path.join(process.cwd(), '.tmp', 'images', gameSlug);
    await fs.mkdir(tempDir, { recursive: true });

    const tempImagePath = path.join(tempDir, `${field}_original.jpg`);
    await fs.writeFile(tempImagePath, buffer);

    // ⚙️ Configurar opções de otimização baseadas no campo
    let optimizationOptions;
    switch (field) {
      case 'cover':
        optimizationOptions = ImagePresets.gameCard;
        break;
      case 'gallery':
        optimizationOptions = ImagePresets.gallery;
        break;
      default:
        optimizationOptions = ImagePresets.gameCard;
    }

    // 🔧 Criar versões otimizadas
    const optimizedDir = path.join(tempDir, 'optimized');
    const result = await ImageOptimizer.createMultipleFormats(tempImagePath, optimizedDir, optimizationOptions);

    // 📤 Upload da versão principal (JPEG)
    const formData: any = new FormData();
    const optimizedImageBuffer = await fs.readFile(result.path);

    formData.append('refId', gameSlug);
    formData.append('ref', `${gameService}`);
    formData.append('field', field);
    formData.append('files', optimizedImageBuffer, { filename: `${gameSlug}_${field}.jpg` });

    console.log(`📤 Fazendo upload da imagem ${field}: ${gameSlug}_${field}.jpg`);

    await axios({
      method: 'POST',
      url: `http://localhost:1337/api/upload/`,
      data: formData,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
      },
      timeout: 30000,
    });

    // 📤 Upload da versão WebP se disponível
    if (result.webpPath) {
      const webpFormData: any = new FormData();
      const webpBuffer = await fs.readFile(result.webpPath);

      webpFormData.append('refId', gameSlug);
      webpFormData.append('ref', `${gameService}`);
      webpFormData.append('field', `${field}_webp`);
      webpFormData.append('files', webpBuffer, { filename: `${gameSlug}_${field}.webp` });

      await axios({
        method: 'POST',
        url: `http://localhost:1337/api/upload/`,
        data: webpFormData,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${webpFormData._boundary}`,
        },
        timeout: 30000,
      });
    }

    // 🧹 Limpar arquivos temporários
    await fs.rm(tempDir, { recursive: true, force: true });

    console.log(`✅ Otimização de ${field} concluída para: ${gameSlug}`);
  } catch (error) {
    console.error(`❌ Erro na otimização de ${field} para ${gameSlug}:`, Exception(error));
  }
}

/**
 * 🎮 Criar Jogos - Processa lista de produtos da API GOG
 *
 * Para cada produto:
 * 1. Verifica se já existe
 * 2. Cria entidades relacionadas (categorias, plataformas, etc.)
 * 3. Cria o jogo com metadados
 * 4. Otimiza e faz upload das imagens
 *
 * @param products - Lista de produtos da API GOG
 */
async function createGames(products: any[]): Promise<void> {
  console.log(`🎮 Processando ${products.length} jogos...`);

  await Promise.all(
    products.map(async (product, index) => {
      try {
        console.log(`🔄 Processando ${index + 1}/${products.length}: ${product.title}`);

        const item = await getByName(product.title, gameService);

        if (!item) {
          // 🏷️ Criar entidades relacionadas
          const categories = await Promise.all(
            product.genres.map(({ name }: { name: string }) => getByName(name, categoryService))
          );

          const platforms = await Promise.all(
            product.operatingSystems.map((name: string) => getByName(name, platformService))
          );

          const developers = await Promise.all(
            product.developers.map((name: string) => getByName(name, developerService))
          );

          const publishers = await Promise.all(
            product.publishers.map((name: string) => getByName(name, publisherService))
          );

          // 📝 Criar o jogo
          const game = await (strapi as any).service(gameService).create({
            data: {
              name: product.title,
              slug: slugify(product.title, { strict: true, lower: true }),
              price: product.price.finalMoney.amount,
              release_date: new Date(product.releaseDate),
              categories,
              platforms,
              developers,
              publisher: publishers[0] || null, // Primeiro publisher ou null
              ...(await getGameInfo(product.slug)),
              publishedAt: new Date(),
            },
          });

          console.log(`✅ Jogo criado: ${game.name}`);

          // 🖼️ Processar imagens
          if (product.coverHorizontal) {
            await optimizeAndUploadImage(product.coverHorizontal, game.slug, 'cover');
          }

          // 🖼️ Processar galeria (máximo 5 imagens)
          await Promise.all(
            product.screenshots
              .slice(0, 5)
              .map((url: string, index: number) =>
                optimizeAndUploadImage(
                  `${url.replace('{formatter}', 'product_card_v2_mobile_slider_639')}`,
                  game.slug,
                  `gallery_${index + 1}`
                )
              )
          );
        } else {
          console.log(`⏭️ Jogo já existe: ${product.title}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao processar ${product.title}:`, Exception(error));
      }
    })
  );

  console.log(`🎉 Processamento de ${products.length} jogos concluído!`);
}

/**
 * 🎮 Game Service - Serviço principal
 */
export default factories.createCoreService(gameService, () => ({
  /**
   * 📥 Popular Jogos - Importa jogos da API GOG
   *
   * @param params - Parâmetros da API GOG (limit, order, etc.)
   */
  async populate(params: any): Promise<void> {
    try {
      const gogApiUrl = `https://catalog.gog.com/v1/catalog?${qs.stringify(params)}`;

      console.log(`🌐 Conectando com API GOG: ${gogApiUrl}`);

      const {
        data: { products },
      } = await axios.get(gogApiUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RootGames-Bot/1.0)',
        },
      });

      console.log(`📦 Recebidos ${products.length} produtos da API GOG`);

      await createGames(products);

      console.log('🎉 População de jogos concluída com sucesso!');
    } catch (error) {
      console.error('❌ Erro na população de jogos:', Exception(error));
      throw error;
    }
  },

  /**
   * 🖼️ Otimizar Imagens Existentes - Reprocessa todas as imagens
   *
   * Método para otimizar imagens de jogos já existentes no banco
   */
  async optimizeExistingImages(): Promise<void> {
    try {
      const games = await (strapi as any).service(gameService).find({
        populate: ['cover', 'gallery'],
      });

      console.log(`🔄 Iniciando otimização para ${games.results.length} jogos...`);

      for (const game of games.results) {
        try {
          console.log(`📸 Processando imagens de: ${game.name}`);

          // 🖼️ Otimizar imagem de capa
          if (game.cover?.url) {
            console.log(`📸 Otimizando capa para: ${game.name}`);
            await optimizeAndUploadImage(game.cover.url, game.slug, 'cover');
          }

          // 🖼️ Otimizar imagens da galeria
          if (game.gallery && game.gallery.length > 0) {
            for (let i = 0; i < game.gallery.length; i++) {
              const image = game.gallery[i];
              if (image.url) {
                console.log(`📸 Otimizando imagem ${i + 1} da galeria para: ${game.name}`);
                await optimizeAndUploadImage(image.url, game.slug, `gallery_${i + 1}`);
              }
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao processar imagens de ${game.name}:`, Exception(error));
        }
      }

      console.log('✅ Otimização de imagens concluída para todos os jogos!');
    } catch (error) {
      console.error('❌ Erro na otimização de imagens:', Exception(error));
      throw error;
    }
  },
}));
