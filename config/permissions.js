/**
 * 🔐 Configuração de Permissões para APIs Públicas
 *
 * Este arquivo configura permissões para acesso público às APIs
 */

module.exports = {
  // Configurações para o plugin users-permissions
  'users-permissions': {
    config: {
      // Permitir acesso público
      public: {
        enabled: true,
        defaultRole: 'public',
      },
      // Configurar JWT
      jwt: {
        expiresIn: '30d',
      },
    },
  },

  // Configurações para APIs
  api: {
    // Configurar permissões públicas para todas as APIs
    public: {
      enabled: true,
      routes: [
        '/api/games',
        '/api/games/:id',
        '/api/games/populate',
        '/api/categories',
        '/api/categories/:id',
        '/api/developers',
        '/api/developers/:id',
        '/api/platforms',
        '/api/platforms/:id',
        '/api/publishers',
        '/api/publishers/:id',
      ],
    },
  },
};
