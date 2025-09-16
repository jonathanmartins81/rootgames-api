/**
 * Middleware de Autenticação por API Key para Strapi
 *
 * Valida API keys para rotas administrativas
 */

interface ApiKeyConfig {
  validKeys: string[];
  protectedRoutes: string[];
  headerName: string;
}

export default (config: any, { strapi }: any) => {
  const apiKeyConfig: ApiKeyConfig = {
    validKeys: process.env.VALID_API_KEYS?.split(",") || [
      "rootgames-dev-key-2024",
      "rootgames-admin-key-2024",
    ],
    protectedRoutes: [
      "/api/admin",
      "/api/upload",
      "/api/games/images/download",
      "/api/games/images/download-all",
    ],
    headerName: "X-API-Key",
    ...config,
  };

  return async (ctx: any, next: any) => {
    const { path, method } = ctx;

    // Verificar se a rota está protegida
    const isProtectedRoute = apiKeyConfig.protectedRoutes.some((route) =>
      path.startsWith(route)
    );

    if (!isProtectedRoute) {
      await next();
      return;
    }

    // Obter API key do header
    const apiKey = ctx.get(apiKeyConfig.headerName);

    if (!apiKey) {
      strapi.log.warn(
        `🚨 Missing API key for protected route: ${method} ${path} from IP: ${ctx.ip}`
      );

      ctx.status = 401;
      ctx.body = {
        error: "API key é obrigatória para esta rota",
        code: "MISSING_API_KEY",
      };
      return;
    }

    // Validar API key
    if (!apiKeyConfig.validKeys.includes(apiKey)) {
      strapi.log.warn(
        `🚨 Invalid API key attempt: ${apiKey} for route: ${method} ${path} from IP: ${ctx.ip}`
      );

      ctx.status = 401;
      ctx.body = {
        error: "API key inválida",
        code: "INVALID_API_KEY",
      };
      return;
    }

    // Log de acesso autorizado
    strapi.log.info(
      `✅ Authorized API access: ${method} ${path} with key: ${apiKey.substring(
        0,
        8
      )}... from IP: ${ctx.ip}`
    );

    await next();
  };
};
