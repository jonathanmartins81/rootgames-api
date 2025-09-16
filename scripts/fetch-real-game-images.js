const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Configurações
const STRAPI_URL = 'http://localhost:1337';
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

// Headers para simular navegador
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
};

// Função para baixar imagem
async function downloadImage(url, filename) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: BROWSER_HEADERS,
      timeout: 10000
    });

    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, response.data);
    console.log(`✅ Imagem baixada: ${filename}`);
    return filePath;
  } catch (error) {
    console.log(`❌ Erro ao baixar ${filename}:`, error.message);
    return null;
  }
}

// Função para buscar na Steam
async function searchSteamImage(gameName) {
  try {
    const searchUrl = `https://store.steampowered.com/search/?term=${encodeURIComponent(gameName)}`;
    const response = await axios.get(searchUrl, { headers: BROWSER_HEADERS });
    const dom = new JSDOM(response.data);

    // Buscar primeira imagem de capa
    const coverImg = dom.window.document.querySelector('.search_result_row img');
    if (coverImg && coverImg.src) {
      return coverImg.src;
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
    const searchUrl = `https://www.gog.com/games/ajax/filtered?search=${encodeURIComponent(gameName)}`;
    const response = await axios.get(searchUrl, { headers: BROWSER_HEADERS });
    const data = response.data;

    if (data.products && data.products.length > 0) {
      const product = data.products[0];
      if (product.image) {
        return `https:${product.image}`;
      }
    }

    return null;
  } catch (error) {
    console.log(`❌ Erro ao buscar no GOG:`, error.message);
    return null;
  }
}

// Função para buscar no RAWG.io
async function searchRAWGImage(gameName) {
  try {
    const searchUrl = `https://rawg.io/api/games?search=${encodeURIComponent(gameName)}&page_size=1`;
    const response = await axios.get(searchUrl, { headers: BROWSER_HEADERS });
    const data = response.data;

    if (data.results && data.results.length > 0) {
      const game = data.results[0];
      if (game.background_image) {
        return game.background_image;
      }
    }

    return null;
  } catch (error) {
    console.log(`❌ Erro ao buscar no RAWG:`, error.message);
    return null;
  }
}

// Função para buscar no IGDB
async function searchIGDBImage(gameName) {
  try {
    // IGDB requer autenticação, vamos usar uma abordagem alternativa
    const searchUrl = `https://www.igdb.com/search?type=1&q=${encodeURIComponent(gameName)}`;
    const response = await axios.get(searchUrl, { headers: BROWSER_HEADERS });
    const dom = new JSDOM(response.data);

    // Buscar primeira imagem
    const coverImg = dom.window.document.querySelector('.search-result img');
    if (coverImg && coverImg.src) {
      return coverImg.src;
    }

    return null;
  } catch (error) {
    console.log(`❌ Erro ao buscar no IGDB:`, error.message);
    return null;
  }
}

// Função para buscar no Mobygames
async function searchMobygamesImage(gameName) {
  try {
    const searchUrl = `https://www.mobygames.com/search?q=${encodeURIComponent(gameName)}`;
    const response = await axios.get(searchUrl, { headers: BROWSER_HEADERS });
    const dom = new JSDOM(response.data);

    // Buscar primeira imagem de capa
    const coverImg = dom.window.document.querySelector('.searchResult img');
    if (coverImg && coverImg.src) {
      return `https://www.mobygames.com${coverImg.src}`;
    }

    return null;
  } catch (error) {
    console.log(`❌ Erro ao buscar no Mobygames:`, error.message);
    return null;
  }
}

// Função para buscar imagens de gallery (screenshots)
async function searchGameScreenshots(gameName, platform = 'steam') {
  try {
    let screenshots = [];

    if (platform === 'steam') {
      // Buscar screenshots na Steam
      const searchUrl = `https://store.steampowered.com/search/?term=${encodeURIComponent(gameName)}`;
      const response = await axios.get(searchUrl, { headers: BROWSER_HEADERS });
      const dom = new JSDOM(response.data);

      // Buscar links para screenshots
      const gameLinks = dom.window.document.querySelectorAll('.search_result_row a');
      if (gameLinks.length > 0) {
        const gameUrl = gameLinks[0].href;
        const gameResponse = await axios.get(gameUrl, { headers: BROWSER_HEADERS });
        const gameDom = new JSDOM(gameResponse.data);

        // Buscar screenshots
        const screenshotImgs = gameDom.window.document.querySelectorAll('.screenshot_holder img');
        screenshotImgs.forEach((img, index) => {
          if (index < 5 && img.src) {
            screenshots.push(img.src);
          }
        });
      }
    }

    return screenshots;
  } catch (error) {
    console.log(`❌ Erro ao buscar screenshots:`, error.message);
    return [];
  }
}

// Função para buscar imagem em múltiplas fontes
async function searchGameImage(gameName) {
  console.log(`🔍 Buscando imagem para: ${gameName}`);

  // Tentar diferentes fontes em ordem de prioridade
  const sources = [
    { name: 'RAWG', func: searchRAWGImage },
    { name: 'Steam', func: searchSteamImage },
    { name: 'GOG', func: searchGOGImage },
    { name: 'Mobygames', func: searchMobygamesImage },
  ];

  for (const source of sources) {
    try {
      console.log(`  📍 Tentando ${source.name}...`);
      const imageUrl = await source.func(gameName);

      if (imageUrl) {
        console.log(`  ✅ Encontrado em ${source.name}: ${imageUrl}`);
        return imageUrl;
      }
    } catch (error) {
      console.log(`  ❌ Erro em ${source.name}:`, error.message);
      continue;
    }
  }

  console.log(`  ⚠️ Nenhuma imagem encontrada`);
  return null;
}

// Função para fazer upload para o Strapi
async function uploadToStrapi(filePath, gameId, field = 'cover') {
  try {
    const FormData = require('form-data');
    const formData = new FormData();

    formData.append('files', fs.createReadStream(filePath));
    formData.append('refId', gameId);
    formData.append('ref', 'api::game.game');
    formData.append('field', field);

    const response = await axios.post(`${STRAPI_URL}/api/upload`, formData, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
      },
    });

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
    const FormData = require('form-data');
    const formData = new FormData();

    // Adicionar múltiplos arquivos
    filePaths.forEach(filePath => {
      formData.append('files', fs.createReadStream(filePath));
    });

    formData.append('refId', gameId);
    formData.append('ref', 'api::game.game');
    formData.append('field', 'gallery');

    const response = await axios.post(`${STRAPI_URL}/api/upload`, formData, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
      },
    });

    console.log(`✅ Gallery upload realizado: ${response.data.length} imagens`);
    return response.data;
  } catch (error) {
    console.log(`❌ Erro no upload da gallery:`, error.message);
    return [];
  }
}

// Função principal
async function fetchRealGameImages() {
  try {
    console.log('🎮 Iniciando busca por imagens reais dos jogos...\n');

    // Buscar todos os jogos
    const gamesResponse = await axios.get(`${STRAPI_URL}/api/games?pagination[pageSize]=100`);
    const games = gamesResponse.data.data;

    console.log(`📊 Encontrados ${games.length} jogos para processar\n`);

    for (const game of games) {
      const gameId = game.id;
      const gameName = game.attributes.name;
      const gameSlug = game.attributes.slug;

      console.log(`🎯 Processando: ${gameName}`);

      // Buscar imagem de capa real
      const coverUrl = await searchGameImage(gameName);

      if (coverUrl) {
        // Baixar imagem de capa
        const coverFilename = `${gameSlug}_cover_real.png`;
        const coverPath = await downloadImage(coverUrl, coverFilename);

        if (coverPath) {
          // Fazer upload da cover
          const uploadedCover = await uploadToStrapi(coverPath, gameId, 'cover');

          if (uploadedCover) {
            console.log(`✅ Cover real enviada com sucesso!`);
          }
        }
      }

      // Buscar screenshots para gallery
      const screenshotUrls = await searchGameScreenshots(gameName);

      if (screenshotUrls.length > 0) {
        const galleryPaths = [];

        // Baixar screenshots
        for (let i = 0; i < Math.min(screenshotUrls.length, 5); i++) {
          const screenshotUrl = screenshotUrls[i];
          const screenshotFilename = `${gameSlug}_gallery_real_${i + 1}.png`;
          const screenshotPath = await downloadImage(screenshotUrl, screenshotFilename);

          if (screenshotPath) {
            galleryPaths.push(screenshotPath);
          }
        }

        if (galleryPaths.length > 0) {
          // Fazer upload da gallery
          const uploadedGallery = await uploadGalleryToStrapi(galleryPaths, gameId);

          if (uploadedGallery.length > 0) {
            console.log(`✅ Gallery real enviada com sucesso!`);
          }
        }
      }

      console.log('---');

      // Aguardar um pouco para não sobrecarregar as APIs
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n🎉 Processo concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar o script
fetchRealGameImages();
