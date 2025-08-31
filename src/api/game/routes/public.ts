/**
 * 🚀 Rotas Públicas para Game API
 *
 * Estas rotas são acessíveis sem autenticação
 */

export default {
  routes: [
    // Rota para população de jogos
    {
      method: 'POST',
      path: '/games/populate',
      handler: 'game.populate',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
        description: 'Popula o banco com jogos da GOG API',
      },
    },

    // Nova rota para população específica
    {
      method: 'POST',
      path: '/games/populate-specific',
      handler: 'game.populateSpecific',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
        description: 'Popula o banco com jogos específicos da lista fornecida',
      },
    },

    // Rota para listar jogos (pública)
    {
      method: 'GET',
      path: '/games',
      handler: 'game.find',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
        description: 'Lista todos os jogos (acesso público)',
      },
    },

    // Rota para buscar jogo específico (pública)
    {
      method: 'GET',
      path: '/games/:id',
      handler: 'game.findOne',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
        description: 'Busca jogo específico por ID (acesso público)',
      },
    },
  ],
};
