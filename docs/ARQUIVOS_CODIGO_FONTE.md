# 💻 DOCUMENTAÇÃO DOS ARQUIVOS DE CÓDIGO FONTE

## 🎯 **ESTRUTURA DO CÓDIGO FONTE**

### **Diretório Principal:** `src/`

```
src/
├── 📁 api/                    # APIs e Content Types
├── 📁 admin/                  # Customizações do painel admin
├── 📁 utils/                  # Utilitários e helpers
├── 📁 types/                  # Definições TypeScript
├── 📁 extensions/             # Extensões do Strapi
└── 📄 index.ts               # Ponto de entrada da aplicação
```

---

## 🎮 **APIS E CONTENT TYPES**

### **1. Game API - Catálogo de Jogos**

**Localização:** `src/api/game/`

**Estrutura:**

```
src/api/game/
├── 📁 content-types/
│   └── 📁 game/
│       └── 📄 schema.json    # Schema do content type
├── 📁 controllers/
│   └── 📄 game.ts           # Controller customizado
├── 📁 routes/
│   ├── 📄 game.ts           # Rotas principais
│   ├── 📄 populate.ts       # Rotas de população
│   └── 📄 optimize-images.ts # Rotas de otimização
└── 📁 services/
    └── 📄 game.ts           # Serviços customizados
```

#### **A. Schema (schema.json)**

**Propósito:** Define a estrutura do content type Game

**Campos Principais:**

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
      "type": "customField",
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

**Explicação dos Campos:**

- **name**: Nome do jogo (string, obrigatório)
- **slug**: URL amigável gerado automaticamente do nome
- **description**: Descrição usando editor de texto simples
- **releaseDate**: Data de lançamento do jogo
- **rating**: Avaliação de 0 a 10
- **price**: Preço do jogo (decimal positivo)
- **image**: Imagem do jogo (apenas imagens)
- **categories**: Relação many-to-many com categorias
- **platforms**: Relação many-to-many com plataformas
- **developer**: Relação many-to-many com desenvolvedores
- **publisher**: Relação many-to-one com publicadora

#### **B. Controller (game.ts)**

**Propósito:** Lógica de negócio customizada para jogos

**Funcionalidades Principais:**

```typescript
export default factories.createCoreController('api::game.game', ({ strapi }) => ({
  // Método customizado para população de relações
  async populate(ctx) {
    const { query } = ctx;

    // Lógica de população customizada
    const games = await strapi.entityService.findMany('api::game.game', {
      ...query,
      populate: {
        categories: true,
        platforms: true,
        developer: true,
        publisher: true,
        image: true,
      },
    });

    return games;
  },

  // Método para otimização de imagens
  async optimizeImages(ctx) {
    const { id } = ctx.params;

    // Lógica de otimização
    const game = await strapi.entityService.findOne('api::game.game', id, {
      populate: ['image'],
    });

    if (game.image) {
      // Otimizar imagem
      await ImageOptimizer.optimizeImage(game.image);
    }

    return { success: true };
  },

  // Método para estatísticas
  async getStats(ctx) {
    const totalGames = await strapi.entityService.count('api::game.game');
    const publishedGames = await strapi.entityService.count('api::game.game', {
      filters: { publishedAt: { $notNull: true } },
    });

    return {
      total: totalGames,
      published: publishedGames,
      draft: totalGames - publishedGames,
    };
  },
}));
```

#### **C. Routes (game.ts)**

**Propósito:** Definição das rotas da API

**Rotas Configuradas:**

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

**Rotas Disponíveis:**

- `GET /api/games` - Lista todos os jogos
- `GET /api/games/:id` - Busca jogo específico
- `POST /api/games` - Cria novo jogo
- `PUT /api/games/:id` - Atualiza jogo
- `DELETE /api/games/:id` - Remove jogo

#### **D. Services (game.ts)**

**Propósito:** Lógica de negócio reutilizável

**Funcionalidades:**

```typescript
export default factories.createCoreService('api::game.game', ({ strapi }) => ({
  // Buscar jogos por categoria
  async findByCategory(categoryId) {
    return await strapi.entityService.findMany('api::game.game', {
      filters: {
        categories: {
          id: categoryId,
        },
      },
      populate: ['categories', 'platforms', 'developer', 'publisher'],
    });
  },

  // Buscar jogos por plataforma
  async findByPlatform(platformId) {
    return await strapi.entityService.findMany('api::game.game', {
      filters: {
        platforms: {
          id: platformId,
        },
      },
      populate: ['categories', 'platforms', 'developer', 'publisher'],
    });
  },

  // Buscar jogos por desenvolvedor
  async findByDeveloper(developerId) {
    return await strapi.entityService.findMany('api::game.game', {
      filters: {
        developer: {
          id: developerId,
        },
      },
      populate: ['categories', 'platforms', 'developer', 'publisher'],
    });
  },
}));
```

### **2. Category API - Categorias de Jogos**

**Localização:** `src/api/category/`

**Estrutura:**

```
src/api/category/
├── 📁 content-types/
│   └── 📁 category/
│       └── 📄 schema.json
├── 📁 controllers/
│   └── 📄 category.ts
├── 📁 routes/
│   └── 📄 category.ts
└── 📁 services/
    └── 📄 category.ts
```

#### **Schema (schema.json)**

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

**Campos:**

- **name**: Nome da categoria (obrigatório)
- **description**: Descrição da categoria
- **games**: Relação many-to-many com jogos

### **3. Platform API - Plataformas de Jogos**

**Localização:** `src/api/platform/`

**Schema (schema.json):**

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

**Campos:**

- **name**: Nome da plataforma (obrigatório)
- **description**: Descrição da plataforma
- **games**: Relação many-to-many com jogos

### **4. Developer API - Desenvolvedores**

**Localização:** `src/api/developer/`

**Schema (schema.json):**

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

**Campos:**

- **name**: Nome do desenvolvedor (obrigatório)
- **description**: Descrição do desenvolvedor
- **games**: Relação many-to-many com jogos

### **5. Publisher API - Publicadoras**

**Localização:** `src/api/publisher/`

**Schema (schema.json):**

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

**Campos:**

- **name**: Nome da publicadora (obrigatório)
- **description**: Descrição da publicadora
- **games**: Relação one-to-many com jogos

---

## 🛠️ **UTILITÁRIOS E HELPERS**

### **1. Image Optimizer (src/utils/imageOptimizer.ts)**

**Propósito:** Otimização automática de imagens

**Funcionalidades Principais:**

```typescript
import sharp from 'sharp';
import { JSDOM } from 'jsdom';

export interface OptimizeOptions {
  quality?: number;
  width?: number;
  height?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export class ImageOptimizer {
  /**
   * Otimiza uma imagem usando Sharp
   * @param buffer - Buffer da imagem
   * @param options - Opções de otimização
   * @returns Buffer otimizado
   */
  static async optimizeImage(buffer: Buffer, options: OptimizeOptions = {}): Promise<Buffer> {
    const { quality = 80, width, height, format = 'jpeg' } = options;

    let sharpInstance = sharp(buffer);

    // Redimensionar se especificado
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Aplicar otimização baseada no formato
    switch (format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality });
        break;
    }

    return await sharpInstance.toBuffer();
  }

  /**
   * Extrai URLs de imagens de conteúdo HTML
   * @param html - Conteúdo HTML
   * @returns Array de URLs de imagens
   */
  static async extractImagesFromHtml(html: string): Promise<string[]> {
    const dom = new JSDOM(html);
    const images = dom.window.document.querySelectorAll('img');

    return Array.from(images)
      .map(img => img.getAttribute('src'))
      .filter(Boolean) as string[];
  }

  /**
   * Otimiza todas as imagens em conteúdo HTML
   * @param html - Conteúdo HTML
   * @returns HTML com imagens otimizadas
   */
  static async optimizeImagesInHtml(html: string): Promise<string> {
    const dom = new JSDOM(html);
    const images = dom.window.document.querySelectorAll('img');

    for (const img of images) {
      const src = img.getAttribute('src');
      if (src && src.startsWith('data:')) {
        // Otimizar imagem base64
        const base64Data = src.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const optimizedBuffer = await this.optimizeImage(buffer);
        const optimizedBase64 = `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;
        img.setAttribute('src', optimizedBase64);
      }
    }

    return dom.serialize();
  }
}
```

**Métodos Disponíveis:**

- **optimizeImage**: Otimiza uma imagem usando Sharp
- **extractImagesFromHtml**: Extrai URLs de imagens do HTML
- **optimizeImagesInHtml**: Otimiza todas as imagens em HTML

### **2. Types (src/types/game.ts)**

**Propósito:** Definições TypeScript para tipagem

**Interfaces Principais:**

```typescript
export interface Media {
  id: number;
  name: string;
  alternativeText?: string;
  caption?: string;
  width: number;
  height: number;
  formats?: {
    thumbnail?: MediaFormat;
    small?: MediaFormat;
    medium?: MediaFormat;
    large?: MediaFormat;
  };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl?: string;
  provider: string;
  provider_metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface MediaFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  url: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface Platform {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface Developer {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface Publisher {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

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

export interface GameFilters {
  name?: string;
  categories?: number[];
  platforms?: number[];
  developer?: number[];
  publisher?: number[];
  minRating?: number;
  maxRating?: number;
  minPrice?: number;
  maxPrice?: number;
  releaseDateFrom?: string;
  releaseDateTo?: string;
}

export interface GameSort {
  field: keyof Game;
  order: 'asc' | 'desc';
}

export interface Pagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface GameResponse {
  data: Game[];
  meta: {
    pagination: Pagination;
  };
}
```

---

## 🎨 **CUSTOMIZAÇÕES DO ADMIN**

### **1. Admin App (src/admin/app.tsx)**

**Propósito:** Customizações do painel administrativo

**Configurações Principais:**

```typescript
export default {
  config: {
    // Configurações de localização
    locales: ['pt-BR', 'en'],

    // Traduções customizadas
    translations: {
      'pt-BR': {
        'app.components.LeftMenu.navbrand.title': 'RootGames API',
        'app.components.LeftMenu.navbrand.workplace': 'Catálogo de Jogos',
        'app.components.LeftMenu.navbrand.title': 'RootGames API',
        'app.components.LeftMenu.navbrand.workplace': 'Catálogo de Jogos',
        'content-manager.containers.ListPage.table-headers.name': 'Nome',
        'content-manager.containers.ListPage.table-headers.description': 'Descrição',
        'content-manager.containers.ListPage.table-headers.releaseDate': 'Data de Lançamento',
        'content-manager.containers.ListPage.table-headers.rating': 'Avaliação',
        'content-manager.containers.ListPage.table-headers.price': 'Preço',
      },
      en: {
        'app.components.LeftMenu.navbrand.title': 'RootGames API',
        'app.components.LeftMenu.navbrand.workplace': 'Games Catalog',
      },
    },

    // Configurações de autenticação
    auth: {
      logo: '/admin/assets/logo.svg',
    },

    // Configurações do cabeçalho
    head: {
      favicon: '/admin/assets/favicon.ico',
    },

    // Configurações do menu
    menu: {
      logo: '/admin/assets/logo.svg',
    },

    // Tema personalizado
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

    // Configurações de notificações
    notifications: {
      releases: false,
    },

    // Tutoriais desabilitados
    tutorials: false,
  },

  // Função de inicialização
  bootstrap() {
    // Código executado na inicialização do admin
    console.log('🚀 RootGames API Admin inicializado');
  },
};
```

**Customizações Implementadas:**

- **Localização**: Português e Inglês
- **Traduções**: Textos customizados em português
- **Tema**: Cores personalizadas da marca
- **Logo**: Logo customizado
- **Notificações**: Releases desabilitados
- **Tutoriais**: Desabilitados

### **2. Admin Extensions (src/admin/extensions/)**

**Propósito:** Extensões customizadas do painel admin

**Estrutura:**

```
src/admin/extensions/
├── 📄 icon.png              # Ícone da extensão
└── 📄 logo.svg              # Logo da extensão
```

---

## 📄 **PONTO DE ENTRADA**

### **1. Index (src/index.ts)**

**Propósito:** Ponto de entrada principal da aplicação

**Conteúdo:**

```typescript
import { Strapi } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/*{ strapi }*/) {
    // Código executado na inicialização
    console.log('🚀 RootGames API - Inicializando...');

    // Verificar conexão com banco
    strapi.db.connection
      .raw('SELECT 1')
      .then(() => {
        console.log('✅ Conexão com banco de dados estabelecida');
      })
      .catch(error => {
        console.error('❌ Erro na conexão com banco:', error);
      });

    console.log('✅ RootGames API - Inicializado com sucesso!');
  },
};
```

**Funcionalidades:**

- **register**: Executado antes da inicialização
- **bootstrap**: Executado durante a inicialização
- **Logs**: Logs de inicialização customizados
- **Verificação de BD**: Teste de conexão com banco

---

## 🔧 **EXTENSÕES**

### **1. Extensions Directory (src/extensions/)**

**Propósito:** Extensões customizadas do Strapi

**Estrutura:**

```
src/extensions/
├── 📁 upload/               # Extensões do sistema de upload
├── 📁 users-permissions/    # Extensões de permissões
└── 📁 content-manager/      # Extensões do content manager
```

---

## 📊 **RESUMO DOS ARQUIVOS DE CÓDIGO FONTE**

### **APIs (5 Content Types):**

1. **Game** - Catálogo principal de jogos
2. **Category** - Categorias de jogos
3. **Platform** - Plataformas de jogos
4. **Developer** - Desenvolvedores
5. **Publisher** - Publicadoras

### **Utilitários:**

1. **ImageOptimizer** - Otimização de imagens
2. **Types** - Definições TypeScript

### **Admin:**

1. **app.tsx** - Customizações do painel admin
2. **extensions/** - Extensões do admin

### **Ponto de Entrada:**

1. **index.ts** - Inicialização da aplicação

### **Características Principais:**

- **TypeScript**: Código totalmente tipado
- **Relacionamentos**: Relações complexas entre entidades
- **Editor**: Textarea simples nativo do Strapi
- **Otimização**: Sistema de otimização de imagens
- **Customização**: Admin personalizado
- **Internacionalização**: Suporte PT-BR e EN
- **Logs**: Sistema de logs customizado

---

## 🎯 **PADRÕES DE CÓDIGO**

### **1. Nomenclatura**

- **PascalCase**: Interfaces, Classes, Types
- **camelCase**: Variáveis, Funções, Métodos
- **kebab-case**: Arquivos, Diretórios
- **UPPER_CASE**: Constantes

### **2. Estrutura de Arquivos**

- **Um arquivo por entidade**
- **Separação clara de responsabilidades**
- **Imports organizados**
- **Exports nomeados**

### **3. Documentação**

- **JSDoc**: Documentação de funções
- **Comentários**: Explicações complexas
- **README**: Documentação de uso
- **Types**: Tipagem explícita

### **4. Tratamento de Erros**

- **Try/Catch**: Tratamento de exceções
- **Logs**: Sistema de logs estruturado
- **Validação**: Validação de inputs
- **Sanitização**: Sanitização de dados

---

**Documentação gerada em:** 14/08/2025 **Última atualização:** Documentação completa dos arquivos de
código fonte
