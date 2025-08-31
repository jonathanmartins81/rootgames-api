# 🎮 API de Imagens de Jogos - RootGames

## 📋 Visão Geral

A **API de Imagens de Jogos** é uma solução completa para gerenciar e servir imagens de capa e
galeria para jogos. Desenvolvida para integrar perfeitamente com o sistema Strapi existente, oferece
uma base de dados robusta de imagens de jogos com funcionalidades avançadas de busca e
gerenciamento.

## 🚀 Características Principais

- ✅ **Base de dados expandida** com 40+ jogos
- ✅ **Busca por similaridade** inteligente
- ✅ **Integração completa** com Strapi
- ✅ **Validação de URLs** de imagens
- ✅ **Sistema de monitoramento** em tempo real
- ✅ **Testes automatizados** completos
- ✅ **Backup e restauração** automáticos
- ✅ **Logs estruturados** para debugging

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Strapi API    │◄──►│  Game Images API │◄──►│  MobyGames DB   │
│   (localhost:1337)│    │   (localhost:3001) │    │   (Externo)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Upload Files   │    │  Similarity      │    │  Image URLs     │
│  & Association  │    │  Search Engine   │    │  & Metadata     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📦 Instalação e Configuração

### 1. Dependências

```bash
npm install express cors axios
```

### 2. Iniciar a API

```bash
node scripts/game-images-api.js
```

A API estará disponível em `http://localhost:3001`

### 3. Verificar Status

```bash
curl http://localhost:3001/health
```

## 🔗 Endpoints da API

### Health Check

```http
GET /health
```

**Resposta:**

```json
{
  "status": "OK",
  "timestamp": "2025-08-31T01:09:20.995Z",
  "totalGames": 40,
  "uptime": 65.766794776,
  "version": "2.0.0",
  "features": [
    "Expanded database",
    "Similarity search",
    "Enhanced endpoints",
    "Better error handling"
  ]
}
```

### Buscar Imagens por Nome

```http
GET /api/game-images?name=Nome do Jogo
```

**Exemplo:**

```bash
curl "http://localhost:3001/api/game-images?name=Fallout%204:%20Game%20of%20the%20Year%20Edition"
```

**Resposta:**

```json
{
  "success": true,
  "game": "Fallout 4: Game of the Year Edition",
  "cover": "https://www.mobygames.com/images/covers/l/439254-fallout-4-game-of-the-year-edition-windows-front-cover.jpg",
  "gallery": [
    "https://www.mobygames.com/images/screenshots/l/439254-fallout-4-game-of-the-year-edition-windows-screenshot-1.jpg",
    "https://www.mobygames.com/images/screenshots/l/439254-fallout-4-game-of-the-year-edition-windows-screenshot-2.jpg",
    "https://www.mobygames.com/images/screenshots/l/439254-fallout-4-game-of-the-year-edition-windows-screenshot-3.jpg"
  ],
  "source": "MobyGames",
  "lastUpdated": "2025-08-31T01:09:20.995Z",
  "matchType": "local"
}
```

### Busca por Similaridade

```http
GET /api/game-images/search?query=termo
```

**Exemplo:**

```bash
curl "http://localhost:3001/api/game-images/search?query=witcher"
```

**Resposta:**

```json
{
  "success": true,
  "query": "witcher",
  "total": 3,
  "results": [
    {
      "name": "The Witcher 3: Wild Hunt",
      "cover": "https://www.mobygames.com/images/covers/l/0/0c/The_Witcher_3_cover_art.jpg",
      "source": "MobyGames",
      "lastUpdated": "2025-08-31T01:09:20.995Z"
    },
    {
      "name": "The Witcher: Enhanced Edition",
      "cover": "https://www.mobygames.com/images/covers/l/the-witcher-enhanced-cover.jpg",
      "source": "MobyGames",
      "lastUpdated": "2025-08-31T01:09:20.995Z"
    },
    {
      "name": "The Witcher 2: Assassins of Kings Enhanced Edition",
      "cover": "https://www.mobygames.com/images/covers/l/the-witcher-2-cover.jpg",
      "source": "MobyGames",
      "lastUpdated": "2025-08-31T01:09:20.995Z"
    }
  ]
}
```

### Listar Todos os Jogos

```http
GET /api/games-list
```

**Resposta:**

```json
{
  "success": true,
  "total": 40,
  "games": [
    {
      "name": "Fallout 4: Game of the Year Edition",
      "hasCover": true,
      "hasGallery": true,
      "source": "MobyGames",
      "lastUpdated": "2025-08-31T01:09:20.995Z"
    }
  ]
}
```

### Adicionar Novo Jogo

```http
POST /api/game-images
```

**Body:**

```json
{
  "name": "Nome do Jogo",
  "cover": "https://exemplo.com/capa.jpg",
  "gallery": ["https://exemplo.com/screenshot1.jpg", "https://exemplo.com/screenshot2.jpg"],
  "source": "Manual"
}
```

### Atualizar Jogo Existente

```http
PUT /api/game-images/:name
```

**Body:**

```json
{
  "cover": "https://exemplo.com/nova-capa.jpg",
  "source": "Atualizado"
}
```

## 🛠️ Scripts de Gerenciamento

### 1. Gerenciador de Banco de Dados

```bash
# Mostrar ajuda
node scripts/manage-game-database.js help

# Criar backup
node scripts/manage-game-database.js backup

# Listar backups
node scripts/manage-game-database.js list-backups

# Buscar jogos
node scripts/manage-game-database.js search witcher

# Adicionar jogo
node scripts/manage-game-database.js add "Novo Jogo" "https://exemplo.com/capa.jpg"

# Atualizar jogo
node scripts/manage-game-database.js update "Fallout 4" cover "https://nova-capa.jpg"
```

### 2. Monitor de Performance

```bash
# Mostrar ajuda
node scripts/monitor-game-images.js help

# Iniciar monitoramento contínuo
node scripts/monitor-game-images.js monitor

# Verificar saúde
node scripts/monitor-game-images.js health

# Verificar performance
node scripts/monitor-game-images.js performance

# Gerar relatório
node scripts/monitor-game-images.js report

# Mostrar estatísticas dos logs
node scripts/monitor-game-images.js logs

# Limpar logs antigos
node scripts/monitor-game-images.js cleanup 30
```

### 3. Testes Automatizados

```bash
# Mostrar ajuda
node scripts/test-game-images-api.js help

# Executar todos os testes
node scripts/test-game-images.js all

# Teste específico
node scripts/test-game-images.js health
node scripts/test-game-images.js performance
node scripts/test-game-images.js exact-search
```

### 4. Integração com Strapi

```bash
# Processar todos os jogos
node scripts/integrate-game-images.js

# Processar jogo específico
node scripts/integrate-game-images.js "Fallout 4: Game of the Year Edition"
```

## 🔍 Funcionalidades de Busca

### 1. Busca Exata

- Busca por nome completo do jogo
- Retorna imagens exatas se encontradas

### 2. Busca por Similaridade

- Busca inteligente por termos parciais
- Filtra jogos que contenham o termo
- Ordena por relevância

### 3. Fallback Inteligente

- Se não encontrar jogo exato, tenta similar
- Sugere jogos relacionados
- Logs detalhados do processo de busca

## 📊 Base de Dados

### Jogos Incluídos (40+ títulos)

- **Fallout Series**: Fallout 4 GOTY, Fallout New Vegas
- **The Witcher Series**: The Witcher 1, 2, 3 + Complete Edition
- **Hitman Series**: Hitman 1, 2, 3, Absolution, Blood Money
- **Civilization Series**: Civilization IV Complete
- **Elder Scrolls**: Skyrim Special/Anniversary Edition
- **Cyberpunk 2077**: Base + Phantom Liberty + Ultimate
- **Classics**: Sacred Gold, DOOM 3, Hollow Knight
- **Strategy**: Heroes of Might and Magic 3, 4, 5
- **Action**: Sleeping Dogs, Kingdom Come Deliverance II
- **RPG**: Vampire Masquerade, Gothic 2 Gold

### Estrutura dos Dados

```json
{
  "name": "Nome do Jogo",
  "cover": "URL da capa principal",
  "gallery": ["URL1", "URL2", "URL3"],
  "source": "Fonte das imagens (MobyGames)",
  "lastUpdated": "Timestamp da última atualização"
}
```

## 🔒 Segurança e Validação

### 1. Validação de URLs

- Verifica se URLs são válidas antes do download
- Validação de tipo de conteúdo (image/\*)
- Timeout configurável para requisições

### 2. Rate Limiting

- Delays entre requisições para não sobrecarregar
- Configuração de timeouts para APIs externas
- Retry automático com backoff

### 3. Tratamento de Erros

- Logs estruturados para debugging
- Fallbacks para falhas de rede
- Mensagens de erro informativas

## 📈 Monitoramento e Performance

### 1. Métricas Coletadas

- Tempo de resposta dos endpoints
- Uso de memória e recursos
- Taxa de sucesso das requisições
- Logs de erro e warnings

### 2. Alertas Automáticos

- Falhas consecutivas
- Performance abaixo do threshold
- APIs externas não responsivas

### 3. Relatórios

- Relatórios diários de status
- Análise de performance
- Estatísticas de uso

## 🚀 Deploy e Produção

### 1. Variáveis de Ambiente

```bash
# Configurações da API
PORT=3001
NODE_ENV=production

# Configurações de monitoramento
LOG_LEVEL=info
ALERT_EMAIL=admin@exemplo.com
```

### 2. Process Manager (PM2)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar com PM2
pm2 start scripts/game-images-api.js --name "game-images-api"

# Monitorar
pm2 monit

# Logs
pm2 logs game-images-api
```

### 3. Docker (Opcional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "scripts/game-images-api.js"]
```

## 🔧 Manutenção

### 1. Backups Automáticos

- Backups diários do banco de dados
- Retenção configurável (padrão: 7 dias)
- Restauração simples via script

### 2. Limpeza de Logs

- Limpeza automática de logs antigos
- Compressão de logs históricos
- Configuração de retenção

### 3. Atualizações

- Adição de novos jogos via API
- Atualização de URLs existentes
- Migração de dados em lote

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. API não responde

```bash
# Verificar se está rodando
ps aux | grep game-images-api

# Verificar logs
tail -f logs/game-images/monitor-*.log

# Reiniciar
pkill -f game-images-api
node scripts/game-images-api.js
```

#### 2. Erro de conexão com Strapi

```bash
# Verificar se Strapi está rodando
curl http://localhost:1337/admin

# Verificar configurações
cat config/plugins.js
```

#### 3. Falhas no download de imagens

```bash
# Verificar conectividade
curl -I "https://www.mobygames.com"

# Verificar logs de erro
grep "Erro ao baixar" logs/game-images/*.log
```

### Logs e Debugging

```bash
# Logs em tempo real
tail -f logs/game-images/monitor-*.log

# Logs de dados estruturados
cat logs/game-images/monitor-*-data.json | jq .

# Relatórios de status
ls -la logs/game-images/status-report-*.json
```

## 📚 Exemplos de Uso

### 1. Integração com Frontend

```javascript
// Buscar imagens de um jogo
async function getGameImages(gameName) {
  try {
    const response = await fetch(
      `http://localhost:3001/api/game-images?name=${encodeURIComponent(gameName)}`
    );
    const data = await response.json();

    if (data.success) {
      return {
        cover: data.cover,
        gallery: data.gallery,
        source: data.source,
      };
    } else {
      console.log('Jogo não encontrado:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Erro na busca:', error);
    return null;
  }
}

// Uso
const images = await getGameImages('The Witcher 3: Wild Hunt');
if (images) {
  document.getElementById('game-cover').src = images.cover;
}
```

### 2. Processamento em Lote

```javascript
// Processar múltiplos jogos
async function processMultipleGames(gameNames) {
  const results = [];

  for (const name of gameNames) {
    try {
      const response = await fetch(
        `http://localhost:3001/api/game-images?name=${encodeURIComponent(name)}`
      );
      const data = await response.json();

      results.push({
        name,
        success: data.success,
        hasImages: data.success && data.cover,
        source: data.source,
      });

      // Aguardar entre requisições
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      results.push({
        name,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}
```

## 🔮 Roadmap e Melhorias Futuras

### Fase 1 (Atual)

- ✅ Base de dados expandida
- ✅ Busca por similaridade
- ✅ Sistema de monitoramento
- ✅ Testes automatizados

### Fase 2 (Próxima)

- 🔄 Integração com APIs externas (RAWG, IGDB)
- 🔄 Sistema de cache Redis
- 🔄 Web scraping automático da MobyGames
- 🔄 Interface web de administração

### Fase 3 (Futura)

- 📋 Machine learning para busca inteligente
- 📋 CDN para imagens
- 📋 API GraphQL
- 📋 Sistema de notificações

## 📞 Suporte

### Documentação

- Este arquivo: `docs/API_IMAGENS_JOGOS.md`
- Scripts: `scripts/` directory
- Logs: `logs/game-images/` directory

### Comandos de Ajuda

```bash
# Todos os scripts têm comando help
node scripts/game-images-api.js --help
node scripts/manage-game-database.js help
node scripts/monitor-game-images.js help
node scripts/test-game-images-api.js help
```

### Logs e Debugging

```bash
# Verificar status geral
curl http://localhost:3001/health

# Ver logs em tempo real
tail -f logs/game-images/monitor-*.log

# Executar testes
node scripts/test-game-images-api.js all
```

---

**🎮 API de Imagens de Jogos v2.0** - Solução completa para gerenciamento de imagens de jogos no
RootGames!
