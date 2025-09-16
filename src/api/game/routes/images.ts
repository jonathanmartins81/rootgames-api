/**
 * Custom image routes for games
 */

export default {
  routes: [
    // Buscar imagens reais de um jogo específico
    {
      method: "GET",
      path: "/games/:gameId/images",
      handler: "game.fetchRealImages",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },

    // Baixar imagens de um jogo específico
    {
      method: "POST",
      path: "/games/:gameId/images/download",
      handler: "game.downloadGameImages",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },

    // Baixar imagens de todos os jogos
    {
      method: "POST",
      path: "/games/images/download-all",
      handler: "game.downloadAllGameImages",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },

    // Buscar imagens por nome do jogo
    {
      method: "GET",
      path: "/games/images/search",
      handler: "game.searchGameImages",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },

    // Listar fontes de imagens disponíveis
    {
      method: "GET",
      path: "/games/images/sources",
      handler: "game.getImageSources",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },

    // Verificar status das APIs externas
    {
      method: "GET",
      path: "/games/images/api-status",
      handler: "game.checkAPIStatus",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },

    // Busca avançada de imagens com múltiplas fontes
    {
      method: "GET",
      path: "/games/images/search-advanced",
      handler: "game.searchGameImagesAdvanced",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },

    // Estatísticas do cache
    {
      method: "GET",
      path: "/games/images/cache/stats",
      handler: "game.getCacheStats",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },

    // Limpar cache
    {
      method: "POST",
      path: "/games/images/cache/clear",
      handler: "game.clearCache",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
