#!/bin/bash

# 🚀 Script de Deploy Automático
# Executa deploy baseado na branch e commit

set -e

BRANCH=$1
COMMIT=$2
DEPLOY_DIR="/opt/rootgames-api"
BACKUP_DIR="/opt/backups/rootgames-api"
LOG_FILE="/var/log/rootgames-deploy.log"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1" | tee -a "$LOG_FILE"
}

# Verificar parâmetros
if [ -z "$BRANCH" ] || [ -z "$COMMIT" ]; then
    log_error "Uso: $0 <branch> <commit>"
    exit 1
fi

log "🚀 Iniciando deploy da branch $BRANCH (commit: $COMMIT)"

# Criar diretórios se não existirem
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# 1. Backup do deploy atual
log "📦 Criando backup do deploy atual..."
if [ -d "$DEPLOY_DIR" ]; then
    BACKUP_NAME="backup-$(date +'%Y%m%d-%H%M%S')"
    cp -r "$DEPLOY_DIR" "$BACKUP_DIR/$BACKUP_NAME"
    log_success "Backup criado: $BACKUP_NAME"
else
    log_warning "Diretório de deploy não existe, pulando backup"
fi

# 2. Parar aplicação atual
log "⏹️ Parando aplicação atual..."
if systemctl is-active --quiet rootgames-api; then
    systemctl stop rootgames-api
    log_success "Aplicação parada"
else
    log_warning "Aplicação não estava rodando"
fi

# 3. Atualizar código
log "📥 Atualizando código..."
cd "$DEPLOY_DIR" || exit 1

# Fazer pull das mudanças
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"
git checkout "$COMMIT"

log_success "Código atualizado para commit $COMMIT"

# 4. Instalar dependências
log "📦 Instalando dependências..."
yarn install --production --frozen-lockfile
log_success "Dependências instaladas"

# 5. Executar migrações do banco
log "🗄️ Executando migrações do banco..."
yarn strapi migrate
log_success "Migrações executadas"

# 6. Build da aplicação
log "🏗️ Fazendo build da aplicação..."
yarn build
log_success "Build concluído"

# 7. Executar testes
log "🧪 Executando testes..."
if yarn test:ci; then
    log_success "Testes passaram"
else
    log_error "Testes falharam, revertendo deploy"
    # Reverter para backup
    if [ -d "$BACKUP_DIR/$BACKUP_NAME" ]; then
        rm -rf "$DEPLOY_DIR"
        mv "$BACKUP_DIR/$BACKUP_NAME" "$DEPLOY_DIR"
        systemctl start rootgames-api
    fi
    exit 1
fi

# 8. Iniciar aplicação
log "🚀 Iniciando aplicação..."
systemctl start rootgames-api

# Aguardar aplicação ficar pronta
sleep 10

# Verificar se aplicação está rodando
if systemctl is-active --quiet rootgames-api; then
    log_success "Aplicação iniciada com sucesso"
else
    log_error "Falha ao iniciar aplicação"
    exit 1
fi

# 9. Health check
log "🔍 Executando health check..."
if curl -f http://localhost:1337/api/health > /dev/null 2>&1; then
    log_success "Health check passou"
else
    log_error "Health check falhou"
    exit 1
fi

# 10. Limpeza de backups antigos (manter apenas últimos 5)
log "🧹 Limpando backups antigos..."
cd "$BACKUP_DIR"
ls -t | tail -n +6 | xargs -r rm -rf
log_success "Backups antigos removidos"

# 11. Notificar sucesso
log_success "🎉 Deploy concluído com sucesso!"
log "📊 Branch: $BRANCH"
log "📝 Commit: $COMMIT"
log "⏰ Timestamp: $(date)"

# Enviar notificação (opcional)
if command -v curl > /dev/null; then
    curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
        -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 RootGames API deployado com sucesso!\nBranch: $BRANCH\nCommit: $COMMIT\"}" \
        > /dev/null 2>&1 || true
fi

exit 0
