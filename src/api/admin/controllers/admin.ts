/**
 * Controlador Administrativo para RootGames API
 *
 * Rotas protegidas por API key para operações administrativas
 */

export default {
  // Informações do sistema
  async getSystemInfo(ctx: any) {
    try {
      const systemInfo = {
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
        api: {
          name: "RootGames API",
          description: "API para gerenciamento de jogos",
          endpoints: {
            games: "/api/games",
            categories: "/api/categories",
            platforms: "/api/platforms",
            developers: "/api/developers",
            publishers: "/api/publishers",
          },
        },
      };

      ctx.body = {
        success: true,
        data: systemInfo,
      };
    } catch (error) {
      ctx.throw(500, "Erro ao obter informações do sistema");
    }
  },

  // Estatísticas de segurança
  async getSecurityStats(ctx: any) {
    try {
      const securityStats = {
        totalRequests: global.securityStats?.totalRequests || 0,
        blockedRequests: global.securityStats?.blockedRequests || 0,
        rateLimitedRequests: global.securityStats?.rateLimitedRequests || 0,
        suspiciousRequests: global.securityStats?.suspiciousRequests || 0,
        lastScan: global.securityStats?.lastScan || null,
        vulnerabilities: global.securityStats?.vulnerabilities || 0,
      };

      ctx.body = {
        success: true,
        data: securityStats,
      };
    } catch (error) {
      ctx.throw(500, "Erro ao obter estatísticas de segurança");
    }
  },

  // Listar logs de segurança
  async getSecurityLogs(ctx: any) {
    try {
      const fs = require("fs");
      const path = require("path");

      const logFile = path.join(process.cwd(), "logs", "security.log");

      if (!fs.existsSync(logFile)) {
        ctx.body = {
          success: true,
          data: {
            logs: [],
            message: "Arquivo de log não encontrado",
          },
        };
        return;
      }

      const logContent = fs.readFileSync(logFile, "utf8");
      const logs = logContent
        .split("\n")
        .filter((line) => line.trim())
        .slice(-100) // Últimas 100 linhas
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return { message: line, timestamp: new Date().toISOString() };
          }
        });

      ctx.body = {
        success: true,
        data: {
          logs,
          total: logs.length,
        },
      };
    } catch (error) {
      ctx.throw(500, "Erro ao obter logs de segurança");
    }
  },

  // Limpar cache de segurança
  async clearSecurityCache(ctx: any) {
    try {
      // Limpar cache de rate limiting
      if (global.rateLimitStore) {
        Object.keys(global.rateLimitStore).forEach((key) => {
          delete global.rateLimitStore[key];
        });
      }

      // Limpar cache de tentativas de login
      if (global.loginAttempts) {
        Object.keys(global.loginAttempts).forEach((key) => {
          delete global.loginAttempts[key];
        });
      }

      ctx.body = {
        success: true,
        message: "Cache de segurança limpo com sucesso",
      };
    } catch (error) {
      ctx.throw(500, "Erro ao limpar cache de segurança");
    }
  },

  // Executar scan de vulnerabilidades
  async runVulnerabilityScan(ctx: any) {
    try {
      const { execSync } = require("child_process");

      // Executar scan de vulnerabilidades
      const scanResult = execSync("node scripts/vulnerability-scanner.js", {
        encoding: "utf8",
        cwd: process.cwd(),
      });

      ctx.body = {
        success: true,
        message: "Scan de vulnerabilidades executado com sucesso",
        output: scanResult,
      };
    } catch (error) {
      ctx.throw(500, "Erro ao executar scan de vulnerabilidades");
    }
  },

  // Testar conectividade com APIs externas
  async testExternalAPIs(ctx: any) {
    try {
      const axios = require("axios");
      const results: any = {};

      // Testar RAWG API
      try {
        const rawgResponse = await axios.get(
          "https://api.rawg.io/api/games?key=test",
          {
            timeout: 5000,
          }
        );
        results.rawg = {
          status: "success",
          statusCode: rawgResponse.status,
        };
      } catch (error: any) {
        results.rawg = {
          status: "error",
          message: error.message,
        };
      }

      // Testar Steam API
      try {
        const steamResponse = await axios.get(
          "https://store.steampowered.com/api/appdetails?appids=730",
          {
            timeout: 5000,
          }
        );
        results.steam = {
          status: "success",
          statusCode: steamResponse.status,
        };
      } catch (error: any) {
        results.steam = {
          status: "error",
          message: error.message,
        };
      }

      ctx.body = {
        success: true,
        data: results,
      };
    } catch (error) {
      ctx.throw(500, "Erro ao testar APIs externas");
    }
  },
};
