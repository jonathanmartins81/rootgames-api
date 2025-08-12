/**
 * Feature Flags Configuration
 * Sistema de controle de funcionalidades para implementação segura
 */

module.exports = ({ env }) => ({
  // ========================================
  // Q1 2025 - Fundação e Estabilização
  // ========================================

  // Cache e Performance
  redisCache: env.bool('FEATURE_REDIS_CACHE', false),
  memoryCache: env.bool('FEATURE_MEMORY_CACHE', true),
  queryOptimization: env.bool('FEATURE_QUERY_OPTIMIZATION', false),

  // Segurança
  rateLimiting: env.bool('FEATURE_RATE_LIMITING', false),
  inputValidation: env.bool('FEATURE_INPUT_VALIDATION', true),
  securityHeaders: env.bool('FEATURE_SECURITY_HEADERS', true),

  // Monitoramento
  advancedLogging: env.bool('FEATURE_ADVANCED_LOGGING', false),
  healthChecks: env.bool('FEATURE_HEALTH_CHECKS', true),
  metrics: env.bool('FEATURE_METRICS', false),

  // ========================================
  // Q2 2025 - Expansão de Funcionalidades
  // ========================================

  // Sistema de Usuários
  advancedAuth: env.bool('FEATURE_ADVANCED_AUTH', false),
  oauth2: env.bool('FEATURE_OAUTH2', false),
  twoFactorAuth: env.bool('FEATURE_2FA', false),

  // Reviews e Avaliações
  reviews: env.bool('FEATURE_REVIEWS', false),
  ratings: env.bool('FEATURE_RATINGS', false),
  reviewModeration: env.bool('FEATURE_REVIEW_MODERATION', false),

  // Wishlist e Favoritos
  wishlist: env.bool('FEATURE_WISHLIST', false),
  favorites: env.bool('FEATURE_FAVORITES', false),
  priceAlerts: env.bool('FEATURE_PRICE_ALERTS', false),

  // Notificações
  notifications: env.bool('FEATURE_NOTIFICATIONS', false),
  emailNotifications: env.bool('FEATURE_EMAIL_NOTIFICATIONS', false),
  pushNotifications: env.bool('FEATURE_PUSH_NOTIFICATIONS', false),

  // Features Sociais
  social: env.bool('FEATURE_SOCIAL', false),
  comments: env.bool('FEATURE_COMMENTS', false),
  userProfiles: env.bool('FEATURE_USER_PROFILES', false),

  // ========================================
  // Q3 2025 - Integração e Automação
  // ========================================

  // Integração Multi-Loja
  multiStore: env.bool('FEATURE_MULTI_STORE', false),
  steamIntegration: env.bool('FEATURE_STEAM_INTEGRATION', false),
  epicIntegration: env.bool('FEATURE_EPIC_INTEGRATION', false),
  gogIntegration: env.bool('FEATURE_GOG_INTEGRATION', true), // Já implementado

  // Sistema de Preços
  priceTracking: env.bool('FEATURE_PRICE_TRACKING', false),
  priceHistory: env.bool('FEATURE_PRICE_HISTORY', false),
  priceComparison: env.bool('FEATURE_PRICE_COMPARISON', false),

  // Automação
  autoSync: env.bool('FEATURE_AUTO_SYNC', false),
  autoUpdate: env.bool('FEATURE_AUTO_UPDATE', false),
  dataCleanup: env.bool('FEATURE_DATA_CLEANUP', false),

  // Analytics
  analytics: env.bool('FEATURE_ANALYTICS', false),
  userAnalytics: env.bool('FEATURE_USER_ANALYTICS', false),
  businessMetrics: env.bool('FEATURE_BUSINESS_METRICS', false),

  // ========================================
  // Q4 2025 - Escalabilidade e Inovação
  // ========================================

  // Microserviços
  microservices: env.bool('FEATURE_MICROSERVICES', false),
  apiGateway: env.bool('FEATURE_API_GATEWAY', false),
  serviceDiscovery: env.bool('FEATURE_SERVICE_DISCOVERY', false),

  // IA e Machine Learning
  aiRecommendations: env.bool('FEATURE_AI_RECOMMENDATIONS', false),
  sentimentAnalysis: env.bool('FEATURE_SENTIMENT_ANALYSIS', false),
  spamDetection: env.bool('FEATURE_SPAM_DETECTION', false),

  // Real-time Features
  realtime: env.bool('FEATURE_REALTIME', false),
  websockets: env.bool('FEATURE_WEBSOCKETS', false),
  liveUpdates: env.bool('FEATURE_LIVE_UPDATES', false),

  // Mobile e PWA
  mobileApp: env.bool('FEATURE_MOBILE_APP', false),
  pwa: env.bool('FEATURE_PWA', false),
  offlineMode: env.bool('FEATURE_OFFLINE_MODE', false),

  // ========================================
  // Configurações Avançadas
  // ========================================

  // Debug e Desenvolvimento
  debugMode: env.bool('FEATURE_DEBUG_MODE', false),
  developmentTools: env.bool('FEATURE_DEV_TOOLS', false),
  hotReload: env.bool('FEATURE_HOT_RELOAD', true),

  // Testes
  automatedTesting: env.bool('FEATURE_AUTOMATED_TESTING', false),
  loadTesting: env.bool('FEATURE_LOAD_TESTING', false),
  integrationTesting: env.bool('FEATURE_INTEGRATION_TESTING', false),

  // Backup e Recuperação
  autoBackup: env.bool('FEATURE_AUTO_BACKUP', true),
  disasterRecovery: env.bool('FEATURE_DISASTER_RECOVERY', false),
  dataReplication: env.bool('FEATURE_DATA_REPLICATION', false),

  // ========================================
  // Configurações de Controle
  // ========================================

  // Controle de Features
  featureFlagsEnabled: env.bool('FEATURE_FLAGS_ENABLED', true),
  featureRollbackEnabled: env.bool('FEATURE_ROLLBACK_ENABLED', true),
  featureMonitoringEnabled: env.bool('FEATURE_MONITORING_ENABLED', true),

  // Thresholds para Rollback Automático
  errorThreshold: env.int('ERROR_THRESHOLD', 5), // 5% de erro
  responseTimeThreshold: env.int('RESPONSE_TIME_THRESHOLD', 1000), // 1 segundo
  memoryThreshold: env.int('MEMORY_THRESHOLD', 80), // 80% de memória
  cpuThreshold: env.int('CPU_THRESHOLD', 70), // 70% de CPU

  // Configurações de Notificação
  alertChannels: {
    slack: env.bool('ALERT_SLACK_ENABLED', false),
    email: env.bool('ALERT_EMAIL_ENABLED', false),
    discord: env.bool('ALERT_DISCORD_ENABLED', false),
  },

  // Configurações de Log
  logLevel: env('LOG_LEVEL', 'info'),
  logRetention: env.int('LOG_RETENTION_DAYS', 30),

  // Configurações de Cache
  cacheTTL: env.int('CACHE_TTL', 3600), // 1 hora
  cacheMaxSize: env.int('CACHE_MAX_SIZE', 100), // 100 itens

  // Configurações de Rate Limiting
  rateLimitWindow: env.int('RATE_LIMIT_WINDOW', 900000), // 15 minutos
  rateLimitMax: env.int('RATE_LIMIT_MAX', 100), // 100 requests por janela

  // Configurações de Health Check
  healthCheckInterval: env.int('HEALTH_CHECK_INTERVAL', 60000), // 1 minuto
  healthCheckTimeout: env.int('HEALTH_CHECK_TIMEOUT', 30000), // 30 segundos

  // Configurações de Backup
  backupRetention: env.int('BACKUP_RETENTION_DAYS', 7),
  backupSchedule: env('BACKUP_SCHEDULE', '0 2 * * *'), // 2 AM diariamente

  // Configurações de Monitoramento
  monitoringInterval: env.int('MONITORING_INTERVAL', 30000), // 30 segundos
  alertCooldown: env.int('ALERT_COOLDOWN', 300000), // 5 minutos
  maxAlertsPerHour: env.int('MAX_ALERTS_PER_HOUR', 10),
});

// ========================================
// Funções Utilitárias
// ========================================

/**
 * Verificar se uma feature está habilitada
 * @param {string} featureName - Nome da feature
 * @param {object} features - Objeto de features
 * @returns {boolean}
 */
function isFeatureEnabled(featureName, features) {
  return features[featureName] === true;
}

/**
 * Obter lista de features habilitadas
 * @param {object} features - Objeto de features
 * @returns {string[]}
 */
function getEnabledFeatures(features) {
  return Object.keys(features).filter(key => features[key] === true);
}

/**
 * Obter lista de features desabilitadas
 * @param {object} features - Objeto de features
 * @returns {string[]}
 */
function getDisabledFeatures(features) {
  return Object.keys(features).filter(key => features[key] === false);
}

/**
 * Verificar se features críticas estão habilitadas
 * @param {object} features - Objeto de features
 * @returns {object}
 */
function checkCriticalFeatures(features) {
  const criticalFeatures = [
    'healthChecks',
    'autoBackup',
    'featureRollbackEnabled'
  ];

  const missingFeatures = criticalFeatures.filter(feature => !features[feature]);

  return {
    allEnabled: missingFeatures.length === 0,
    missingFeatures,
    criticalFeatures
  };
}

/**
 * Gerar relatório de features
 * @param {object} features - Objeto de features
 * @returns {object}
 */
function generateFeatureReport(features) {
  const enabled = getEnabledFeatures(features);
  const disabled = getDisabledFeatures(features);
  const critical = checkCriticalFeatures(features);

  return {
    total: Object.keys(features).length,
    enabled: enabled.length,
    disabled: disabled.length,
    enabledFeatures: enabled,
    disabledFeatures: disabled,
    criticalFeatures: critical,
    timestamp: new Date().toISOString()
  };
}

// Exportar funções utilitárias
module.exports.utils = {
  isFeatureEnabled,
  getEnabledFeatures,
  getDisabledFeatures,
  checkCriticalFeatures,
  generateFeatureReport
};
