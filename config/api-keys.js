// Configuração das chaves de API para fontes externas de imagens
module.exports = {
  // RAWG.io - Gaming Database API
  // Obtenha sua chave em: https://rawg.io/apidocs
  RAWG_API_KEY: process.env.RAWG_API_KEY || 'your_rawg_api_key_here',

  // IGDB - Internet Games Database API
  // Obtenha sua chave em: https://api.igdb.com/
  IGDB_CLIENT_ID: process.env.IGDB_CLIENT_ID || 'your_igdb_client_id_here',
  IGDB_CLIENT_SECRET: process.env.IGDB_CLIENT_SECRET || 'your_igdb_client_secret_here',

  // Giant Bomb API
  // Obtenha sua chave em: https://www.giantbomb.com/api/
  GIANT_BOMB_API_KEY: process.env.GIANT_BOMB_API_KEY || 'your_giant_bomb_api_key_here',

  // Steam API (opcional)
  // Obtenha sua chave em: https://steamcommunity.com/dev/apikey
  STEAM_API_KEY: process.env.STEAM_API_KEY || 'your_steam_api_key_here',

  // Configurações de fallback
  FALLBACK_IMAGES: {
    // URLs de imagens padrão para jogos sem imagens
    DEFAULT_COVER: 'https://via.placeholder.com/460x215/009c3b/ffffff?text=GAME+COVER',
    DEFAULT_GALLERY: [
      'https://via.placeholder.com/800x450/1e3a8a/ffffff?text=SCREENSHOT+1',
      'https://via.placeholder.com/800x450/7c3aed/ffffff?text=SCREENSHOT+2',
      'https://via.placeholder.com/800x450/dc2626/ffffff?text=SCREENSHOT+3',
      'https://via.placeholder.com/800x450/059669/ffffff?text=SCREENSHOT+4',
      'https://via.placeholder.com/800x450/d97706/ffffff?text=SCREENSHOT+5'
    ]
  },

  // Configurações de busca
  SEARCH_CONFIG: {
    MAX_RETRIES: 3,
    TIMEOUT: 15000,
    DELAY_BETWEEN_REQUESTS: 2000,
    MAX_IMAGES_PER_GAME: 5
  }
};
