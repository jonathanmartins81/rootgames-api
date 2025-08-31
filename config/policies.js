/**
 * 🔐 Políticas de Acesso para APIs
 *
 * Este arquivo define políticas de acesso para as APIs
 */

module.exports = {
  // Política para permitir acesso público
  public: ctx => {
    return true; // Sempre permite acesso
  },

  // Política para população de jogos
  populate: ctx => {
    return true; // Sempre permite acesso
  },

  // Política para listar jogos
  list: ctx => {
    return true; // Sempre permite acesso
  },

  // Política para buscar jogo específico
  read: ctx => {
    return true; // Sempre permite acesso
  },
};
