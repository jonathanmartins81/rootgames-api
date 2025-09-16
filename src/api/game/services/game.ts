/**
 * game service
 */
import axios from "axios";
import { JSDOM } from "jsdom";
import slugify from "slugify";
import qs from "querystring";
import { factories } from "@strapi/strapi";

// Importar sistema de cache (temporariamente comentado)
// const imageCache = require("../../../utils/image-cache.js");

const gameService = "api::game.game";
const publisherService = "api::publisher.publisher";
const developerService = "api::developer.developer";
const categoryService = "api::category.category";
const platformService = "api::platform.platform";

// Headers para simular navegador
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
};

// Configurações das APIs
const API_CONFIG = {
  RAWG_API_KEY: process.env.RAWG_API_KEY || "3baab481282546d3b2fc6246620d6dd0",
  IGDB_CLIENT_ID: process.env.IGDB_CLIENT_ID || "",
  IGDB_CLIENT_SECRET: process.env.IGDB_CLIENT_SECRET || "",
  GIANT_BOMB_API_KEY: process.env.GIANT_BOMB_API_KEY || "",
  STEAM_API_KEY: process.env.STEAM_API_KEY || "",
};

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function Exception(e) {
  return { e, data: e.data && e.data.errors && e.data.errors };
}

// Base de dados de IDs do Steam para jogos conhecidos
const STEAM_GAME_IDS = {
  "Baldur's Gate 3": 1086940,
  "Cyberpunk 2077": 1091500,
  "The Witcher 3: Wild Hunt": 292030,
  "Fallout 4": 377160,
  DOOM: 379720,
  "Batman: Arkham City": 200260,
  "Batman: Arkham Asylum": 35140,
  "Batman: Arkham Knight": 208650,
  "Hollow Knight": 367520,
  "No Man's Sky": 275850,
  "Divinity: Original Sin 2": 435150,
  "Vampire: The Masquerade - Bloodlines": 2600,
  "Medal of Honor: Allied Assault": 230,
  "RoboCop: Rogue City": 1681430,
  "Resident Evil": 304240,
  "Fallout: New Vegas": 22380,
  "Fallout 3": 22370,
  "Silent Hill 4": 3132870,
  "Middle-earth: Shadow of Mordor": 241930,
  "Middle-earth: Shadow of War": 356190,
  "SimCity 4": 24780,
  "RollerCoaster Tycoon": 285310,
  "Rayman 2": 967050,
  "Rayman 3": 598550,
  "Sacred Gold": 12320,
  "House Party": 944540,
  "Sleeping Dogs": 307690,
  "F.E.A.R.": 21090,
  "The Witcher": 20900,
  "The Witcher 2": 20920,
  "Breath of Fire IV": 1335100,
  "Warhammer 40,000: Dawn of War": 4570,
  "SWAT 4": 250,
  "Kane and Lynch: Dead Men": 8080,
  "Kane & Lynch 2: Dog Days": 28000,
  Stranglehold: 18200,
  TurretGirls: 3861500,
  "B.E.S.T Deluxe Edition": 37285,
  "Mortal Kombat": 3301120,
  "Heroes of Might and Magic 3": 297000,
  "Heroes of Might and Magic 4": 2920,
  Diablo: 1980,
  "The Elder Scrolls V: Skyrim": 489830,
  "Dino Crisis": 3861500,
  "Cyberpunk 2077: Phantom Liberty": 2138330,
  "Cyberpunk 2077: Ultimate Edition": 32470,
  "Baldur's Gate 3 - Digital Deluxe Edition upgrade": 2378500,
  "Fallout: New Vegas Ultimate Edition": 3782,
  "Fallout 4: Game of the Year Edition": 199943,
  "Batman: Arkham City - Game of the Year Edition": 200260,
  "Batman: Arkham Asylum Game of the Year Edition": 35140,
  "Batman: Arkham Knight Premium Edition": 208650,
  "The Witcher 3: Wild Hunt - Complete Edition": 124923,
  "House Party - Explicit Content Add-On": 944540,
  "Middle-earth: Shadow of War Definitive Edition": 648168,
  "DOOM 3": 208200,
};

// Função para buscar imagem na Steam
async function searchSteamImage(gameName) {
  try {
    // Primeiro tentar usar o ID conhecido
    const steamId = STEAM_GAME_IDS[gameName];
    if (steamId) {
      const headerUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${steamId}/header.jpg`;
      const capsuleUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${steamId}/capsule_616x353.jpg`;

      // Verificar se a imagem existe
      try {
        await axios.head(headerUrl, {
          headers: BROWSER_HEADERS,
          timeout: 5000,
        });
        return { cover: headerUrl, steamId, source: "Steam (Known ID)" };
      } catch {
        try {
          await axios.head(capsuleUrl, {
            headers: BROWSER_HEADERS,
            timeout: 5000,
          });
          return { cover: capsuleUrl, steamId, source: "Steam (Known ID)" };
        } catch {
          // Continuar com busca por nome
        }
      }
    }

    // Busca por nome na Steam
    const searchUrl = `https://store.steampowered.com/search/?term=${encodeURIComponent(
      gameName
    )}`;
    const response = await axios.get(searchUrl, {
      headers: BROWSER_HEADERS,
      timeout: 10000,
    });
    const dom = new JSDOM(response.data);

    // Buscar primeira imagem de capa
    const coverImg = dom.window.document.querySelector(
      ".search_result_row img"
    );
    if (coverImg && coverImg.src) {
      return { cover: coverImg.src, steamId: null, source: "Steam (Search)" };
    }

    return null;
  } catch (error) {
    console.log(`❌ Erro ao buscar na Steam:`, error.message);
    return null;
  }
}

// Função para buscar no GOG
async function searchGOGImage(gameName) {
  try {
    const searchUrl = `https://www.gog.com/games/ajax/filtered?search=${encodeURIComponent(
      gameName
    )}`;
    const response = await axios.get(searchUrl, {
      headers: BROWSER_HEADERS,
      timeout: 10000,
    });
    const data = response.data;

    if (data.products && data.products.length > 0) {
      const product = data.products[0];
      if (product.image) {
        return {
          cover: `https:${product.image}`,
          steamId: null,
          source: "GOG",
        };
      }
    }

    return null;
  } catch (error) {
    console.log(`❌ Erro ao buscar no GOG:`, error.message);
    return null;
  }
}

// Função para buscar no RAWG.io com API key
async function searchRAWGImage(gameName) {
  try {
    if (
      !API_CONFIG.RAWG_API_KEY ||
      API_CONFIG.RAWG_API_KEY === "your_rawg_api_key_here"
    ) {
      return null;
    }

    const searchUrl = `https://api.rawg.io/api/games?search=${encodeURIComponent(
      gameName
    )}&page_size=1&key=${API_CONFIG.RAWG_API_KEY}`;
    const response = await axios.get(searchUrl, {
      headers: BROWSER_HEADERS,
      timeout: 10000,
    });

    const data = response.data;
    if (data.results && data.results.length > 0) {
      const game = data.results[0];
      return {
        cover: game.background_image,
        steamId: null,
        screenshots:
          game.short_screenshots?.slice(0, 5).map((s) => s.image) || [],
        source: "RAWG.io (API)",
        metadata: {
          rating: game.rating,
          releaseDate: game.released,
          platforms: game.platforms?.map((p) => p.platform.name) || [],
        },
      };
    }
    return null;
  } catch (error) {
    console.log(`❌ Erro ao buscar no RAWG:`, error.message);
    return null;
  }
}

// Função para buscar no RAWG.io (requer API key)
async function searchRAWGImageLegacy(gameName) {
  try {
    // RAWG requer API key, mas podemos tentar uma busca básica
    const searchUrl = `https://rawg.io/api/games?search=${encodeURIComponent(
      gameName
    )}&page_size=1`;
    const response = await axios.get(searchUrl, {
      headers: BROWSER_HEADERS,
      timeout: 10000,
    });
    const data = response.data;

    if (data.results && data.results.length > 0) {
      const game = data.results[0];
      if (game.background_image) {
        return {
          cover: game.background_image,
          steamId: null,
          source: "RAWG.io",
        };
      }
    }

    return null;
  } catch (error) {
    console.log(`❌ Erro ao buscar no RAWG:`, error.message);
    return null;
  }
}

// Função para buscar screenshots na Steam
async function searchSteamScreenshots(steamId) {
  try {
    if (!steamId) return [];

    const gameUrl = `https://store.steampowered.com/app/${steamId}`;
    const response = await axios.get(gameUrl, {
      headers: BROWSER_HEADERS,
      timeout: 10000,
    });
    const dom = new JSDOM(response.data);

    const screenshots = [];
    const screenshotImgs = dom.window.document.querySelectorAll(
      ".screenshot_holder img"
    );

    screenshotImgs.forEach((img, index) => {
      if (index < 5 && img.src) {
        screenshots.push(img.src);
      }
    });

    return screenshots;
  } catch (error) {
    console.log(`❌ Erro ao buscar screenshots na Steam:`, error.message);
    return [];
  }
}

// Função para buscar imagem em múltiplas fontes
async function searchGameImage(gameName) {
  console.log(`🔍 Buscando imagem para: ${gameName}`);

  // Tentar cache primeiro
  // const cached = imageCache.get(gameName, "all");
  // if (cached) {
  //   console.log(`📦 Usando cache para: ${gameName}`);
  //   return cached;
  // }

  // Tentar diferentes fontes em ordem de prioridade
  const sources = [
    { name: "RAWG API", func: () => searchRAWGImage(gameName) },
    { name: "Steam", func: () => searchSteamImage(gameName) },
    { name: "GOG", func: () => searchGOGImage(gameName) },
    { name: "RAWG Legacy", func: () => searchRAWGImageLegacy(gameName) },
  ];

  for (const source of sources) {
    try {
      console.log(`  📍 Tentando ${source.name}...`);
      const result = await source.func();

      if (result && result.cover) {
        console.log(`  ✅ Encontrado em ${source.name}`);
        // Salvar no cache
        // imageCache.set(gameName, result, "all");
        return result;
      }
    } catch (error) {
      console.log(`  ❌ Erro em ${source.name}:`, error.message);
      continue;
    }
  }

  console.log(`  ⚠️ Nenhuma imagem encontrada`);
  return null;
}

// Função para buscar em múltiplas fontes com fallback
async function searchMultipleSources(gameName) {
  console.log(`🔍 Buscando imagem para: ${gameName}`);

  // Tentar cache primeiro
  // const cached = imageCache.get(gameName, "advanced");
  // if (cached) {
  //   console.log(`📦 Usando cache avançado para: ${gameName}`);
  //   return cached;
  // }

  const sources = [
    { name: "RAWG API", func: () => searchRAWGImage(gameName) },
    { name: "Steam", func: () => searchSteamImage(gameName) },
    { name: "GOG", func: () => searchGOGImage(gameName) },
  ];

  for (const source of sources) {
    try {
      console.log(`  📍 Tentando ${source.name}...`);
      const result = await source.func();

      if (result && result.cover) {
        console.log(`  ✅ Encontrado em ${source.name}`);
        // Salvar no cache
        // imageCache.set(gameName, result, "advanced");
        return result;
      }
    } catch (error) {
      console.log(`  ❌ Erro em ${source.name}:`, error.message);
      continue;
    }
  }

  console.log(`  ⚠️ Nenhuma imagem encontrada, usando fallback`);
  const fallback = getFallbackImages(gameName);
  // Cache do fallback com TTL menor
  // imageCache.set(gameName, fallback, "fallback", 2 * 60 * 60 * 1000); // 2 horas
  return fallback;
}

// Imagens de fallback personalizadas
function getFallbackImages(gameName) {
  return {
    cover: `https://via.placeholder.com/460x215/009c3b/ffffff?text=${encodeURIComponent(
      gameName.toUpperCase()
    )}`,
    steamId: null,
    screenshots: [
      "https://via.placeholder.com/800x450/1e3a8a/ffffff?text=SCREENSHOT+1",
      "https://via.placeholder.com/800x450/7c3aed/ffffff?text=SCREENSHOT+2",
      "https://via.placeholder.com/800x450/dc2626/ffffff?text=SCREENSHOT+3",
      "https://via.placeholder.com/800x450/059669/ffffff?text=SCREENSHOT+4",
      "https://via.placeholder.com/800x450/d97706/ffffff?text=SCREENSHOT+5",
    ],
    source: "Fallback (Placeholder)",
    metadata: {
      note: "Imagens geradas automaticamente - jogo não encontrado nas fontes",
    },
  };
}

// Função para baixar imagem
async function downloadImage(url, filename) {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: BROWSER_HEADERS,
      timeout: 15000,
    });

    const fs = require("fs");
    const path = require("path");
    const uploadsDir = path.join(process.cwd(), "public/uploads");

    // Criar diretório se não existir
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, response.data);

    console.log(`✅ Imagem baixada: ${filename}`);
    return filePath;
  } catch (error) {
    console.log(`❌ Erro ao baixar ${filename}:`, error.message);
    return null;
  }
}

// Função para fazer upload para o Strapi
async function uploadToStrapi(filePath, gameId, field = "cover") {
  try {
    const FormData = require("form-data");
    const fs = require("fs");
    const formData = new FormData();

    formData.append("files", fs.createReadStream(filePath));
    formData.append("refId", gameId);
    formData.append("ref", "api::game.game");
    formData.append("field", field);

    const response = await axios.post(
      `http://localhost:1337/api/upload`,
      formData,
      {
        headers: {
          "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
        },
      }
    );

    console.log(`✅ Upload realizado para ${field}: ${response.data[0].name}`);
    return response.data[0];
  } catch (error) {
    console.log(`❌ Erro no upload para ${field}:`, error.message);
    return null;
  }
}

// Função para fazer upload múltiplo para gallery
async function uploadGalleryToStrapi(filePaths, gameId) {
  try {
    const FormData = require("form-data");
    const fs = require("fs");
    const formData = new FormData();

    // Adicionar múltiplos arquivos
    filePaths.forEach((filePath) => {
      formData.append("files", fs.createReadStream(filePath));
    });

    formData.append("refId", gameId);
    formData.append("ref", "api::game.game");
    formData.append("field", "gallery");

    const response = await axios.post(
      `http://localhost:1337/api/upload`,
      formData,
      {
        headers: {
          "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
        },
      }
    );

    console.log(`✅ Gallery upload realizado: ${response.data.length} imagens`);
    return response.data;
  } catch (error) {
    console.log(`❌ Erro no upload da gallery:`, error.message);
    return [];
  }
}

async function getGameInfo(slug) {
  try {
    const gogSlug = slug.replaceAll("-", "_").toLowerCase();

    const body = await axios.get(`https://www.gog.com/game/${gogSlug}`);
    const dom = new JSDOM(body.data);

    const raw_description = dom.window.document.querySelector(".description");

    const description = raw_description.innerHTML;
    const short_description = raw_description.textContent.slice(0, 160);

    const ratingElement = dom.window.document.querySelector(
      ".age-restrictions__icon use"
    );

    return {
      description,
      short_description,
      rating: ratingElement
        ? ratingElement
            .getAttribute("xlink:href")
            .replace(/_/g, "")
            .replace("#", "")
        : "BR0",
    };
  } catch (error) {
    console.log("getGameInfo:", Exception(error));
  }
}

async function getByName(name, entityService) {
  try {
    const item = await strapi.service(entityService).find({
      filters: { name },
    });

    return item.results.length > 0 ? item.results[0] : null;
  } catch (error) {
    console.log("getByName:", Exception(error));
  }
}

async function create(name, entityService) {
  try {
    const item = await getByName(name, entityService);

    if (!item) {
      await strapi.service(entityService).create({
        data: {
          name,
          slug: slugify(name, { strict: true, lower: true }),
        },
      });
    }
  } catch (error) {
    console.log("create:", Exception(error));
  }
}

async function createManyToManyData(products) {
  const developersSet = new Set();
  const publishersSet = new Set();
  const categoriesSet = new Set();
  const platformsSet = new Set();

  products.forEach((product) => {
    const { developers, publishers, genres, operatingSystems } = product;

    genres?.forEach(({ name }) => {
      categoriesSet.add(name);
    });

    operatingSystems?.forEach((item) => {
      platformsSet.add(item);
    });

    developers?.forEach((item) => {
      developersSet.add(item);
    });

    publishers?.forEach((item) => {
      publishersSet.add(item);
    });
  });

  const createCall = (set, entityName) =>
    Array.from(set).map((name) => create(name, entityName));

  return Promise.all([
    ...createCall(developersSet, developerService),
    ...createCall(publishersSet, publisherService),
    ...createCall(categoriesSet, categoryService),
    ...createCall(platformsSet, platformService),
  ]);
}

async function setImage({ image, game, field = "cover" }) {
  const { data } = await axios.get(image, { responseType: "arraybuffer" });
  const buffer = Buffer.from(data, "base64");

  const FormData = require("form-data");

  const formData: any = new FormData();

  formData.append("refId", game.id);
  formData.append("ref", `${gameService}`);
  formData.append("field", field);
  formData.append("files", buffer, { filename: `${game.slug}.jpg` });

  console.info(`Uploading ${field} image: ${game.slug}.jpg`);

  try {
    await axios({
      method: "POST",
      url: `http://localhost:1337/api/upload/`,
      data: formData,
      headers: {
        "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
      },
    });
  } catch (error) {
    console.log("setImage:", Exception(error));
  }
}

async function createGames(products) {
  await Promise.all(
    products.map(async (product) => {
      const item = await getByName(product.title, gameService);

      if (!item) {
        console.info(`Creating: ${product.title}...`);

        const game = await strapi.service(`${gameService}`).create({
          data: {
            name: product.title,
            slug: product.slug,
            price: product.price.finalMoney.amount,
            release_date: new Date(product.releaseDate),
            categories: await Promise.all(
              product.genres.map(({ name }) => getByName(name, categoryService))
            ),
            platforms: await Promise.all(
              product.operatingSystems.map((name) =>
                getByName(name, platformService)
              )
            ),
            developers: await Promise.all(
              product.developers.map((name) =>
                getByName(name, developerService)
              )
            ),
            publisher: await Promise.all(
              product.publishers.map((name) =>
                getByName(name, publisherService)
              )
            ),
            ...(await getGameInfo(product.slug)),
            publishedAt: new Date(),
          },
        });

        await setImage({ image: product.coverHorizontal, game });
        await Promise.all(
          product.screenshots.slice(0, 5).map((url) =>
            setImage({
              image: `${url.replace(
                "{formatter}",
                "product_card_v2_mobile_slider_639"
              )}`,
              game,
              field: "gallery",
            })
          )
        );

        return game;
      }
    })
  );
}

export default factories.createCoreService(gameService, () => ({
  async populate(params) {
    try {
      const gogApiUrl = `https://catalog.gog.com/v1/catalog?${qs.stringify(
        params
      )}`;

      const {
        data: { products },
      } = await axios.get(gogApiUrl);

      await createManyToManyData(products);
      await createGames(products);
    } catch (error) {
      console.log("populate:", Exception(error));
    }
  },

  // Novo método para buscar imagens reais
  async fetchRealImages(gameId) {
    try {
      const game = await strapi.entityService.findOne(gameService, gameId);
      if (!game) {
        throw new Error("Game not found");
      }

      const imageResult = await searchGameImage(game.name);
      return {
        game: game.name,
        images: imageResult,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Error fetching images: ${error.message}`);
    }
  },

  // Novo método para baixar imagens de um jogo
  async downloadGameImages(gameId) {
    try {
      const game = await strapi.entityService.findOne(gameService, gameId);
      if (!game) {
        throw new Error("Game not found");
      }

      console.log(`🎯 Baixando imagens para: ${game.name}`);

      // Buscar imagem de capa
      const imageResult = await searchGameImage(game.name);
      if (!imageResult) {
        throw new Error("No images found for this game");
      }

      const results = {
        game: game.name,
        cover: null,
        gallery: [],
        timestamp: new Date().toISOString(),
      };

      // Baixar cover
      if (imageResult.cover) {
        const coverFilename = `${game.slug}_cover_real.png`;
        const coverPath = await downloadImage(imageResult.cover, coverFilename);

        if (coverPath) {
          const uploadedCover = await uploadToStrapi(
            coverPath,
            gameId,
            "cover"
          );
          if (uploadedCover) {
            results.cover = uploadedCover;
          }
        }
      }

      // Baixar screenshots se disponível (apenas para Steam)
      if (imageResult.steamId && imageResult.source.includes("Steam")) {
        const screenshots = await searchSteamScreenshots(imageResult.steamId);

        if (screenshots.length > 0) {
          const galleryPaths = [];

          for (let i = 0; i < Math.min(screenshots.length, 5); i++) {
            const screenshotUrl = screenshots[i];
            const screenshotFilename = `${game.slug}_gallery_real_${i + 1}.png`;
            const screenshotPath = await downloadImage(
              screenshotUrl,
              screenshotFilename
            );

            if (screenshotPath) {
              galleryPaths.push(screenshotPath);
            }
          }

          if (galleryPaths.length > 0) {
            const uploadedGallery = await uploadGalleryToStrapi(
              galleryPaths,
              gameId
            );
            results.gallery = uploadedGallery;
          }
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Error downloading images: ${error.message}`);
    }
  },

  // Novo método para baixar imagens de todos os jogos
  async downloadAllGameImages() {
    try {
      const games = await strapi.entityService.findMany(gameService, {
        pagination: { pageSize: 100 },
      });

      const results = [];

      for (const game of games) {
        try {
          console.log(`🎯 Processando: ${game.name}`);
          const result = await this.downloadGameImages(game.id);
          results.push(result);

          // Aguardar para não sobrecarregar
          await timeout(2000);
        } catch (error) {
          console.log(`❌ Erro ao processar ${game.name}:`, error.message);
          results.push({
            game: game.name,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        }
      }

      return {
        total: games.length,
        processed: results.length,
        results,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Error downloading all images: ${error.message}`);
    }
  },

  // Novo método para buscar imagens por nome
  async searchGameImages(gameName) {
    try {
      const result = await searchGameImage(gameName);
      return {
        gameName,
        images: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Error searching images: ${error.message}`);
    }
  },

  // Novo método para listar fontes disponíveis
  async getImageSources() {
    return {
      sources: [
        {
          name: "Steam Store",
          description:
            "Largest PC gaming platform with high-quality covers and screenshots",
          url: "https://store.steampowered.com",
          features: ["Covers", "Screenshots", "Banners", "Icons"],
        },
        {
          name: "GOG.com",
          description: "DRM-free games with clean, high-quality images",
          url: "https://www.gog.com",
          features: ["Covers", "Screenshots", "Artwork"],
        },
        {
          name: "RAWG.io",
          description:
            "Gaming database with extensive game information and images",
          url: "https://rawg.io",
          features: ["Covers", "Backgrounds", "Screenshots"],
        },
      ],
      total: 3,
      timestamp: new Date().toISOString(),
    };
  },

  // Novo método para verificar status das APIs externas
  async checkAPIStatus() {
    try {
      const status = {
        RAWG:
          !!API_CONFIG.RAWG_API_KEY &&
          API_CONFIG.RAWG_API_KEY !== "your_rawg_api_key_here",
        IGDB:
          !!(API_CONFIG.IGDB_CLIENT_ID && API_CONFIG.IGDB_CLIENT_SECRET) &&
          API_CONFIG.IGDB_CLIENT_ID !== "your_igdb_client_id_here",
        GiantBomb:
          !!API_CONFIG.GIANT_BOMB_API_KEY &&
          API_CONFIG.GIANT_BOMB_API_KEY !== "your_giant_bomb_api_key_here",
        Steam:
          !!API_CONFIG.STEAM_API_KEY &&
          API_CONFIG.STEAM_API_KEY !== "your_steam_api_key_here",
      };

      return {
        apis: status,
        totalConfigured: Object.values(status).filter(Boolean).length,
        totalAvailable: Object.keys(status).length,
        timestamp: new Date().toISOString(),
        recommendations: this.getAPIRecommendations({
          apis: status,
          totalConfigured: Object.values(status).filter(Boolean).length,
          totalAvailable: Object.keys(status).length,
        }),
      };
    } catch (error) {
      throw new Error(`Error checking API status: ${error.message}`);
    }
  },

  // Novo método para busca avançada de imagens
  async searchGameImagesAdvanced(gameName) {
    try {
      const result = await searchMultipleSources(gameName);
      return {
        gameName,
        images: result,
        timestamp: new Date().toISOString(),
        searchQuality: this.assessSearchQuality(result),
      };
    } catch (error) {
      throw new Error(`Error searching images: ${error.message}`);
    }
  },

  // Método auxiliar para recomendações de APIs
  getAPIRecommendations(status) {
    const recommendations = [];

    if (status.totalConfigured === 0) {
      recommendations.push({
        priority: "high",
        message:
          "Configure pelo menos uma API externa para melhorar a busca de imagens",
        apis: ["RAWG.io", "IGDB", "Giant Bomb"],
      });
    } else if (status.totalConfigured < 2) {
      recommendations.push({
        priority: "medium",
        message: "Configure mais APIs para aumentar a cobertura de busca",
        apis: status.apis.RAWG ? ["IGDB", "Giant Bomb"] : ["RAWG.io", "IGDB"],
      });
    }

    if (!status.apis.RAWG) {
      recommendations.push({
        priority: "medium",
        message: "RAWG.io oferece +1M jogos com imagens de alta qualidade",
        link: "https://rawg.io/apidocs",
      });
    }

    if (!status.apis.IGDB) {
      recommendations.push({
        priority: "medium",
        message: "IGDB é a maior base de dados de jogos do mundo",
        link: "https://api.igdb.com/",
      });
    }

    return recommendations;
  },

  // Método auxiliar para avaliar qualidade da busca
  assessSearchQuality(result) {
    let score = 0;
    let details = [];

    if (result.cover) score += 30;
    if (result.screenshots && result.screenshots.length > 0) score += 40;
    if (result.metadata && Object.keys(result.metadata).length > 0) score += 20;
    if (result.source && !result.source.includes("Fallback")) score += 10;

    if (score >= 80)
      details.push("Excelente - Imagens de alta qualidade encontradas");
    else if (score >= 60) details.push("Boa - Cobertura adequada de imagens");
    else if (score >= 40) details.push("Regular - Apenas imagens básicas");
    else details.push("Baixa - Usando imagens de fallback");

    return { score, details, maxScore: 100 };
  },

  // Método para obter estatísticas do cache
  async getCacheStats() {
    try {
      // const stats = imageCache.stats(); // Temporariamente comentado
      // return {
      //   ...stats,
      //   timestamp: new Date().toISOString(),
      //   recommendations: this.getCacheRecommendations(stats),
      // };
      return {
        message: "Cache desabilitado temporariamente",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Error getting cache stats: ${error.message}`);
    }
  },

  // Método para limpar cache
  async clearCache() {
    try {
      // imageCache.clear(); // Temporariamente comentado
      return {
        message: "Cache desabilitado temporariamente",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Error clearing cache: ${error.message}`);
    }
  },

  // Método auxiliar para recomendações de cache
  getCacheRecommendations(stats) {
    const recommendations = [];

    if (stats.valid === 0) {
      recommendations.push({
        priority: "info",
        message: "Cache vazio - Primeiras buscas serão mais lentas",
      });
    } else if (stats.valid < 100) {
      recommendations.push({
        priority: "low",
        message:
          "Cache pequeno - Considere aumentar maxSize para melhor performance",
      });
    }

    if (stats.expired > 0) {
      recommendations.push({
        priority: "medium",
        message: `${stats.expired} itens expirados - Cache será limpo automaticamente`,
      });
    }

    if (stats.averageAccess < 2) {
      recommendations.push({
        priority: "medium",
        message: "Baixo reuso de cache - Considere aumentar TTL",
      });
    }

    return recommendations;
  },
}));
