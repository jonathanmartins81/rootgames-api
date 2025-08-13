#!/bin/bash
# scripts/prepare-strapi5-migration.sh - Preparar migração para Strapi 5.x

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCESSO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

# Configurações
STAGING_DB="rootgames_staging"
BACKUP_FILE="./backups/backup_latest.sql"

echo "🚀 Preparando migração para Strapi 5.x..."
echo "=========================================="

# 1. Verificar pré-requisitos
log "Verificando pré-requisitos..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js não encontrado!"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$NODE_MAJOR" -lt 18 ]; then
    error "Node.js 18+ é necessário para Strapi 5.x. Versão atual: $NODE_VERSION"
    exit 1
else
    success "Node.js: $NODE_VERSION ✅"
fi

# Verificar Yarn
if ! command -v yarn &> /dev/null; then
    error "Yarn não encontrado!"
    exit 1
fi

YARN_VERSION=$(yarn --version)
success "Yarn: $YARN_VERSION ✅"

# Verificar PostgreSQL
if ! command -v psql &> /dev/null; then
    error "PostgreSQL client não encontrado!"
    exit 1
fi

success "PostgreSQL client encontrado ✅"

# 2. Backup completo
log "Criando backup completo..."
if [ -f "./scripts/backup.sh" ]; then
    ./scripts/backup.sh
    success "Backup criado com sucesso"
else
    error "Script de backup não encontrado!"
    exit 1
fi

# 3. Criar branch de staging
log "Criando branch de staging..."
if git status --porcelain | grep -q .; then
    warning "Há mudanças não commitadas. Fazendo commit..."
    git add .
    git commit -m "Backup antes da migração Strapi 5.x"
fi

if git branch | grep -q "staging-strapi-5-migration"; then
    warning "Branch de staging já existe. Fazendo checkout..."
    git checkout staging-strapi-5-migration
    git pull origin staging-strapi-5-migration || true
else
    log "Criando nova branch de staging..."
    git checkout -b staging-strapi-5-migration
    success "Branch de staging criada"
fi

# 4. Configurar ambiente de staging
log "Configurando ambiente de staging..."

# Criar .env.staging
if [ ! -f ".env.staging" ]; then
    cp .env .env.staging
    echo "NODE_ENV=staging" >> .env.staging
    echo "DATABASE_NAME=$STAGING_DB" >> .env.staging
    success "Arquivo .env.staging criado"
else
    warning "Arquivo .env.staging já existe"
fi

# 5. Criar banco de dados de staging
log "Criando banco de dados de staging..."

# Verificar se banco já existe
if PGPASSWORD=rootgames psql -h 127.0.0.1 -U rootgames -d postgres -c "SELECT 1 FROM pg_database WHERE datname='$STAGING_DB';" | grep -q 1; then
    warning "Banco de dados $STAGING_DB já existe"
else
    log "Criando banco de dados $STAGING_DB..."
    if sudo -u postgres psql -c "CREATE DATABASE $STAGING_DB OWNER rootgames;" 2>/dev/null; then
        success "Banco de dados $STAGING_DB criado"
    else
        error "Falha ao criar banco de dados $STAGING_DB"
        exit 1
    fi
fi

# 6. Restaurar dados de produção
log "Restaurando dados de produção para staging..."

if [ -f "$BACKUP_FILE" ]; then
    if PGPASSWORD=rootgames psql -h 127.0.0.1 -U rootgames -d "$STAGING_DB" -f "$BACKUP_FILE" > /dev/null 2>&1; then
        success "Dados restaurados com sucesso"
    else
        error "Falha ao restaurar dados"
        exit 1
    fi
else
    error "Arquivo de backup não encontrado: $BACKUP_FILE"
    exit 1
fi

# 7. Análise de impacto
log "Realizando análise de impacto..."

# Verificar arquivos customizados
log "Arquivos customizados encontrados:"
find src/ -name "*.js" -o -name "*.ts" 2>/dev/null | grep -v node_modules | head -10

# Verificar patches
log "Patches aplicados:"
ls -la patches/ 2>/dev/null || echo "Nenhum patch encontrado"

# Verificar configurações customizadas
log "Configurações customizadas:"
grep -r "custom" config/ 2>/dev/null || echo "Nenhuma configuração custom encontrada"

# 8. Verificar dependências
log "Verificando dependências..."
yarn list --depth=0 --pattern="@strapi/*" 2>/dev/null || warning "Erro ao verificar dependências Strapi"

# 9. Criar diretórios necessários
log "Criando diretórios necessários..."
mkdir -p logs
mkdir -p backups
mkdir -p staging

# 10. Resumo final
echo ""
echo "=========================================="
success "✅ Preparação para migração Strapi 5.x concluída!"
echo ""
echo "📋 Resumo da preparação:"
echo "  - ✅ Pré-requisitos verificados"
echo "  - ✅ Backup criado"
echo "  - ✅ Branch de staging criada"
echo "  - ✅ Ambiente de staging configurado"
echo "  - ✅ Banco de dados de staging criado"
echo "  - ✅ Dados restaurados"
echo "  - ✅ Análise de impacto realizada"
echo ""
echo "🚀 Próximos passos:"
echo "  1. Revisar análise de impacto"
echo "  2. Executar migração em staging"
echo "  3. Testar funcionalidades"
echo "  4. Validar resultados"
echo ""
echo "📁 Arquivos criados:"
echo "  - .env.staging"
echo "  - Branch: staging-strapi-5-migration"
echo "  - Banco: $STAGING_DB"
echo ""
echo "🔧 Comandos úteis:"
echo "  - Migração: ./scripts/migrate-strapi5.sh"
echo "  - Validação: ./scripts/validate-strapi5.sh"
echo "  - Rollback: ./scripts/rollback.sh"
echo ""
echo "📚 Documentação: docs/STRAPI_5_MIGRATION_PREP.md"
echo "=========================================="
