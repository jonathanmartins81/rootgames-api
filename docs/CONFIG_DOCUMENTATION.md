# ⚙️ Config Documentation - RootGames API

Documentação completa das configurações do Strapi e arquivos de configuração do RootGames API.

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Configurações do Strapi](#-configurações-do-strapi)
- [Configurações de Segurança](#-configurações-de-segurança)
- [Configurações de Banco](#-configurações-de-banco)
- [Configurações de API](#-configurações-de-api)
- [Configurações de Servidor](#-configurações-de-servidor)
- [Configurações de Middlewares](#-configurações-de-middlewares)

---

## 🎯 Visão Geral

O RootGames API utiliza o sistema de configuração do Strapi 4.12.5 com personalizações avançadas para:

- ✅ **Segurança** - Headers, rate limiting, autenticação
- ✅ **Performance** - Cache, otimizações, timeouts
- ✅ **Monitoramento** - Logs, métricas, alertas
- ✅ **Integração** - APIs externas, webhooks
- ✅ **Desenvolvimento** - Hot reload, debugging

### Estrutura de Configuração

```
config/
├── admin.ts           # Configuração do painel admin
├── api.ts             # Configuração da API
├── database.ts        # Configuração do banco de dados
├── middlewares.ts     # Middlewares globais
├── middlewares.js     # Middlewares JS (legacy)
├── security.js        # Configurações de segurança
├── server.ts          # Configuração do servidor
└── api-keys.js        # Chaves de API
```

---

## 🎛️ Configurações do Strapi

### 1. Admin Configuration (`config/admin.ts`)

**Funcionalidade:** Personalização do painel administrativo do Strapi.

```typescript
export default {
  // Configurações de autenticação
  auth: {
    secret: process.env.ADMIN_JWT_SECRET || "rootgames-admin-secret-2024",
  },
  
  // Configurações de API token
  apiToken: {
    salt: process.env.API_TOKEN_SALT || "rootgames-api-token-salt-2024",
  },
  
  // Configurações de transfer token
  transfer: {
    token: {
      salt: process.env.TRANSFER_TOKEN_SALT || "rootgames-transfer-salt-2024",
    },
  },
  
  // Configurações de upload
  upload: {
    sizeLimit: 10 * 1024 * 1024, // 10MB
    breakpoints: {
      xlarge: 1920,
      large: 1000,
      medium: 750,
      small: 500,
    },
  },
  
  // Configurações de watchIgnoreFiles
  watchIgnoreFiles: [
    "**/node_modules/**",
    "**/dist/**",
    "**/coverage/**",
    "**/logs/**",
    "**/.git/**",
  ],
  
  // Configurações de serveAdminPanel
  serveAdminPanel: process.env.NODE_ENV === "production" ? true : true,
  
  // Configurações de forgotPassword
  forgotPassword: {
    emailTemplate: {
      subject: "Reset your password - RootGames",
      text: "Reset your password",
      html: "Reset your password",
    },
  },
  
  // Configurações de register
  register: {
    allowedFields: ["firstname", "lastname"],
  },
};
```

**Características:**
- **JWT Secret**: Chave secreta para tokens JWT
- **API Token Salt**: Salt para tokens de API
- **Transfer Token Salt**: Salt para tokens de transferência
- **Upload Limit**: Limite de 10MB para uploads
- **Breakpoints**: Pontos de quebra para imagens responsivas
- **Watch Ignore**: Arquivos ignorados pelo watcher
- **Email Templates**: Templates personalizados para emails

### 2. API Configuration (`config/api.ts`)

**Funcionalidade:** Configurações globais da API REST.

```typescript
export default {
  // Configurações de rest
  rest: {
    // Configurações de prefix
    prefix: "/api",
    
    // Configurações de defaultLimit
    defaultLimit: 25,
    
    // Configurações de maxLimit
    maxLimit: 100,
    
    // Configurações de withCount
    withCount: true,
  },
  
  // Configurações de responses
  responses: {
    // Configurações de privateAttributes
    privateAttributes: ["createdAt", "updatedAt", "publishedAt", "createdBy", "updatedBy"],
    
    // Configurações de populateCreatorFields
    populateCreatorFields: true,
  },
  
  // Configurações de restCache
  restCache: {
    // Configurações de max
    max: 100,
    
    // Configurações de ttl
    ttl: 60000, // 1 minuto
  },
};
```

**Características:**
- **Prefix**: `/api` para todas as rotas REST
- **Default Limit**: 25 itens por página
- **Max Limit**: 100 itens por página
- **With Count**: Incluir contagem total nos resultados
- **Private Attributes**: Atributos privados não expostos
- **Populate Creator Fields**: Popular campos de criação
- **REST Cache**: Cache de 1 minuto com máximo de 100 itens

---

## 🛡️ Configurações de Segurança

### 1. Security Configuration (`config/security.js`)

**Funcionalidade:** Configurações centralizadas de segurança.

```javascript
module.exports = {
  // Configurações de headers de segurança
  securityHeaders: {
    // Content Security Policy
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
    
    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 ano
      includeSubDomains: true,
      preload: true,
    },
    
    // Frame Guard
    frameguard: {
      action: "deny",
    },
    
    // No Sniff
    noSniff: true,
    
    // XSS Filter
    xssFilter: true,
    
    // Referrer Policy
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
  },
  
  // Configurações de rate limiting
  rateLimiting: {
    windowMs: 60 * 1000, // 1 minuto
    max: 100, // 100 requisições por minuto
    message: "Muitas requisições. Tente novamente em 1 minuto.",
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
  
  // Configurações de API key authentication
  apiKeyAuth: {
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
  
  // Configurações de upload validation
  uploadValidation: {
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
  
  // Configurações de security logging
  securityLogging: {
    logFile: "logs/security.log",
    logLevel: "info",
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    datePattern: "YYYY-MM-DD",
  },
};
```

**Características:**
- **CSP**: Política de segurança de conteúdo restritiva
- **HSTS**: Força HTTPS por 1 ano
- **Frame Guard**: Previne clickjacking
- **No Sniff**: Previne MIME sniffing
- **XSS Filter**: Proteção contra XSS
- **Rate Limiting**: 100 req/min por IP
- **API Key Auth**: Autenticação por chave
- **Upload Validation**: Validação de arquivos
- **Security Logging**: Logs de segurança

### 2. API Keys Configuration (`config/api-keys.js`)

**Funcionalidade:** Gerenciamento de chaves de API.

```javascript
module.exports = {
  // Chaves de desenvolvimento
  development: {
    "rootgames-dev-key-2024": {
      name: "Development Key",
      permissions: ["read", "write"],
      expiresAt: null, // Nunca expira
      lastUsed: null,
      createdAt: "2024-01-01T00:00:00Z",
    },
  },
  
  // Chaves de produção
  production: {
    "rootgames-admin-key-2024": {
      name: "Admin Key",
      permissions: ["read", "write", "admin"],
      expiresAt: "2025-12-31T23:59:59Z",
      lastUsed: null,
      createdAt: "2024-01-01T00:00:00Z",
    },
  },
  
  // Configurações de validação
  validation: {
    minLength: 16,
    maxLength: 64,
    pattern: /^[a-zA-Z0-9-_]+$/,
    rotationPeriod: 90, // dias
  },
  
  // Configurações de rate limiting por chave
  rateLimiting: {
    "rootgames-dev-key-2024": {
      windowMs: 60 * 1000,
      max: 1000,
    },
    "rootgames-admin-key-2024": {
      windowMs: 60 * 1000,
      max: 5000,
    },
  },
};
```

---

## 🗄️ Configurações de Banco

### Database Configuration (`config/database.ts`)

**Funcionalidade:** Configuração de conexão com PostgreSQL.

```typescript
export default ({ env }) => ({
  connection: {
    client: "postgres",
    connection: {
      host: env("DATABASE_HOST", "localhost"),
      port: env.int("DATABASE_PORT", 5432),
      database: env("DATABASE_NAME", "rootgames"),
      user: env("DATABASE_USERNAME", "rootgames"),
      password: env("DATABASE_PASSWORD", "rootgames123"),
      ssl: env.bool("DATABASE_SSL", false) && {
        key: env("DATABASE_SSL_KEY", undefined),
        cert: env("DATABASE_SSL_CERT", undefined),
        ca: env("DATABASE_SSL_CA", undefined),
        capath: env("DATABASE_SSL_CAPATH", undefined),
        cipher: env("DATABASE_SSL_CIPHER", undefined),
        rejectUnauthorized: env.bool("DATABASE_SSL_REJECT_UNAUTHORIZED", true),
      },
    },
    pool: {
      min: env.int("DATABASE_POOL_MIN", 2),
      max: env.int("DATABASE_POOL_MAX", 10),
      acquireTimeoutMillis: env.int("DATABASE_ACQUIRE_TIMEOUT", 60000),
      createTimeoutMillis: env.int("DATABASE_CREATE_TIMEOUT", 30000),
      destroyTimeoutMillis: env.int("DATABASE_DESTROY_TIMEOUT", 5000),
      idleTimeoutMillis: env.int("DATABASE_IDLE_TIMEOUT", 30000),
      reapIntervalMillis: env.int("DATABASE_REAP_INTERVAL", 1000),
      createRetryIntervalMillis: env.int("DATABASE_CREATE_RETRY_INTERVAL", 200),
    },
    acquireConnectionTimeout: env.int("DATABASE_ACQUIRE_CONNECTION_TIMEOUT", 60000),
  },
});
```

**Características:**
- **Client**: PostgreSQL
- **Connection Pool**: 2-10 conexões
- **SSL**: Configurável via variáveis de ambiente
- **Timeouts**: Configuráveis para diferentes operações
- **Retry Logic**: Lógica de retry para conexões

### Variáveis de Ambiente

```env
# Database Configuration
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=rootgames
DATABASE_USERNAME=rootgames
DATABASE_PASSWORD=rootgames123
DATABASE_SSL=false

# Database Pool Configuration
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_ACQUIRE_TIMEOUT=60000
DATABASE_CREATE_TIMEOUT=30000
DATABASE_DESTROY_TIMEOUT=5000
DATABASE_IDLE_TIMEOUT=30000
DATABASE_REAP_INTERVAL=1000
DATABASE_CREATE_RETRY_INTERVAL=200
DATABASE_ACQUIRE_CONNECTION_TIMEOUT=60000
```

---

## 🌐 Configurações de API

### API Configuration (`config/api.ts`)

**Funcionalidade:** Configurações específicas da API REST.

```typescript
export default {
  // Configurações de rest
  rest: {
    prefix: "/api",
    defaultLimit: 25,
    maxLimit: 100,
    withCount: true,
  },
  
  // Configurações de responses
  responses: {
    privateAttributes: ["createdAt", "updatedAt", "publishedAt", "createdBy", "updatedBy"],
    populateCreatorFields: true,
  },
  
  // Configurações de restCache
  restCache: {
    max: 100,
    ttl: 60000,
  },
  
  // Configurações de graphql
  graphql: {
    endpoint: "/graphql",
    shadowCRUD: true,
    playgroundAlways: false,
    depthLimit: 7,
    amountLimit: 100,
    apolloServer: {
      tracing: false,
    },
  },
};
```

**Características:**
- **REST Prefix**: `/api` para todas as rotas
- **Pagination**: 25 itens por página (máximo 100)
- **Count**: Incluir contagem total
- **Private Attributes**: Campos privados não expostos
- **REST Cache**: Cache de 1 minuto
- **GraphQL**: Endpoint em `/graphql`

---

## 🖥️ Configurações de Servidor

### Server Configuration (`config/server.ts`)

**Funcionalidade:** Configurações do servidor HTTP.

```typescript
export default ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),
  app: {
    keys: env.array("APP_KEYS", ["rootgames-app-key-1", "rootgames-app-key-2"]),
  },
  webhooks: {
    populateRelations: env.bool("WEBHOOKS_POPULATE_RELATIONS", false),
  },
  dirs: {
    public: env("PUBLIC_DIR", "./public"),
  },
  proxy: env.bool("IS_PROXIED", false),
  cron: {
    enabled: env.bool("CRON_ENABLED", false),
  },
  admin: {
    serveAdminPanel: env.bool("SERVE_ADMIN", true),
    url: env("ADMIN_URL", "/admin"),
    auth: {
      secret: env("ADMIN_JWT_SECRET", "rootgames-admin-secret-2024"),
    },
  },
});
```

**Características:**
- **Host**: `0.0.0.0` (aceita conexões de qualquer IP)
- **Port**: `1337` (porta padrão do Strapi)
- **App Keys**: Chaves para assinatura de cookies
- **Webhooks**: Configuração de webhooks
- **Public Dir**: Diretório de arquivos públicos
- **Proxy**: Suporte a proxy reverso
- **Cron**: Jobs agendados
- **Admin**: Configuração do painel admin

### Variáveis de Ambiente

```env
# Server Configuration
HOST=0.0.0.0
PORT=1337
IS_PROXIED=false
CRON_ENABLED=false
SERVE_ADMIN=true
ADMIN_URL=/admin

# App Keys
APP_KEYS=rootgames-app-key-1,rootgames-app-key-2

# Admin Configuration
ADMIN_JWT_SECRET=rootgames-admin-secret-2024

# Webhooks Configuration
WEBHOOKS_POPULATE_RELATIONS=false
```

---

## 🔧 Configurações de Middlewares

### Middlewares Configuration (`config/middlewares.ts`)

**Funcionalidade:** Configuração de middlewares globais.

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
      frameguard: {
        action: "deny",
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: {
        policy: "strict-origin-when-cross-origin",
      },
    },
  },
  
  // Middleware de CORS
  "strapi::cors",
  
  // Middleware de powered by
  "strapi::poweredBy",
  
  // Middleware de logger
  "strapi::logger",
  
  // Middleware de query
  "strapi::query",
  
  // Middleware de body
  "strapi::body",
  
  // Middleware de session
  "strapi::session",
  
  // Middleware de favicon
  "strapi::favicon",
  
  // Middleware de public
  "strapi::public",
  
  // Middleware personalizado de segurança
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
  
  // Middleware de rate limiting
  {
    name: "global::rate-limiting",
    config: {
      windowMs: 60 * 1000, // 1 minuto
      max: 100, // 100 requisições por minuto
      message: "Muitas requisições. Tente novamente em 1 minuto.",
    },
  },
  
  // Middleware de autenticação por API key
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
  
  // Middleware de validação de upload
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
  },
  
  // Middleware de logging de segurança
  {
    name: "global::security-logging",
    config: {
      logFile: "logs/security.log",
      logLevel: "info",
    },
  },
];
```

**Características:**
- **Ordem Importante**: Middlewares executam na ordem definida
- **Segurança**: Headers e proteções de segurança
- **Rate Limiting**: Controle de requisições
- **Autenticação**: API key para rotas protegidas
- **Upload**: Validação de arquivos
- **Logging**: Registro de eventos de segurança

---

## 🔄 Configurações de Ambiente

### Desenvolvimento

```env
# .env.development
NODE_ENV=development
HOST=localhost
PORT=1337
DATABASE_HOST=localhost
DATABASE_NAME=rootgames_dev
LOG_LEVEL=debug
```

### Produção

```env
# .env.production
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
DATABASE_HOST=production-db-host
DATABASE_NAME=rootgames_prod
LOG_LEVEL=info
SSL_ENABLED=true
```

### Teste

```env
# .env.test
NODE_ENV=test
HOST=localhost
PORT=1338
DATABASE_HOST=localhost
DATABASE_NAME=rootgames_test
LOG_LEVEL=error
```

---

## 📊 Monitoramento de Configurações

### Health Check

```typescript
// Verificar configurações
const configHealth = {
  database: await checkDatabaseConnection(),
  middlewares: await checkMiddlewaresStatus(),
  security: await checkSecurityConfig(),
  api: await checkApiConfig(),
};
```

### Validação de Configuração

```typescript
// Validar configurações na inicialização
const validateConfig = () => {
  const required = [
    "DATABASE_HOST",
    "DATABASE_NAME",
    "ADMIN_JWT_SECRET",
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
};
```

---

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar variáveis de ambiente
echo $DATABASE_HOST
echo $DATABASE_NAME
```

#### 2. Middleware não funcionando
```typescript
// Verificar ordem dos middlewares
// Middlewares executam na ordem definida no array
```

#### 3. Configuração de segurança não aplicada
```bash
# Verificar se o arquivo de configuração está sendo carregado
console.log(process.env.NODE_ENV);
console.log(process.env.DATABASE_HOST);
```

#### 4. Erro de permissão
```bash
# Verificar permissões dos arquivos de configuração
ls -la config/
chmod 644 config/*.ts
chmod 644 config/*.js
```

---

**Última atualização**: Setembro 2025  
**Versão de Configuração**: 1.0.0  
**Ambientes Suportados**: development, production, test  
**Status**: Ativo e Monitorado
