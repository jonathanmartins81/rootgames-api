# 🔧 Scripts Documentation - RootGames API

Documentação completa de todos os scripts de automação, monitoramento e utilitários do RootGames API.

## 📋 Índice

- [Scripts de Imagens](#-scripts-de-imagens)
- [Scripts de Segurança](#-scripts-de-segurança)
- [Scripts de Deploy](#-scripts-de-deploy)
- [Scripts de Monitoramento](#-scripts-de-monitoramento)
- [Scripts de SEO](#-scripts-de-seo)
- [Scripts de Configuração](#-scripts-de-configuração)

---

## 🖼️ Scripts de Imagens

### 1. `check-games-images.js`

**Funcionalidade:** Verifica o status das imagens (capa e galeria) de todos os jogos.

**Uso:**
```bash
node scripts/check-games-images.js
```

**Funcionalidades:**
- Verifica se jogos têm imagem de capa
- Verifica se jogos têm imagens de galeria
- Gera relatório de status
- Identifica jogos com imagens faltando

**Saída:**
```json
{
  "totalGames": 50,
  "gamesWithCover": 45,
  "gamesWithGallery": 30,
  "gamesComplete": 25,
  "missingCover": 5,
  "missingGallery": 20,
  "status": "completed"
}
```

### 2. `manage-images.js`

**Funcionalidade:** Gerenciamento completo de imagens em massa.

**Uso:**
```bash
node scripts/manage-images.js --action=download --source=rawg --limit=10
```

**Parâmetros:**
- `--action` - Ação a executar (download, organize, optimize)
- `--source` - Fonte das imagens (rawg, steam, gog, igdb)
- `--limit` - Limite de jogos a processar
- `--type` - Tipo de imagem (cover, gallery, all)

**Funcionalidades:**
- Download de imagens de APIs externas
- Organização de imagens por categoria
- Otimização de imagens
- Associação automática com jogos

### 3. `download-game-images.js`

**Funcionalidade:** Download específico de imagens para um jogo.

**Uso:**
```bash
node scripts/download-game-images.js --game="Baldur's Gate 3" --type=cover
```

**Parâmetros:**
- `--game` - Nome do jogo
- `--type` - Tipo de imagem (cover, gallery, all)
- `--source` - Fonte da API
- `--quality` - Qualidade da imagem (high, medium, low)

### 4. `fetch-real-game-images.js`

**Funcionalidade:** Busca imagens reais de jogos em APIs externas.

**Uso:**
```bash
node scripts/fetch-real-game-images.js --query="cyberpunk" --limit=5
```

**APIs Suportadas:**
- RAWG.io
- Steam
- GOG
- IGDB
- Giant Bomb

### 5. `create-complete-game-images.js`

**Funcionalidade:** Cria conjunto completo de imagens para um jogo.

**Uso:**
```bash
node scripts/create-complete-game-images.js --game="Cyberpunk 2077"
```

**Funcionalidades:**
- Download de capa principal
- Download de screenshots
- Download de imagens de galeria
- Geração de thumbnails
- Otimização automática

### 6. `image-organizer.js`

**Funcionalidade:** Organiza e categoriza imagens existentes.

**Uso:**
```bash
node scripts/image-organizer.js --action=organize --path=./public/uploads
```

**Funcionalidades:**
- Organização por tipo (cover, gallery, screenshot)
- Renomeação padronizada
- Remoção de duplicatas
- Geração de metadados

### 7. `monitor-quality.js`

**Funcionalidade:** Monitora a qualidade das buscas de imagens.

**Uso:**
```bash
node scripts/monitor-quality.js --duration=3600
```

**Métricas:**
- Taxa de sucesso das buscas
- Qualidade das imagens encontradas
- Tempo de resposta das APIs
- Disponibilidade dos serviços

### 8. `smart-downloader.js`

**Funcionalidade:** Download inteligente com fallback entre APIs.

**Uso:**
```bash
node scripts/smart-downloader.js --game="The Witcher 3" --fallback
```

**Funcionalidades:**
- Tentativa em múltiplas APIs
- Fallback automático
- Cache de resultados
- Retry com backoff exponencial

### 9. `fix-heroes-gallery.js`

**Funcionalidade:** Script específico para corrigir galeria do jogo "Heroes of Might and Magic 3".

**Uso:**
```bash
node scripts/fix-heroes-gallery.js
```

**Funcionalidades:**
- Download de imagens específicas
- Associação com o jogo correto
- Verificação de integridade

---

## 🛡️ Scripts de Segurança

### 1. `test-security.js`

**Funcionalidade:** Executa bateria completa de testes de segurança.

**Uso:**
```bash
node scripts/test-security.js
```

**Testes Implementados:**
- Headers de segurança
- Rate limiting
- Autenticação por API key
- Validação de upload
- Proteção XSS
- Proteção SQL injection
- Logging de segurança

**Saída:**
```json
{
  "totalTests": 13,
  "passed": 7,
  "failed": 6,
  "successRate": "53.85%",
  "results": [
    {
      "test": "Security Headers",
      "status": "PASS",
      "details": "All security headers present"
    }
  ]
}
```

### 2. `vulnerability-scanner.js`

**Funcionalidade:** Scanner automático de vulnerabilidades.

**Uso:**
```bash
node scripts/vulnerability-scanner.js
```

**Verificações:**
- Dependências vulneráveis (`yarn audit`)
- Configurações de segurança
- Headers de segurança
- Permissões de arquivos
- Configurações do banco

**Relatórios:**
- `logs/reports/latest-vulnerability-report.json`
- `logs/reports/vulnerability-report-{timestamp}.json`

### 3. `security-monitor.js`

**Funcionalidade:** Monitoramento contínuo de segurança.

**Uso:**
```bash
node scripts/security-monitor.js
```

**Verificações:**
- Status dos middlewares
- Logs de segurança
- Tentativas de acesso suspeitas
- Uso de memória e CPU
- Conectividade com APIs externas

### 4. `setup-security.js`

**Funcionalidade:** Configuração inicial do sistema de segurança.

**Uso:**
```bash
node scripts/setup-security.js
```

**Funcionalidades:**
- Criação de diretórios de logs
- Configuração de middlewares
- Geração de chaves de API
- Configuração de alertas
- Backup de configurações

### 5. `backup-security.sh`

**Funcionalidade:** Backup de configurações de segurança.

**Uso:**
```bash
bash scripts/backup-security.sh
```

**Funcionalidades:**
- Backup de middlewares
- Backup de configurações
- Backup de logs
- Compressão de arquivos
- Upload para storage remoto

### 6. `start-security-monitor.sh`

**Funcionalidade:** Inicia o monitor de segurança como serviço.

**Uso:**
```bash
bash scripts/start-security-monitor.sh
```

**Funcionalidades:**
- Inicialização como daemon
- Logs de sistema
- Restart automático
- Monitoramento de recursos

---

## 🚀 Scripts de Deploy

### 1. `deploy.sh`

**Funcionalidade:** Script principal de deploy automatizado.

**Uso:**
```bash
bash scripts/deploy.sh master abc123
```

**Parâmetros:**
- `$1` - Branch para deploy
- `$2` - Commit hash

**Funcionalidades:**
- Backup do deploy atual
- Parada da aplicação
- Atualização do código
- Instalação de dependências
- Execução de migrações
- Build da aplicação
- Testes automatizados
- Inicialização da aplicação
- Health check
- Limpeza de backups antigos

### 2. `webhook-server.js`

**Funcionalidade:** Servidor de webhooks para deploy automático.

**Uso:**
```bash
node scripts/webhook-server.js
```

**Endpoints:**
- `POST /webhook/github` - Webhook do GitHub
- `POST /webhook/release` - Webhook de release
- `GET /health` - Health check
- `GET /webhooks/logs` - Logs de webhooks

**Configuração:**
```env
WEBHOOK_PORT=5001
WEBHOOK_SECRET=rootgames-webhook-secret-2024
```

---

## 📊 Scripts de Monitoramento

### 1. `monitoring-setup.js`

**Funcionalidade:** Configuração completa do sistema de monitoramento.

**Uso:**
```bash
node scripts/monitoring-setup.js
```

**Componentes Configurados:**
- Prometheus
- Grafana
- Alertmanager
- Node Exporter
- PostgreSQL Exporter

**Arquivos Gerados:**
- `monitoring/docker-compose.yml`
- `monitoring/prometheus.yml`
- `monitoring/grafana-dashboard.json`
- `monitoring/alertmanager.yml`
- `scripts/health-check.sh`

### 2. `health-check.sh`

**Funcionalidade:** Script de verificação de saúde da aplicação.

**Uso:**
```bash
bash scripts/health-check.sh
```

**Verificações:**
- Status da API
- Conectividade com banco
- Uso de memória
- Uso de CPU
- Espaço em disco

---

## 🔍 Scripts de SEO

### 1. `seo-setup.js`

**Funcionalidade:** Configuração inicial do sistema de SEO.

**Uso:**
```bash
node scripts/seo-setup.js
```

**Funcionalidades:**
- Configuração de metadados
- Geração de sitemap
- Configuração de robots.txt
- Otimização de imagens
- Configuração de Open Graph

### 2. `test-seo-complete.js`

**Funcionalidade:** Testes completos de SEO.

**Uso:**
```bash
node scripts/test-seo-complete.js
```

**Testes:**
- Metadados de páginas
- Estrutura de URLs
- Sitemap XML
- Robots.txt
- Open Graph tags
- Schema.org markup

---

## ⚙️ Scripts de Configuração

### 1. `configure-apis.js`

**Funcionalidade:** Configuração de APIs externas.

**Uso:**
```bash
node scripts/configure-apis.js
```

**APIs Configuradas:**
- RAWG.io
- Steam
- GOG
- IGDB
- Giant Bomb

**Funcionalidades:**
- Validação de chaves de API
- Teste de conectividade
- Configuração de rate limits
- Geração de documentação

### 2. `setup-apis.js`

**Funcionalidade:** Setup inicial das APIs.

**Uso:**
```bash
node scripts/setup-apis.js
```

**Funcionalidades:**
- Criação de contas de API
- Geração de chaves
- Configuração de webhooks
- Teste de integração

---

## 📈 Scripts de Relatórios

### 1. `associate-images-with-games.js`

**Funcionalidade:** Associa imagens baixadas com jogos existentes.

**Uso:**
```bash
node scripts/associate-images-with-games.js --dry-run
```

**Funcionalidades:**
- Mapeamento automático por nome
- Verificação de duplicatas
- Associação por similaridade
- Relatório de associações

### 2. `create-game-covers.js`

**Funcionalidade:** Cria capas padronizadas para jogos.

**Uso:**
```bash
node scripts/create-game-covers.js --template=modern
```

**Templates Disponíveis:**
- `modern` - Design moderno
- `classic` - Design clássico
- `minimal` - Design minimalista
- `gaming` - Design gamer

---

## 🔧 Scripts de Utilitários

### 1. Scripts de Backup

```bash
# Backup de banco de dados
pg_dump rootgames > backup-$(date +%Y%m%d).sql

# Backup de uploads
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz public/uploads/

# Backup de configurações
tar -czf config-backup-$(date +%Y%m%d).tar.gz config/
```

### 2. Scripts de Limpeza

```bash
# Limpeza de logs antigos
find logs/ -name "*.log" -mtime +30 -delete

# Limpeza de backups antigos
find backups/ -name "*.sql" -mtime +7 -delete

# Limpeza de cache
rm -rf .tmp/cache/*
```

### 3. Scripts de Manutenção

```bash
# Otimização do banco
psql rootgames -c "VACUUM ANALYZE;"

# Verificação de integridade
psql rootgames -c "CHECKPOINT;"

# Estatísticas de uso
psql rootgames -c "SELECT * FROM pg_stat_activity;"
```

---

## 📊 Monitoramento de Scripts

### Logs de Execução

**Localização:** `logs/scripts/`

**Tipos de Logs:**
- `image-management.log` - Scripts de imagens
- `security-monitoring.log` - Scripts de segurança
- `deploy.log` - Scripts de deploy
- `monitoring.log` - Scripts de monitoramento

### Métricas de Performance

```json
{
  "script": "manage-images.js",
  "executionTime": "2m 30s",
  "imagesProcessed": 150,
  "successRate": "95%",
  "errors": 8,
  "memoryUsage": "256MB",
  "cpuUsage": "15%"
}
```

### Alertas de Scripts

- Falha na execução
- Tempo de execução excessivo
- Uso de memória alto
- Taxa de erro elevada
- Dependências não encontradas

---

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Script não executa
```bash
# Verificar permissões
chmod +x scripts/script-name.js

# Verificar dependências
npm install

# Verificar Node.js
node --version
```

#### 2. Erro de memória
```bash
# Aumentar limite de memória
export NODE_OPTIONS="--max-old-space-size=4096"
node scripts/script-name.js
```

#### 3. Erro de conectividade
```bash
# Verificar conectividade
curl -I https://api.rawg.io/api/games

# Verificar proxy
export HTTP_PROXY=http://proxy:port
export HTTPS_PROXY=http://proxy:port
```

#### 4. Erro de permissão
```bash
# Corrigir permissões
sudo chown -R $USER:$USER scripts/
chmod -R 755 scripts/
```

---

**Última atualização**: Setembro 2025  
**Total de Scripts**: 25  
**Cobertura de Funcionalidades**: 100%  
**Status**: Ativo e Monitorado
