# 🎮 API de Imagens Avançada - RootGames

## 📋 **Visão Geral**

A API de Imagens Avançada do RootGames oferece busca inteligente de imagens de jogos em múltiplas fontes, incluindo APIs oficiais, bancos de dados especializados e fallbacks automáticos.

## 🚀 **Novos Endpoints**

### 1. **Verificar Status das APIs**
```http
GET /api/games/images/api-status
```

**Descrição**: Verifica o status de todas as APIs externas configuradas.

**Resposta**:
```json
{
  "apis": {
    "RAWG": true,
    "IGDB": false,
    "GiantBomb": false,
    "Steam": false
  },
  "totalConfigured": 1,
  "totalAvailable": 4,
  "timestamp": "2025-09-02T03:45:00.000Z",
  "recommendations": [
    {
      "priority": "medium",
      "message": "Configure mais APIs para aumentar a cobertura de busca",
      "apis": ["IGDB", "Giant Bomb"]
    }
  ]
}
```

### 2. **Busca Avançada de Imagens**
```http
GET /api/games/images/search-advanced?gameName=Cyberpunk 2077
```

**Descrição**: Busca imagens usando múltiplas fontes com análise de qualidade.

**Resposta**:
```json
{
  "gameName": "Cyberpunk 2077",
  "images": {
    "cover": "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg",
    "screenshots": ["url1", "url2", "url3"],
    "source": "RAWG.io (API)",
    "metadata": {
      "rating": 4.5,
      "releaseDate": "2020-12-10",
      "platforms": ["PC", "PS4", "Xbox One"]
    }
  },
  "timestamp": "2025-09-02T03:45:00.000Z",
  "searchQuality": {
    "score": 90,
    "details": ["Excelente - Imagens de alta qualidade encontradas"],
    "maxScore": 100
  }
}
```

## 🔑 **Configuração das APIs Externas**

### **RAWG.io API**
- **URL**: https://rawg.io/apidocs
- **Limite**: 20,000 requests/mês (gratuito)
- **Cobertura**: +1M jogos
- **Recursos**: Covers, screenshots, metadados

### **IGDB API**
- **URL**: https://api.igdb.com/
- **Limite**: 4 requests/segundo
- **Cobertura**: Maior base de dados de jogos
- **Recursos**: Covers, screenshots, ratings, plataformas

### **Giant Bomb API**
- **URL**: https://www.giantbomb.com/api/
- **Limite**: 200 requests/dia (gratuito)
- **Cobertura**: Jogos AAA e indie
- **Recursos**: Imagens, reviews, vídeos

### **Steam API**
- **URL**: https://steamcommunity.com/dev/apikey
- **Limite**: 100,000 requests/dia
- **Cobertura**: Jogos da Steam
- **Recursos**: Covers, screenshots, preços

## 🛠️ **Configuração Automática**

### **Executar Script de Configuração**
```bash
node scripts/setup-apis.js
```

O script irá:
1. ✅ Verificar arquivo `.env`
2. 🔑 Configurar cada API interativamente
3. 🧪 Testar as APIs configuradas
4. 📝 Atualizar variáveis de ambiente

### **Variáveis de Ambiente**
```bash
# API Keys para fontes externas de imagens
RAWG_API_KEY=your_rawg_api_key_here
IGDB_CLIENT_ID=your_igdb_client_id_here
IGDB_CLIENT_SECRET=your_igdb_client_secret_here
GIANT_BOMB_API_KEY=your_giant_bomb_api_key_here
STEAM_API_KEY=your_steam_api_key_here
```

## 📊 **Sistema de Qualidade**

### **Pontuação da Busca**
- **90-100**: Excelente - Imagens de alta qualidade
- **70-89**: Boa - Cobertura adequada
- **50-69**: Regular - Imagens básicas
- **0-49**: Baixa - Usando fallbacks

### **Fatores de Qualidade**
- ✅ **Cover**: +30 pontos
- 🖼️ **Screenshots**: +40 pontos (5 imagens)
- 📊 **Metadados**: +20 pontos
- 🌐 **Fonte**: +10 pontos (não fallback)

## 🔄 **Fallbacks Automáticos**

### **Imagens de Fallback**
Quando nenhuma fonte externa retorna imagens, o sistema gera automaticamente:

- **Cover**: Placeholder verde com nome do jogo
- **Gallery**: 5 screenshots coloridos com numeração
- **Fonte**: Marcada como "Fallback (Placeholder)"

### **URLs de Fallback**
```javascript
FALLBACK_IMAGES: {
  DEFAULT_COVER: 'https://via.placeholder.com/460x215/009c3b/ffffff?text=GAME+COVER',
  DEFAULT_GALLERY: [
    'https://via.placeholder.com/800x450/1e3a8a/ffffff?text=SCREENSHOT+1',
    'https://via.placeholder.com/800x450/7c3aed/ffffff?text=SCREENSHOT+2',
    // ... mais 3 screenshots
  ]
}
```

## 📈 **Melhorias de Performance**

### **Configurações de Busca**
```javascript
SEARCH_CONFIG: {
  MAX_RETRIES: 3,           // Tentativas por fonte
  TIMEOUT: 15000,           // Timeout por request (15s)
  DELAY_BETWEEN_REQUESTS: 2000,  // Delay entre fontes (2s)
  MAX_IMAGES_PER_GAME: 5    // Máximo de screenshots
}
```

### **Headers de Navegador**
```javascript
BROWSER_HEADERS: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Connection': 'keep-alive'
}
```

## 🎯 **Casos de Uso**

### **1. Verificação de Status**
```bash
curl "http://localhost:1337/api/games/images/api-status"
```

### **2. Busca Avançada**
```bash
curl "http://localhost:1337/api/games/images/search-advanced?gameName=The%20Witcher%203"
```

### **3. Download com Múltiplas Fontes**
```bash
curl -X POST "http://localhost:1337/api/games/images/download-all"
```

## 🔍 **Troubleshooting**

### **Erro 401 - RAWG API**
```bash
# Verificar se a chave está configurada
echo $RAWG_API_KEY

# Configurar via script
node scripts/setup-apis.js
```

### **Erro de Timeout**
```bash
# Aumentar timeout no arquivo de configuração
TIMEOUT: 30000  # 30 segundos
```

### **Imagens de Fallback**
Se todas as buscas retornarem fallbacks:
1. ✅ Verificar status das APIs
2. 🔑 Configurar pelo menos uma API
3. 🌐 Verificar conectividade com internet
4. 📝 Verificar logs do servidor

## 🚀 **Próximos Passos**

### **Melhorias Planejadas**
- [ ] Cache de imagens para jogos populares
- [ ] Sistema de prioridade por fonte
- [ ] Análise de qualidade das imagens
- [ ] Suporte a mais formatos de imagem
- [ ] Integração com CDNs

### **APIs Adicionais**
- [ ] Epic Games Store
- [ ] PlayStation Store
- [ ] Nintendo eShop
- [ ] Xbox Store
- [ ] Humble Bundle

## 📞 **Suporte**

Para dúvidas ou problemas:
1. 📖 Verificar esta documentação
2. 🔍 Consultar logs do servidor
3. 🧪 Executar testes de API
4. 💬 Abrir issue no repositório

---

**🎮 RootGames - API de Imagens Avançada v2.0**  
*Desenvolvido com ❤️ para a comunidade gamer*
