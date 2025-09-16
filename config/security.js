/**
 * Configurações de Segurança para RootGames API
 *
 * Este arquivo contém todas as configurações de segurança
 * para o projeto Strapi
 */

module.exports = {
  // Configurações de CORS
  cors: {
    enabled: true,
    origin: process.env.NODE_ENV === 'production'
      ? ['https://rootgames.com.br', 'https://www.rootgames.com.br']
      : ['http://localhost:3000', 'http://localhost:8000', 'http://localhost:1337'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true
  },

  // Configurações de Rate Limiting
  rateLimit: {
    enabled: true,
    max: 100, // requests por janela
    interval: 60000, // 1 minuto
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Headers de Segurança
  security: {
    // Content Security Policy
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        'font-src': ["'self'", "https://fonts.gstatic.com"],
        'img-src': ["'self'", "data:", "https:", "http:"],
        'connect-src': [
          "'self'",
          "https://api.rawg.io",
          "https://store.steampowered.com",
          "https://www.gog.com",
          "https://api.igdb.com"
        ],
        'frame-src': ["'none'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'upgrade-insecure-requests': []
      }
    },

    // HSTS (HTTP Strict Transport Security)
    hsts: {
      maxAge: 31536000, // 1 ano
      includeSubDomains: true,
      preload: true
    },

    // X-Frame-Options
    frameguard: {
      action: 'deny'
    },

    // X-Content-Type-Options
    noSniff: true,

    // X-XSS-Protection
    xssFilter: true,

    // Referrer Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    }
  },

  // Configurações de Upload
  upload: {
    // Tamanho máximo do arquivo (10MB)
    maxFileSize: 10 * 1024 * 1024,

    // Tipos de arquivo permitidos
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

    // Diretório de upload
    uploadDir: './public/uploads',

    // Configurações de segurança para uploads
    security: {
      // Verificar assinatura de arquivo
      checkFileSignature: true,

      // Remover metadados EXIF
      removeExif: true,

      // Redimensionar imagens grandes
      resizeLargeImages: true,
      maxImageSize: 1920
    }
  },

  // Configurações de API Keys
  apiKeys: {
    // Chaves válidas (em produção, usar variáveis de ambiente)
    validKeys: process.env.VALID_API_KEYS?.split(',') || [
      'rootgames-dev-key-2024',
      'rootgames-admin-key-2024'
    ],

    // Rotas que requerem API key
    protectedRoutes: [
      '/api/admin',
      '/api/upload',
      '/api/games/images/download',
      '/api/games/images/download-all'
    ]
  },

  // Configurações de Logging de Segurança
  securityLogging: {
    enabled: true,
    logLevel: 'warn', // 'error', 'warn', 'info'

    // Eventos para logar
    events: [
      'rate_limit_exceeded',
      'invalid_api_key',
      'suspicious_request',
      'upload_attempt',
      'admin_access',
      'authentication_failure'
    ],

    // Formato do log
    format: 'json'
  },

  // Configurações de Validação de Entrada
  inputValidation: {
    enabled: true,

    // Tamanho máximo do body
    maxBodySize: 10 * 1024 * 1024, // 10MB

    // Sanitização de dados
    sanitize: {
      html: true,
      sql: true,
      xss: true
    },

    // Validação de parâmetros
    validateParams: {
      gameId: /^\d+$/,
      pageSize: /^\d+$/,
      page: /^\d+$/
    }
  },

  // Configurações de Sessão
  session: {
    // Tempo de vida da sessão (24 horas)
    maxAge: 24 * 60 * 60 * 1000,

    // Renovar sessão automaticamente
    rolling: true,

    // Configurações de cookie
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict'
    }
  },

  // Configurações de Monitoramento
  monitoring: {
    enabled: true,

    // Métricas de segurança
    metrics: [
      'requests_per_minute',
      'error_rate',
      'response_time',
      'upload_attempts',
      'failed_logins'
    ],

    // Alertas
    alerts: {
      highErrorRate: 0.1, // 10%
      highResponseTime: 5000, // 5 segundos
      suspiciousActivity: true
    }
  }
};
