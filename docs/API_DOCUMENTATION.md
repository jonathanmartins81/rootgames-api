# 📚 Documentação da API - RootGames

## 🌐 Visão Geral da API

A RootGames API é uma API RESTful e GraphQL para gerenciamento de catálogo de jogos, construída com Strapi CMS. Oferece funcionalidades completas para CRUD de jogos, categorias, plataformas, desenvolvedores e publicadores.

---

## 🔗 Endpoints Base

- **Base URL**: `http://localhost:1337`
- **Admin Panel**: `http://localhost:1337/admin`
- **API REST**: `http://localhost:1337/api`
- **GraphQL**: `http://localhost:1337/graphql`

---

## 🎮 Endpoints de Jogos

### **Listar Jogos**

```http
GET /api/games
```

**Parâmetros de Query:**

- `pagination[page]`: Número da página (padrão: 1)
- `pagination[pageSize]`: Itens por página (padrão: 25, máximo: 100)
- `sort`: Campo para ordenação (ex: `name:asc`, `price:desc`)
- `filters`: Filtros (ex: `filters[price][$gt]=50`)
- `populate`: Relacionamentos para incluir

**Exemplo:**

```bash
curl "http://localhost:1337/api/games?populate=*&sort=name:asc&pagination[pageSize]=10"
```

**Resposta:**

```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "name": "The Witcher 3: Wild Hunt",
        "slug": "the-witcher-3-wild-hunt",
        "short_description": "Um RPG de mundo aberto...",
        "price": 29.99,
        "release_date": "2015-05-19",
        "rating": "BR16",
        "cover": {
          "data": {
            "id": 1,
            "attributes": {
              "url": "/uploads/witcher3_cover.jpg"
            }
          }
        },
        "categories": {
          "data": [
            {
              "id": 1,
              "attributes": {
                "name": "RPG"
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

### **Buscar Jogo por ID**

```http
GET /api/games/{id}
```

**Exemplo:**

```bash
curl "http://localhost:1337/api/games/1?populate=*"
```

### **Criar Novo Jogo**

```http
POST /api/games
```

**Headers:**

```
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json
```

**Body:**

```json
{
  "data": {
    "name": "Novo Jogo",
    "slug": "novo-jogo",
    "short_description": "Descrição do jogo",
    "price": 59.99,
    "release_date": "2025-01-15",
    "rating": "BR12",
    "categories": [1, 2],
    "platforms": [1, 3],
    "developers": [1],
    "publisher": 1
  }
}
```

### **Atualizar Jogo**

```http
PUT /api/games/{id}
```

### **Deletar Jogo**

```http
DELETE /api/games/{id}
```

---

## 🏷️ Endpoints de Categorias

### **Listar Categorias**

```http
GET /api/categories
```

**Exemplo:**

```bash
curl "http://localhost:1337/api/categories?populate=games"
```

### **Buscar Categoria por ID**

```http
GET /api/categories/{id}
```

### **Criar Categoria**

```http
POST /api/categories
```

**Body:**

```json
{
  "data": {
    "name": "Ação",
    "slug": "acao"
  }
}
```

---

## 🎯 Endpoints de Plataformas

### **Listar Plataformas**

```http
GET /api/platforms
```

### **Buscar Plataforma por ID**

```http
GET /api/platforms/{id}
```

### **Criar Plataforma**

```http
POST /api/platforms
```

**Body:**

```json
{
  "data": {
    "name": "PlayStation 5",
    "slug": "playstation-5"
  }
}
```

---

## 👨‍💻 Endpoints de Desenvolvedores

### **Listar Desenvolvedores**

```http
GET /api/developers
```

### **Buscar Desenvolvedor por ID**

```http
GET /api/developers/{id}
```

### **Criar Desenvolvedor**

```http
POST /api/developers
```

**Body:**

```json
{
  "data": {
    "name": "CD Projekt Red",
    "slug": "cd-projekt-red"
  }
}
```

---

## 📢 Endpoints de Publicadores

### **Listar Publicadores**

```http
GET /api/publishers
```

### **Buscar Publicador por ID**

```http
GET /api/publishers/{id}
```

### **Criar Publicador**

```http
POST /api/publishers
```

**Body:**

```json
{
  "data": {
    "name": "Electronic Arts",
    "slug": "electronic-arts"
  }
}
```

---

## 🔄 Funcionalidade de Populate

### **Endpoint de Populate**

```http
POST /api/games/populate
```

**Headers:**

```
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json
```

**Body (opcional):**

```json
{
  "limit": 50,
  "order": "desc:trending"
}
```

**Descrição:**
Este endpoint importa automaticamente jogos da API da GOG, incluindo:

- Informações básicas do jogo
- Descrições e classificação etária
- Imagens de capa e galeria
- Categorias, plataformas, desenvolvedores e publicadores

**Exemplo:**

```bash
curl -X POST "http://localhost:1337/api/games/populate" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit": 25}'
```

---

## 🔍 Filtros e Busca

### **Filtros por Preço**

```bash
# Jogos com preço maior que $50
GET /api/games?filters[price][$gt]=50

# Jogos com preço entre $20 e $100
GET /api/games?filters[price][$gte]=20&filters[price][$lte]=100
```

### **Filtros por Data**

```bash
# Jogos lançados em 2024
GET /api/games?filters[release_date][$gte]=2024-01-01&filters[release_date][$lte]=2024-12-31

# Jogos lançados nos últimos 30 dias
GET /api/games?filters[release_date][$gte]=2024-12-01
```

### **Filtros por Categoria**

```bash
# Jogos da categoria RPG
GET /api/games?filters[categories][name][$eq]=RPG

# Jogos de múltiplas categorias
GET /api/games?filters[categories][name][$in][]=RPG&filters[categories][name][$in][]=Ação
```

### **Filtros por Plataforma**

```bash
# Jogos para PC
GET /api/games?filters[platforms][name][$eq]=PC

# Jogos para múltiplas plataformas
GET /api/games?filters[platforms][name][$in][]=PC&filters[platforms][name][$in][]=PlayStation 5
```

### **Busca por Nome**

```bash
# Busca por nome do jogo
GET /api/games?filters[name][$containsi]=witcher
```

---

## 📊 Ordenação

### **Ordenação Simples**

```bash
# Por nome (A-Z)
GET /api/games?sort=name:asc

# Por preço (maior para menor)
GET /api/games?sort=price:desc

# Por data de lançamento (mais recente primeiro)
GET /api/games?sort=release_date:desc
```

### **Ordenação Múltipla**

```bash
# Por categoria e depois por nome
GET /api/games?sort=categories.name:asc,name:asc
```

---

## 🔐 Autenticação

### **Tokens de API**

Para endpoints protegidos, use tokens de API:

1. **Criar Token:**
   - Acesse o Admin Panel
   - Vá para Settings > API Tokens
   - Clique em "Create new API Token"
   - Configure permissões e expiração

2. **Usar Token:**

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
  "http://localhost:1337/api/games"
```

### **JWT para Usuários**

Para autenticação de usuários:

```bash
# Login
curl -X POST "http://localhost:1337/api/auth/local" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "user@example.com",
    "password": "password123"
  }'

# Usar JWT retornado
curl -H "Authorization: Bearer JWT_TOKEN" \
  "http://localhost:1337/api/users/me"
```

---

## 📡 GraphQL

### **Schema GraphQL**

Acesse o GraphQL Playground em: `http://localhost:1337/graphql`

### **Exemplo de Query**

```graphql
query GetGames {
  games {
    data {
      id
      attributes {
        name
        price
        release_date
        categories {
          data {
            attributes {
              name
            }
          }
        }
        platforms {
          data {
            attributes {
              name
            }
          }
        }
      }
    }
  }
}
```

### **Exemplo de Mutation**

```graphql
mutation CreateGame($data: GameInput!) {
  createGame(data: $data) {
    data {
      id
      attributes {
        name
        price
      }
    }
  }
}
```

**Variables:**

```json
{
  "data": {
    "name": "Novo Jogo",
    "price": 59.99,
    "release_date": "2025-01-15"
  }
}
```

---

## 📁 Upload de Arquivos

### **Upload de Imagem**

```bash
curl -X POST "http://localhost:1337/api/upload" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -F "files=@image.jpg" \
  -F "refId=1" \
  -F "ref=api::game.game" \
  -F "field=cover"
```

### **Upload Múltiplo**

```bash
curl -X POST "http://localhost:1337/api/upload" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg" \
  -F "refId=1" \
  -F "ref=api::game.game" \
  -F "field=gallery"
```

---

## 🚨 Códigos de Status HTTP

- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Requisição inválida
- **401**: Não autorizado
- **403**: Proibido
- **404**: Não encontrado
- **422**: Erro de validação
- **500**: Erro interno do servidor

---

## 📝 Exemplos Práticos

### **Script para Popular Banco**

```bash
#!/bin/bash

# Token da API (substitua pelo seu)
API_TOKEN="your-api-token-here"

# Popular jogos
echo "Populando jogos..."
curl -X POST "http://localhost:1337/api/games/populate" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit": 100}'

echo "População concluída!"
```

### **Script para Backup**

```bash
#!/bin/bash

# Backup do banco
DATE=$(date +%Y%m%d_%H%M%S)
PGPASSWORD=rootgames pg_dump -h 127.0.0.1 -U rootgames rootgames > backup_$DATE.sql

echo "Backup criado: backup_$DATE.sql"
```

---

## 🔧 Configuração de CORS

Para permitir acesso de outros domínios, configure o CORS:

**config/middlewares.ts:**

```typescript
export default [
  'strapi::errors',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      origin: ['http://localhost:3000', 'https://yourdomain.com'],
    },
  },
  // ... outros middlewares
];
```

---

## 📊 Monitoramento

### **Health Check**

```bash
curl "http://localhost:1337/_health"
```

### **Informações do Sistema**

```bash
curl "http://localhost:1337/admin/information"
```

---

_Última atualização: Agosto 2025_
_Versão da API: 1.0.0_
