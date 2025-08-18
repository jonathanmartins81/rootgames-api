#!/bin/bash
# scripts/monitor-avancado.sh - Sistema de Monitoramento Avançado
# Versão: 2.0.0 - Agosto 2025

set -euo pipefail

# Carregar biblioteca comum
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# Configurações
MONITOR_INTERVAL="$(get_config MONITOR_INTERVAL "60")"
API_URL="$(get_config API_URL "http://localhost:1337")"
WEBHOOK_URL="$(get_config MONITOR_WEBHOOK_URL "")"
ALERT_COOLDOWN="$(get_config ALERT_COOLDOWN "300")"
MAX_ALERTS_PER_HOUR="$(get_config MAX_ALERTS_PER_HOUR "10")"

# Thresholds
CPU_THRESHOLD="$(get_config CPU_THRESHOLD "80")"
MEMORY_THRESHOLD="$(get_config MEMORY_THRESHOLD "85")"
DISK_THRESHOLD="$(get_config DISK_THRESHOLD "90")"
RESPONSE_TIME_THRESHOLD="$(get_config RESPONSE_TIME_THRESHOLD "2000")"
ERROR_THRESHOLD="$(get_config ERROR_THRESHOLD "5")"

# Arquivos de controle
METRICS_FILE="$LOG_DIR/metrics_realtime.json"
ALERTS_FILE="$LOG_DIR/alerts_history.json"
PID_FILE="$LOG_DIR/monitor.pid"
LAST_ALERT_FILE="$LOG_DIR/last_alert_times.json"

# Estruturas para métricas
declare -A CURRENT_METRICS
declare -A ALERT_COUNTS

# Inicializar monitoramento
init_monitoring() {
    log_info "🚀 Iniciando Monitor Avançado RootGames API"
    
    # Verificar se já está rodando
    if [[ -f "$PID_FILE" ]]; then
        local old_pid=$(cat "$PID_FILE")
        if kill -0 "$old_pid" 2>/dev/null; then
            log_error "Monitor já está rodando (PID: $old_pid)"
            exit 1
        else
            log_warning "Removendo PID file órfão"
            rm -f "$PID_FILE"
        fi
    fi
    
    # Salvar PID atual
    echo $$ > "$PID_FILE"
    
    # Inicializar arquivos de métricas
    echo '{}' > "$METRICS_FILE"
    [[ ! -f "$ALERTS_FILE" ]] && echo '[]' > "$ALERTS_FILE"
    [[ ! -f "$LAST_ALERT_FILE" ]] && echo '{}' > "$LAST_ALERT_FILE"
    
    log_success "Monitor iniciado (PID: $$, Intervalo: ${MONITOR_INTERVAL}s)"
}

# Coletar métricas do sistema
collect_system_metrics() {
    CURRENT_METRICS[timestamp]=$(date -Iseconds)
    CURRENT_METRICS[cpu_usage]=$(get_cpu_usage)
    CURRENT_METRICS[memory_usage]=$(get_memory_usage)
    CURRENT_METRICS[disk_usage]=$(get_disk_usage)
    CURRENT_METRICS[load_average]=$(get_load_average)
    
    # Métricas de rede
    if check_internet; then
        CURRENT_METRICS[internet_status]="connected"
    else
        CURRENT_METRICS[internet_status]="disconnected"
    fi
}

# Coletar métricas da API
collect_api_metrics() {
    local start_time=$(date +%s%N)
    local api_status="down"
    local response_time=0
    local status_code=0
    
    if command_exists curl; then
        # Testar endpoint de health
        local response=$(curl -s -w "%{http_code}:%{time_total}" --max-time 10 "$API_URL/api/health" 2>/dev/null || echo "000:0")
        status_code=$(echo "$response" | cut -d: -f1)
        response_time=$(echo "$response" | cut -d: -f2 | awk '{print int($1*1000)}')
        
        if [[ "$status_code" =~ ^[23] ]]; then
            api_status="up"
        fi
    fi
    
    CURRENT_METRICS[api_status]="$api_status"
    CURRENT_METRICS[api_response_time]="$response_time"
    CURRENT_METRICS[api_status_code]="$status_code"
}

# Coletar métricas do banco
collect_database_metrics() {
    local db_status="down"
    local db_size="0"
    
    local db_host=$(get_config DB_HOST "127.0.0.1")
    local db_port=$(get_config DB_PORT "5432")
    local db_name=$(get_config DB_NAME "rootgames")
    local db_user=$(get_config DB_USER "rootgames")
    
    if check_postgres_connection "$db_host" "$db_port" "$db_name" "$db_user"; then
        db_status="up"
        db_size=$(get_database_size "$db_host" "$db_port" "$db_name" "$db_user" || echo "0")
    fi
    
    CURRENT_METRICS[db_status]="$db_status"
    CURRENT_METRICS[db_size]="$db_size"
}

# Verificar logs de erro
collect_error_metrics() {
    local error_count=0
    local today_log="$LOG_DIR/$(date +%Y-%m-%d).log"
    
    if [[ -f "$today_log" ]]; then
        # Contar erros na última hora
        local one_hour_ago=$(date -d '1 hour ago' '+%Y-%m-%d %H:%M:%S')
        error_count=$(awk -v start="$one_hour_ago" '$0 >= start && /ERROR/ {count++} END {print count+0}' "$today_log")
    fi
    
    CURRENT_METRICS[error_count_1h]="$error_count"
}

# Salvar métricas
save_metrics() {
    local metrics_json="{"
    local first=true
    
    for key in "${!CURRENT_METRICS[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            metrics_json+=","
        fi
        metrics_json+="\"$key\":\"${CURRENT_METRICS[$key]}\""
    done
    
    metrics_json+="}"
    echo "$metrics_json" > "$METRICS_FILE"
    
    # Também adicionar ao histórico
    local history_file="$LOG_DIR/metrics_history_$(date +%Y-%m-%d).json"
    echo "$metrics_json" >> "$history_file"
}

# Verificar se deve enviar alerta
should_send_alert() {
    local alert_type="$1"
    local current_time=$(date +%s)
    
    # Verificar cooldown
    if [[ -f "$LAST_ALERT_FILE" ]] && command_exists jq; then
        local last_alert=$(jq -r ".\"$alert_type\" // 0" "$LAST_ALERT_FILE" 2>/dev/null || echo "0")
        local time_diff=$((current_time - last_alert))
        
        if [[ $time_diff -lt $ALERT_COOLDOWN ]]; then
            return 1
        fi
    fi
    
    # Verificar limite por hora
    local current_hour=$(date +%Y-%m-%d-%H)
    local alert_count_key="${alert_type}_${current_hour}"
    local current_count=${ALERT_COUNTS[$alert_count_key]:-0}
    
    if [[ $current_count -ge $MAX_ALERTS_PER_HOUR ]]; then
        return 1
    fi
    
    return 0
}

# Enviar alerta
send_alert() {
    local alert_type="$1"
    local message="$2"
    local level="${3:-warning}"
    local current_time=$(date +%s)
    
    if ! should_send_alert "$alert_type"; then
        log_debug "Alerta $alert_type em cooldown ou limite atingido"
        return 0
    fi
    
    # Enviar via webhook se configurado
    if [[ -n "$WEBHOOK_URL" ]]; then
        send_webhook_notification "$WEBHOOK_URL" "$message" "$level"
    fi
    
    # Log do alerta
    log_warning "ALERTA [$alert_type]: $message"
    
    # Atualizar contadores
    local current_hour=$(date +%Y-%m-%d-%H)
    local alert_count_key="${alert_type}_${current_hour}"
    ALERT_COUNTS[$alert_count_key]=$((${ALERT_COUNTS[$alert_count_key]:-0} + 1))
    
    # Salvar timestamp do último alerta
    if command_exists jq; then
        local updated_alerts=$(jq ". + {\"$alert_type\": $current_time}" "$LAST_ALERT_FILE" 2>/dev/null || echo "{\"$alert_type\": $current_time}")
        echo "$updated_alerts" > "$LAST_ALERT_FILE"
    fi
    
    # Adicionar ao histórico de alertas
    local alert_record="{\"timestamp\":\"$(date -Iseconds)\",\"type\":\"$alert_type\",\"message\":\"$message\",\"level\":\"$level\"}"
    if command_exists jq; then
        local updated_history=$(jq ". + [$alert_record]" "$ALERTS_FILE" 2>/dev/null || echo "[$alert_record]")
        echo "$updated_history" > "$ALERTS_FILE"
    fi
}

# Analisar métricas e gerar alertas
analyze_metrics() {
    # CPU
    if (( $(echo "${CURRENT_METRICS[cpu_usage]} > $CPU_THRESHOLD" | bc -l 2>/dev/null || echo 0) )); then
        send_alert "high_cpu" "Alto uso de CPU: ${CURRENT_METRICS[cpu_usage]}% (limite: $CPU_THRESHOLD%)" "warning"
    fi
    
    # Memória
    if (( $(echo "${CURRENT_METRICS[memory_usage]} > $MEMORY_THRESHOLD" | bc -l 2>/dev/null || echo 0) )); then
        send_alert "high_memory" "Alto uso de memória: ${CURRENT_METRICS[memory_usage]}% (limite: $MEMORY_THRESHOLD%)" "warning"
    fi
    
    # Disco
    if (( ${CURRENT_METRICS[disk_usage]} > DISK_THRESHOLD )); then
        send_alert "high_disk" "Alto uso de disco: ${CURRENT_METRICS[disk_usage]}% (limite: $DISK_THRESHOLD%)" "error"
    fi
    
    # API
    if [[ "${CURRENT_METRICS[api_status]}" == "down" ]]; then
        send_alert "api_down" "API indisponível (status: ${CURRENT_METRICS[api_status_code]})" "error"
    elif (( ${CURRENT_METRICS[api_response_time]} > RESPONSE_TIME_THRESHOLD )); then
        send_alert "slow_api" "API lenta: ${CURRENT_METRICS[api_response_time]}ms (limite: ${RESPONSE_TIME_THRESHOLD}ms)" "warning"
    fi
    
    # Banco de dados
    if [[ "${CURRENT_METRICS[db_status]}" == "down" ]]; then
        send_alert "db_down" "Banco de dados indisponível" "error"
    fi
    
    # Erros
    if (( ${CURRENT_METRICS[error_count_1h]} > ERROR_THRESHOLD )); then
        send_alert "high_errors" "Muitos erros na última hora: ${CURRENT_METRICS[error_count_1h]} (limite: $ERROR_THRESHOLD)" "warning"
    fi
    
    # Internet
    if [[ "${CURRENT_METRICS[internet_status]}" == "disconnected" ]]; then
        send_alert "no_internet" "Sem conectividade com a internet" "warning"
    fi
}

# Exibir status atual
show_status() {
    echo ""
    log_info "📊 Status Atual do Sistema"
    echo "   🖥️  CPU: ${CURRENT_METRICS[cpu_usage]}% | Memória: ${CURRENT_METRICS[memory_usage]}% | Disco: ${CURRENT_METRICS[disk_usage]}%"
    echo "   🌐 API: ${CURRENT_METRICS[api_status]} (${CURRENT_METRICS[api_response_time]}ms)"
    echo "   🗄️  DB: ${CURRENT_METRICS[db_status]} (${CURRENT_METRICS[db_size]})"
    echo "   🌍 Internet: ${CURRENT_METRICS[internet_status]}"
    echo "   📋 Erros (1h): ${CURRENT_METRICS[error_count_1h]}"
    echo ""
}

# Cleanup ao sair
cleanup_monitor() {
    log_info "🛑 Parando monitor..."
    [[ -f "$PID_FILE" ]] && rm -f "$PID_FILE"
    log_success "Monitor parado"
    exit 0
}

# Loop principal de monitoramento
monitoring_loop() {
    log_info "🔄 Iniciando loop de monitoramento..."
    
    while true; do
        collect_system_metrics
        collect_api_metrics
        collect_database_metrics
        collect_error_metrics
        save_metrics
        analyze_metrics
        
        if [[ "${1:-}" == "--verbose" ]]; then
            show_status
        fi
        
        sleep "$MONITOR_INTERVAL"
    done
}

# Função principal
main() {
    case "${1:-start}" in
        "start")
            init_monitoring
            trap cleanup_monitor SIGINT SIGTERM
            monitoring_loop "${2:-}"
            ;;
        "status")
            if [[ -f "$METRICS_FILE" ]]; then
                if command_exists jq; then
                    jq . "$METRICS_FILE"
                else
                    cat "$METRICS_FILE"
                fi
            else
                log_error "Arquivo de métricas não encontrado"
                exit 1
            fi
            ;;
        "stop")
            if [[ -f "$PID_FILE" ]]; then
                local pid=$(cat "$PID_FILE")
                if kill -0 "$pid" 2>/dev/null; then
                    kill "$pid"
                    log_success "Monitor parado (PID: $pid)"
                else
                    log_warning "Monitor não estava rodando"
                    rm -f "$PID_FILE"
                fi
            else
                log_warning "Monitor não está rodando"
            fi
            ;;
        "help"|"--help")
            echo "Uso: $0 [start|stop|status|help] [--verbose]"
            echo ""
            echo "Comandos:"
            echo "  start     - Iniciar monitoramento (padrão)"
            echo "  stop      - Parar monitoramento"
            echo "  status    - Mostrar métricas atuais"
            echo "  help      - Mostrar esta ajuda"
            echo ""
            echo "Opções:"
            echo "  --verbose - Mostrar status detalhado durante monitoramento"
            ;;
        *)
            log_error "Comando inválido: $1"
            echo "Use '$0 help' para ver comandos disponíveis"
            exit 1
            ;;
    esac
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
