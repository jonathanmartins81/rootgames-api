#!/bin/bash
# scripts/start-monitoring.sh - Iniciar monitoramento contínuo em produção
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

# Configurações de produção
MONITOR_INTERVAL="${MONITOR_INTERVAL:-60}" # 1 minuto em produção
LOG_FILE="${LOG_FILE:-./logs/monitor_production.log}"
ALERT_LOG="${ALERT_LOG:-./logs/alerts_production.log}"
METRICS_FILE="${METRICS_FILE:-./logs/metrics_production.json}"

# Verificar se monitor já está rodando
check_monitor_running() {
    if pgrep -f "monitor.sh" > /dev/null; then
        warning "Monitor já está rodando (PID: $(pgrep -f "monitor.sh"))"
        read -p "Deseja parar o monitor atual e iniciar um novo? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "Parando monitor atual..."
            pkill -f "monitor.sh"
            sleep 2
        else
            log "Monitoramento mantido. Saindo..."
            exit 0
        fi
    fi
}

# Configurar diretórios
setup_directories() {
    log "Configurando diretórios de monitoramento..."

    mkdir -p ./logs
    mkdir -p ./backups
    mkdir -p ./metrics

    success "Diretórios configurados"
}

# Configurar variáveis de ambiente para produção
setup_production_env() {
    log "Configurando ambiente de produção..."

    # Configurações de alerta (configurar conforme necessário)
    export ALERT_COOLDOWN=300  # 5 minutos entre alertas
    export MAX_ALERTS_PER_HOUR=10
    export ERROR_THRESHOLD=5
    export RESPONSE_TIME_THRESHOLD=2000  # 2 segundos
    export MEMORY_THRESHOLD=85
    export CPU_THRESHOLD=80

    # Configurações de monitoramento
    export CHECK_INTERVAL=$MONITOR_INTERVAL
    export LOG_FILE=$LOG_FILE
    export ALERT_LOG=$ALERT_LOG
    export METRICS_FILE=$METRICS_FILE

    success "Ambiente de produção configurado"
}

# Iniciar monitoramento em background
start_monitoring() {
    log "Iniciando monitoramento contínuo em produção..."

    # Executar monitor em background
    nohup ./scripts/monitor.sh > "$LOG_FILE" 2>&1 &
    MONITOR_PID=$!

    # Salvar PID para controle
    echo $MONITOR_PID > ./logs/monitor.pid

    success "Monitor iniciado com PID: $MONITOR_PID"
    log "Logs sendo salvos em: $LOG_FILE"
    log "Alertas sendo salvos em: $ALERT_LOG"
    log "Métricas sendo salvas em: $METRICS_FILE"
    log "Intervalo de verificação: ${MONITOR_INTERVAL}s"

    # Verificar se iniciou corretamente
    sleep 5
    if kill -0 $MONITOR_PID 2>/dev/null; then
        success "✅ Monitoramento contínuo iniciado com sucesso!"
        log "Para parar o monitoramento: ./scripts/stop-monitoring.sh"
        log "Para ver logs em tempo real: tail -f $LOG_FILE"
    else
        error "❌ Falha ao iniciar monitoramento"
        exit 1
    fi
}

# Função principal
main() {
    log "🚀 Iniciando monitoramento contínuo em produção..."

    # Verificar argumentos
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "Uso: $0 [intervalo_em_segundos]"
        echo "  intervalo_em_segundos: Intervalo entre verificações (padrão: 60s)"
        exit 0
    fi

    # Configurar intervalo se fornecido
    if [ -n "$1" ]; then
        MONITOR_INTERVAL="$1"
        log "Intervalo configurado para: ${MONITOR_INTERVAL}s"
    fi

    # Executar etapas
    check_monitor_running
    setup_directories
    setup_production_env
    start_monitoring

    log "📊 Monitoramento ativo - Sistema protegido!"
}

# Executar função principal
main "$@"
