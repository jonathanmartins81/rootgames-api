#!/bin/bash
# scripts/stop-monitoring.sh - Parar monitoramento contínuo
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

# Parar monitoramento
stop_monitoring() {
    log "Parando monitoramento contínuo..."
    
    # Verificar se há PID salvo
    if [ -f "./logs/monitor.pid" ]; then
        MONITOR_PID=$(cat ./logs/monitor.pid)
        log "PID do monitor: $MONITOR_PID"
        
        # Verificar se processo ainda está rodando
        if kill -0 $MONITOR_PID 2>/dev/null; then
            log "Enviando sinal de parada para PID $MONITOR_PID..."
            kill -TERM $MONITOR_PID
            
            # Aguardar parada
            local count=0
            while kill -0 $MONITOR_PID 2>/dev/null && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
                log "Aguardando parada... ($count/10)"
            done
            
            # Forçar parada se necessário
            if kill -0 $MONITOR_PID 2>/dev/null; then
                warning "Processo não parou, forçando encerramento..."
                kill -KILL $MONITOR_PID
                sleep 2
            fi
            
            # Verificar se parou
            if ! kill -0 $MONITOR_PID 2>/dev/null; then
                success "Monitor parado com sucesso"
                rm -f ./logs/monitor.pid
            else
                error "Falha ao parar monitor"
                return 1
            fi
        else
            warning "Processo não está mais rodando"
            rm -f ./logs/monitor.pid
        fi
    else
        # Tentar parar por nome se não há PID salvo
        log "Procurando processos de monitoramento..."
        MONITOR_PIDS=$(pgrep -f "monitor.sh" || true)
        
        if [ -n "$MONITOR_PIDS" ]; then
            log "Encontrados PIDs: $MONITOR_PIDS"
            for pid in $MONITOR_PIDS; do
                log "Parando PID $pid..."
                kill -TERM $pid
            done
            
            sleep 3
            
            # Verificar se ainda há processos
            REMAINING_PIDS=$(pgrep -f "monitor.sh" || true)
            if [ -n "$REMAINING_PIDS" ]; then
                warning "Alguns processos ainda rodando, forçando parada..."
                for pid in $REMAINING_PIDS; do
                    kill -KILL $pid
                done
            fi
            
            success "Monitoramento parado"
        else
            warning "Nenhum processo de monitoramento encontrado"
        fi
    fi
}

# Gerar relatório final
generate_report() {
    log "Gerando relatório final..."
    
    if [ -f "./logs/monitor_production.log" ]; then
        local total_cycles=$(grep -c "Iniciando ciclo de monitoramento" ./logs/monitor_production.log || echo "0")
        local total_alerts=$(grep -c "ALERTA" ./logs/alerts_production.log || echo "0")
        local last_cycle=$(tail -n 20 ./logs/monitor_production.log | grep "Iniciando ciclo" | tail -1 || echo "N/A")
        
        echo "📊 Relatório de Monitoramento:"
        echo "  - Total de ciclos: $total_cycles"
        echo "  - Total de alertas: $total_alerts"
        echo "  - Último ciclo: $last_cycle"
        echo "  - Logs salvos em: ./logs/monitor_production.log"
        echo "  - Alertas salvos em: ./logs/alerts_production.log"
    fi
}

# Função principal
main() {
    log "🛑 Parando monitoramento contínuo..."
    
    # Verificar argumentos
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "Uso: $0"
        echo "  Para o monitoramento contínuo de forma segura"
        exit 0
    fi
    
    # Executar parada
    stop_monitoring
    
    # Gerar relatório
    generate_report
    
    success "✅ Monitoramento parado com sucesso!"
    log "Para reiniciar: ./scripts/start-monitoring.sh"
}

# Executar função principal
main "$@"
