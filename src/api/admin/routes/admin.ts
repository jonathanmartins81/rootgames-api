/**
 * Rotas Administrativas para RootGames API
 *
 * Todas as rotas são protegidas por API key
 */

export default {
  routes: [
    {
      method: "GET",
      path: "/admin/system-info",
      handler: "admin.getSystemInfo",
      config: {
        auth: false, // Usa middleware de API key
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/admin/security-stats",
      handler: "admin.getSecurityStats",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/admin/security-logs",
      handler: "admin.getSecurityLogs",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/admin/clear-cache",
      handler: "admin.clearSecurityCache",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/admin/run-vulnerability-scan",
      handler: "admin.runVulnerabilityScan",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/admin/test-external-apis",
      handler: "admin.testExternalAPIs",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
