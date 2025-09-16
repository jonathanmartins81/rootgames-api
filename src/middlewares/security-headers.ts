/**
 * Middleware de Headers de Segurança para Strapi
 *
 * Adiciona headers de segurança adicionais
 */

export default (config: any, { strapi }: any) => {
  return async (ctx: any, next: any) => {
    // Headers de segurança
    ctx.set("X-XSS-Protection", "1; mode=block");
    ctx.set("X-Content-Type-Options", "nosniff");
    ctx.set("X-Frame-Options", "DENY");
    ctx.set("Referrer-Policy", "strict-origin-when-cross-origin");
    ctx.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

    // Header personalizado para identificar a API
    ctx.set("X-API-Version", "1.0.0");
    ctx.set("X-Powered-By", "RootGames API");

    // Log de requisições suspeitas
    const userAgent = ctx.get("User-Agent") || "";
    const suspiciousPatterns = [
      /sqlmap/i,
      /nikto/i,
      /nmap/i,
      /masscan/i,
      /zap/i,
      /burp/i,
      /w3af/i,
    ];

    if (suspiciousPatterns.some((pattern) => pattern.test(userAgent))) {
      strapi.log.warn(
        `🚨 Suspicious User-Agent detected: ${userAgent} from IP: ${ctx.ip}`
      );
    }

    await next();
  };
};
