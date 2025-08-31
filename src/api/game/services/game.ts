/**
 * game service
 */
import { factories } from '@strapi/strapi';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import qs from 'querystring';
import slugify from 'slugify';

const gameService = 'api::game.game';
const publisherService = 'api::publisher.publisher';
const developerService = 'api::developer.developer';
const categoryService = 'api::category.category';
const platformService = 'api::platform.platform';

// Lista específica de jogos fornecida pelo usuário
const TARGET_GAMES = [
  'Cyberpunk 2077',
  'The Witcher 3: Wild Hunt',
  'Divinity: Original Sin 2',
  'Fallout 4: Game of the Year Edition',
  'DOOM Eternal',
  'Stardew Valley',
  'Dark Souls III',
  'Hades',
  'Disco Elysium',
  "Sid Meier's Civilization VI",
  "Baldur's Gate 3",
  'Control Ultimate Edition',
  'Monster Hunter: World',
  'Hollow Knight',
  'Payday 2',
  'Hotline Miami',
  'Dragon Age: Origins',
  'Subnautica',
  "No Man's Sky",
  'Shadowrun Trilogy',
  'Pillars of Eternity',
  'Dead Cells',
  'The Long Dark',
  'Frostpunk',
  'Age of Wonders III',
  'Into the Breach',
  'Ori and the Will of the Wisps',
  'Metro Exodus',
  'Outer Wilds',
  'GreedFall',
  'Kingdom Come: Deliverance',
  'Torchlight II',
  'Celeste',
  'Project Zomboid',
  'Slay the Spire',
  'Deus Ex: Mankind Divided',
  'Warhammer: Vermintide 2',
  'Papers, Please',
  'THIEF Gold Edition',
  'The Outer Worlds',
  'Euro Truck Simulator 2',
  'Factorio',
  'Frostpunk: Game of the Year Edition',
  'Pillars of Eternity II: Deadfire',
  'System Shock: Enhanced Edition',
  'Vampire: The Masquerade - Bloodlines',
  'Dead Island Definitive Edition',
  'Age of Empires II: Definitive Edition',
  'Divinity: Original Sin - Enhanced Edition',
  'The Talos Principle',
  'Shadow Warrior 2',
  'Jurassic Park: The Game',
  'Resident Evil 2',
];

// Mapeamento de nomes para slugs da GOG
const GAME_SLUGS = {
  'Cyberpunk 2077': 'cyberpunk_2077',
  'The Witcher 3: Wild Hunt': 'the_witcher_3_wild_hunt',
  'Divinity: Original Sin 2': 'divinity_original_sin_2',
  'Fallout 4: Game of the Year Edition': 'fallout_4_game_of_the_year_edition',
  'DOOM Eternal': 'doom_eternal',
  'Stardew Valley': 'stardew_valley',
  'Dark Souls III': 'dark_souls_iii',
  Hades: 'hades',
  'Disco Elysium': 'disco_elysium',
  "Sid Meier's Civilization VI": 'sid_meiers_civilization_vi',
  "Baldur's Gate 3": 'baldurs_gate_3',
  'Control Ultimate Edition': 'control_ultimate_edition',
  'Monster Hunter: World': 'monster_hunter_world',
  'Hollow Knight': 'hollow_knight',
  'Payday 2': 'payday_2',
  'Hotline Miami': 'hotline_miami',
  'Dragon Age: Origins': 'dragon_age_origins',
  Subnautica: 'subnautica',
  "No Man's Sky": 'no_mans_sky',
  'Shadowrun Trilogy': 'shadowrun_trilogy',
  'Pillars of Eternity': 'pillars_of_eternity',
  'Dead Cells': 'dead_cells',
  'The Long Dark': 'the_long_dark',
  Frostpunk: 'frostpunk',
  'Age of Wonders III': 'age_of_wonders_iii',
  'Into the Breach': 'into_the_breach',
  'Ori and the Will of the Wisps': 'ori_and_the_will_of_the_wisps',
  'Metro Exodus': 'metro_exodus',
  'Outer Wilds': 'outer_wilds',
  GreedFall: 'greedfall',
  'Kingdom Come: Deliverance': 'kingdom_come_deliverance',
  'Torchlight II': 'torchlight_ii',
  Celeste: 'celeste',
  'Project Zomboid': 'project_zomboid',
  'Slay the Spire': 'slay_the_spire',
  'Deus Ex: Mankind Divided': 'deus_ex_mankind_divided',
  'Warhammer: Vermintide 2': 'warhammer_vermintide_2',
  'Papers, Please': 'papers_please',
  'THIEF Gold Edition': 'thief_gold_edition',
  'The Outer Worlds': 'the_outer_worlds',
  'Euro Truck Simulator 2': 'euro_truck_simulator_2',
  Factorio: 'factorio',
  'Frostpunk: Game of the Year Edition': 'frostpunk_game_of_the_year_edition',
  'Pillars of Eternity II: Deadfire': 'pillars_of_eternity_ii_deadfire',
  'System Shock: Enhanced Edition': 'system_shock_enhanced_edition',
  'Vampire: The Masquerade - Bloodlines': 'vampire_the_masquerade_bloodlines',
  'Dead Island Definitive Edition': 'dead_island_definitive_edition',
  'Age of Empires II: Definitive Edition': 'age_of_empires_ii_definitive_edition',
  'Divinity: Original Sin - Enhanced Edition': 'divinity_original_sin_enhanced_edition',
  'The Talos Principle': 'the_talos_principle',
  'Shadow Warrior 2': 'shadow_warrior_2',
  'Jurassic Park: The Game': 'jurassic_park_the_game',
  'Resident Evil 2': 'resident_evil_2',
};

function Exception(e: unknown) {
  const error = e as any;
  return { e, data: error.data && error.data.errors && error.data.errors };
}

async function getGameInfo(slug: string) {
  try {
    const gogSlug = slug.replaceAll('-', '_').toLowerCase();

    const body = await axios.get(`https://www.gog.com/game/${gogSlug}`);
    const dom = new JSDOM(body.data);

    const raw_description = dom.window.document.querySelector('.description');

    if (!raw_description) {
      return {
        description: '',
        short_description: '',
        rating: 'BR0',
      };
    }

    const description = raw_description.innerHTML || '';
    const short_description = (raw_description.textContent || '').slice(0, 160);

    const ratingElement = dom.window.document.querySelector('.age-restrictions__icon use');

    return {
      description,
      short_description,
      rating: ratingElement
        ? ratingElement.getAttribute('xlink:href')?.replace(/_/g, '')?.replace('#', '') || 'BR0'
        : 'BR0',
    };
  } catch (error) {
    console.log('getGameInfo:', Exception(error));
    return {
      description: '',
      short_description: '',
      rating: 'BR0',
    };
  }
}

async function getByName(name: string, entityService: string) {
  try {
    const item = await strapi.service(entityService as any).find({
      filters: { name },
    });

    return item.results.length > 0 ? item.results[0] : null;
  } catch (error) {
    console.log('getByName:', Exception(error));
    return null;
  }
}

async function create(name: string, entityService: string) {
  try {
    const item = await getByName(name, entityService);

    if (!item) {
      await strapi.service(entityService as any).create({
        data: {
          name,
          slug: slugify(name, { strict: true, lower: true }),
        },
      });
    }
  } catch (error) {
    console.log('create:', Exception(error));
  }
}

interface Product {
  title: string;
  slug: string;
  price: { finalMoney: { amount: number } };
  releaseDate: string;
  coverHorizontal?: string;
  screenshots?: string[];
  developers?: string[];
  publishers?: string[];
  genres?: Array<{ name: string }>;
  operatingSystems?: string[];
}

async function createManyToManyData(products: Product[]) {
  const developersSet = new Set<string>();
  const publishersSet = new Set<string>();
  const categoriesSet = new Set<string>();
  const platformsSet = new Set<string>();

  products.forEach(product => {
    const { developers, publishers, genres, operatingSystems } = product;

    genres?.forEach(({ name }: { name: string }) => {
      categoriesSet.add(name);
    });

    operatingSystems?.forEach((item: string) => {
      platformsSet.add(item);
    });

    developers?.forEach((item: string) => {
      developersSet.add(item);
    });

    publishers?.forEach((item: string) => {
      publishersSet.add(item);
    });
  });

  const createCall = (set: Set<string>, entityName: string) => Array.from(set).map(name => create(name, entityName));

  return Promise.all([
    ...createCall(developersSet, developerService),
    ...createCall(publishersSet, publisherService),
    ...createCall(categoriesSet, categoryService),
    ...createCall(platformsSet, platformService),
  ]);
}

interface Game {
  id: number;
  name: string;
  [key: string]: unknown;
}

async function setImage({ image, game, field = 'cover' }: { image: string; game: Game; field?: string }) {
  try {
    console.info(`🖼️  Baixando imagem: ${image}`);

    // Baixar a imagem
    const { data } = await axios.get(image, {
      responseType: 'arraybuffer',
      timeout: 10000, // 10 segundos de timeout
    });

    // Converter para buffer
    const buffer = Buffer.from(data);

    // Criar arquivo temporário
    const tempFileName = `${game.slug}_${field}_${Date.now()}.jpg`;
    const tempFilePath = `./temp_${tempFileName}`;

    // Salvar arquivo temporário
    fs.writeFileSync(tempFilePath, buffer);

    console.info(`📤 Fazendo upload da imagem ${field}: ${tempFileName}`);

    try {
      // Usar upload via API REST (mais confiável)
      const formData = new FormData();

      formData.append('refId', game.id);
      formData.append('ref', gameService);
      formData.append('field', field);
      formData.append('files', buffer, {
        filename: tempFileName,
        contentType: 'image/jpeg',
      });

      const uploadResponse = await axios({
        method: 'POST',
        url: 'http://localhost:1337/api/upload',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.info(`✅ Imagem ${field} enviada com sucesso para ${game.name}`);

      // Atualizar o jogo com a referência da imagem
      if (uploadResponse.data && uploadResponse.data[0]) {
        const uploadedFile = uploadResponse.data[0];

        // Atualizar o campo da imagem no jogo
        await strapi.service(gameService).update(game.id, {
          data: {
            [field]: uploadedFile.id,
          },
        });

        console.info(`🔗 Imagem ${field} vinculada ao jogo ${game.name}`);
      }

      // Limpar arquivo temporário
      fs.unlinkSync(tempFilePath);
    } catch (uploadError: unknown) {
      const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
      console.error(`❌ Erro no upload via API:`, errorMessage);

      // Limpar arquivo temporário em caso de erro
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  } catch (error: unknown) {
    const errorObj = error as any;
    console.error(`❌ Erro ao fazer upload da imagem ${field} para ${game.name}:`, {
      error: errorObj.message,
      response: errorObj.response?.data,
      status: errorObj.response?.status,
    });
  }
}

async function createGames(products: Product[]) {
  console.log(`🎮 Iniciando criação de ${products.length} jogos...`);

  for (const product of products) {
    try {
      const item = await getByName(product.title, gameService);

      if (!item) {
        console.info(`🎯 Criando jogo: ${product.title}...`);

        // Criar o jogo primeiro
        const game = await strapi.service(`${gameService}`).create({
          data: {
            name: product.title,
            slug: product.slug,
            price: product.price.finalMoney.amount,
            release_date: new Date(product.releaseDate),
            categories: await Promise.all(
              (product.genres || []).map(({ name }: { name: string }) => getByName(name, categoryService))
            ),
            platforms: await Promise.all(
              (product.operatingSystems || []).map((name: string) => getByName(name, platformService))
            ),
            developers: await Promise.all(
              (product.developers || []).map((name: string) => getByName(name, developerService))
            ),
            publisher: await Promise.all(
              (product.publishers || []).map((name: string) => getByName(name, publisherService))
            ),
            ...(await getGameInfo(product.slug)),
            publishedAt: new Date(),
          },
        });

        console.log(`✅ Jogo criado: ${game.name} (ID: ${game.id})`);

        // Fazer upload da imagem de capa
        if (product.coverHorizontal) {
          console.log(`🖼️  Fazendo upload da capa para: ${game.name}`);
          await setImage({ image: product.coverHorizontal, game, field: 'cover' });
        }

        // Fazer upload das imagens da galeria
        if (product.screenshots && product.screenshots.length > 0) {
          console.log(
            `🖼️  Fazendo upload de ${Math.min(product.screenshots.length, 5)} imagens da galeria para: ${game.name}`
          );

          const galleryImages = product.screenshots.slice(0, 5);
          for (const screenshot of galleryImages) {
            const imageUrl = screenshot.replace('{formatter}', 'product_card_v2_mobile_slider_639');
            await setImage({ image: imageUrl, game, field: 'gallery' });
          }
        }

        console.log(`🎉 Jogo ${game.name} criado com sucesso!`);
      } else {
        console.log(`⏭️  Jogo já existe: ${product.title}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Erro ao criar jogo ${product.title}:`, errorMessage);
    }
  }

  console.log(`🏁 Criação de jogos concluída!`);
}

// Função para buscar jogos específicos da lista
async function searchSpecificGames() {
  console.log('🔍 Buscando jogos específicos da lista...');

  const foundGames = [];
  const notFoundGames = [];

  for (const gameName of TARGET_GAMES) {
    try {
      const slug = (GAME_SLUGS as Record<string, string>)[gameName] || slugify(gameName, { strict: true, lower: true });
      const gogUrl = `https://www.gog.com/game/${slug}`;

      console.log(`🔍 Verificando: ${gameName} (${slug})`);

      const response = await axios.get(gogUrl);
      if (response.status === 200) {
        console.log(`✅ Encontrado: ${gameName}`);
        foundGames.push({ name: gameName, slug, url: gogUrl });
      }
    } catch (error) {
      console.log(`❌ Não encontrado: ${gameName}`);
      notFoundGames.push(gameName);
    }

    // Aguardar entre requisições para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n📊 RESULTADO DA BUSCA:`);
  console.log(`✅ Jogos encontrados: ${foundGames.length}`);
  console.log(`❌ Jogos não encontrados: ${notFoundGames.length}`);

  if (notFoundGames.length > 0) {
    console.log(`\n❌ Jogos não encontrados na GOG:`);
    notFoundGames.forEach(game => console.log(`   - ${game}`));
  }

  return foundGames;
}

export default factories.createCoreService(gameService, () => ({
  async populate(params: Record<string, string | number | boolean | string[] | number[] | null | undefined>) {
    try {
      console.log('🚀 Iniciando população de jogos específicos...');
      console.log(`📋 Total de jogos na lista: ${TARGET_GAMES.length}`);

      // Buscar jogos específicos primeiro
      const foundGames = await searchSpecificGames();

      if (foundGames.length === 0) {
        console.log('❌ Nenhum jogo foi encontrado na GOG');
        return;
      }

      // Usar a API da GOG para buscar informações detalhadas
      const gogApiUrl = `https://catalog.gog.com/v1/catalog?${qs.stringify(params)}`;

      console.log('📡 Buscando informações detalhadas da API da GOG...');

      const {
        data: { products },
      } = await axios.get(gogApiUrl);

      // Filtrar apenas os jogos da nossa lista
      const targetProducts = products.filter((product: any) => TARGET_GAMES.includes(product.title));

      console.log(`🎯 Jogos da lista encontrados na API: ${targetProducts.length}`);

      if (targetProducts.length > 0) {
        await createManyToManyData(targetProducts);
        await createGames(targetProducts);
      }

      console.log('🏁 População de jogos específicos concluída!');
    } catch (error) {
      console.log('populate:', Exception(error));
    }
  },

  // Nova função para população específica
  async populateSpecific() {
    try {
      console.log('🎯 Iniciando população específica dos jogos da lista...');

      // Buscar jogos específicos
      const foundGames = await searchSpecificGames();

      if (foundGames.length === 0) {
        console.log('❌ Nenhum jogo foi encontrado na GOG');
        return;
      }

      // Criar jogos manualmente com informações básicas
      for (const gameInfo of foundGames) {
        try {
          const existingGame = await getByName(gameInfo.name, gameService);

          if (!existingGame) {
            console.log(`🎮 Criando jogo: ${gameInfo.name}`);

            const game = await strapi.service(gameService).create({
              data: {
                name: gameInfo.name,
                slug: gameInfo.slug,
                price: 0, // Preço será atualizado depois
                release_date: new Date(),
                description: `Jogo ${gameInfo.name} disponível na GOG`,
                short_description: `Jogo ${gameInfo.name}`,
                rating: 'BR0',
                publishedAt: new Date(),
              },
            });

            console.log(`✅ Jogo criado: ${game.name} (ID: ${game.id})`);
          } else {
            console.log(`⏭️  Jogo já existe: ${gameInfo.name}`);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Erro ao criar jogo ${gameInfo.name}:`, errorMessage);
        }
      }

      console.log('🏁 População específica concluída!');
    } catch (error) {
      console.log('populateSpecific:', Exception(error));
    }
  },
}));
