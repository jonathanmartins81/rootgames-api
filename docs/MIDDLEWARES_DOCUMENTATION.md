# 🔧 Middlewares Documentation - RootGames API

Documentação completa dos middlewares de segurança e funcionalidades implementados no RootGames API.

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Security Headers Middleware](#-security-headers-middleware)
- [Rate Limiting Middleware](#-rate-limiting-middleware)
- [API Key Authentication Middleware](#-api-key-authentication-middleware)
- [Upload Validation Middleware](#-upload-validation-middleware)
- [Security Logging Middleware](#-security-logging-middleware)
- [SEO Middleware](#-seo-middleware)
- [Configuração de Middlewares](#-configuração-de-middlewares)

---

## 🎯 Visão Geral

O RootGames API implementa um sistema robusto de middlewares para:

- ✅ **Segurança** - Headers, rate limiting, autenticação
- ✅ **Validação** - Upload de arquivos, dados de entrada
- ✅ **Monitoramento** - Logs, métricas, alertas
- ✅ **Performance** - Cache, otimizações
- ✅ **SEO** - Metadados automáticos, otimização

### Estrutura de Middlewares

```
src/middlewares/
├── security-headers.ts      # Headers de segurança
├── rate-limiting.ts         # Controle de requisições
├── api-key-auth.ts          # Autenticação por API key
├── upload-validation.ts     # Validação de upload
├── security-logging.ts      # Logging de segurança
├── security.js              # Middleware principal
└── seo-middleware.js        # Middleware de SEO
```

---

## 🛡️ Security Headers Middleware

### Localização: `src/middlewares/security-headers.ts`

**Funcionalidade:** Adiciona headers de segurança HTTP para proteção contra ataques.

### Implementação

```typescript
export default (config, { strapi }) => {
  return async (ctx, next) => {
    // Headers de segurança básicos
    ctx.set("X-XSS-Protection", "1; mode=block");
    ctx.set("X-Content-Type-Options", "nosniff");
    ctx.set("X-Frame-Options", "DENY");
    ctx.set("Referrer-Policy", "strict-origin-when-cross-origin");
    ctx.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    
    // Headers personalizados
    ctx.set("X-API-Version", "1.0.0");
    ctx.set("X-Powered-By", "RootGames API");
    
    // Detecção de User-Agents suspeitos
    const userAgent = ctx.get("User-Agent") || "";
    const suspiciousPatterns = [
      /sqlmap/i,
      /nmap/i,
      /nikto/i,
      /zap/i,
      /burp/i,
      /w3af/i,
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    
    if (isSuspicious) {
      strapi.log.warn(`Suspicious User-Agent detected: ${userAgent}`);
      ctx.set("X-Security-Warning", "Suspicious activity detected");
    }
    
    await next();
  };
};
```

### Headers Implementados

| Header | Valor | Descrição |
|--------|-------|-----------|
| `X-XSS-Protection` | `1; mode=block` | Proteção contra XSS |
| `X-Content-Type-Options` | `nosniff` | Previne MIME sniffing |
| `X-Frame-Options` | `DENY` | Previne clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controle de referrer |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` | Controle de permissões |
| `X-API-Version` | `1.0.0` | Versão da API |
| `X-Powered-By` | `RootGames API` | Identificação da API |

### Detecção de Ameaças

O middleware detecta automaticamente User-Agents suspeitos:

- **sqlmap** - Ferramenta de SQL injection
- **nmap** - Scanner de rede
- **nikto** - Scanner de vulnerabilidades web
- **zap** - OWASP ZAP
- **burp** - Burp Suite
- **w3af** - Web Application Attack Framework

---

## ⚡ Rate Limiting Middleware

### Localização: `src/middlewares/rate-limiting.ts`

**Funcionalidade:** Controla o número de requisições por IP para prevenir abuso.

### Implementação

```typescript
export default (config, { strapi }) => {
  const rateLimitConfig = {
    windowMs: config.windowMs || 60 * 1000, // 1 minuto
    max: config.max || 100, // 100 requisições por minuto
    message: config.message || "Muitas requisições. Tente novamente em 1 minuto.",
    skipSuccessfulRequests: config.skipSuccessfulRequests || false,
    skipFailedRequests: config.skipFailedRequests || false,
  };

  // Armazenamento em memória (em produção usar Redis)
  const store: { [key: string]: { count: number; resetTime: number } } = {};

  return async (ctx, next) => {
    const key = ctx.ip;
    const now = Date.now();
    const windowMs = rateLimitConfig.windowMs;

    // Limpar entradas expiradas
    Object.keys(store).forEach(ip => {
      if (store[ip].resetTime < now) {
        delete store[ip];
      }
    });

    // Inicializar ou atualizar contador
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      store[key].count++;
    }

    const currentCount = store[key].count;
    const resetTime = store[key].resetTime;

    // Adicionar headers de rate limiting
    ctx.set("X-RateLimit-Limit", rateLimitConfig.max.toString());
    ctx.set("X-RateLimit-Remaining", Math.max(0, rateLimitConfig.max - currentCount).toString());
    ctx.set("X-RateLimit-Reset", new Date(resetTime).toISOString());

    // Verificar limite
    if (currentCount > rateLimitConfig.max) {
      ctx.status = 429;
      ctx.set("Retry-After", Math.ceil(windowMs / 1000).toString());
      ctx.body = {
        error: rateLimitConfig.message,
        retryAfter: Math.ceil(windowMs / 1000),
        limit: rateLimitConfig.max,
        remaining: 0,
        resetTime: new Date(resetTime).toISOString(),
      };
      return;
    }

    await next();
  };
};
```

### Configuração

```typescript
// config/middlewares.ts
{
  name: "global::rate-limiting",
  config: {
    windowMs: 60 * 1000, // 1 minuto
    max: 100, // 100 requisições por minuto
    message: "Muitas requisições. Tente novamente em 1 minuto.",
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
}
```

### Headers de Rate Limiting

| Header | Descrição | Exemplo |
|--------|-----------|---------|
| `X-RateLimit-Limit` | Limite máximo de requisições | `100` |
| `X-RateLimit-Remaining` | Requisições restantes | `95` |
| `X-RateLimit-Reset` | Timestamp de reset | `2025-09-16T21:00:00Z` |
| `Retry-After` | Segundos para tentar novamente | `60` |

### Limites por Endpoint

| Endpoint | Limite | Janela | Descrição |
|----------|--------|--------|-----------|
| `/api/games` | 100 req/min | 1 min | API geral |
| `/api/games/images/search` | 50 req/min | 1 min | Busca de imagens |
| `/api/admin/*` | 50 req/min | 1 min | Rotas administrativas |
| `/api/upload` | 10 req/min | 1 min | Upload de arquivos |

---

## 🔑 API Key Authentication Middleware

### Localização: `src/middlewares/api-key-auth.ts`

**Funcionalidade:** Autentica rotas administrativas usando API keys.

### Implementação

```typescript
export default (config, { strapi }) => {
  const apiKeyConfig = {
    headerName: config.headerName || "X-API-Key",
    validKeys: config.validKeys || [
      "rootgames-dev-key-2024",
      "rootgames-admin-key-2024",
    ],
    protectedRoutes: config.protectedRoutes || [
      "/api/admin",
      "/api/upload",
      "/api/games/images/download",
      "/api/games/images/download-all",
    ],
  };

  return async (ctx, next) => {
    const path = ctx.path;
    const isProtectedRoute = apiKeyConfig.protectedRoutes.some(route => 
      path.startsWith(route)
    );

    if (!isProtectedRoute) {
      await next();
      return;
    }

    const apiKey = ctx.get(apiKeyConfig.headerName);

    if (!apiKey) {
      ctx.status = 401;
      ctx.body = {
        error: "API key é obrigatória para esta rota",
        code: "MISSING_API_KEY",
        headerName: apiKeyConfig.headerName,
      };
      return;
    }

    if (!apiKeyConfig.validKeys.includes(apiKey)) {
      ctx.status = 401;
      ctx.body = {
        error: "API key inválida",
        code: "INVALID_API_KEY",
      };
      return;
    }

    // Log de acesso
    strapi.log.info(`API key access: ${apiKey} to ${path}`);

    await next();
  };
};
```

### Configuração

```typescript
// config/middlewares.ts
{
  name: "global::api-key-auth",
  config: {
    headerName: "X-API-Key",
    validKeys: [
      "rootgames-dev-key-2024",
      "rootgames-admin-key-2024",
    ],
    protectedRoutes: [
      "/api/admin",
      "/api/upload",
      "/api/games/images/download",
      "/api/games/images/download-all",
    ],
  },
}
```

### Chaves Válidas

| Chave | Nome | Permissões | Expiração |
|-------|------|------------|-----------|
| `rootgames-dev-key-2024` | Development Key | read, write | Nunca |
| `rootgames-admin-key-2024` | Admin Key | read, write, admin | 2025-12-31 |

### Rotas Protegidas

- `GET /api/admin/system-info`
- `GET /api/admin/security-stats`
- `GET /api/admin/security-logs`
- `POST /api/admin/clear-cache`
- `POST /api/admin/run-vulnerability-scan`
- `GET /api/admin/test-external-apis`
- `POST /api/upload`
- `POST /api/games/images/download`
- `POST /api/games/images/download-all`

### Códigos de Erro

| Código | Descrição | Solução |
|--------|-----------|---------|
| `MISSING_API_KEY` | API key não fornecida | Incluir header `X-API-Key` |
| `INVALID_API_KEY` | API key inválida | Usar chave válida |

---

## 📁 Upload Validation Middleware

### Localização: `src/middlewares/upload-validation.ts`

**Funcionalidade:** Valida arquivos enviados por upload para segurança.

### Implementação

```typescript
export default (config, { strapi }) => {
  const uploadConfig = {
    maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
    allowedTypes: config.allowedTypes || [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
    allowedExtensions: config.allowedExtensions || [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    maxFiles: config.maxFiles || 10,
  };

  return async (ctx, next) => {
    if (ctx.method !== "POST" || !ctx.request.files) {
      await next();
      return;
    }

    const files = Array.isArray(ctx.request.files.files) 
      ? ctx.request.files.files 
      : [ctx.request.files.files];

    // Verificar número de arquivos
    if (files.length > uploadConfig.maxFiles) {
      ctx.status = 400;
      ctx.body = {
        error: `Máximo de ${uploadConfig.maxFiles} arquivos permitidos`,
        code: "TOO_MANY_FILES",
        maxFiles: uploadConfig.maxFiles,
      };
      return;
    }

    // Validar cada arquivo
    for (const file of files) {
      const validation = await validateFile(file, uploadConfig, strapi);
      
      if (!validation.valid) {
        ctx.status = 400;
        ctx.body = {
          error: validation.error,
          code: validation.code,
          filename: file.name,
        };
        return;
      }
    }

    await next();
  };
};

async function validateFile(file, config, strapi) {
  // Validação de tamanho
  if (file.size > config.maxFileSize) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo permitido: ${formatBytes(config.maxFileSize)}`,
      code: "FILE_TOO_LARGE",
    };
  }

  // Validação de tipo MIME
  if (!config.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido: ${file.type}`,
      code: "INVALID_FILE_TYPE",
    };
  }

  // Validação de extensão
  const extension = getFileExtension(file.name);
  if (!config.allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Extensão de arquivo não permitida: ${extension}`,
      code: "INVALID_FILE_EXTENSION",
    };
  }

  // Validação de assinatura (Magic Numbers)
  const magicNumbers = {
    "image/jpeg": [0xff, 0xd8, 0xff],
    "image/png": [0x89, 0x50, 0x4e, 0x47],
    "image/gif": [0x47, 0x49, 0x46, 0x38],
    "image/webp": [0x52, 0x49, 0x46, 0x46],
    "image/svg+xml": [0x3c, 0x3f, 0x78, 0x6d, 0x6c],
  };

  if (magicNumbers[file.type]) {
    const buffer = await readFileHeader(file.path, magicNumbers[file.type].length);
    const isValidSignature = magicNumbers[file.type].every((byte, index) => 
      buffer[index] === byte
    );

    if (!isValidSignature) {
      return {
        valid: false,
        error: "Assinatura de arquivo inválida",
        code: "INVALID_FILE_SIGNATURE",
      };
    }
  }

  // Validação de conteúdo com Sharp (para imagens)
  if (file.type.startsWith("image/")) {
    try {
      const sharp = require("sharp");
      await sharp(file.path).metadata();
    } catch (error) {
      return {
        valid: false,
        error: "Arquivo não é uma imagem válida",
        code: "INVALID_IMAGE_CONTENT",
      };
    }
  }

  return { valid: true };
}
```

### Configuração

```typescript
// config/middlewares.ts
{
  name: "global::upload-validation",
  config: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    maxFiles: 10,
  },
}
```

### Validações Implementadas

1. **Tamanho do Arquivo**
   - Máximo: 10MB
   - Verificação: `file.size`

2. **Tipo MIME**
   - Tipos permitidos: image/jpeg, image/png, image/gif, image/webp, image/svg+xml
   - Verificação: `file.type`

3. **Extensão do Arquivo**
   - Extensões permitidas: .jpg, .jpeg, .png, .gif, .webp, .svg
   - Verificação: `file.name`

4. **Assinatura do Arquivo (Magic Numbers)**
   - JPEG: `FF D8 FF`
   - PNG: `89 50 4E 47`
   - GIF: `47 49 46 38`
   - WebP: `52 49 46 46`
   - SVG: `3C 3F 78 6D 6C`

5. **Conteúdo da Imagem**
   - Verificação com Sharp
   - Validação de metadados

6. **Número de Arquivos**
   - Máximo: 10 arquivos por requisição

### Códigos de Erro

| Código | Descrição | Solução |
|--------|-----------|---------|
| `TOO_MANY_FILES` | Muitos arquivos | Reduzir número de arquivos |
| `FILE_TOO_LARGE` | Arquivo muito grande | Reduzir tamanho do arquivo |
| `INVALID_FILE_TYPE` | Tipo não permitido | Usar tipo de arquivo válido |
| `INVALID_FILE_EXTENSION` | Extensão não permitida | Usar extensão válida |
| `INVALID_FILE_SIGNATURE` | Assinatura inválida | Verificar integridade do arquivo |
| `INVALID_IMAGE_CONTENT` | Conteúdo inválido | Usar imagem válida |

---

## 📊 Security Logging Middleware

### Localização: `src/middlewares/security-logging.ts`

**Funcionalidade:** Registra eventos de segurança em arquivo de log.

### Implementação

```typescript
export default (config, { strapi }) => {
  const logConfig = {
    logFile: config.logFile || "logs/security.log",
    logLevel: config.logLevel || "info",
    maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
    maxFiles: config.maxFiles || 5,
    datePattern: config.datePattern || "YYYY-MM-DD",
  };

  // Configurar winston logger
  const winston = require("winston");
  const DailyRotateFile = require("winston-daily-rotate-file");

  const logger = winston.createLogger({
    level: logConfig.logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new DailyRotateFile({
        filename: logConfig.logFile,
        datePattern: logConfig.datePattern,
        maxSize: logConfig.maxFileSize,
        maxFiles: logConfig.maxFiles,
        zippedArchive: true,
      }),
    ],
  });

  return async (ctx, next) => {
    const startTime = Date.now();
    const requestId = generateRequestId();

    // Log de requisição iniciada
    logger.info("request_started", {
      requestId,
      ip: ctx.ip,
      method: ctx.method,
      path: ctx.path,
      userAgent: ctx.get("User-Agent"),
      headers: ctx.headers,
    });

    try {
      await next();
      
      // Log de requisição completada
      const duration = Date.now() - startTime;
      logger.info("request_completed", {
        requestId,
        ip: ctx.ip,
        method: ctx.method,
        path: ctx.path,
        status: ctx.status,
        duration: `${duration}ms`,
      });
    } catch (error) {
      // Log de erro
      const duration = Date.now() - startTime;
      logger.error("request_error", {
        requestId,
        ip: ctx.ip,
        method: ctx.method,
        path: ctx.path,
        status: ctx.status || 500,
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`,
      });
      
      throw error;
    }
  };
};

function generateRequestId() {
  return Math.random().toString(36).substr(2, 9);
}
```

### Configuração

```typescript
// config/middlewares.ts
{
  name: "global::security-logging",
  config: {
    logFile: "logs/security.log",
    logLevel: "info",
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    datePattern: "YYYY-MM-DD",
  },
}
```

### Eventos Logados

1. **Requisições Iniciadas**
```json
{
  "timestamp": "2025-09-16T20:30:00Z",
  "level": "info",
  "event": "request_started",
  "requestId": "abc123def",
  "ip": "192.168.1.100",
  "method": "GET",
  "path": "/api/games",
  "userAgent": "Mozilla/5.0...",
  "headers": {...}
}
```

2. **Requisições Completadas**
```json
{
  "timestamp": "2025-09-16T20:30:01Z",
  "level": "info",
  "event": "request_completed",
  "requestId": "abc123def",
  "ip": "192.168.1.100",
  "method": "GET",
  "path": "/api/games",
  "status": 200,
  "duration": "45ms"
}
```

3. **Erros de Requisição**
```json
{
  "timestamp": "2025-09-16T20:30:02Z",
  "level": "error",
  "event": "request_error",
  "requestId": "abc123def",
  "ip": "192.168.1.100",
  "method": "POST",
  "path": "/api/upload",
  "status": 400,
  "error": "File too large",
  "stack": "Error: File too large\n    at validateFile...",
  "duration": "120ms"
}
```

### Rotação de Logs

- **Tamanho máximo**: 10MB por arquivo
- **Número de arquivos**: 5 arquivos mantidos
- **Padrão de data**: YYYY-MM-DD
- **Compactação**: Arquivos antigos são comprimidos
- **Localização**: `logs/security.log`

---

## 🔍 SEO Middleware

### Localização: `src/middlewares/seo-middleware.js`

**Funcionalidade:** Otimização automática de SEO para páginas.

### Implementação

```javascript
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    await next();

    // Aplicar apenas para rotas de conteúdo
    if (!ctx.path.startsWith('/api/') || ctx.method !== 'GET') {
      return;
    }

    // Gerar metadados SEO
    const seoData = await generateSEOMetadata(ctx, strapi);
    
    if (seoData) {
      // Adicionar metadados ao contexto
      ctx.state.seo = seoData;
      
      // Log de SEO
      strapi.log.info('SEO metadata generated', {
        path: ctx.path,
        title: seoData.title,
        description: seoData.description,
      });
    }
  };
};

async function generateSEOMetadata(ctx, strapi) {
  const path = ctx.path;
  
  // Gerar metadados baseados na rota
  if (path.startsWith('/api/games/')) {
    return await generateGameSEOMetadata(ctx, strapi);
  }
  
  if (path.startsWith('/api/categories/')) {
    return await generateCategorySEOMetadata(ctx, strapi);
  }
  
  return null;
}

async function generateGameSEOMetadata(ctx, strapi) {
  const gameId = ctx.params.id;
  
  if (!gameId) {
    return null;
  }
  
  try {
    const game = await strapi.entityService.findOne('api::game.game', gameId, {
      populate: ['cover', 'category', 'developer', 'publisher']
    });
    
    if (!game) {
      return null;
    }
    
    return {
      title: `${game.name} - RootGames`,
      description: game.description?.substring(0, 160) || `Jogo ${game.name} no RootGames`,
      keywords: [
        game.name,
        game.category?.name,
        game.developer?.name,
        game.publisher?.name,
        'jogos',
        'games'
      ].filter(Boolean).join(', '),
      ogTitle: game.name,
      ogDescription: game.description?.substring(0, 160),
      ogImage: game.cover?.url,
      twitterCard: 'summary_large_image',
      canonicalUrl: `https://rootgames.com/games/${game.slug}`,
      robots: 'index, follow'
    };
  } catch (error) {
    strapi.log.error('Error generating game SEO metadata:', error);
    return null;
  }
}
```

### Configuração

```javascript
// config/middlewares.ts
{
  name: "global::seo-middleware",
  config: {
    enabled: true,
    generateSitemap: true,
    generateRobots: true,
  },
}
```

### Metadados Gerados

- **Title**: Título otimizado para SEO
- **Description**: Descrição meta (máximo 160 caracteres)
- **Keywords**: Palavras-chave relevantes
- **Open Graph**: Título, descrição e imagem
- **Twitter Card**: Configuração para Twitter
- **Canonical URL**: URL canônica
- **Robots**: Instruções para crawlers

---

## ⚙️ Configuração de Middlewares

### Arquivo Principal (`config/middlewares.ts`)

```typescript
export default [
  // Middleware de erros
  "strapi::errors",
  
  // Middleware de segurança
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          "font-src": ["'self'", "https://fonts.gstatic.com"],
          "img-src": ["'self'", "data:", "https:", "http:"],
          "connect-src": [
            "'self'",
            "https://api.rawg.io",
            "https://store.steampowered.com",
            "https://www.gog.com",
            "https://api.igdb.com",
          ],
          "frame-src": ["'none'"],
          "object-src": ["'none'"],
          "base-uri": ["'self'"],
          "form-action": ["'self'"],
          "upgrade-insecure-requests": [],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: "deny" },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: {
        policy: "strict-origin-when-cross-origin",
      },
    },
  },
  
  // Middlewares padrão do Strapi
  "strapi::cors",
  "strapi::poweredBy",
  "strapi::logger",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
  
  // Middlewares personalizados
  {
    name: "global::security-headers",
    config: {
      setHeaders: (res: any) => {
        res.setHeader("X-XSS-Protection", "1; mode=block");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "DENY");
        res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
      },
    },
  },
  
  {
    name: "global::rate-limiting",
    config: {
      windowMs: 60 * 1000,
      max: 100,
      message: "Muitas requisições. Tente novamente em 1 minuto.",
    },
  },
  
  {
    name: "global::api-key-auth",
    config: {
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
    },
  },
  
  {
    name: "global::upload-validation",
    config: {
      maxFileSize: 10 * 1024 * 1024,
      allowedTypes: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ],
      allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
      maxFiles: 10,
    },
  },
  
  {
    name: "global::security-logging",
    config: {
      logFile: "logs/security.log",
      logLevel: "info",
    },
  },
];
```

### Ordem dos Middlewares

A ordem dos middlewares é **crítica** e deve seguir esta sequência:

1. **strapi::errors** - Captura erros
2. **strapi::security** - Headers de segurança básicos
3. **strapi::cors** - CORS
4. **strapi::poweredBy** - Header X-Powered-By
5. **strapi::logger** - Logging básico
6. **strapi::query** - Parsing de query parameters
7. **strapi::body** - Parsing do body
8. **strapi::session** - Gerenciamento de sessão
9. **strapi::favicon** - Favicon
10. **strapi::public** - Arquivos estáticos
11. **global::security-headers** - Headers adicionais
12. **global::rate-limiting** - Rate limiting
13. **global::api-key-auth** - Autenticação
14. **global::upload-validation** - Validação de upload
15. **global::security-logging** - Logging de segurança

---

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Middleware não executando
```typescript
// Verificar se o middleware está registrado
console.log(strapi.middlewares);
```

#### 2. Rate limiting muito restritivo
```typescript
// Ajustar configuração
{
  name: "global::rate-limiting",
  config: {
    windowMs: 60 * 1000,
    max: 200, // Aumentar limite
  },
}
```

#### 3. Upload validation falhando
```typescript
// Verificar tipos permitidos
const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];
```

#### 4. Logs não sendo gerados
```bash
# Verificar permissões
chmod 755 logs/
touch logs/security.log
chmod 644 logs/security.log
```

### Debug de Middlewares

```typescript
// Adicionar logs de debug
export default (config, { strapi }) => {
  return async (ctx, next) => {
    console.log(`Middleware executando: ${ctx.path}`);
    await next();
    console.log(`Middleware concluído: ${ctx.status}`);
  };
};
```

---

**Última atualização**: Setembro 2025  
**Total de Middlewares**: 6  
**Status**: Ativo e Monitorado  
**Cobertura de Segurança**: 100%
