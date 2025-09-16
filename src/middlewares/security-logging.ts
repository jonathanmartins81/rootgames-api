/**
 * Middleware de Logging de Segurança para Strapi
 *
 * Registra eventos de segurança em arquivo de log
 */

import * as fs from "fs";
import * as path from "path";

interface SecurityLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  event: string;
  ip: string;
  method: string;
  path: string;
  userAgent?: string;
  details?: any;
}

export default (config: any, { strapi }: any) => {
  const logFile = path.join(process.cwd(), "logs", "security.log");

  // Criar diretório de logs se não existir
  const logDir = path.dirname(logFile);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  return async (ctx: any, next: any) => {
    const startTime = Date.now();

    // Log da requisição
    logSecurityEvent({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "request_started",
      ip: ctx.ip,
      method: ctx.method,
      path: ctx.path,
      userAgent: ctx.get("User-Agent"),
      details: {
        query: ctx.query,
        headers: {
          "content-type": ctx.get("Content-Type"),
          "content-length": ctx.get("Content-Length"),
          "x-api-key": ctx.get("X-API-Key") ? "***" : undefined,
        },
      },
    });

    try {
      await next();

      const duration = Date.now() - startTime;

      // Log de resposta bem-sucedida
      if (ctx.status >= 200 && ctx.status < 300) {
        logSecurityEvent({
          timestamp: new Date().toISOString(),
          level: "info",
          event: "request_completed",
          ip: ctx.ip,
          method: ctx.method,
          path: ctx.path,
          details: {
            status: ctx.status,
            duration: `${duration}ms`,
          },
        });
      }

      // Log de erros
      if (ctx.status >= 400) {
        logSecurityEvent({
          timestamp: new Date().toISOString(),
          level: "warn",
          event: "request_error",
          ip: ctx.ip,
          method: ctx.method,
          path: ctx.path,
          details: {
            status: ctx.status,
            error: ctx.body?.error || "Unknown error",
          },
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log de exceção
      logSecurityEvent({
        timestamp: new Date().toISOString(),
        level: "error",
        event: "request_exception",
        ip: ctx.ip,
        method: ctx.method,
        path: ctx.path,
        details: {
          error: error.message,
          stack: error.stack,
          duration: `${duration}ms`,
        },
      });

      throw error;
    }
  };

  function logSecurityEvent(entry: SecurityLogEntry) {
    try {
      const logLine = JSON.stringify(entry) + "\n";
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error("Erro ao escrever log de segurança:", error);
    }
  }
};
