#!/bin/bash
# scripts/monitor-status.sh - Verificar status do monitoramento contínuo
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

# Verificar status do monitoramento
check_monitor_status() {
    log "Verificando status do monitoramento..."

    # Verificar se há PID salvo
    if [ -f "./logs/monitor.pid" ]; then
        MONITOR_PID=$(cat ./logs/monitor.pid)
        log "PID salvo: $MONITOR_PID"

        if kill -0 $MONITOR_PID 2>/dev/null; then
            success "✅ Monitor ativo (PID: $MONITOR_PID)"
            return 0
        else
            warning "⚠️ PID salvo mas processo não está rodando"
            rm -f ./logs/monitor.pid
        fi
    fi

    # Verificar por nome de processo
    MONITOR_PIDS=$(pgrep -f "monitor.sh" || true)

    if [ -n "$MONITOR_PIDS" ]; then
        success "✅ Monitor ativo (PIDs: $MONITOR_PIDS)"
        return 0
    else
        error "❌ Monitor não está rodando"
        return 1
    fi
}

# Verificar logs recentes
check_recent_logs() {
    log "Verificando logs recentes..."

    if [ -f "./logs/monitor_production.log" ]; then
        local last_log=$(tail -n 1 ./logs/monitor_production.log 2>/dev/null || echo "N/A")
        local log_size=$(du -h ./logs/monitor_production.log 2>/dev/null | cut -f1 || echo "0")

        echo "  📄 Log principal: $log_size"
        echo "  🕐 Última entrada: $last_log"
    else
        warning "  ⚠️ Log principal não encontrado"
    fi

    if [ -f "./logs/alerts_production.log" ]; then
        local alert_count=$(grep -c "ALERTA" ./logs/alerts_production.log 2>/dev/null || echo "0")
        local last_alert=$(tail -n 1 ./logs/alerts_production.log 2>/dev/null || echo "N/A")

        echo "  🚨 Alertas: $alert_count"
        echo "  🕐 Último alerta: $last_alert"
    else
        echo "  🚨 Alertas: 0 (arquivo não encontrado)"
    fi
}

# Verificar métricas
check_metrics() {
    log "Verificando métricas..."

    if [ -f "./logs/metrics_production.json" ]; then
        local metrics_size=$(du -h ./logs/metrics_production.json 2>/dev/null | cut -f1 || echo "0")
        local metrics_count=$(wc -l < ./logs/metrics_production.json 2>/dev/null || echo "0")

        echo "  📊 Arquivo de métricas: $metrics_size"
        echo "  📈 Total de métricas: $metrics_count"

        # Mostrar última métrica
        if [ "$metrics_count" -gt 0 ]; then
            local last_metric=$(tail -n 1 ./logs/metrics_production.json 2>/dev/null || echo "N/A")
            echo "  🕐 Última métrica: $last_metric"
        fi
    else
        warning "  ⚠️ Arquivo de métricas não encontrado"
    fi
}

# Verificar recursos do sistema
check_system_resources() {
    log "Verificando recursos do sistema..."

    # Memória
    local memory_usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    echo "  💾 Uso de memória: ${memory_usage}%"

    # CPU
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    echo "  🔥 Uso de CPU: ${cpu_usage}%"

    # Disco
    local disk_usage=$(df . | awk 'NR==2 {print $5}')
    echo "  💿 Uso de disco: $disk_usage"

    # Espaço em logs
    local logs_size=$(du -sh ./logs 2>/dev/null | cut -f1 || echo "0")
    echo "  📁 Tamanho dos logs: $logs_size"
}

# Verificar conectividade
check_connectivity() {
    log "Verificando conectividade..."

    # API
    if curl -s -f "http://localhost:1337/" > /dev/null 2>&1; then
        success "  ✅ API: Online"
    else
        error "  ❌ API: Offline"
    fi

    # Banco de dados
    if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        success "  ✅ Banco de dados: Online"
    else
        error "  ❌ Banco de dados: Offline"
    fi
}

# Gerar relatório completo
generate_complete_report() {
    echo ""
    echo "📊 RELATÓRIO COMPLETO DE MONITORAMENTO"
    echo "======================================"

    # Status do monitor
    if check_monitor_status; then
        echo ""
        check_recent_logs
        echo ""
        check_metrics
        echo ""
        check_system_resources
        echo ""
        check_connectivity
    else
        echo ""
        warning "Monitor não está rodando. Para iniciar: ./scripts/start-monitoring.sh"
    fi

    echo ""
    echo "🔧 COMANDOS ÚTEIS:"
    echo "  Iniciar monitoramento: ./scripts/start-monitoring.sh"
    echo "  Parar monitoramento: ./scripts/stop-monitoring.sh"
    echo "  Ver logs em tempo real: tail -f ./logs/monitor_production.log"
    echo "  Ver alertas: tail -f ./logs/alerts_production.log"
    echo "  Health check manual: ./scripts/health-check.sh"
}

# Função principal
main() {
    log "📊 Verificando status do monitoramento contínuo..."

    # Verificar argumentos
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "Uso: $0"
        echo "  Verifica o status completo do monitoramento contínuo"
        exit 0
    fi

    # Gerar relatório
    generate_complete_report

    echo ""
    success "✅ Verificação de status concluída!"
}

# Executar função principal
main "$@"
