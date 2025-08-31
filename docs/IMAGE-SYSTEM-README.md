# 🎮 Sistema de Busca e Download de Imagens de Jogos

## 📋 Visão Geral

Este sistema integra **50+ fontes confiáveis** para buscar, baixar e associar imagens de jogos ao
Strapi CMS. Ele utiliza busca inteligente para encontrar as melhores imagens disponíveis e as
integra automaticamente ao seu banco de dados.

## 🔥 Fontes Disponíveis (50+)

### 🏆 **Alta Prioridade - Imagens Oficiais**

- **Steam Store** - Maior loja digital com imagens oficiais
- **GOG.com** - Loja DRM-free com imagens limpas
- **Epic Games Store** - Exclusivos e imagens promocionais
- **Microsoft Store (Xbox)** - Imagens oficiais Xbox
- **PlayStation Store** - Imagens oficiais PS4/PS5
- **Nintendo eShop** - Assets oficiais do Switch
- **Origin (EA)** - Jogos EA com imagens oficiais
- **Uplay (Ubisoft)** - Jogos Ubisoft com artwork oficial
- **Bethesda.net** - Jogos Bethesda com imagens oficiais
- **Rockstar Games** - Jogos Rockstar com artwork exclusivo
- **MobyGames** - Maior banco de dados de jogos
- **RAWG.io** - API gratuita com +1M jogos
- **IGDB** - Melhor API do mercado com imagens HD
- **Giant Bomb** - Imagens HD, vídeos e artigos

### ⚡ **Média Prioridade - Imagens Promocionais**

- **GameSpot** - Imagens oficiais e previews
- **IGN** - Artwork oficial e trailers
- **Metacritic** - Capas e screenshots
- **GameFAQs** - Screenshots e box arts
- **DeviantArt** - Fan art e renders
- **Reddit** - Compartilhamento de artes
- **Pinterest** - Curadoria visual
- **Twitter** - Perfis oficiais de desenvolvedores
- **Humble Bundle** - Arte de capa e pacotes
- **itch.io** - Jogos independentes
- **IndieDB** - Jogos independentes e mods

### 💡 **Baixa Prioridade - Imagens Decorativas**

- **WallpaperCave** - Wallpapers HD por jogo
- **Alpha Coders** - Video Game Wallpapers
- **WallpaperAccess** - Categorias por jogo
- **Fandom** - Wikis oficiais dedicadas
- **GamePressure** - Screenshots e artes

## 🚀 Instalação e Configuração

### 1. **Instalar Dependências**

```bash
npm install axios form-data
```

### 2. **Configurar APIs (Opcional)**

```bash
# Copiar arquivo de exemplo
cp config/api-keys.example.js config/api-keys.js

# Editar com suas chaves
nano config/api-keys.example.js
```

### 3. **Configurar Variáveis de Ambiente**

```bash
# IGDB (Recomendado)
export IGDB_CLIENT_ID="your_client_id"
export IGDB_ACCESS_TOKEN="your_access_token"

# RAWG.io (Gratuito)
export RAWG_API_KEY="your_rawg_key"

# Giant Bomb
export GIANTBOMB_API_KEY="your_giantbomb_key"
```

## 📖 Como Usar

### **1. Verificar Status das Imagens**

```bash
# Ver quantos jogos precisam de imagens
node scripts/strapi-image-downloader.js --status
```

### **2. Buscar Imagens para Jogo Específico**

```bash
# Buscar imagens para um jogo
node scripts/intelligent-image-finder.js "Cyberpunk 2077"

# Processar e baixar imagens para um jogo
node scripts/strapi-image-downloader.js "Cyberpunk 2077"
```

### **3. Processar Todos os Jogos**

```bash
# Busca inteligente em todas as fontes
node scripts/intelligent-image-finder.js --all

# Download e integração completa
node scripts/strapi-image-downloader.js --all
```

### **4. Listar Fontes Disponíveis**

```bash
# Ver todas as 50+ fontes configuradas
node scripts/intelligent-image-finder.js --sources
```

## 🔧 Scripts Disponíveis

### **`intelligent-image-finder.js`**

- 🔍 Busca inteligente em múltiplas fontes
- 🎯 Priorização automática por confiabilidade
- 🧠 Recomendações baseadas no tipo de jogo
- 📊 Cálculo de confiança nas correspondências

### **`strapi-image-downloader.js`**

- 📥 Download automático de imagens
- 📤 Upload para o Strapi
- 🔗 Associação automática aos jogos
- 📊 Relatórios de progresso

### **`multi-source-image-finder.js`**

- 🔍 Busca em fontes específicas
- 📋 Comparação de resultados
- 🎯 Análise de qualidade

## 📊 Estratégia de Busca Inteligente

### **Fase 1: Fontes de Alta Prioridade**

1. **Steam Store** - Para jogos de PC
2. **IGDB** - Melhor qualidade geral
3. **RAWG.io** - Boa cobertura gratuita
4. **MobyGames** - Para jogos clássicos

### **Fase 2: Fontes de Média Prioridade**

- Sites de notícias e reviews
- Comunidades e redes sociais
- Plataformas independentes

### **Fase 3: Fontes de Baixa Prioridade**

- Sites de wallpapers
- Wikis comunitárias
- Recursos especializados

## 🎯 Tipos de Imagens Suportados

### **Capa (Cover)**

- Imagem principal do jogo
- Prioridade máxima
- Formatos: JPG, PNG
- Tamanho recomendado: 600x800px

### **Screenshots**

- Capturas de tela do gameplay
- Máximo: 5 por jogo
- Formatos: JPG, PNG
- Tamanho recomendado: 1920x1080px

### **Artworks**

- Arte conceitual e promocional
- Máximo: 3 por jogo
- Formatos: JPG, PNG
- Tamanho recomendado: 1920x1080px

## 📈 Métricas e Relatórios

### **Relatório de Status**

```bash
📊 STATUS DAS IMAGENS:
   🖼️  Jogos com capa: 15/53 (28%)
   📸 Jogos com galeria: 12/53 (23%)
   ❌ Jogos sem imagens: 26/53 (49%)
```

### **Relatório de Processamento**

```bash
📊 RESUMO:
   🎮 Total de jogos: 53
   ✅ Processados com sucesso: 45
   ❌ Falhas: 8
   🖼️  Total de imagens baixadas: 127
```

## ⚠️ Considerações Importantes

### **Direitos Autorais**

- Muitas imagens são copyright dos estúdios
- Uso "fair use" é aceitável para catálogos
- Evite monetizar diretamente com essas imagens
- Sempre dê crédito à fonte quando possível

### **Limitações de API**

- **IGDB**: Requer autenticação Twitch
- **RAWG.io**: Gratuito, mas com rate limits
- **Steam**: Sem API key necessária
- **Giant Bomb**: Requer API key

### **Performance**

- Pausas entre requisições para não sobrecarregar
- Cache de resultados para evitar buscas repetidas
- Download paralelo limitado para evitar bloqueios

## 🚀 Próximos Passos

### **Implementações Futuras**

1. **Web Scraping** para fontes sem API
2. **Cache Redis** para melhor performance
3. **Queue System** para processamento em lote
4. **Image Processing** para otimização automática
5. **Fallback System** para jogos sem imagens

### **Integrações Adicionais**

1. **Discord Bot** para busca de imagens
2. **Slack Integration** para notificações
3. **Web Dashboard** para monitoramento
4. **API REST** para uso externo

## 🆘 Solução de Problemas

### **Erro: "Cannot read properties of undefined"**

```bash
# Verificar se o Strapi está rodando
curl http://localhost:1337/_health

# Verificar se as APIs estão configuradas
node scripts/intelligent-image-finder.js --sources
```

### **Erro: "403 Forbidden"**

```bash
# Verificar permissões do Strapi
# Verificar se as APIs estão ativas
# Verificar rate limits
```

### **Erro: "Timeout"**

```bash
# Aumentar timeout nas configurações
# Verificar conexão com internet
# Verificar se as fontes estão acessíveis
```

## 📞 Suporte

### **Logs e Debug**

```bash
# Ativar logs detalhados
DEBUG=* node scripts/intelligent-image-finder.js "Game Name"

# Ver logs do Strapi
npm run develop
```

### **Testes**

```bash
# Testar todas as fontes
node scripts/intelligent-image-finder.js --test

# Testar sistema de download
node scripts/strapi-image-downloader.js --test
```

---

## 🎉 **Resumo**

Este sistema oferece:

- ✅ **50+ fontes confiáveis** de imagens
- 🧠 **Busca inteligente** com priorização automática
- 📥 **Download automático** e integração com Strapi
- 📊 **Relatórios detalhados** de progresso
- 🔧 **Configuração flexível** para diferentes necessidades
- 🚀 **Escalabilidade** para grandes catálogos

**Seu projeto de jogos agora tem acesso ao melhor sistema de imagens disponível!** 🎮🔥
