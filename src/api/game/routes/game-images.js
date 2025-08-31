module.exports = {
  routes: [
    // Buscar imagem de capa de um jogo
    {
      method: 'GET',
      path: '/games/:gameName/cover',
      handler: 'game-images.getGameCover',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
        description: 'Buscar imagem de capa de um jogo',
        tag: {
          plugin: 'game',
          name: 'Game Cover Image',
          actionType: 'read',
        },
      },
    },

    // Buscar galeria de imagens de um jogo
    {
      method: 'GET',
      path: '/games/:gameName/gallery',
      handler: 'game-images.getGameGallery',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
        description: 'Buscar galeria de imagens de um jogo',
        tag: {
          plugin: 'game',
          name: 'Game Gallery',
          actionType: 'read',
        },
      },
    },

    // Listar status das imagens de todos os jogos
    {
      method: 'GET',
      path: '/games/images/status',
      handler: 'game-images.getGamesImageStatus',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
        description: 'Listar status das imagens de todos os jogos',
        tag: {
          plugin: 'game',
          name: 'Games Image Status',
          actionType: 'read',
        },
      },
    },
  ],
};
