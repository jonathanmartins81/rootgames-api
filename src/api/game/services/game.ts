/**
 * game service
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

const gameService = 'api::game.game';
const publisherService = 'api::publisher.publisher';
const developerService = 'api::developer.developer';
const categoryService = 'api::category.category';
const platformService = 'api::platform.platform';

function Exception(e: any): { e: any; data: any } {
  return { e, data: e.data && e.data.errors && e.data.errors };
}

async function getGameInfo(slug: string): Promise<any> {
  try {
    const gogSlug = slug.replaceAll('-', '_').toLowerCase();

    const body = await axios.get(`https://www.gog.com/game/${gogSlug}`);
    const dom = new JSDOM(body.data);

    const raw_description = dom.window.document.querySelector('.description');

    const description = raw_description?.innerHTML || '';
    const short_description = raw_description?.textContent?.slice(0, 160) || '';

    const ratingElement = dom.window.document.querySelector('.age-restrictions__icon use');

    return {
      description,
      short_description,
      rating: ratingElement
        ? ratingElement?.getAttribute('xlink:href')?.replace(/_/g, '')?.replace('#', '') || 'BR0'
        : 'BR0',
    };
  } catch (error) {
    console.log('getGameInfo:', Exception(error));
  }
}

async function getByName(name: string, entityService: string): Promise<any> {
  try {
    const item = await (strapi as any).service(entityService).find({ filters: { name } });

    return item.results.length > 0 ? item.results[0] : null;
  } catch (error) {
    console.log('getByName:', Exception(error));
  }
}

async function optimizeAndUploadImage(imageUrl: string, gameSlug: string, field: string = 'cover'): Promise<void> {
  try {
    // Download da imagem
    const { data } = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(data, 'binary');

    // Criar diretório temporário para otimização
    const tempDir = path.join(process.cwd(), '.tmp', 'images', gameSlug);
    await fs.mkdir(tempDir, { recursive: true });

    const tempImagePath = path.join(tempDir, `${field}_original.jpg`);
    await fs.writeFile(tempImagePath, buffer);

    // Otimizar imagem baseada no campo
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

    // Criar versões otimizadas
    const optimizedDir = path.join(tempDir, 'optimized');
    const result = await ImageOptimizer.createMultipleFormats(tempImagePath, optimizedDir, optimizationOptions);

    // Upload da versão principal (JPEG)
    const formData: any = new FormData();

    const optimizedImageBuffer = await fs.readFile(result.path);
    formData.append('refId', gameSlug);
    formData.append('ref', `${gameService}`);
    formData.append('field', field);
    formData.append('files', optimizedImageBuffer, { filename: `${gameSlug}_${field}.jpg` });

    console.info(`📸 Uploading optimized ${field} image: ${gameSlug}_${field}.jpg`);

    await axios({
      method: 'POST',
      url: `http://localhost:1337/api/upload/`,
      data: formData,
      headers: { 'Content-Type': `multipart/form-data; boundary=${formData._boundary}` },
    });

    // Upload da versão WebP se disponível
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
        headers: { 'Content-Type': `multipart/form-data; boundary=${webpFormData._boundary}` },
      });
    }

    // Limpar arquivos temporários
    await fs.rm(tempDir, { recursive: true, force: true });

    console.log(`✅ Image optimization completed for ${gameSlug} ${field}`);
  } catch (error) {
    console.log('optimizeAndUploadImage:', Exception(error));
  }
}

async function createGames(products: any[]): Promise<void> {
  await Promise.all(
    products.map(async product => {
      const item = await getByName(product.title, gameService);

      if (!item) {
        const game = await (strapi as any).service(gameService).create({
          data: {
            name: product.title,
            slug: slugify(product.title, { strict: true, lower: true }),
            price: product.price.finalMoney.amount,
            release_date: new Date(product.releaseDate),
            categories: await Promise.all(
              product.genres.map(({ name }: { name: string }) => getByName(name, categoryService))
            ),
            platforms: await Promise.all(
              product.operatingSystems.map((name: string) => getByName(name, platformService))
            ),
            developers: await Promise.all(product.developers.map((name: string) => getByName(name, developerService))),
            publisher: await Promise.all(product.publishers.map((name: string) => getByName(name, publisherService))),
            ...(await getGameInfo(product.slug)),
            publishedAt: new Date(),
          },
        });

        // Upload da imagem de capa otimizada
        if (product.coverHorizontal) {
          await optimizeAndUploadImage(product.coverHorizontal, game.slug, 'cover');
        }

        // Upload das imagens da galeria otimizadas
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
      }
    })
  );
}

export default factories.createCoreService(gameService, () => ({
  async populate(params: any): Promise<void> {
    try {
      const gogApiUrl = `https://catalog.gog.com/v1/catalog?${qs.stringify(params)}`;
      const {
        data: { products },
      } = await axios.get(gogApiUrl);

      await createGames(products);
      console.log('populate:', 'Finished populating games with optimized images!');
    } catch (error) {
      console.log('populate:', Exception(error));
    }
  },

  // Novo método para otimizar imagens existentes
  async optimizeExistingImages(): Promise<void> {
    try {
      const games = await (strapi as any).service(gameService).find({ populate: ['cover', 'gallery'] });

      console.log(`🔄 Starting optimization for ${games.results.length} games...`);

      for (const game of games.results) {
        if (game.cover?.url) {
          console.log(`📸 Optimizing cover for: ${game.name}`);
          await optimizeAndUploadImage(game.cover.url, game.slug, 'cover');
        }

        if (game.gallery && game.gallery.length > 0) {
          for (let i = 0; i < game.gallery.length; i++) {
            const image = game.gallery[i];
            if (image.url) {
              console.log(`📸 Optimizing gallery image ${i + 1} for: ${game.name}`);
              await optimizeAndUploadImage(image.url, game.slug, `gallery_${i + 1}`);
            }
          }
        }
      }

      console.log('✅ Image optimization completed for all games!');
    } catch (error) {
      console.log('optimizeExistingImages:', Exception(error));
    }
  },
}));
