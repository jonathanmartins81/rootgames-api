// 🔑 CONFIGURAÇÕES DAS APIS DE IMAGENS DE JOGOS
// Copie este arquivo para config/api-keys.js e preencha com suas chaves

module.exports = {
  // IGDB (Internet Games Database) - Melhor API do mercado
  // Obter em: https://api.igdb.com/
  IGDB: {
    CLIENT_ID: 'your_igdb_client_id',
    ACCESS_TOKEN: 'your_igdb_access_token',
  },

  // RAWG.io - API gratuita com boa cobertura
  // Obter em: https://rawg.io/apidocs
  RAWG: {
    API_KEY: 'your_rawg_api_key',
  },

  // Giant Bomb - Imagens HD e vídeos
  // Obter em: https://www.giantbomb.com/api/
  GIANTBOMB: {
    API_KEY: 'your_giantbomb_api_key',
  },

  // Steam Web API (opcional)
  STEAM: {
    API_KEY: 'your_steam_api_key',
  },

  // Configurações do Strapi
  STRAPI: {
    URL: 'http://localhost:1337',
    ADMIN_TOKEN: 'your_strapi_admin_token',
  },

  // Configurações de download
  DOWNLOAD: {
    TIMEOUT: 30000,
    DELAY: 1000,
    MAX_IMAGES_PER_GAME: 10,
    MAX_SCREENSHOTS: 5,
    MAX_ARTWORKS: 3,
  },

  // Configurações de qualidade
  QUALITY: {
    IMAGE_QUALITY: 85,
    MIN_IMAGE_SIZE: 10240, // 10KB
    MAX_IMAGE_SIZE: 10485760, // 10MB
  },

  // Configurações de cache
  CACHE: {
    ENABLED: true,
    DURATION: 86400000, // 24 horas em ms
  },
};
