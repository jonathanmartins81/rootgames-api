# 🎮 API Documentation - RootGames API

Documentação completa das APIs do RootGames, incluindo endpoints, parâmetros, respostas e exemplos.

## 📋 Índice

- [Autenticação](#-autenticação)
- [Endpoints de Jogos](#-endpoints-de-jogos)
- [Endpoints de Imagens](#-endpoints-de-imagens)
- [Endpoints Administrativos](#-endpoints-administrativos)
- [Endpoints de SEO](#-endpoints-de-seo)
- [Códigos de Erro](#-códigos-de-erro)
- [Rate Limiting](#-rate-limiting)

---

## 🔐 Autenticação

### API Key Authentication

Algumas rotas requerem autenticação por API Key:

```http
X-API-Key: rootgames-admin-key-2024
```

**Chaves válidas:**
- `rootgames-dev-key-2024` - Desenvolvimento
- `rootgames-admin-key-2024` - Administração

---

## 🎮 Endpoints de Jogos

### GET /api/games

Lista todos os jogos com paginação e filtros.

**Parâmetros de Query:**
- `pagination[page]` - Página (padrão: 1)
- `pagination[pageSize]` - Itens por página (padrão: 25)
- `filters[name][$containsi]` - Filtrar por nome
- `filters[category][$eq]` - Filtrar por categoria
- `filters[platform][$eq]` - Filtrar por plataforma
- `sort` - Ordenação (ex: `name:ASC`)

**Exemplo de Requisição:**
```http
GET /api/games?pagination[pageSize]=10&filters[category][$eq]=RPG&sort=name:ASC
```

**Exemplo de Resposta:**
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "name": "Baldur's Gate 3",
        "slug": "baldurs-gate-3",
        "description": "Um RPG épico...",
        "releaseDate": "2023-08-03",
        "rating": 9.5,
        "category": "RPG",
        "platform": "PC",
        "cover": {
          "data": {
            "id": 1,
            "attributes": {
              "url": "/uploads/baldurs_gate_3_cover.png"
            }
          }
        },
        "gallery": {
          "data": [
            {
              "id": 1,
              "attributes": {
                "url": "/uploads/baldurs_gate_3_screenshot_1.png"
              }
            }
          ]
        }
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "pageCount": 5,
      "total": 50
    }
  }
}
```

### GET /api/games/:id

Retorna um jogo específico.

**Parâmetros:**
- `id` - ID do jogo
- `populate` - Campos para popular (ex: `populate=cover,gallery`)

**Exemplo:**
```http
GET /api/games/1?populate=cover,gallery,developer,publisher
```

### POST /api/games

Cria um novo jogo.

**Headers:**
```http
Content-Type: application/json
```

**Body:**
```json
{
  "data": {
    "name": "Novo Jogo",
    "slug": "novo-jogo",
    "description": "Descrição do jogo",
    "releaseDate": "2024-01-01",
    "rating": 8.5,
    "category": "Action",
    "platform": "PC"
  }
}
```

### PUT /api/games/:id

Atualiza um jogo existente.

**Headers:**
```http
Content-Type: application/json
```

**Body:**
```json
{
  "data": {
    "name": "Nome Atualizado",
    "description": "Nova descrição"
  }
}
```

### DELETE /api/games/:id

Remove um jogo.

**Resposta:**
```json
{
  "data": {
    "id": 1,
    "attributes": {
      "name": "Jogo Removido"
    }
  }
}
```

---

## 🖼️ Endpoints de Imagens

### GET /api/games/images/search

Busca imagens de jogos em APIs externas.

**Parâmetros:**
- `query` - Termo de busca (obrigatório)
- `source` - Fonte da API (rawg, steam, gog, igdb)
- `type` - Tipo de imagem (cover, screenshot, gallery)
- `limit` - Limite de resultados (padrão: 10)

**Exemplo:**
```http
GET /api/games/images/search?query=baldur&source=rawg&type=cover&limit=5
```

**Resposta:**
```json
{
  "images": [
    {
      "url": "https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg",
      "source": "rawg",
      "type": "cover",
      "width": 600,
      "height": 800,
      "title": "Baldur's Gate 3 Cover"
    }
  ],
  "total": 15,
  "sources": ["rawg", "steam", "gog"]
}
```

### POST /api/games/:id/images/download

Baixa e associa imagens a um jogo.

**Headers:**
```http
X-API-Key: rootgames-admin-key-2024
Content-Type: application/json
```

**Body:**
```json
{
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "type": "cover"
    }
  ],
  "source": "rawg"
}
```

### GET /api/games/images/sources

Lista fontes de imagens disponíveis.

**Resposta:**
```json
{
  "sources": [
    {
      "name": "rawg",
      "displayName": "RAWG.io",
      "enabled": true,
      "rateLimit": "1000/hour"
    },
    {
      "name": "steam",
      "displayName": "Steam",
      "enabled": true,
      "rateLimit": "unlimited"
    }
  ]
}
```

---

## 🔐 Endpoints Administrativos

**⚠️ Requer autenticação por API Key**

### GET /api/admin/system-info

Informações do sistema.

**Headers:**
```http
X-API-Key: rootgames-admin-key-2024
```

**Resposta:**
```json
{
  "system": {
    "version": "4.12.5",
    "uptime": "2d 5h 30m",
    "memory": "512MB",
    "cpu": "15%",
    "database": "connected"
  },
  "security": {
    "rateLimitActive": true,
    "lastScan": "2025-09-16T20:30:00Z",
    "vulnerabilities": 0
  }
}
```

### GET /api/admin/security-stats

Estatísticas de segurança.

**Resposta:**
```json
{
  "stats": {
    "totalRequests": 15420,
    "blockedRequests": 23,
    "suspiciousActivity": 5,
    "lastScan": "2025-09-16T20:30:00Z",
    "vulnerabilities": 0
  },
  "rateLimiting": {
    "active": true,
    "maxRequests": 100,
    "windowMs": 60000
  }
}
```

### GET /api/admin/security-logs

Logs de segurança.

**Parâmetros:**
- `limit` - Limite de logs (padrão: 50)
- `level` - Nível do log (info, warn, error)
- `from` - Data inicial (ISO 8601)
- `to` - Data final (ISO 8601)

**Exemplo:**
```http
GET /api/admin/security-logs?limit=20&level=warn&from=2025-09-16T00:00:00Z
```

### POST /api/admin/clear-cache

Limpa cache de segurança.

**Resposta:**
```json
{
  "message": "Cache cleared successfully",
  "clearedAt": "2025-09-16T20:35:00Z"
}
```

### POST /api/admin/run-vulnerability-scan

Executa scan de vulnerabilidades.

**Resposta:**
```json
{
  "scanId": "scan_20250916_203500",
  "status": "started",
  "estimatedDuration": "5m"
}
```

### GET /api/admin/test-external-apis

Testa conectividade com APIs externas.

**Resposta:**
```json
{
  "results": {
    "rawg": {
      "status": "success",
      "statusCode": 200,
      "responseTime": "150ms"
    },
    "steam": {
      "status": "success",
      "statusCode": 200,
      "responseTime": "200ms"
    }
  }
}
```

---

## 🔍 Endpoints de SEO

### GET /api/seo/generate

Gera metadados SEO para uma página.

**Parâmetros:**
- `type` - Tipo de conteúdo (game, category, platform)
- `id` - ID do conteúdo
- `url` - URL da página

**Exemplo:**
```http
GET /api/seo/generate?type=game&id=1&url=/games/baldurs-gate-3
```

**Resposta:**
```json
{
  "title": "Baldur's Gate 3 - RootGames",
  "description": "Descrição otimizada para SEO...",
  "keywords": "baldur, gate, rpg, fantasy",
  "ogTitle": "Baldur's Gate 3",
  "ogDescription": "Um RPG épico...",
  "ogImage": "/uploads/baldurs_gate_3_og.jpg",
  "twitterCard": "summary_large_image"
}
```

---

## ❌ Códigos de Erro

| Código | Descrição | Solução |
|--------|-----------|---------|
| 400 | Bad Request | Verificar parâmetros da requisição |
| 401 | Unauthorized | Incluir API key válida |
| 403 | Forbidden | Verificar permissões |
| 404 | Not Found | Recurso não encontrado |
| 429 | Too Many Requests | Aguardar e tentar novamente |
| 500 | Internal Server Error | Contatar suporte |

**Exemplo de Erro:**
```json
{
  "error": {
    "status": 400,
    "name": "ValidationError",
    "message": "Invalid input data",
    "details": {
      "errors": [
        {
          "path": ["name"],
          "message": "Name is required"
        }
      ]
    }
  }
}
```

---

## ⚡ Rate Limiting

### Limites por Endpoint

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `/api/games` | 100 req/min | 1 minuto |
| `/api/games/images/search` | 50 req/min | 1 minuto |
| `/api/admin/*` | 50 req/min | 1 minuto |
| `/api/upload` | 10 req/min | 1 minuto |

### Headers de Rate Limiting

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-09-16T21:00:00Z
Retry-After: 60
```

### Exemplo de Resposta 429

```json
{
  "error": "Muitas requisições. Tente novamente em 1 minuto.",
  "retryAfter": 60
}
```

---

## 📊 Exemplos de Uso

### Buscar jogos por categoria

```bash
curl -X GET "http://localhost:1337/api/games?filters[category][$eq]=RPG&sort=rating:DESC&pagination[pageSize]=5"
```

### Criar novo jogo

```bash
curl -X POST "http://localhost:1337/api/games" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "name": "Novo Jogo",
      "slug": "novo-jogo",
      "description": "Descrição do jogo",
      "category": "Action"
    }
  }'
```

### Buscar imagens

```bash
curl -X GET "http://localhost:1337/api/games/images/search?query=cyberpunk&source=rawg&limit=3"
```

### Acessar informações administrativas

```bash
curl -X GET "http://localhost:1337/api/admin/system-info" \
  -H "X-API-Key: rootgames-admin-key-2024"
```

---

**Última atualização**: Setembro 2025  
**Versão da API**: 1.0.0  
**Base URL**: `http://localhost:1337` (desenvolvimento)  
**Documentação Interativa**: `http://localhost:1337/api-docs`
