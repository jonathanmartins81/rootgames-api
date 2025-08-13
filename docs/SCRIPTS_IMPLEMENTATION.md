# 🛠️ Scripts e Implementações - Estratégia de Atualizações

## 📋 Visão Geral

Este documento contém scripts práticos, configurações e implementações concretas para executar a estratégia de atualizações seguras definida no `UPDATE_STRATEGY.md`.

---

## 🔧 Scripts de Proteção

### **1. Script de Backup Automático**

```bash
#!/bin/bash
# scripts/backup.sh

set -e

# Configurações
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-rootgames}"
DB_USER="${DB_USER:-rootgames}"
DB_PASS="${DB_PASS:-rootgames}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Nome do arquivo de backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/rootgames_backup_$TIMESTAMP.sql"

echo "💾 Iniciando backup do banco de dados..."

# Fazer backup
PGPASSWORD="$DB_PASS" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --verbose \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Backup criado: $BACKUP_FILE"

  # Comprimir backup
  gzip "$BACKUP_FILE"
  echo "📦 Backup comprimido: $BACKUP_FILE.gz"

  # Remover backups antigos
  find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
  echo "🗑️ Backups antigos removidos"

  # Criar link simbólico para o backup mais recente
  ln -sf "$BACKUP_FILE.gz" "$BACKUP_DIR/backup_latest.sql.gz"

  echo "✅ Backup concluído com sucesso!"
else
  echo "❌ Erro ao criar backup"
  exit 1
fi
```

### **2. Script de Rollback**

```bash
#!/bin/bash
# scripts/rollback.sh

set -e

# Configurações
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-rootgames}"
DB_USER="${DB_USER:-rootgames}"
DB_PASS="${DB_PASS:-rootgames}"
BACKUP_FILE="${1:-./backups/backup_latest.sql.gz}"

echo "🔄 Iniciando rollback..."

# Verificar se o arquivo de backup existe
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Arquivo de backup não encontrado: $BACKUP_FILE"
  exit 1
fi

# Parar aplicação
echo "⏹️ Parando aplicação..."
pm2 stop rootgames-api || true

# Restaurar backup
echo "📥 Restaurando backup..."
PGPASSWORD="$DB_PASS" pg_restore \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --verbose \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  <(gunzip -c "$BACKUP_FILE")

# Reverter código se necessário
if [ "$2" = "--revert-code" ]; then
  echo "📝 Revertendo código..."
  git checkout HEAD~1
  yarn install
fi

# Reiniciar aplicação
echo "▶️ Reiniciando aplicação..."
pm2 start rootgames-api

# Verificar saúde
echo "🔍 Verificando saúde da aplicação..."
sleep 10
./scripts/health-check.sh

echo "✅ Rollback concluído!"
```

### **3. Script de Health Check**

```bash
#!/bin/bash
# scripts/health-check.sh

set -e

# Configurações
API_URL="${API_URL:-http://localhost:1337}"
TIMEOUT="${TIMEOUT:-30}"
RETRIES="${RETRIES:-3}"

echo "🔍 Verificando saúde da aplicação..."

# Função para verificar endpoint
check_endpoint() {
  local endpoint="$1"
  local description="$2"

  for i in $(seq 1 $RETRIES); do
    echo "  Verificando $description... (tentativa $i/$RETRIES)"

    if curl -s -f --max-time $TIMEOUT "$API_URL$endpoint" > /dev/null; then
      echo "  ✅ $description: OK"
      return 0
    else
      echo "  ❌ $description: FALHOU"
      if [ $i -eq $RETRIES ]; then
        return 1
      fi
      sleep 2
    fi
  done
}

# Verificar endpoints críticos
check_endpoint "/_health" "Health Check"
check_endpoint "/api/games?limit=1" "API Games"
check_endpoint "/admin" "Admin Panel"

# Verificar banco de dados
echo "  Verificando banco de dados..."
if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "  ✅ Banco de dados: OK"
else
  echo "  ❌ Banco de dados: FALHOU"
  exit 1
fi

# Verificar uso de memória
MEMORY_USAGE=$(ps aux | grep strapi | grep -v grep | awk '{print $4}' | head -1)
echo "  💾 Uso de memória: ${MEMORY_USAGE}%"

if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
  echo "  ⚠️ Uso de memória alto: $MEMORY_USAGE%"
fi

echo "✅ Health check concluído com sucesso!"
```

### **4. Script de Deploy Seguro**

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

# Configurações
ENVIRONMENT="${1:-staging}"
ROLLBACK_ON_FAILURE="${2:-true}"

echo "🚀 Iniciando deploy para $ENVIRONMENT..."

# Backup antes do deploy
echo "💾 Criando backup..."
./scripts/backup.sh

# Executar testes
echo "🧪 Executando testes..."
yarn test

# Deploy baseado no ambiente
case $ENVIRONMENT in
  "staging")
    echo "📦 Deploy para staging..."
    # Comandos específicos para staging
    ;;
  "production")
    echo "📦 Deploy para produção..."
    # Comandos específicos para produção
    ;;
  *)
    echo "❌ Ambiente inválido: $ENVIRONMENT"
    exit 1
    ;;
esac

# Health check pós-deploy
echo "🔍 Verificando saúde pós-deploy..."
if ./scripts/health-check.sh; then
  echo "✅ Deploy concluído com sucesso!"
else
  echo "❌ Deploy falhou!"

  if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
    echo "🔄 Iniciando rollback automático..."
    ./scripts/rollback.sh
  fi

  exit 1
fi
```

---

## ⚙️ Configurações de Feature Flags

### **1. Arquivo de Configuração de Features**

```javascript
// config/features.js
module.exports = ({ env }) => ({
  // Q1 2025 - Fundação e Estabilização
  redisCache: env.bool('FEATURE_REDIS_CACHE', false),
  rateLimiting: env.bool('FEATURE_RATE_LIMITING', false),
  advancedLogging: env.bool('FEATURE_ADVANCED_LOGGING', false),
  healthChecks: env.bool('FEATURE_HEALTH_CHECKS', true),

  // Q2 2025 - Expansão de Funcionalidades
  advancedAuth: env.bool('FEATURE_ADVANCED_AUTH', false),
  reviews: env.bool('FEATURE_REVIEWS', false),
  wishlist: env.bool('FEATURE_WISHLIST', false),
  notifications: env.bool('FEATURE_NOTIFICATIONS', false),
  social: env.bool('FEATURE_SOCIAL', false),

  // Q3 2025 - Integração e Automação
  multiStore: env.bool('FEATURE_MULTI_STORE', false),
  autoSync: env.bool('FEATURE_AUTO_SYNC', false),
  priceTracking: env.bool('FEATURE_PRICE_TRACKING', false),

  // Q4 2025 - Escalabilidade e Inovação
  microservices: env.bool('FEATURE_MICROSERVICES', false),
  aiRecommendations: env.bool('FEATURE_AI_RECOMMENDATIONS', false),
  realtime: env.bool('FEATURE_REALTIME', false),
});
```

### **2. Middleware de Feature Flags**

```javascript
// src/middlewares/feature-flags.js
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const features = require('../../config/features');

    // Adicionar features ao contexto
    ctx.features = features;

    // Verificar se feature está habilitada para rota específica
    const checkFeature = (featureName) => {
      if (!features[featureName]) {
        ctx.throw(404, `Feature ${featureName} não está habilitada`);
      }
    };

    // Verificar features baseado na rota
    if (ctx.path.startsWith('/api/reviews') && !features.reviews) {
      checkFeature('reviews');
    }

    if (ctx.path.startsWith('/api/wishlist') && !features.wishlist) {
      checkFeature('wishlist');
    }

    await next();
  };
};
```

---

## 📊 Configurações de Monitoramento

### **1. Configuração de Logs Avançados**

```javascript
// config/logger.js
const winston = require('winston');

module.exports = ({ env }) => ({
  settings: {
    logger: {
      level: env('LOG_LEVEL', 'info'),
      requests: env.bool('LOG_REQUESTS', true),
    },
  },

  // Configuração customizada do Winston
  customLogger: winston.createLogger({
    level: env('LOG_LEVEL', 'info'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({
        filename: '.tmp/logs/error.log',
        level: 'error',
      }),
      new winston.transports.File({
        filename: '.tmp/logs/combined.log',
      }),
    ],
  }),
});
```

### **2. Configuração de Métricas**

```javascript
// config/metrics.js
module.exports = {
  // Métricas de performance
  performance: {
    responseTime: {
      threshold: 1000, // ms
      alert: true,
    },
    memoryUsage: {
      threshold: 80, // %
      alert: true,
    },
    cpuUsage: {
      threshold: 70, // %
      alert: true,
    },
  },

  // Métricas de negócio
  business: {
    activeUsers: {
      threshold: 100,
      alert: false,
    },
    apiCalls: {
      threshold: 1000, // por hora
      alert: true,
    },
    errorRate: {
      threshold: 5, // %
      alert: true,
    },
  },

  // Métricas de features
  features: {
    reviews: {
      enabled: true,
      adoption: 0,
    },
    wishlist: {
      enabled: true,
      adoption: 0,
    },
    notifications: {
      enabled: true,
      adoption: 0,
    },
  },
};
```

### **3. Configuração de Alertas**

```javascript
// config/alerts.js
module.exports = ({ env }) => ({
  // Configurações de alerta
  errorThreshold: env.int('ERROR_THRESHOLD', 5), // 5% de erro
  responseTimeThreshold: env.int('RESPONSE_TIME_THRESHOLD', 1000), // 1 segundo
  memoryThreshold: env.int('MEMORY_THRESHOLD', 80), // 80% de memória

  // Canais de notificação
  channels: {
    slack: {
      enabled: env.bool('SLACK_ALERTS_ENABLED', false),
      webhook: env('SLACK_WEBHOOK_URL'),
    },
    email: {
      enabled: env.bool('EMAIL_ALERTS_ENABLED', false),
      recipients: env.array('ALERT_EMAIL_RECIPIENTS', []),
    },
    discord: {
      enabled: env.bool('DISCORD_ALERTS_ENABLED', false),
      webhook: env('DISCORD_WEBHOOK_URL'),
    },
  },

  // Configurações de notificação
  notification: {
    cooldown: env.int('ALERT_COOLDOWN', 300000), // 5 minutos
    maxAlertsPerHour: env.int('MAX_ALERTS_PER_HOUR', 10),
  },
});
```

---

## 🔄 Implementações de Rollback

### **1. Middleware de Proteção**

```javascript
// src/middlewares/safety.js
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);

    // Log da requisição
    strapi.log.info(`Request started`, {
      id: requestId,
      method: ctx.method,
      path: ctx.path,
      ip: ctx.ip,
      userAgent: ctx.headers['user-agent'],
    });

    try {
      await next();

      // Verificar performance
      const responseTime = Date.now() - startTime;
      if (responseTime > 1000) {
        strapi.log.warn(`Slow response detected`, {
          id: requestId,
          responseTime,
          path: ctx.path,
        });
      }

      // Log de sucesso
      strapi.log.info(`Request completed`, {
        id: requestId,
        status: ctx.status,
        responseTime,
      });
    } catch (error) {
      // Log detalhado do erro
      strapi.log.error(`Request failed`, {
        id: requestId,
        error: error.message,
        stack: error.stack,
        path: ctx.path,
        method: ctx.method,
      });

      // Verificar se é erro crítico
      if (isCriticalError(error)) {
        await triggerRollback();
      }

      throw error;
    }
  };
};

// Função para verificar erro crítico
function isCriticalError(error) {
  const criticalErrors = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'];

  return criticalErrors.some((criticalError) => error.message.includes(criticalError));
}

// Função para trigger de rollback
async function triggerRollback() {
  strapi.log.error('Critical error detected, triggering rollback...');

  // Executar script de rollback
  const { exec } = require('child_process');
  exec('./scripts/rollback.sh', (error, stdout, stderr) => {
    if (error) {
      strapi.log.error('Rollback failed:', error);
    } else {
      strapi.log.info('Rollback executed successfully');
    }
  });
}
```

### **2. Service de Monitoramento**

```javascript
// src/services/monitoring.js
module.exports = ({ strapi }) => ({
  // Verificar saúde do sistema
  async checkHealth() {
    const checks = {
      database: await this.checkDatabase(),
      api: await this.checkAPI(),
      memory: await this.checkMemory(),
      features: await this.checkFeatures(),
    };

    const allHealthy = Object.values(checks).every((check) => check.status === 'healthy');

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString(),
    };
  },

  // Verificar banco de dados
  async checkDatabase() {
    try {
      await strapi.db.connection.raw('SELECT 1');
      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  },

  // Verificar API
  async checkAPI() {
    try {
      const response = await fetch('http://localhost:1337/api/games?limit=1');
      return response.ok ? { status: 'healthy' } : { status: 'unhealthy', error: `HTTP ${response.status}` };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  },

  // Verificar uso de memória
  async checkMemory() {
    const usage = process.memoryUsage();
    const memoryUsage = (usage.heapUsed / usage.heapTotal) * 100;

    return {
      status: memoryUsage < 80 ? 'healthy' : 'warning',
      usage: memoryUsage,
      threshold: 80,
    };
  },

  // Verificar features
  async checkFeatures() {
    const features = require('../../config/features');
    const enabledFeatures = Object.keys(features).filter((key) => features[key]);

    return {
      status: 'healthy',
      enabled: enabledFeatures,
      total: Object.keys(features).length,
    };
  },

  // Enviar alerta
  async sendAlert(alert) {
    const alertConfig = require('../../config/alerts');

    if (alertConfig.channels.slack.enabled) {
      await this.sendSlackAlert(alert);
    }

    if (alertConfig.channels.email.enabled) {
      await this.sendEmailAlert(alert);
    }

    if (alertConfig.channels.discord.enabled) {
      await this.sendDiscordAlert(alert);
    }
  },

  // Enviar alerta para Slack
  async sendSlackAlert(alert) {
    const alertConfig = require('../../config/alerts');

    const message = {
      text: `🚨 Alerta RootGames API`,
      attachments: [
        {
          color: 'danger',
          fields: [
            { title: 'Tipo', value: alert.type, short: true },
            { title: 'Severidade', value: alert.severity, short: true },
            { title: 'Mensagem', value: alert.message },
            { title: 'Timestamp', value: new Date().toISOString() },
          ],
        },
      ],
    };

    try {
      await fetch(alertConfig.channels.slack.webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
    } catch (error) {
      strapi.log.error('Failed to send Slack alert:', error);
    }
  },
});
```

---

## 📝 Scripts de Migração

### **1. Script de Migração de Versão**

```bash
#!/bin/bash
# scripts/migrate.sh

set -e

VERSION="${1}"
CURRENT_VERSION="${2:-1.0.0}"

echo "🔄 Iniciando migração de $CURRENT_VERSION para $VERSION..."

# Backup antes da migração
echo "💾 Criando backup..."
./scripts/backup.sh

# Executar migrações específicas da versão
case $VERSION in
  "1.1.0")
    echo "📦 Migrando para v1.1.0..."

    # Adicionar Redis cache
    if [ "$FEATURE_REDIS_CACHE" = "true" ]; then
      echo "  Configurando Redis cache..."
      # Comandos específicos
    fi

    # Adicionar rate limiting
    if [ "$FEATURE_RATE_LIMITING" = "true" ]; then
      echo "  Configurando rate limiting..."
      # Comandos específicos
    fi

    ;;

  "1.2.0")
    echo "📦 Migrando para v1.2.0..."

    # Adicionar sistema de reviews
    if [ "$FEATURE_REVIEWS" = "true" ]; then
      echo "  Configurando sistema de reviews..."
      # Comandos específicos
    fi

    ;;

  *)
    echo "❌ Versão não suportada: $VERSION"
    exit 1
    ;;
esac

# Atualizar versão no package.json
echo "📝 Atualizando versão..."
npm version $VERSION --no-git-tag-version

# Health check pós-migração
echo "🔍 Verificando saúde pós-migração..."
./scripts/health-check.sh

echo "✅ Migração concluída com sucesso!"
```

### **2. Script de Rollback de Versão**

```bash
#!/bin/bash
# scripts/rollback-version.sh

set -e

TARGET_VERSION="${1}"
CURRENT_VERSION="${2}"

echo "🔄 Iniciando rollback para versão $TARGET_VERSION..."

# Verificar se versão existe
if ! git tag | grep -q "v$TARGET_VERSION"; then
  echo "❌ Versão $TARGET_VERSION não encontrada"
  exit 1
fi

# Backup antes do rollback
echo "💾 Criando backup..."
./scripts/backup.sh

# Fazer checkout da versão
echo "📝 Fazendo checkout da versão $TARGET_VERSION..."
git checkout "v$TARGET_VERSION"

# Reinstalar dependências
echo "📦 Reinstalando dependências..."
yarn install

# Restaurar backup se necessário
if [ "$3" = "--restore-data" ]; then
  echo "📥 Restaurando dados..."
  ./scripts/rollback.sh
fi

# Health check
echo "🔍 Verificando saúde..."
./scripts/health-check.sh

echo "✅ Rollback para versão $TARGET_VERSION concluído!"
```

---

## 🚀 Scripts de Deploy

### **1. Script de Deploy para Staging**

```bash
#!/bin/bash
# scripts/deploy-staging.sh

set -e

echo "🚀 Deploy para Staging..."

# Variáveis de ambiente para staging
export NODE_ENV=staging
export DATABASE_URL=postgresql://rootgames:rootgames@localhost:5432/rootgames_staging

# Backup
./scripts/backup.sh

# Testes
echo "🧪 Executando testes..."
yarn test

# Build
echo "📦 Fazendo build..."
yarn build

# Deploy
echo "🚀 Fazendo deploy..."
pm2 restart rootgames-api-staging

# Health check
echo "🔍 Verificando saúde..."
sleep 10
./scripts/health-check.sh

echo "✅ Deploy para staging concluído!"
```

### **2. Script de Deploy para Produção**

```bash
#!/bin/bash
# scripts/deploy-production.sh

set -e

echo "🚀 Deploy para Produção..."

# Confirmação
read -p "Tem certeza que deseja fazer deploy para produção? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Deploy cancelado"
  exit 1
fi

# Variáveis de ambiente para produção
export NODE_ENV=production
export DATABASE_URL=postgresql://rootgames:rootgames@localhost:5432/rootgames_prod

# Backup
echo "💾 Criando backup..."
./scripts/backup.sh

# Testes em staging
echo "🧪 Executando testes em staging..."
./scripts/deploy-staging.sh

# Deploy para produção
echo "🚀 Fazendo deploy para produção..."
pm2 restart rootgames-api-production

# Health check
echo "🔍 Verificando saúde..."
sleep 15
./scripts/health-check.sh

# Notificação de sucesso
echo "✅ Deploy para produção concluído!"
./scripts/notify.sh "Deploy para produção concluído com sucesso!"
```

---

## 📊 Scripts de Monitoramento

### **1. Script de Monitoramento Contínuo**

```bash
#!/bin/bash
# scripts/monitor.sh

# Configurações
CHECK_INTERVAL="${CHECK_INTERVAL:-60}" # segundos
LOG_FILE="${LOG_FILE:-./logs/monitor.log}"

echo "🔍 Iniciando monitoramento contínuo..."

# Criar diretório de logs
mkdir -p ./logs

while true; do
  echo "$(date): Verificando saúde..." >> "$LOG_FILE"

  if ./scripts/health-check.sh >> "$LOG_FILE" 2>&1; then
    echo "$(date): ✅ Sistema saudável" >> "$LOG_FILE"
  else
    echo "$(date): ❌ Problema detectado!" >> "$LOG_FILE"

    # Enviar alerta
    ./scripts/notify.sh "Problema detectado no sistema RootGames API"

    # Tentar auto-recovery
    echo "$(date): 🔄 Tentando auto-recovery..." >> "$LOG_FILE"
    pm2 restart rootgames-api
  fi

  sleep $CHECK_INTERVAL
done
```

### **2. Script de Notificação**

```bash
#!/bin/bash
# scripts/notify.sh

MESSAGE="${1}"
CHANNEL="${2:-all}"

echo "📢 Enviando notificação: $MESSAGE"

# Slack
if [ "$SLACK_WEBHOOK_URL" != "" ] && [ "$CHANNEL" = "all" ] || [ "$CHANNEL" = "slack" ]; then
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"$MESSAGE\"}" \
    "$SLACK_WEBHOOK_URL"
fi

# Email
if [ "$ALERT_EMAIL" != "" ] && [ "$CHANNEL" = "all" ] || [ "$CHANNEL" = "email" ]; then
  echo "$MESSAGE" | mail -s "RootGames API Alert" "$ALERT_EMAIL"
fi

# Discord
if [ "$DISCORD_WEBHOOK_URL" != "" ] && [ "$CHANNEL" = "all" ] || [ "$CHANNEL" = "discord" ]; then
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"content\":\"$MESSAGE\"}" \
    "$DISCORD_WEBHOOK_URL"
fi

echo "✅ Notificação enviada!"
```

---

## 📝 Documentação de Mudanças

### **1. Template de Changelog**

```markdown
# CHANGELOG.md

## [1.1.0] - 2025-01-15

### Added

- Redis cache implementation
- Rate limiting middleware
- Health check endpoints
- Advanced logging with Winston
- Feature flags system

### Changed

- Improved query performance
- Enhanced error handling
- Updated documentation

### Deprecated

- Old auth middleware (will be removed in 1.2.0)
- Basic logging (will be replaced by Winston in 1.2.0)

### Removed

- None

### Fixed

- Memory leak in game service
- Database connection issues
- Response time degradation

### Security

- Added input validation
- Implemented rate limiting
- Enhanced error messages (no sensitive data)

## [1.0.0] - 2024-12-01

### Added

- Initial release
- Basic CRUD operations
- Admin panel
- GraphQL support
```

### **2. Template de Migration Guide**

````markdown
# docs/migrations/v1.0-to-v1.1.md

# Migração de v1.0 para v1.1

## Visão Geral

Esta migração adiciona funcionalidades de cache, rate limiting e monitoramento sem quebrar compatibilidade.

## Pré-requisitos

- Backup completo do banco de dados
- Node.js 18+ instalado
- Redis (opcional, para cache)

## Passos da Migração

### 1. Backup

```bash
./scripts/backup.sh
```
````

### 2. Atualizar Dependências

```bash
yarn install
```

### 3. Configurar Variáveis de Ambiente

```env
# Novas variáveis
FEATURE_REDIS_CACHE=false
FEATURE_RATE_LIMITING=false
FEATURE_ADVANCED_LOGGING=false
LOG_LEVEL=info
```

### 4. Executar Migração

```bash
./scripts/migrate.sh 1.1.0 1.0.0
```

### 5. Verificar Saúde

```bash
./scripts/health-check.sh
```

## Breaking Changes

- Nenhuma mudança que quebra compatibilidade

## Rollback

Se necessário, execute:

```bash
./scripts/rollback-version.sh 1.0.0 1.1.0
```

## Troubleshooting

- **Erro de Redis**: Desabilite com `FEATURE_REDIS_CACHE=false`
- **Rate limiting muito restritivo**: Ajuste com `RATE_LIMIT_MAX=1000`
- **Logs muito verbosos**: Ajuste com `LOG_LEVEL=warn`

```

---

*Última atualização: Agosto 2025*
*Versão dos Scripts: 1.0.0*
```
