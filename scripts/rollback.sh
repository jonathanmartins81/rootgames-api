#!/bin/bash
# scripts/rollback.sh - Rollback automático em caso de problemas

set -e

# Configurações
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-rootgames}"
DB_USER="${DB_USER:-rootgames}"
DB_PASS="${DB_PASS:-rootgames}"
BACKUP_FILE="${1:-./backups/backup_latest.sql}"
ROLLBACK_CODE="${2:-false}"
LOG_FILE="${LOG_FILE:-./logs/rollback.log}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ERRO] $1" >> "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCESSO]${NC} $1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [SUCESSO] $1" >> "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [AVISO] $1" >> "$LOG_FILE"
}

alert() {
    echo -e "${PURPLE}[ALERTA]${NC} $1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ALERTA] $1" >> "$LOG_FILE"
}

# Criar diretório de logs se não existir
mkdir -p "$(dirname "$LOG_FILE")"

# Verificar se o arquivo de backup existe
check_backup_file() {
    log "Verificando arquivo de backup..."

    if [ ! -f "$BACKUP_FILE" ]; then
        error "Arquivo de backup não encontrado: $BACKUP_FILE"

        # Tentar encontrar backup mais recente
        local latest_backup=$(find ./backups -name "*.sql" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -f2- -d" ")

        if [ -n "$latest_backup" ] && [ -f "$latest_backup" ]; then
            warning "Usando backup mais recente encontrado: $latest_backup"
            BACKUP_FILE="$latest_backup"
        else
            error "Nenhum backup encontrado! Rollback não pode ser executado."
            exit 1
        fi
    fi

    success "Arquivo de backup encontrado: $BACKUP_FILE"

    # Verificar tamanho do backup
    local backup_size=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Tamanho do backup: $backup_size"
}

# Parar aplicação
stop_application() {
    log "Parando aplicação..."

    # Tentar parar com pm2
    if command -v pm2 &> /dev/null; then
        if pm2 list | grep -q "rootgames-api"; then
            pm2 stop rootgames-api || true
            success "Aplicação parada via PM2"
        else
            warning "Aplicação não encontrada no PM2"
        fi
    fi

    # Tentar parar processo manualmente
    local strapi_pid=$(pgrep -f "strapi" | head -1)
    if [ -n "$strapi_pid" ]; then
        log "Parando processo Strapi (PID: $strapi_pid)..."
        kill -TERM "$strapi_pid" || true
        sleep 5

        # Verificar se processo ainda está rodando
        if kill -0 "$strapi_pid" 2>/dev/null; then
            warning "Processo não parou, forçando encerramento..."
            kill -KILL "$strapi_pid" || true
        fi

        success "Processo Strapi encerrado"
    else
        warning "Nenhum processo Strapi encontrado"
    fi
}

# Restaurar backup do banco de dados
restore_database() {
    log "Restaurando backup do banco de dados..."

    # Verificar se PostgreSQL está rodando
    if ! PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        error "Não foi possível conectar ao PostgreSQL"
        error "Verifique se o serviço está rodando"
        return 1
    fi

    # Fazer backup do estado atual antes da restauração
    local current_backup="./backups/pre_rollback_$(date +%Y%m%d_%H%M%S).sql"
    log "Criando backup do estado atual: $current_backup"

    PGPASSWORD="$DB_PASS" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=custom \
        --compress=9 \
        > "$current_backup" || warning "Falha ao criar backup do estado atual"

    # Restaurar backup
    log "Executando restauração..."

    if PGPASSWORD="$DB_PASS" pg_restore \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        "$BACKUP_FILE"; then

        success "Backup restaurado com sucesso"
        return 0
    else
        error "Falha ao restaurar backup"
        return 1
    fi
}

# Reverter código se necessário
revert_code() {
    if [ "$ROLLBACK_CODE" = "true" ]; then
        log "Revertendo código para versão anterior..."

        # Verificar se estamos em um repositório Git
        if [ -d ".git" ]; then
            # Fazer backup das mudanças atuais
            local stash_name="rollback_$(date +%Y%m%d_%H%M%S)"
            git stash push -m "$stash_name" || warning "Falha ao fazer stash das mudanças"

            # Reverter para commit anterior
            if git checkout HEAD~1; then
                success "Código revertido para versão anterior"

                # Reinstalar dependências se necessário
                if [ -f "package.json" ]; then
                    log "Reinstalando dependências..."
                    yarn install || npm install || warning "Falha ao reinstalar dependências"
                fi
            else
                error "Falha ao reverter código"
                return 1
            fi
        else
            warning "Não é um repositório Git, pulando reversão de código"
        fi
    else
        log "Reversão de código não solicitada"
    fi
}

# Restaurar arquivos de configuração
restore_config_files() {
    log "Restaurando arquivos de configuração..."

    # Restaurar .env se backup existir
    local env_backup=$(find ./backups -name ".env.backup.*" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -f2- -d" ")
    if [ -n "$env_backup" ] && [ -f "$env_backup" ]; then
        cp "$env_backup" .env
        success "Arquivo .env restaurado"
    fi

    # Restaurar configurações se backup existir
    local config_backup=$(find ./backups -name "config_backup_*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -f2- -d" ")
    if [ -n "$config_backup" ] && [ -f "$config_backup" ]; then
        tar -xzf "$config_backup" -C ./
        success "Configurações restauradas"
    fi
}

# Reiniciar aplicação
restart_application() {
    log "Reiniciando aplicação..."

    # Tentar reiniciar com pm2
    if command -v pm2 &> /dev/null; then
        if pm2 list | grep -q "rootgames-api"; then
            pm2 start rootgames-api || pm2 restart rootgames-api
            success "Aplicação reiniciada via PM2"
        else
            # Criar processo PM2 se não existir
            pm2 start npm --name "rootgames-api" -- start
            success "Aplicação iniciada via PM2"
        fi
    else
        # Iniciar manualmente
        log "Iniciando aplicação manualmente..."
        nohup yarn start > ./logs/strapi.log 2>&1 &
        success "Aplicação iniciada manualmente"
    fi

    # Aguardar aplicação inicializar
    log "Aguardando aplicação inicializar..."
    sleep 15
}

# Verificar saúde após rollback
verify_rollback() {
    log "Verificando saúde após rollback..."

    # Aguardar um pouco mais para garantir inicialização
    sleep 10

    # Executar health check
    if [ -f "./scripts/health-check.sh" ]; then
        if ./scripts/health-check.sh --no-rollback; then
            success "✅ Rollback verificado com sucesso! Sistema saudável."
            return 0
        else
            error "❌ Rollback falhou! Sistema ainda com problemas."
            return 1
        fi
    else
        # Verificação básica se health check não estiver disponível
        if curl -s -f "http://localhost:1337/api/games?limit=1" > /dev/null; then
            success "✅ Verificação básica passou. Sistema parece estar funcionando."
            return 0
        else
            error "❌ Verificação básica falhou. Sistema pode ainda estar com problemas."
            return 1
        fi
    fi
}

# Notificar sobre rollback
notify_rollback() {
    local success="$1"

    local message
    if [ "$success" = "true" ]; then
        message="✅ Rollback executado com sucesso! Sistema restaurado e funcionando."
    else
        message="❌ Rollback falhou! Intervenção manual necessária."
    fi

    alert "$message"

    # Enviar notificação via Slack se configurado
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local payload="{\"text\":\"$message\"}"
        curl -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || log "Falha ao enviar notificação para Slack"
    fi

    # Enviar notificação via Discord se configurado
    if [ -n "$DISCORD_WEBHOOK_URL" ]; then
        local payload="{\"content\":\"$message\"}"
        curl -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$DISCORD_WEBHOOK_URL" > /dev/null 2>&1 || log "Falha ao enviar notificação para Discord"
    fi
}

# Função principal
main() {
    log "🔄 Iniciando rollback automático..."

    # Verificar argumentos
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "Uso: $0 [backup_file] [revert_code]"
        echo "  backup_file: Caminho para o arquivo de backup (padrão: ./backups/backup_latest.sql)"
        echo "  revert_code: 'true' para reverter código também (padrão: false)"
        exit 0
    fi

    # Executar etapas do rollback
    local rollback_success=true

    check_backup_file || rollback_success=false
    stop_application || rollback_success=false

    if [ "$rollback_success" = "true" ]; then
        restore_database || rollback_success=false
        revert_code || rollback_success=false
        restore_config_files || warning "Falha ao restaurar alguns arquivos de configuração"
        restart_application || rollback_success=false
        verify_rollback || rollback_success=false
    fi

    # Notificar resultado
    notify_rollback "$rollback_success"

    # Resumo final
    log "📊 Resumo do rollback:"
    log "  - Backup usado: $BACKUP_FILE"
    log "  - Código revertido: $ROLLBACK_CODE"
    log "  - Status: $([ "$rollback_success" = "true" ] && echo "SUCESSO" || echo "FALHA")"

    if [ "$rollback_success" = "true" ]; then
        success "✅ Rollback concluído com sucesso!"
        exit 0
    else
        error "❌ Rollback falhou! Intervenção manual necessária."
        exit 1
    fi
}

# Executar função principal
main "$@"
