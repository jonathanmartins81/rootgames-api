/**
 * 🚀 Middleware para Acesso Público às APIs
 *
 * Este middleware permite acesso público às rotas especificadas
 */

export default () => {
  return async (ctx: any, next: any) => {
    // Lista de rotas públicas
    const publicRoutes = [
      '/api/games',
      '/api/games/populate',
      '/api/categories',
      '/api/developers',
      '/api/platforms',
      '/api/publishers',
    ];

    // Verificar se a rota atual é pública
    const isPublicRoute = publicRoutes.some(route => {
      if (route.includes('/:id')) {
        // Para rotas com parâmetros
        const routePattern = route.replace('/:id', '/[^/]+');
        return new RegExp(`^${routePattern}$`).test(ctx.path);
      }
      return ctx.path === route || ctx.path.startsWith(route + '/');
    });

    if (isPublicRoute) {
      // Para rotas públicas, definir autenticação como pública
      ctx.state.auth = { strategy: 'public' };
    }

    await next();
  };
};
