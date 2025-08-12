#!/bin/bash
# scripts/deploy-safe.sh - Deploy seguro com proteções automáticas

set -e

# Configurações
ENVIRONMENT="${1:-development}"
ROLLBACK_ON_FAILURE="${2:-true}"
SKIP_BACKUP="${3:-false}"
LOG_FILE="${LOG_FILE:-./logs/deploy.log}"

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

# Verificar pré-requisitos
check_prerequisites() {
    log "Verificando pré-requisitos..."

    # Verificar se scripts existem
    local required_scripts=("backup.sh" "health-check.sh" "rollback.sh")
    for script in "${required_scripts[@]}"; do
        if [ ! -f "./scripts/$script" ]; then
            error "Script necessário não encontrado: ./scripts/$script"
            exit 1
        fi
    done

    # Verificar se scripts são executáveis
    for script in "${required_scripts[@]}"; do
        if [ ! -x "./scripts/$script" ]; then
            warning "Tornando script executável: ./scripts/$script"
            chmod +x "./scripts/$script"
        fi
    done

    # Verificar dependências
    if ! command -v curl &> /dev/null; then
        error "curl não encontrado. Instale o curl."
        exit 1
    fi

    if ! command -v pg_dump &> /dev/null; then
        error "pg_dump não encontrado. Instale o PostgreSQL client."
        exit 1
    fi

    success "Pré-requisitos verificados"
}

# Verificar saúde inicial
check_initial_health() {
    log "Verificando saúde inicial do sistema..."

    if [ -f "./scripts/health-check.sh" ]; then
        if ./scripts/health-check.sh --no-rollback; then
            success "Sistema saudável antes do deploy"
        else
            warning "Sistema com problemas antes do deploy"
            if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
                log "Considerando abortar deploy devido a problemas pré-existentes"
                read -p "Continuar com o deploy? (y/N): " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    log "Deploy abortado pelo usuário"
                    exit 1
                fi
            fi
        fi
    else
        warning "Script de health check não encontrado, pulando verificação inicial"
    fi
}

# Fazer backup antes do deploy
create_backup() {
    if [ "$SKIP_BACKUP" = "true" ]; then
        warning "Backup pulado conforme solicitado"
        return 0
    fi

    log "Criando backup antes do deploy..."

    if [ -f "./scripts/backup.sh" ]; then
        if ./scripts/backup.sh; then
            success "Backup criado com sucesso"
        else
            error "Falha ao criar backup"
            if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
                log "Abortando deploy devido a falha no backup"
                exit 1
            fi
        fi
    else
        error "Script de backup não encontrado"
        exit 1
    fi
}

# Executar testes
run_tests() {
    log "Executando testes..."

    # Verificar se há testes configurados
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        if yarn test || npm test; then
            success "Testes executados com sucesso"
        else
            error "Testes falharam"
            if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
                log "Abortando deploy devido a falha nos testes"
                exit 1
            fi
        fi
    else
        warning "Nenhum teste configurado, pulando execução de testes"
    fi
}

# Fazer build
build_application() {
    log "Fazendo build da aplicação..."

    if [ -f "package.json" ]; then
        if yarn build || npm run build; then
            success "Build executado com sucesso"
        else
            error "Build falhou"
            if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
                log "Abortando deploy devido a falha no build"
                exit 1
            fi
        fi
    else
        warning "package.json não encontrado, pulando build"
    fi
}

# Deploy baseado no ambiente
deploy_application() {
    log "Executando deploy para ambiente: $ENVIRONMENT"

    case $ENVIRONMENT in
        "development")
            deploy_development
            ;;
        "staging")
            deploy_staging
            ;;
        "production")
            deploy_production
            ;;
        *)
            error "Ambiente inválido: $ENVIRONMENT"
            exit 1
            ;;
    esac
}

# Deploy para desenvolvimento
deploy_development() {
    log "Deploy para desenvolvimento..."

    # Parar aplicação se estiver rodando
    if command -v pm2 &> /dev/null; then
        pm2 stop rootgames-api 2>/dev/null || true
    fi

    # Iniciar em modo desenvolvimento
    if command -v pm2 &> /dev/null; then
        pm2 start npm --name "rootgames-api" -- run develop
    else
        nohup yarn develop > ./logs/strapi.log 2>&1 &
    fi

    success "Deploy para desenvolvimento concluído"
}

# Deploy para staging
deploy_staging() {
    log "Deploy para staging..."

    # Configurar variáveis de ambiente para staging
    export NODE_ENV=staging

    # Parar aplicação se estiver rodando
    if command -v pm2 &> /dev/null; then
        pm2 stop rootgames-api-staging 2>/dev/null || true
    fi

    # Iniciar aplicação
    if command -v pm2 &> /dev/null; then
        pm2 start npm --name "rootgames-api-staging" -- start
    else
        nohup yarn start > ./logs/strapi-staging.log 2>&1 &
    fi

    success "Deploy para staging concluído"
}

# Deploy para produção
deploy_production() {
    log "Deploy para produção..."

    # Confirmação para produção
    read -p "Tem certeza que deseja fazer deploy para PRODUÇÃO? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Deploy para produção cancelado pelo usuário"
        exit 1
    fi

    # Configurar variáveis de ambiente para produção
    export NODE_ENV=production

    # Parar aplicação se estiver rodando
    if command -v pm2 &> /dev/null; then
        pm2 stop rootgames-api-production 2>/dev/null || true
    fi

    # Iniciar aplicação
    if command -v pm2 &> /dev/null; then
        pm2 start npm --name "rootgames-api-production" -- start
    else
        nohup yarn start > ./logs/strapi-production.log 2>&1 &
    fi

    success "Deploy para produção concluído"
}

# Aguardar inicialização
wait_for_startup() {
    log "Aguardando inicialização da aplicação..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        log "Tentativa $attempt/$max_attempts..."

        if curl -s -f "http://localhost:1337/api/games?limit=1" > /dev/null 2>&1; then
            success "Aplicação inicializada com sucesso"
            return 0
        fi

        sleep 2
        attempt=$((attempt + 1))
    done

    error "Aplicação não inicializou dentro do tempo esperado"
    return 1
}

# Verificar saúde pós-deploy
check_post_deploy_health() {
    log "Verificando saúde pós-deploy..."

    if [ -f "./scripts/health-check.sh" ]; then
        if ./scripts/health-check.sh --no-rollback; then
            success "Sistema saudável após deploy"
            return 0
        else
            error "Sistema com problemas após deploy"
            return 1
        fi
    else
        # Verificação básica
        if curl -s -f "http://localhost:1337/api/games?limit=1" > /dev/null; then
            success "Verificação básica passou"
            return 0
        else
            error "Verificação básica falhou"
            return 1
        fi
    fi
}

# Executar rollback se necessário
execute_rollback() {
    if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
        error "🚨 Deploy falhou! Iniciando rollback automático..."

        if [ -f "./scripts/rollback.sh" ]; then
            if ./scripts/rollback.sh; then
                success "✅ Rollback executado com sucesso!"
                return 0
            else
                error "❌ Rollback falhou! Intervenção manual necessária."
                return 1
            fi
        else
            error "❌ Script de rollback não encontrado!"
            return 1
        fi
    else
        error "🚨 Deploy falhou! Rollback automático desabilitado."
        return 1
    fi
}

# Notificar resultado do deploy
notify_deploy_result() {
    local success="$1"

    local message
    if [ "$success" = "true" ]; then
        message="✅ Deploy para $ENVIRONMENT concluído com sucesso!"
    else
        message="❌ Deploy para $ENVIRONMENT falhou!"
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
    log "🚀 Iniciando deploy seguro para $ENVIRONMENT..."

    # Verificar argumentos
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "Uso: $0 [environment] [rollback_on_failure] [skip_backup]"
        echo "  environment: development, staging, production (padrão: development)"
        echo "  rollback_on_failure: true/false (padrão: true)"
        echo "  skip_backup: true/false (padrão: false)"
        echo ""
        echo "Exemplos:"
        echo "  $0 development"
        echo "  $0 staging true false"
        echo "  $0 production true true"
        exit 0
    fi

    # Executar etapas do deploy
    local deploy_success=true

    check_prerequisites || deploy_success=false
    check_initial_health || warning "Problemas detectados antes do deploy"
    create_backup || deploy_success=false
    run_tests || deploy_success=false
    build_application || deploy_success=false

    if [ "$deploy_success" = "true" ]; then
        deploy_application || deploy_success=false
        wait_for_startup || deploy_success=false
        check_post_deploy_health || deploy_success=false
    fi

    # Executar rollback se necessário
    if [ "$deploy_success" = "false" ]; then
        execute_rollback || deploy_success=false
    fi

    # Notificar resultado
    notify_deploy_result "$deploy_success"

    # Resumo final
    log "📊 Resumo do deploy:"
    log "  - Ambiente: $ENVIRONMENT"
    log "  - Rollback automático: $ROLLBACK_ON_FAILURE"
    log "  - Backup pulado: $SKIP_BACKUP"
    log "  - Status: $([ "$deploy_success" = "true" ] && echo "SUCESSO" || echo "FALHA")"

    if [ "$deploy_success" = "true" ]; then
        success "✅ Deploy seguro concluído com sucesso!"
        exit 0
    else
        error "❌ Deploy seguro falhou!"
        exit 1
    fi
}

# Executar função principal
main "$@"
