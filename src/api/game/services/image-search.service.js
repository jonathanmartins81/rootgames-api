const axios = require('axios');
const { JSDOM } = require('jsdom');

// Configurações
const config = {
  RAWG_API_KEY: process.env.RAWG_API_KEY,
  IGDB_CLIENT_ID: process.env.IGDB_CLIENT_ID,
  IGDB_CLIENT_SECRET: process.env.IGDB_CLIENT_SECRET,
  GIANT_BOMB_API_KEY: process.env.GIANT_BOMB_API_KEY,
  STEAM_API_KEY: process.env.STEAM_API_KEY,
  FALLBACK_IMAGES: {
    DEFAULT_COVER: 'https://via.placeholder.com/460x215/009c3b/ffffff?text=GAME+COVER',
    DEFAULT_GALLERY: [
      'https://via.placeholder.com/800x450/1e3a8a/ffffff?text=SCREENSHOT+1',
      'https://via.placeholder.com/800x450/7c3aed/ffffff?text=SCREENSHOT+2',
      'https://via.placeholder.com/800x450/dc2626/ffffff?text=SCREENSHOT+3',
      'https://via.placeholder.com/800x450/059669/ffffff?text=SCREENSHOT+4',
      'https://via.placeholder.com/800x450/d97706/ffffff?text=SCREENSHOT+5'
    ]
  }
};

// Headers para simular navegador
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
};

class ImageSearchService {

  // Buscar no RAWG.io com API key
  async searchRAWGWithAPI(gameName) {
    if (!config.RAWG_API_KEY || config.RAWG_API_KEY === 'your_rawg_api_key_here') {
      return null;
    }

    try {
      const searchUrl = `https://api.rawg.io/api/games?search=${encodeURIComponent(gameName)}&page_size=1&key=${config.RAWG_API_KEY}`;
      const response = await axios.get(searchUrl, {
        headers: BROWSER_HEADERS,
        timeout: 10000
      });

      const data = response.data;
      if (data.results && data.results.length > 0) {
        const game = data.results[0];
        return {
          cover: game.background_image,
          screenshots: game.short_screenshots?.slice(0, 5).map(s => s.image) || [],
          source: 'RAWG.io (API)',
          metadata: {
            rating: game.rating,
            releaseDate: game.released,
            platforms: game.platforms?.map(p => p.platform.name) || []
          }
        };
      }
      return null;
    } catch (error) {
      console.log(`❌ Erro ao buscar no RAWG com API:`, error.message);
      return null;
    }
  }

  // Buscar no IGDB com autenticação
  async searchIGDBWithAuth(gameName) {
    if (!config.IGDB_CLIENT_ID || !config.IGDB_CLIENT_SECRET) {
      return null;
    }

    try {
      // Primeiro obter token de acesso
      const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', {
        client_id: config.IGDB_CLIENT_ID,
        client_secret: config.IGDB_CLIENT_SECRET,
        grant_type: 'client_credentials'
      });

      const accessToken = tokenResponse.data.access_token;

      // Buscar jogo
      const searchResponse = await axios.post('https://api.igdb.com/v4/games',
        `search "${gameName}"; fields name,cover.url,screenshots.url,rating,first_release_date,platforms.name; limit 1;`,
        {
          headers: {
            'Client-ID': config.IGDB_CLIENT_ID,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'text/plain'
          }
        }
      );

      if (searchResponse.data && searchResponse.data.length > 0) {
        const game = searchResponse.data[0];
        return {
          cover: game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null,
          screenshots: game.screenshots?.slice(0, 5).map(s => `https:${s.url.replace('t_thumb', 't_screenshot_big')}`) || [],
          source: 'IGDB (API)',
          metadata: {
            rating: game.rating,
            releaseDate: game.first_release_date,
            platforms: game.platforms?.map(p => p.name) || []
          }
        };
      }
      return null;
    } catch (error) {
      console.log(`❌ Erro ao buscar no IGDB com API:`, error.message);
      return null;
    }
  }

  // Buscar no Giant Bomb
  async searchGiantBomb(gameName) {
    if (!config.GIANT_BOMB_API_KEY || config.GIANT_BOMB_API_KEY === 'your_giant_bomb_api_key_here') {
      return null;
    }

    try {
      const searchUrl = `https://www.giantbomb.com/api/search/?api_key=${config.GIANT_BOMB_API_KEY}&format=json&query=${encodeURIComponent(gameName)}&resources=game&limit=1`;
      const response = await axios.get(searchUrl, {
        headers: BROWSER_HEADERS,
        timeout: 10000
      });

      const data = response.data;
      if (data.results && data.results.length > 0) {
        const game = data.results[0];
        return {
          cover: game.image?.medium_url || game.image?.small_url,
          screenshots: game.screenshots?.slice(0, 5).map(s => s.medium_url) || [],
          source: 'Giant Bomb (API)',
          metadata: {
            rating: game.original_release_date,
            platforms: game.platforms?.map(p => p.name) || []
          }
        };
      }
      return null;
    } catch (error) {
      console.log(`❌ Erro ao buscar no Giant Bomb:`, error.message);
      return null;
    }
  }

  // Buscar em múltiplas fontes com fallback
  async searchMultipleSources(gameName) {
    console.log(`🔍 Buscando imagem para: ${gameName}`);

    const sources = [
      { name: 'RAWG API', func: () => this.searchRAWGWithAPI(gameName) },
      { name: 'IGDB API', func: () => this.searchIGDBWithAuth(gameName) },
      { name: 'Giant Bomb API', func: () => this.searchGiantBomb(gameName) },
      { name: 'Steam (Fallback)', func: () => this.searchSteamFallback(gameName) },
      { name: 'GOG (Fallback)', func: () => this.searchGOGFallback(gameName) }
    ];

    for (const source of sources) {
      try {
        console.log(`  📍 Tentando ${source.name}...`);
        const result = await source.func();

        if (result && result.cover) {
          console.log(`  ✅ Encontrado em ${source.name}`);
          return result;
        }
      } catch (error) {
        console.log(`  ❌ Erro em ${source.name}:`, error.message);
        continue;
      }
    }

    console.log(`  ⚠️ Nenhuma imagem encontrada, usando fallback`);
    return this.getFallbackImages(gameName);
  }

  // Fallback para Steam (sem API key)
  async searchSteamFallback(gameName) {
    try {
      const searchUrl = `https://store.steampowered.com/search/?term=${encodeURIComponent(gameName)}`;
      const response = await axios.get(searchUrl, { headers: BROWSER_HEADERS, timeout: 10000 });
      const dom = new JSDOM(response.data);

      const coverImg = dom.window.document.querySelector('.search_result_row img');
      if (coverImg && coverImg.src) {
        return {
          cover: coverImg.src,
          screenshots: [],
          source: 'Steam (Fallback)',
          metadata: {}
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Fallback para GOG
  async searchGOGFallback(gameName) {
    try {
      const searchUrl = `https://www.gog.com/games/ajax/filtered?search=${encodeURIComponent(gameName)}`;
      const response = await axios.get(searchUrl, { headers: BROWSER_HEADERS, timeout: 10000 });
      const data = response.data;

      if (data.products && data.products.length > 0) {
        const product = data.products[0];
        if (product.image) {
          return {
            cover: `https:${product.image}`,
            screenshots: [],
            source: 'GOG (Fallback)',
            metadata: {}
          };
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Imagens de fallback personalizadas
  getFallbackImages(gameName) {
    return {
      cover: config.FALLBACK_IMAGES.DEFAULT_COVER,
      screenshots: config.FALLBACK_IMAGES.DEFAULT_GALLERY,
      source: 'Fallback (Placeholder)',
      metadata: {
        note: 'Imagens geradas automaticamente - jogo não encontrado nas fontes'
      }
    };
  }

  // Verificar status das APIs
  async checkAPIStatus() {
    const status = {
      RAWG: !!config.RAWG_API_KEY && config.RAWG_API_KEY !== 'your_rawg_api_key_here',
      IGDB: !!(config.IGDB_CLIENT_ID && config.IGDB_CLIENT_SECRET) &&
             config.IGDB_CLIENT_ID !== 'your_igdb_client_id_here',
      GiantBomb: !!config.GIANT_BOMB_API_KEY && config.GIANT_BOMB_API_KEY !== 'your_giant_bomb_api_key_here',
      Steam: !!config.STEAM_API_KEY && config.STEAM_API_KEY !== 'your_steam_api_key_here'
    };

    return {
      apis: status,
      totalConfigured: Object.values(status).filter(Boolean).length,
      totalAvailable: Object.keys(status).length
    };
  }
}

module.exports = new ImageSearchService();
