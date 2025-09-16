/**
 * Middleware de Rate Limiting para Strapi
 *
 * Implementa rate limiting usando o sistema de cache do Strapi
 */

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export default (config: any, { strapi }: any) => {
  const rateLimitConfig: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minuto
    max: 100, // 100 requisições por minuto
    message: "Muitas requisições. Tente novamente em 1 minuto.",
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    ...config,
  };

  // Store em memória (em produção, usar Redis)
  const store: RateLimitStore = {};

  return async (ctx: any, next: any) => {
    const key = ctx.ip;
    const now = Date.now();
    const windowStart = now - rateLimitConfig.windowMs;

    // Limpar entradas expiradas
    Object.keys(store).forEach((ip) => {
      if (store[ip].resetTime < now) {
        delete store[ip];
      }
    });

    // Inicializar ou atualizar contador
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + rateLimitConfig.windowMs,
      };
    } else {
      store[key].count++;
    }

    const currentCount = store[key].count;

    // Verificar se excedeu o limite
    if (currentCount > rateLimitConfig.max) {
      strapi.log.warn(
        `🚨 Rate limit exceeded for IP: ${ctx.ip} - ${ctx.method} ${ctx.path}`
      );

      ctx.status = 429;
      ctx.set(
        "Retry-After",
        Math.ceil(rateLimitConfig.windowMs / 1000).toString()
      );
      ctx.body = {
        error: rateLimitConfig.message,
        retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000),
      };
      return;
    }

    // Adicionar headers informativos
    ctx.set("X-RateLimit-Limit", rateLimitConfig.max.toString());
    ctx.set(
      "X-RateLimit-Remaining",
      Math.max(0, rateLimitConfig.max - currentCount).toString()
    );
    ctx.set("X-RateLimit-Reset", new Date(store[key].resetTime).toISOString());

    await next();
  };
};
