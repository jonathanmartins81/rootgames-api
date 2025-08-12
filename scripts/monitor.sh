#!/bin/bash
# scripts/monitor.sh - Monitoramento contínuo com alertas em tempo real

set -e

# Configurações
API_URL="${API_URL:-http://localhost:1337}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-rootgames}"
DB_USER="${DB_USER:-rootgames}"
DB_PASS="${DB_PASS:-rootgames}"
CHECK_INTERVAL="${CHECK_INTERVAL:-60}" # segundos
LOG_FILE="${LOG_FILE:-./logs/monitor.log}"
ALERT_LOG="${ALERT_LOG:-./logs/alerts.log}"
METRICS_FILE="${METRICS_FILE:-./logs/metrics.json}"

# Configurações de alerta
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
ALERT_EMAIL="${ALERT_EMAIL:-}"
ALERT_COOLDOWN="${ALERT_COOLDOWN:-300}" # 5 minutos
MAX_ALERTS_PER_HOUR="${MAX_ALERTS_PER_HOUR:-10}"

# Thresholds
ERROR_THRESHOLD="${ERROR_THRESHOLD:-5}" # 5% de erro
RESPONSE_TIME_THRESHOLD="${RESPONSE_TIME_THRESHOLD:-1000}" # 1 segundo
MEMORY_THRESHOLD="${MEMORY_THRESHOLD:-80}" # 80% de memória
CPU_THRESHOLD="${CPU_THRESHOLD:-70}" # 70% de CPU

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Variáveis de controle
LAST_ALERT_TIME=0
ALERT_COUNT=0
ALERT_COUNT_RESET_TIME=$(date +%s)

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
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ALERTA] $1" >> "$ALERT_LOG"
}

# Criar diretórios necessários
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$(dirname "$ALERT_LOG")"
mkdir -p "$(dirname "$METRICS_FILE")"

# Função para verificar se pode enviar alerta
can_send_alert() {
    local current_time=$(date +%s)

    # Reset contador de alertas por hora
    if [ $((current_time - ALERT_COUNT_RESET_TIME)) -gt 3600 ]; then
        ALERT_COUNT=0
        ALERT_COUNT_RESET_TIME=$current_time
    fi

    # Verificar cooldown
    if [ $((current_time - LAST_ALERT_TIME)) -lt $ALERT_COOLDOWN ]; then
        return 1
    fi

    # Verificar limite por hora
    if [ $ALERT_COUNT -ge $MAX_ALERTS_PER_HOUR ]; then
        return 1
    fi

    return 0
}

# Função para enviar alerta
send_alert() {
    local message="$1"
    local severity="${2:-warning}"

    if can_send_alert; then
        alert "$message"

        # Enviar para Slack
        if [ -n "$SLACK_WEBHOOK_URL" ]; then
            send_slack_alert "$message" "$severity"
        fi

        # Enviar para Discord
        if [ -n "$DISCORD_WEBHOOK_URL" ]; then
            send_discord_alert "$message" "$severity"
        fi

        # Enviar email
        if [ -n "$ALERT_EMAIL" ]; then
            send_email_alert "$message" "$severity"
        fi

        # Atualizar contadores
        LAST_ALERT_TIME=$(date +%s)
        ALERT_COUNT=$((ALERT_COUNT + 1))

        success "Alerta enviado via todos os canais configurados"
    else
        log "Alerta suprimido (cooldown ou limite atingido)"
    fi
}

# Enviar alerta para Slack
send_slack_alert() {
    local message="$1"
    local severity="$2"

    local color
    case $severity in
        "critical") color="danger" ;;
        "error") color="danger" ;;
        "warning") color="warning" ;;
        *) color="good" ;;
    esac

    local payload=$(cat <<EOF
{
    "text": "🚨 Alerta RootGames API",
    "attachments": [
        {
            "color": "$color",
            "fields": [
                {
                    "title": "Severidade",
                    "value": "$severity",
                    "short": true
                },
                {
                    "title": "Timestamp",
                    "value": "$(date -Iseconds)",
                    "short": true
                },
                {
                    "title": "Mensagem",
                    "value": "$message"
                }
            ]
        }
    ]
}
EOF
)

    curl -X POST -H 'Content-type: application/json' \
        --data "$payload" \
        "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || log "Falha ao enviar alerta para Slack"
}

# Enviar alerta para Discord
send_discord_alert() {
    local message="$1"
    local severity="$2"

    local color
    case $severity in
        "critical") color="16711680" ;; # Vermelho
        "error") color="16711680" ;;
        "warning") color="16776960" ;; # Amarelo
        *) color="65280" ;; # Verde
    esac

    local payload=$(cat <<EOF
{
    "embeds": [
        {
            "title": "🚨 Alerta RootGames API",
            "description": "$message",
            "color": $color,
            "fields": [
                {
                    "name": "Severidade",
                    "value": "$severity",
                    "inline": true
                },
                {
                    "name": "Timestamp",
                    "value": "$(date -Iseconds)",
                    "inline": true
                }
            ]
        }
    ]
}
EOF
)

    curl -X POST -H 'Content-type: application/json' \
        --data "$payload" \
        "$DISCORD_WEBHOOK_URL" > /dev/null 2>&1 || log "Falha ao enviar alerta para Discord"
}

# Enviar alerta por email
send_email_alert() {
    local message="$1"
    local severity="$2"

    local subject="[RootGames API] Alerta: $severity"
    local body="
Alerta detectado no sistema RootGames API

Severidade: $severity
Timestamp: $(date -Iseconds)
Mensagem: $message

Este é um alerta automático do sistema de monitoramento.
"

    echo "$body" | mail -s "$subject" "$ALERT_EMAIL" 2>/dev/null || log "Falha ao enviar alerta por email"
}

# Coletar métricas do sistema
collect_metrics() {
    local timestamp=$(date +%s)
    local metrics=()

    # Métricas de API
    local start_time=$(date +%s%3N)
    local api_response=$(curl -s -w "%{http_code}" --max-time 10 "$API_URL/api/games?limit=1" 2>/dev/null || echo "000")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    local http_status="${api_response: -3}"

    metrics+=("{\"name\":\"api_response_time\",\"value\":$response_time,\"timestamp\":$timestamp}")
    metrics+=("{\"name\":\"api_status\",\"value\":$http_status,\"timestamp\":$timestamp}")

    # Métricas de banco de dados
    if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        metrics+=("{\"name\":\"database_status\",\"value\":1,\"timestamp\":$timestamp}")
    else
        metrics+=("{\"name\":\"database_status\",\"value\":0,\"timestamp\":$timestamp}")
    fi

    # Métricas de memória
    local memory_usage=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
    metrics+=("{\"name\":\"memory_usage\",\"value\":$memory_usage,\"timestamp\":$timestamp}")

    # Métricas de CPU
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    metrics+=("{\"name\":\"cpu_usage\",\"value\":$cpu_usage,\"timestamp\":$timestamp}")

    # Métricas de disco
    local disk_usage=$(df . | awk 'NR==2 {print $5}' | cut -d'%' -f1)
    metrics+=("{\"name\":\"disk_usage\",\"value\":$disk_usage,\"timestamp\":$timestamp}")

    # Salvar métricas
    echo "[$(IFS=,; echo "${metrics[*]}")]" > "$METRICS_FILE"

    # Retornar métricas para análise
    echo "$response_time|$http_status|$memory_usage|$cpu_usage|$disk_usage"
}

# Analisar métricas e gerar alertas
analyze_metrics() {
    local metrics="$1"
    IFS='|' read -r response_time http_status memory_usage cpu_usage disk_usage <<< "$metrics"

    local alerts=()

    # Verificar tempo de resposta
    if [ "$response_time" -gt "$RESPONSE_TIME_THRESHOLD" ]; then
        alerts+=("Tempo de resposta alto: ${response_time}ms (threshold: ${RESPONSE_TIME_THRESHOLD}ms)")
    fi

    # Verificar status HTTP
    if [ "$http_status" != "200" ]; then
        alerts+=("API retornando status HTTP $http_status")
    fi

    # Verificar uso de memória
    if (( $(echo "$memory_usage > $MEMORY_THRESHOLD" | bc -l) )); then
        alerts+=("Uso de memória alto: ${memory_usage}% (threshold: ${MEMORY_THRESHOLD}%)")
    fi

    # Verificar uso de CPU
    if (( $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l) )); then
        alerts+=("Uso de CPU alto: ${cpu_usage}% (threshold: ${CPU_THRESHOLD}%)")
    fi

    # Verificar uso de disco
    if [ "$disk_usage" -gt 90 ]; then
        alerts+=("Uso de disco alto: ${disk_usage}%")
    fi

    # Enviar alertas
    for alert in "${alerts[@]}"; do
        send_alert "$alert" "warning"
    done

    # Retornar número de alertas
    echo "${#alerts[@]}"
}

# Verificar logs de erro
check_error_logs() {
    local log_file=".tmp/logs/strapi.log"

    if [ -f "$log_file" ]; then
        # Contar erros nas últimas 50 linhas
        local error_count=$(tail -50 "$log_file" | grep -i "error\|fatal\|exception" | wc -l)

        if [ $error_count -gt 5 ]; then
            send_alert "Muitos erros nos logs: $error_count erros nas últimas 50 linhas" "error"
        fi
    fi
}

# Verificar conectividade de rede
check_network() {
    if ! ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        send_alert "Problemas de conectividade de rede" "critical"
    fi
}

# Verificar espaço em disco
check_disk_space() {
    local available_kb=$(df . | awk 'NR==2 {print $4}')

    if [ $available_kb -lt 1048576 ]; then # 1GB em KB
        send_alert "Pouco espaço em disco disponível: $(df -h . | awk 'NR==2 {print $4}')" "warning"
    fi
}

# Função principal de monitoramento
monitor_cycle() {
    log "🔄 Iniciando ciclo de monitoramento..."

    # Coletar métricas
    local metrics=$(collect_metrics)

    # Analisar métricas
    local alert_count=$(analyze_metrics "$metrics")

    # Verificações adicionais
    check_error_logs
    check_network
    check_disk_space

    # Log do ciclo
    if [ $alert_count -eq 0 ]; then
        success "Ciclo de monitoramento concluído - Sistema saudável"
    else
        warning "Ciclo de monitoramento concluído - $alert_count alertas gerados"
    fi

    # Salvar estatísticas
    local stats="{\"timestamp\":\"$(date -Iseconds)\",\"alerts_generated\":$alert_count,\"cycle_duration\":\"${CHECK_INTERVAL}s\"}"
    echo "$stats" >> "./logs/monitor_stats.json"
}

# Função para parar monitoramento
stop_monitoring() {
    log "🛑 Parando monitoramento..."
    success "Monitoramento parado com sucesso"
    exit 0
}

# Função principal
main() {
    log "🚀 Iniciando monitoramento contínuo da RootGames API..."
    log "📊 Configurações:"
    log "  - Intervalo de verificação: ${CHECK_INTERVAL}s"
    log "  - Log file: $LOG_FILE"
    log "  - Alert log: $ALERT_LOG"
    log "  - Metrics file: $METRICS_FILE"
    log "  - Cooldown de alertas: ${ALERT_COOLDOWN}s"
    log "  - Máximo de alertas por hora: $MAX_ALERTS_PER_HOUR"

    # Verificar configurações de alerta
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        log "  - Slack alerts: habilitado"
    fi
    if [ -n "$DISCORD_WEBHOOK_URL" ]; then
        log "  - Discord alerts: habilitado"
    fi
    if [ -n "$ALERT_EMAIL" ]; then
        log "  - Email alerts: habilitado"
    fi

    # Configurar trap para parar monitoramento
    trap stop_monitoring SIGINT SIGTERM

    # Loop principal de monitoramento
    while true; do
        monitor_cycle
        sleep $CHECK_INTERVAL
    done
}

# Executar função principal
main "$@"
