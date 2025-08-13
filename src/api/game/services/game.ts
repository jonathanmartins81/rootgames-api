/**
 * game service
 */
import { factories } from '@strapi/strapi';
import axios from 'axios';
import FormData from 'form-data';
import { JSDOM } from 'jsdom';
import qs from 'querystring';
import slugify from 'slugify';

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

async function setImage({ image, game, field = 'cover' }: { image: string; game: any; field?: string }): Promise<void> {
  const { data } = await axios.get(image, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(data, 'base64');

  const formData: any = new FormData();

  formData.append('refId', game.id);
  formData.append('ref', `${gameService}`);
  formData.append('field', field);
  formData.append('files', buffer, { filename: `${game.slug}.jpg` });

  console.info(`Uploading ${field} image: ${game.slug}.jpg`);

  try {
    await axios({
      method: 'POST',
      url: `http://localhost:1337/api/upload/`,
      data: formData,
      headers: { 'Content-Type': `multipart/form-data; boundary=${formData._boundary}` },
    });
  } catch (error) {
    console.log('setImage:', Exception(error));
  }
}

async function createGames(products: any[]): Promise<void> {
  await Promise.all(
    products.map(async (product) => {
      const item = await getByName(product.title, gameService);

      if (!item) {
        await (strapi as any).service(gameService).create({
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

        await Promise.all(
          product.screenshots.slice(0, 5).map((url: string) =>
            setImage({
              image: `${url.replace('{formatter}', 'product_card_v2_mobile_slider_639')}`,
              game: item,
              field: 'gallery',
            })
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
      console.log('populate:', 'Finished populating games!');
    } catch (error) {
      console.log('populate:', Exception(error));
    }
  },
}));
