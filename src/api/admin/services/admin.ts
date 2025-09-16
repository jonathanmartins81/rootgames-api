/**
 * Serviço Administrativo para RootGames API
 *
 * Lógica de negócio para operações administrativas
 */

export default ({ strapi }: any) => ({
  // Inicializar estatísticas de segurança
  initializeSecurityStats() {
    if (!global.securityStats) {
      global.securityStats = {
        totalRequests: 0,
        blockedRequests: 0,
        rateLimitedRequests: 0,
        suspiciousRequests: 0,
        lastScan: null,
        vulnerabilities: 0,
      };
    }
  },

  // Incrementar contador de requisições
  incrementRequestCount() {
    this.initializeSecurityStats();
    global.securityStats.totalRequests++;
  },

  // Incrementar contador de requisições bloqueadas
  incrementBlockedRequests() {
    this.initializeSecurityStats();
    global.securityStats.blockedRequests++;
  },

  // Incrementar contador de rate limiting
  incrementRateLimitedRequests() {
    this.initializeSecurityStats();
    global.securityStats.rateLimitedRequests++;
  },

  // Incrementar contador de requisições suspeitas
  incrementSuspiciousRequests() {
    this.initializeSecurityStats();
    global.securityStats.suspiciousRequests++;
  },

  // Atualizar última verificação de vulnerabilidades
  updateLastVulnerabilityScan(vulnerabilityCount: number) {
    this.initializeSecurityStats();
    global.securityStats.lastScan = new Date().toISOString();
    global.securityStats.vulnerabilities = vulnerabilityCount;
  },

  // Obter estatísticas de segurança
  getSecurityStats() {
    this.initializeSecurityStats();
    return global.securityStats;
  },

  // Limpar estatísticas
  clearSecurityStats() {
    global.securityStats = {
      totalRequests: 0,
      blockedRequests: 0,
      rateLimitedRequests: 0,
      suspiciousRequests: 0,
      lastScan: null,
      vulnerabilities: 0,
    };
  },
});
