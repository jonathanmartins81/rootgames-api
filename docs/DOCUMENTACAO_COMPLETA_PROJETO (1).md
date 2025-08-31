# 📚 DOCUMENTAÇÃO COMPLETA - ROOTGAMES API

## 🎯 **VISÃO GERAL DO PROJETO**

**RootGames API** é uma aplicação backend desenvolvida com **Strapi 5.21.0**, um CMS headless
moderno e robusto. O projeto implementa um catálogo completo de jogos com funcionalidades avançadas
de gerenciamento de conteúdo, API REST/GraphQL, e editor rico integrado.

**Tecnologias Principais:**

- **Strapi 5.21.0** - CMS Headless
- **Node.js 20.19.4** - Runtime JavaScript
- **PostgreSQL** - Banco de dados principal
- **TypeScript** - Linguagem de programação
- **CKEditor 5** - Editor de texto rico completo
- **Yarn** - Gerenciador de pacotes

---

## 🏗️ **ARQUITETURA DO PROJETO**

### **Estrutura de Diretórios**

```
rootgames-api/
├── 📁 src/                    # Código fonte principal
│   ├── 📁 api/               # APIs e Content Types
│   ├── 📁 admin/             # Customizações do painel admin
│   ├── 📁 utils/             # Utilitários e helpers
│   ├── 📁 types/             # Definições TypeScript
│   └── 📁 extensions/        # Extensões do Strapi
├── 📁 config/                # Configurações do Strapi
├── 📁 database/              # Migrações e seeds
├── 📁 docs/                  # Documentação
├── 📁 scripts/               # Scripts de automação
├── 📁 tests/                 # Testes automatizados
└── 📁 backups/               # Backups do projeto
```

---

## 🔧 **CONFIGURAÇÕES PRINCIPAIS**

### **1. package.json - Dependências e Scripts**

**Dependências Principais:**

- `@strapi/strapi@^5.21.0` - Core do Strapi
- `@strapi/plugin-graphql@^5.21.0` - Plugin GraphQL
- `@strapi/plugin-users-permissions@^5.21.0` - Sistema de permissões
- **Editor nativo** - Textarea simples do Strapi

**Dependências de Desenvolvimento:**

- `typescript@^5.0.0` - Compilador TypeScript
- `vitest@^3.2.4` - Framework de testes
- `playwright@^1.54.2` - Testes E2E
- `eslint@^8.0.0` - Linter de código

**Scripts Disponíveis:**

- `yarn develop` - Inicia servidor de desenvolvimento
- `yarn build` - Compila para produção
- `yarn start` - Inicia servidor de produção
- `yarn test` - Executa testes unitários
- `yarn test:e2e` - Executa testes E2E

### **2. tsconfig.json - Configuração TypeScript**

**Configurações Principais:**

- **target**: "ES2022" - Versão do JavaScript
- **module**: "ESNext" - Sistema de módulos
- **strict**: true - Modo estrito habilitado
- **esModuleInterop**: true - Interoperabilidade ES modules
- **skipLibCheck**: true - Pula verificação de tipos de libs

### **3. eslint.config.js - Regras de Linting**

**Configurações:**

- **extends**: Regras base do Strapi e TypeScript
- **parser**: "@typescript-eslint/parser" - Parser TypeScript
- **plugins**: TypeScript e Strapi
- **rules**: Regras customizadas de qualidade de código

---

## ⚙️ **CONFIGURAÇÕES STRAPI**

### **1. config/server.ts - Configuração do Servidor**

```typescript
export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
```

**Funcionalidades:**

- **host**: Define o host do servidor (0.0.0.0 = aceita conexões externas)
- **port**: Porta do servidor (1337 por padrão)
- **app.keys**: Chaves de criptografia para sessões
- **webhooks**: Configuração de webhooks para populações de relações

### **2. config/database.ts - Configuração do Banco**

```typescript
export default ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', '127.0.0.1'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'rootgames'),
      user: env('DATABASE_USERNAME', 'postgres'),
      password: env('DATABASE_PASSWORD', ''),
      ssl: env.bool('DATABASE_SSL', false)
        ? {
            rejectUnauthorized: env.bool('DATABASE_SSL_SELF', false),
          }
        : false,
    },
  },
});
```

**Configurações:**

- **client**: PostgreSQL como banco principal
- **connection**: Parâmetros de conexão via variáveis de ambiente
- **ssl**: Configuração SSL para conexões seguras
- **pool**: Configuração de pool de conexões

### **3. config/admin.ts - Configuração do Painel Admin**

```typescript
export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});
```

**Funcionalidades:**

- **auth.secret**: Chave secreta para JWT do admin
- **apiToken.salt**: Salt para tokens de API
- **transfer.token.salt**: Salt para tokens de transferência
- **flags**: Flags de funcionalidades (NPS, promoções)

### **4. config/middlewares.ts - Middlewares da Aplicação**

```typescript
export default [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'script-src': ["'self'", 'https:'],
          'connect-src': ["'self'", 'https:'],
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

**Middlewares Configurados:**

1. **strapi::errors** - Tratamento de erros
2. **strapi::security** - Política de segurança de conteúdo (CSP)
3. **strapi::cors** - Cross-Origin Resource Sharing
4. **strapi::poweredBy** - Header "Powered by Strapi"
5. **strapi::logger** - Sistema de logs
6. **strapi::query** - Parsing de queries
7. **strapi::body** - Parsing de corpo de requisições
8. **strapi::session** - Gerenciamento de sessões
9. **strapi::favicon** - Favicon da aplicação
10. **strapi::public** - Servir arquivos públicos

### **5. config/plugins.js - Configuração de Plugins**

```javascript
module.exports = () => ({
  // Configurações de plugins removidas - editores ricos desabilitados
  // O projeto agora utiliza o editor de texto simples nativo do Strapi
});
```

**Editor de Texto Simples:**

- **Tipo**: Textarea nativo do Strapi
- **Funcionalidade**: Editor de texto simples e eficiente
- **Performance**: Carregamento rápido e sem dependências externas
- **Compatibilidade**: Totalmente compatível com Strapi 5.x

---

## 🎮 **APIS E CONTENT TYPES**

### **1. Game API - Catálogo de Jogos**

**Localização:** `src/api/game/`

**Schema (schema.json):**

```json
{
  "kind": "collectionType",
  "collectionName": "games",
  "info": {
    "singularName": "game",
    "pluralName": "games",
    "displayName": "Game",
    "description": "Catálogo de jogos com editor de texto simples"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "name": {
      "type": "string",
      "required": true
    },
    "slug": {
      "type": "uid",
      "targetField": "name"
    },
    "description": {
      "type": "text",
      "required": false
    },
    "releaseDate": {
      "type": "date"
    },
    "rating": {
      "type": "decimal",
      "min": 0,
      "max": 10
    },
    "price": {
      "type": "decimal",
      "min": 0
    },
    "image": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "categories": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::category.category"
    },
    "platforms": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::platform.platform"
    },
    "developer": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::developer.developer"
    },
    "publisher": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::publisher.publisher"
    }
  }
}
```

**Campos do Content Type Game:**

- **name**: Nome do jogo (string, obrigatório)
- **slug**: URL amigável (UID baseado no nome)
- **description**: Descrição usando editor de texto simples
- **releaseDate**: Data de lançamento
- **rating**: Avaliação (0-10)
- **price**: Preço do jogo
- **image**: Imagem do jogo
- **categories**: Relação many-to-many com categorias
- **platforms**: Relação many-to-many com plataformas
- **developer**: Relação many-to-many com desenvolvedores
- **publisher**: Relação many-to-one com publicadora

**Controller (game.ts):**

```typescript
export default factories.createCoreController('api::game.game', ({ strapi }) => ({
  // Custom controller methods
  async populate(ctx) {
    // Lógica de população customizada
  },
  async optimizeImages(ctx) {
    // Otimização de imagens
  },
  async getStats(ctx) {
    // Estatísticas dos jogos
  },
}));
```

**Routes (game.ts):**

```typescript
export default factories.createCoreRouter('api::game.game', {
  config: {
    find: {
      middlewares: ['api::game.populate'],
    },
    findOne: {
      middlewares: ['api::game.populate'],
    },
  },
});
```

**Rotas Customizadas:**

- `GET /api/games/populate` - Jogos com relações populadas
- `POST /api/games/optimize-images` - Otimização de imagens
- `GET /api/games/stats` - Estatísticas dos jogos

### **2. Category API - Categorias de Jogos**

**Localização:** `src/api/category/`

**Schema:**

```json
{
  "kind": "collectionType",
  "collectionName": "categories",
  "info": {
    "singularName": "category",
    "pluralName": "categories",
    "displayName": "Category"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "name": {
      "type": "string",
      "required": true
    },
    "description": {
      "type": "text"
    },
    "games": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::game.game",
      "mappedBy": "categories"
    }
  }
}
```

### **3. Platform API - Plataformas de Jogos**

**Localização:** `src/api/platform/`

**Schema:**

```json
{
  "kind": "collectionType",
  "collectionName": "platforms",
  "info": {
    "singularName": "platform",
    "pluralName": "platforms",
    "displayName": "Platform"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "name": {
      "type": "string",
      "required": true
    },
    "description": {
      "type": "text"
    },
    "games": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::game.game",
      "mappedBy": "platforms"
    }
  }
}
```

### **4. Developer API - Desenvolvedores**

**Localização:** `src/api/developer/`

**Schema:**

```json
{
  "kind": "collectionType",
  "collectionName": "developers",
  "info": {
    "singularName": "developer",
    "pluralName": "developers",
    "displayName": "Developer"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "name": {
      "type": "string",
      "required": true
    },
    "description": {
      "type": "text"
    },
    "games": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::game.game",
      "mappedBy": "developer"
    }
  }
}
```

### **5. Publisher API - Publicadoras**

**Localização:** `src/api/publisher/`

**Schema:**

```json
{
  "kind": "collectionType",
  "collectionName": "publishers",
  "info": {
    "singularName": "publisher",
    "pluralName": "publishers",
    "displayName": "Publisher"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "name": {
      "type": "string",
      "required": true
    },
    "description": {
      "type": "text"
    },
    "games": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::game.game",
      "mappedBy": "publisher"
    }
  }
}
```

---

## 🛠️ **UTILITÁRIOS E HELPERS**

### **1. Image Optimizer (src/utils/imageOptimizer.ts)**

```typescript
import sharp from 'sharp';
import { JSDOM } from 'jsdom';

export class ImageOptimizer {
  static async optimizeImage(buffer: Buffer, options: OptimizeOptions): Promise<Buffer> {
    // Lógica de otimização de imagens
  }

  static async extractImagesFromHtml(html: string): Promise<string[]> {
    // Extração de URLs de imagens do HTML
  }

  static async optimizeImagesInHtml(html: string): Promise<string> {
    // Otimização de todas as imagens em HTML
  }
}
```

**Funcionalidades:**

- **optimizeImage**: Otimiza uma imagem usando Sharp
- **extractImagesFromHtml**: Extrai URLs de imagens do HTML
- **optimizeImagesInHtml**: Otimiza todas as imagens em conteúdo HTML

### **2. Types (src/types/game.ts)**

```typescript
export interface Game {
  id: number;
  name: string;
  slug: string;
  description: string;
  releaseDate: string;
  rating: number;
  price: number;
  image: Media;
  categories: Category[];
  platforms: Platform[];
  developer: Developer[];
  publisher: Publisher;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}
```

---

## 🎨 **CUSTOMIZAÇÕES DO ADMIN**

### **1. Admin App (src/admin/app.tsx)**

```typescript
export default {
  config: {
    locales: ['pt-BR', 'en'],
    translations: {
      'pt-BR': {
        'app.components.LeftMenu.navbrand.title': 'RootGames API',
        'app.components.LeftMenu.navbrand.workplace': 'Catálogo de Jogos',
      },
    },
    auth: {
      logo: '/admin/assets/logo.svg',
    },
    head: {
      favicon: '/admin/assets/favicon.ico',
    },
    menu: {
      logo: '/admin/assets/logo.svg',
    },
    theme: {
      colors: {
        primary100: '#f6ecfc',
        primary200: '#e0c1f4',
        primary500: '#ac73e6',
        primary600: '#9736e8',
        primary700: '#8312d1',
        danger700: '#b72b1a',
      },
    },
    notifications: {
      releases: false,
    },
    tutorials: false,
  },
  bootstrap() {},
};
```

**Customizações:**

- **locales**: Português e Inglês
- **translations**: Traduções customizadas
- **theme**: Tema personalizado com cores específicas
- **notifications**: Notificações de releases desabilitadas
- **tutorials**: Tutoriais desabilitados

---

## 🧪 **TESTES AUTOMATIZADOS**

### **1. Configuração Vitest (vitest.config.ts)**

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### **2. Testes E2E (playwright.config.ts)**

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:1337',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'yarn develop',
    url: 'http://localhost:1337',
    reuseExistingServer: !process.env.CI,
  },
});
```

### **3. Testes Unitários (tests/unit/)**

- **imageOptimizer.test.ts**: Testes do otimizador de imagens
- **game.test.ts**: Testes da API de jogos
- **category.test.ts**: Testes da API de categorias

### **4. Testes E2E (tests/e2e/)**

- **accessibility.spec.ts**: Testes de acessibilidade
- **api.spec.ts**: Testes da API REST
- **visual.spec.ts**: Testes visuais

---

## 📊 **MONITORAMENTO E LOGS**

### **1. Estrutura de Logs**

**Diretório:** `logs/`

- **application.log**: Logs da aplicação
- **error.log**: Logs de erros
- **access.log**: Logs de acesso

### **2. Métricas**

**Diretório:** `metrics/`

- **performance.json**: Métricas de performance
- **usage.json**: Métricas de uso
- **errors.json**: Métricas de erros

---

## 🔄 **SCRIPTS DE AUTOMAÇÃO**

### **1. Scripts Disponíveis (scripts/)**

- **backup.sh**: Backup automático do projeto
- **deploy-safe.sh**: Deploy seguro
- **health-check.sh**: Verificação de saúde
- **monitor.sh**: Monitoramento contínuo
- **rollback.sh**: Rollback de versões

### **2. Husky Hooks (.husky/)**

- **pre-commit**: Executa linting antes do commit
- **commit-msg**: Valida mensagens de commit
- **pre-push**: Executa testes antes do push

---

## 🚀 **DEPLOYMENT E PRODUÇÃO**

### **1. Variáveis de Ambiente**

**Arquivo:** `.env.example`

```bash
# Database
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=rootgames
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=

# Admin
ADMIN_JWT_SECRET=your-admin-jwt-secret
API_TOKEN_SALT=your-api-token-salt
TRANSFER_TOKEN_SALT=your-transfer-token-salt

# Server
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-app-keys

# Editor de Texto Simples
# Editores ricos removidos - usando textarea nativo do Strapi
UPLOADCARE_PUBLIC_KEY=c2b151cf0e98e2b16356
```

### **2. Build de Produção**

```bash
# Build
yarn build

# Start
yarn start
```

### **3. Docker (se aplicável)**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN yarn install --production
COPY . .
RUN yarn build
EXPOSE 1337
CMD ["yarn", "start"]
```

---

## 🔒 **SEGURANÇA**

### **1. Content Security Policy (CSP)**

```typescript
contentSecurityPolicy: {
  useDefaults: true,
  directives: {
    'script-src': ["'self'", 'https:'],
    'connect-src': ["'self'", 'https:'],
  },
}
```

### **2. Autenticação e Autorização**

- **JWT**: Tokens JWT para autenticação
- **API Tokens**: Tokens para acesso à API
- **Permissions**: Sistema de permissões granular
- **Roles**: Roles predefinidas (Authenticated, Public)

### **3. Validação de Dados**

- **Schema Validation**: Validação automática de schemas
- **Input Sanitization**: Sanitização de inputs
- **SQL Injection Protection**: Proteção contra injeção SQL

---

## 📈 **PERFORMANCE E OTIMIZAÇÃO**

### **1. Otimizações Implementadas**

- **Image Optimization**: Otimização automática de imagens
- **Caching**: Cache de consultas e assets
- **Compression**: Compressão de respostas
- **Lazy Loading**: Carregamento sob demanda

### **2. Monitoramento**

- **Performance Metrics**: Métricas de performance
- **Error Tracking**: Rastreamento de erros
- **Usage Analytics**: Analytics de uso
- **Health Checks**: Verificações de saúde

---

## 🔧 **MANUTENÇÃO E SUPORTE**

### **1. Backup Strategy**

- **Automated Backups**: Backups automáticos diários
- **Database Backups**: Backups do banco de dados
- **File Backups**: Backups de arquivos
- **Version Control**: Controle de versão com Git

### **2. Update Strategy**

- **Dependency Updates**: Atualizações de dependências
- **Security Patches**: Patches de segurança
- **Feature Updates**: Atualizações de funcionalidades
- **Rollback Plan**: Plano de rollback

### **3. Monitoring**

- **Server Monitoring**: Monitoramento do servidor
- **Database Monitoring**: Monitoramento do banco
- **Application Monitoring**: Monitoramento da aplicação
- **Error Alerting**: Alertas de erros

---

## 📚 **DOCUMENTAÇÃO ADICIONAL**

### **1. Documentação Técnica**

- **API Documentation**: Documentação da API REST/GraphQL
- **Admin Guide**: Guia do painel administrativo
- **Development Guide**: Guia de desenvolvimento
- **Deployment Guide**: Guia de deployment

### **2. Documentação de Negócio**

- **User Manual**: Manual do usuário
- **Admin Manual**: Manual do administrador
- **Feature Documentation**: Documentação de funcionalidades
- **Troubleshooting**: Guia de solução de problemas

---

## 🎯 **ROADMAP E MELHORIAS**

### **1. Melhorias Planejadas**

- **API Rate Limiting**: Limitação de taxa de requisições
- **Advanced Search**: Busca avançada com filtros
- **Analytics Dashboard**: Dashboard de analytics
- **Multi-language Support**: Suporte a múltiplos idiomas
- **Mobile App**: Aplicativo mobile
- **Real-time Notifications**: Notificações em tempo real

### **2. Integrações Futuras**

- **Payment Gateway**: Gateway de pagamento
- **Social Media**: Integração com redes sociais
- **Email Marketing**: Marketing por email
- **CDN Integration**: Integração com CDN
- **Cloud Storage**: Armazenamento em nuvem

---

## 📞 **SUPORTE E CONTATO**

### **1. Equipe de Desenvolvimento**

- **Tech Lead**: Responsável pela arquitetura
- **Backend Developer**: Desenvolvimento backend
- **Frontend Developer**: Desenvolvimento frontend
- **DevOps Engineer**: Infraestrutura e deployment
- **QA Engineer**: Qualidade e testes

### **2. Recursos de Suporte**

- **Documentation**: Documentação completa
- **Issue Tracking**: Rastreamento de issues
- **Code Review**: Revisão de código
- **Testing**: Testes automatizados
- **Monitoring**: Monitoramento contínuo

---

**Documentação gerada em:** 14/08/2025 **Versão do Projeto:** 1.3.0 **Status:** ✅ PRODUÇÃO READY
**Última Atualização:** Editores ricos removidos - usando editor de texto simples
