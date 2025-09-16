/**
 * Middleware de Segurança para RootGames API
 *
 * Funcionalidades:
 * - Rate limiting
 * - Headers de segurança
 * - Validação de entrada
 * - Logging de segurança
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Configuração de Rate Limiting
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.log(`🚨 Rate limit exceeded for IP: ${req.ip} - ${req.method} ${req.path}`);
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Rate limits específicos
const rateLimits = {
  // API geral - 100 requests por minuto
  api: createRateLimit(60 * 1000, 100, 'Muitas requisições. Tente novamente em 1 minuto.'),

  // Upload de imagens - 10 requests por minuto
  upload: createRateLimit(60 * 1000, 10, 'Muitos uploads. Tente novamente em 1 minuto.'),

  // Busca de imagens - 30 requests por minuto
  search: createRateLimit(60 * 1000, 30, 'Muitas buscas. Tente novamente em 1 minuto.'),

  // Admin - 20 requests por minuto
  admin: createRateLimit(60 * 1000, 20, 'Muitas requisições admin. Tente novamente em 1 minuto.'),

  // Login - 5 tentativas por 15 minutos
  auth: createRateLimit(15 * 60 * 1000, 5, 'Muitas tentativas de login. Tente novamente em 15 minutos.')
};

// Configuração do Helmet para headers de segurança
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.rawg.io", "https://store.steampowered.com", "https://www.gog.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
};

// Middleware de validação de entrada
const validateInput = (req, res, next) => {
  // Verificar tamanho do body
  const contentLength = parseInt(req.get('content-length') || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    console.log(`🚨 Request too large: ${contentLength} bytes from IP: ${req.ip}`);
    return res.status(413).json({
      error: 'Payload muito grande. Máximo permitido: 10MB'
    });
  }

  // Verificar headers suspeitos
  const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-cluster-client-ip'];
  const hasSuspiciousHeaders = suspiciousHeaders.some(header =>
    req.get(header) && req.get(header).includes('..')
  );

  if (hasSuspiciousHeaders) {
    console.log(`🚨 Suspicious headers detected from IP: ${req.ip}`);
    return res.status(400).json({
      error: 'Headers suspeitos detectados'
    });
  }

  next();
};

// Middleware de logging de segurança
const securityLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;

    // Log de tentativas suspeitas
    if (status >= 400) {
      console.log(`🚨 Security Event - IP: ${req.ip} | Method: ${req.method} | Path: ${req.path} | Status: ${status} | Duration: ${duration}ms`);
    }

    // Log de uploads
    if (req.path.includes('/upload') && status === 200) {
      console.log(`📁 Upload Success - IP: ${req.ip} | File: ${req.file?.originalname || 'unknown'} | Size: ${req.file?.size || 0} bytes`);
    }
  });

  next();
};

// Middleware de validação de API keys
const validateApiKey = (req, res, next) => {
  const apiKey = req.get('x-api-key');
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

  // Permitir requisições sem API key para rotas públicas
  const publicRoutes = ['/api/games', '/api/categories', '/api/platforms', '/api/developers', '/api/publishers'];
  const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));

  if (isPublicRoute) {
    return next();
  }

  // Requerir API key para rotas administrativas
  if (!apiKey || !validApiKeys.includes(apiKey)) {
    console.log(`🚨 Invalid API key attempt from IP: ${req.ip}`);
    return res.status(401).json({
      error: 'API key inválida ou ausente'
    });
  }

  next();
};

// Middleware de sanitização de dados
const sanitizeInput = (req, res, next) => {
  // Sanitizar query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        // Remover caracteres perigosos
        req.query[key] = req.query[key]
          .replace(/[<>]/g, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+=/gi, '');
      }
    });
  }

  // Sanitizar body parameters
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj) => {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key]
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '');
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      });
    };

    sanitizeObject(req.body);
  }

  next();
};

// Middleware de proteção contra ataques de força bruta
const bruteForceProtection = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutos
  const maxAttempts = 5;

  // Em produção, usar Redis ou banco de dados
  // Aqui usamos memória (não recomendado para produção)
  if (!global.attempts) {
    global.attempts = new Map();
  }

  const attempts = global.attempts.get(ip) || [];
  const recentAttempts = attempts.filter(time => now - time < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    console.log(`🚨 Brute force protection triggered for IP: ${ip}`);
    return res.status(429).json({
      error: 'Muitas tentativas. Tente novamente em 15 minutos.'
    });
  }

  // Registrar tentativa
  recentAttempts.push(now);
  global.attempts.set(ip, recentAttempts);

  next();
};

module.exports = {
  rateLimits,
  helmetConfig,
  validateInput,
  securityLogger,
  validateApiKey,
  sanitizeInput,
  bruteForceProtection,

  // Função para configurar todos os middlewares
  setupSecurity: (app) => {
    // Helmet para headers de segurança
    app.use(helmet(helmetConfig));

    // Logging de segurança
    app.use(securityLogger);

    // Validação de entrada
    app.use(validateInput);

    // Sanitização
    app.use(sanitizeInput);

    // Rate limiting geral
    app.use('/api', rateLimits.api);

    // Rate limiting específico para uploads
    app.use('/api/upload', rateLimits.upload);

    // Rate limiting para busca de imagens
    app.use('/api/games/images', rateLimits.search);

    // Rate limiting para admin
    app.use('/admin', rateLimits.admin);

    // Proteção contra força bruta para autenticação
    app.use('/api/auth', bruteForceProtection);

    // Validação de API key para rotas administrativas
    app.use('/api/admin', validateApiKey);

    console.log('🔒 Middlewares de segurança configurados com sucesso');
  }
};
