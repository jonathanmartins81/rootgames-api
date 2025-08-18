#!/bin/bash
# scripts/health-check-improved.sh - Health check avançado com métricas e alertas

set -euo pipefail

# ===================================================================
# CONFIGURAÇÕES E INICIALIZAÇÃO
# ===================================================================

# Carregar biblioteca comum
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# Configurações específicas do health check
API_URL="$(get_config API_URL "http://localhost:1337")"
DB_HOST="$(get_config DB_HOST "127.0.0.1")"
DB_PORT="$(get_config DB_PORT "5432")"
DB_NAME="$(get_config DB_NAME "rootgames")"
DB_USER="$(get_config DB_USER "rootgames")"
DB_PASS="$(get_config DB_PASS "")"
TIMEOUT="$(get_config HEALTH_CHECK_TIMEOUT "30")"
RETRIES="$(get_config HEALTH_CHECK_RETRIES "3")"
AUTO_ROLLBACK="$(get_config AUTO_ROLLBACK "false")"
WEBHOOK_URL="$(get_config HEALTH_WEBHOOK_URL "")"
ALERT_THRESHOLDS_CPU="$(get_config ALERT_THRESHOLD_CPU "80")"
ALERT_THRESHOLDS_MEMORY="$(get_config ALERT_THRESHOLD_MEMORY "85")"
ALERT_THRESHOLDS_DISK="$(get_config ALERT_THRESHOLD_DISK "90")"
PERFORMANCE_LOG="$(get_config PERFORMANCE_LOG "$LOG_DIR/performance.log")"

# Estrutura para armazenar resultados dos checks
declare -A CHECK_RESULTS
declare -A CHECK_METRICS
declare -A CHECK_DETAILS

# ===================================================================
# FUNÇÕES DE VERIFICAÇÃO
# ===================================================================

# Verificar endpoint da API
check_api_endpoint() {
    log_info "Verificando endpoint da API..."
    
    local endpoint="$1"
    local expected_status="${2:-200}"
    local start_time=$(date +%s%N)
    
    local response_code=""
    local response_time=""
    local response_body=""
    
    if command_exists curl; then
        local curl_output=$(mktemp)
        response_code=$(curl -s -o "$curl_output" -w "%{http_code}" \
            --max-time "$TIMEOUT" \
            --connect-timeout 10 \
            "$endpoint" 2>/dev/null || echo "000")
        response_body=$(cat "$curl_output" 2>/dev/null || echo "")
        rm -f "$curl_output"
    else
        log_error "curl não disponível para verificação da API"
        CHECK_RESULTS["api_$endpoint"]="FAIL"
        CHECK_DETAILS["api_$endpoint"]="curl não disponível"
        return 1
    fi
    
    local end_time=$(date +%s%N)
    response_time=$(( (end_time - start_time) / 1000000 )) # ms
    
    # Armazenar métricas
    CHECK_METRICS["api_${endpoint}_response_time"]="$response_time"
    CHECK_METRICS["api_${endpoint}_status_code"]="$response_code"
    
    # Verificar resultado
    if [[ "$response_code" == "$expected_status" ]]; then
        CHECK_RESULTS["api_$endpoint"]="PASS"
        CHECK_DETAILS["api_$endpoint"]="Status: $response_code, Tempo: ${response_time}ms"
        log_success "API endpoint OK: $endpoint (${response_time}ms)"
        
        # Log de performance
        echo "$(date -Iseconds),api_endpoint,$endpoint,$response_code,$response_time" >> "$PERFORMANCE_LOG"
        
        return 0
    else
        CHECK_RESULTS["api_$endpoint"]="FAIL"
        CHECK_DETAILS["api_$endpoint"]="Status: $response_code (esperado: $expected_status), Tempo: ${response_time}ms"
        log_error "API endpoint falhou: $endpoint - Status: $response_code"
        return 1
    fi
}

# Verificar endpoints específicos da API
check_api_endpoints() {
    log_info "Verificando endpoints específicos da API..."
    
    local endpoints=(
        "$API_URL/api/games:200"
        "$API_URL/api/categories:200"
        "$API_URL/api/platforms:200"
        "$API_URL/api/developers:200"
        "$API_URL/api/publishers:200"
        "$API_URL/_health:200"
        "$API_URL/admin:200"
    )
    
    local failed_endpoints=0
    local total_response_time=0
    
    for endpoint_config in "${endpoints[@]}"; do
        local endpoint="${endpoint_config%:*}"
        local expected_status="${endpoint_config#*:}"
        
        if check_api_endpoint "$endpoint" "$expected_status"; then
            total_response_time=$((total_response_time + CHECK_METRICS["api_${endpoint}_response_time"]))
        else
            ((failed_endpoints++))
        fi
    done
    
    # Calcular tempo médio de resposta
    local avg_response_time=$((total_response_time / ${#endpoints[@]}))
    CHECK_METRICS["api_avg_response_time"]="$avg_response_time"
    
    if [[ $failed_endpoints -eq 0 ]]; then
        log_success "Todos os endpoints da API estão funcionando (média: ${avg_response_time}ms)"
        return 0
    else
        log_error "$failed_endpoints de ${#endpoints[@]} endpoints falharam"
        return 1
    fi
}

# Verificar banco de dados com métricas
check_database_advanced() {
    log_info "Verificando banco de dados..."
    
    local start_time=$(date +%s%N)
    
    # Verificar conectividade
    if ! check_postgres_connection "$DB_HOST" "$DB_PORT" "$DB_NAME" "$DB_USER" "$DB_PASS"; then
        CHECK_RESULTS["database_connection"]="FAIL"
        CHECK_DETAILS["database_connection"]="Falha na conexão"
        log_error "Falha na conexão com banco de dados"
        return 1
    fi
    
    local end_time=$(date +%s%N)
    local connection_time=$(( (end_time - start_time) / 1000000 ))
    
    CHECK_METRICS["db_connection_time"]="$connection_time"
    CHECK_RESULTS["database_connection"]="PASS"
    CHECK_DETAILS["database_connection"]="Conectado em ${connection_time}ms"
    
    # Verificar métricas do banco
    local db_size=$(get_database_size "$DB_HOST" "$DB_PORT" "$DB_NAME" "$DB_USER" "$DB_PASS")
    CHECK_METRICS["db_size"]="$db_size"
    
    # Verificar número de conexões ativas
    local active_connections=""
    if active_connections=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | xargs); then
        CHECK_METRICS["db_active_connections"]="$active_connections"
    fi
    
    # Verificar locks
    local locks_count=""
    if locks_count=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_locks;" 2>/dev/null | xargs); then
        CHECK_METRICS["db_locks"]="$locks_count"
    fi
    
    log_success "Banco de dados OK - Tamanho: $db_size, Conexões: $active_connections, Locks: $locks_count"
    
    # Log de performance
    echo "$(date -Iseconds),database,connection,$connection_time,$db_size" >> "$PERFORMANCE_LOG"
    
    return 0
}

# Verificar recursos do sistema
check_system_resources() {
    log_info "Verificando recursos do sistema..."
    
    # CPU
    local cpu_usage=$(get_cpu_usage)
    CHECK_METRICS["system_cpu"]="$cpu_usage"
    
    if [[ $(echo "$cpu_usage > $ALERT_THRESHOLDS_CPU" | bc -l 2>/dev/null || echo "0") -eq 1 ]]; then
        CHECK_RESULTS["system_cpu"]="WARN"
        CHECK_DETAILS["system_cpu"]="CPU alto: ${cpu_usage}% (limite: ${ALERT_THRESHOLDS_CPU}%)"
        log_warning "Uso de CPU alto: ${cpu_usage}%"
    else
        CHECK_RESULTS["system_cpu"]="PASS"
        CHECK_DETAILS["system_cpu"]="CPU: ${cpu_usage}%"
    fi
    
    # Memória
    local memory_usage=$(get_memory_usage)
    CHECK_METRICS["system_memory"]="$memory_usage"
    
    if [[ $memory_usage -gt $ALERT_THRESHOLDS_MEMORY ]]; then
        CHECK_RESULTS["system_memory"]="WARN"
        CHECK_DETAILS["system_memory"]="Memória alta: ${memory_usage}% (limite: ${ALERT_THRESHOLDS_MEMORY}%)"
        log_warning "Uso de memória alto: ${memory_usage}%"
    else
        CHECK_RESULTS["system_memory"]="PASS"
        CHECK_DETAILS["system_memory"]="Memória: ${memory_usage}%"
    fi
    
    # Disco
    local disk_usage=$(get_disk_usage "$PROJECT_ROOT")
    CHECK_METRICS["system_disk"]="$disk_usage"
    
    if [[ $disk_usage -gt $ALERT_THRESHOLDS_DISK ]]; then
        CHECK_RESULTS["system_disk"]="WARN"
        CHECK_DETAILS["system_disk"]="Disco cheio: ${disk_usage}% (limite: ${ALERT_THRESHOLDS_DISK}%)"
        log_warning "Uso de disco alto: ${disk_usage}%"
    else
        CHECK_RESULTS["system_disk"]="PASS"
        CHECK_DETAILS["system_disk"]="Disco: ${disk_usage}%"
    fi
    
    # Load Average
    local load_avg=$(get_load_average)
    CHECK_METRICS["system_load"]="$load_avg"
    CHECK_RESULTS["system_load"]="PASS"
    CHECK_DETAILS["system_load"]="Load: $load_avg"
    
    log_success "Recursos do sistema - CPU: ${cpu_usage}%, Mem: ${memory_usage}%, Disco: ${disk_usage}%, Load: $load_avg"
    
    # Log de performance
    echo "$(date -Iseconds),system,resources,$cpu_usage,$memory_usage,$disk_usage,$load_avg" >> "$PERFORMANCE_LOG"
}

# Verificar conectividade de rede
check_network_connectivity() {
    log_info "Verificando conectividade de rede..."
    
    # Internet
    if check_internet; then
        CHECK_RESULTS["network_internet"]="PASS"
        CHECK_DETAILS["network_internet"]="Conectividade OK"
        log_success "Conectividade com internet OK"
    else
        CHECK_RESULTS["network_internet"]="FAIL"
        CHECK_DETAILS["network_internet"]="Sem conectividade"
        log_error "Falha na conectividade com internet"
    fi
    
    # DNS
    if nslookup google.com >/dev/null 2>&1; then
        CHECK_RESULTS["network_dns"]="PASS"
        CHECK_DETAILS["network_dns"]="DNS funcionando"
        log_success "Resolução DNS OK"
    else
        CHECK_RESULTS["network_dns"]="FAIL"
        CHECK_DETAILS["network_dns"]="Falha no DNS"
        log_error "Falha na resolução DNS"
    fi
    
    # Portas locais
    local ports_to_check=("$DB_PORT" "1337")
    for port in "${ports_to_check[@]}"; do
        if port_open "localhost" "$port"; then
            CHECK_RESULTS["network_port_$port"]="PASS"
            CHECK_DETAILS["network_port_$port"]="Porta $port aberta"
            log_success "Porta $port está aberta"
        else
            CHECK_RESULTS["network_port_$port"]="FAIL"
            CHECK_DETAILS["network_port_$port"]="Porta $port fechada"
            log_error "Porta $port não está acessível"
        fi
    done
}

# Verificar logs de erro
check_error_logs() {
    log_info "Verificando logs de erro..."
    
    local log_files=(
        "$LOG_DIR/$(date +%Y-%m-%d).log"
        "$PROJECT_ROOT/logs/strapi.log"
        "/var/log/postgresql/postgresql-*.log"
    )
    
    local error_count=0
    local warning_count=0
    
    for log_file_pattern in "${log_files[@]}"; do
        # Expandir padrão de arquivo
        for log_file in $log_file_pattern; do
            if [[ -f "$log_file" && -r "$log_file" ]]; then
                # Contar erros nas últimas 24 horas
                local recent_errors=$(grep -c "ERROR\|FATAL\|CRITICAL" "$log_file" 2>/dev/null || echo "0")
                local recent_warnings=$(grep -c "WARNING\|WARN" "$log_file" 2>/dev/null || echo "0")
                
                error_count=$((error_count + recent_errors))
                warning_count=$((warning_count + recent_warnings))
                
                log_debug "Log $log_file: $recent_errors erros, $recent_warnings warnings"
            fi
        done
    done
    
    CHECK_METRICS["logs_errors"]="$error_count"
    CHECK_METRICS["logs_warnings"]="$warning_count"
    
    if [[ $error_count -gt 10 ]]; then
        CHECK_RESULTS["logs_errors"]="FAIL"
        CHECK_DETAILS["logs_errors"]="Muitos erros: $error_count"
        log_error "Muitos erros nos logs: $error_count"
    elif [[ $error_count -gt 0 ]]; then
        CHECK_RESULTS["logs_errors"]="WARN"
        CHECK_DETAILS["logs_errors"]="Alguns erros: $error_count"
        log_warning "Erros encontrados nos logs: $error_count"
    else
        CHECK_RESULTS["logs_errors"]="PASS"
        CHECK_DETAILS["logs_errors"]="Sem erros críticos"
        log_success "Nenhum erro crítico nos logs"
    fi
}

# Verificar performance da aplicação
check_application_performance() {
    log_info "Verificando performance da aplicação..."
    
    # Teste de carga simples
    local start_time=$(date +%s%N)
    local successful_requests=0
    local failed_requests=0
    local total_requests=5
    
    for ((i=1; i<=total_requests; i++)); do
        if check_api_endpoint "$API_URL/api/games" "200" >/dev/null 2>&1; then
            ((successful_requests++))
        else
            ((failed_requests++))
        fi
    done
    
    local end_time=$(date +%s%N)
    local total_time=$(( (end_time - start_time) / 1000000 ))
    local avg_time=$((total_time / total_requests))
    
    CHECK_METRICS["perf_success_rate"]="$((successful_requests * 100 / total_requests))"
    CHECK_METRICS["perf_avg_response"]="$avg_time"
    
    if [[ $successful_requests -eq $total_requests ]]; then
        CHECK_RESULTS["performance"]="PASS"
        CHECK_DETAILS["performance"]="100% sucesso, média: ${avg_time}ms"
        log_success "Performance OK - 100% sucesso, média: ${avg_time}ms"
    else
        CHECK_RESULTS["performance"]="FAIL"
        CHECK_DETAILS["performance"]="$failed_requests/$total_requests falharam"
        log_error "Performance degradada - $failed_requests de $total_requests requests falharam"
    fi
    
    # Log de performance
    echo "$(date -Iseconds),performance,load_test,$successful_requests,$failed_requests,$avg_time" >> "$PERFORMANCE_LOG"
}

# ===================================================================
# FUNÇÕES DE RELATÓRIO E ALERTAS
# ===================================================================

# Gerar relatório de saúde
generate_health_report() {
    log_info "Gerando relatório de saúde..."
    
    local report_file="$LOG_DIR/health_report_$(date +%Y%m%d_%H%M%S).json"
    local timestamp=$(date -Iseconds)
    
    # Contar resultados
    local pass_count=0
    local warn_count=0
    local fail_count=0
    
    for result in "${CHECK_RESULTS[@]}"; do
        case "$result" in
            "PASS") ((pass_count++)) ;;
            "WARN") ((warn_count++)) ;;
            "FAIL") ((fail_count++)) ;;
        esac
    done
    
    # Determinar status geral
    local overall_status="HEALTHY"
    if [[ $fail_count -gt 0 ]]; then
        overall_status="UNHEALTHY"
    elif [[ $warn_count -gt 0 ]]; then
        overall_status="WARNING"
    fi
    
    # Gerar JSON
    cat > "$report_file" << EOF
{
    "timestamp": "$timestamp",
    "overall_status": "$overall_status",
    "summary": {
        "total_checks": $((pass_count + warn_count + fail_count)),
        "passed": $pass_count,
        "warnings": $warn_count,
        "failed": $fail_count
    },
    "checks": {
EOF
    
    # Adicionar resultados dos checks
    local first=true
    for check in "${!CHECK_RESULTS[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$report_file"
        fi
        
        echo -n "        \"$check\": {" >> "$report_file"
        echo -n "\"status\": \"${CHECK_RESULTS[$check]}\", " >> "$report_file"
        echo -n "\"details\": \"${CHECK_DETAILS[$check]}\"" >> "$report_file"
        echo -n "}" >> "$report_file"
    done
    
    cat >> "$report_file" << EOF

    },
    "metrics": {
EOF
    
    # Adicionar métricas
    first=true
    for metric in "${!CHECK_METRICS[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$report_file"
        fi
        echo -n "        \"$metric\": \"${CHECK_METRICS[$metric]}\"" >> "$report_file"
    done
    
    cat >> "$report_file" << EOF

    },
    "system_info": {
        "hostname": "$(hostname)",
        "uptime": "$(uptime -p 2>/dev/null || echo "unknown")",
        "load_average": "$(get_load_average)",
        "public_ip": "$(get_public_ip)"
    }
}
EOF
    
    log_success "Relatório de saúde gerado: $(basename "$report_file")"
    echo "$report_file"
}

# Enviar alertas
send_health_alerts() {
    local overall_status="$1"
    local report_file="$2"
    
    if [[ -z "$WEBHOOK_URL" ]]; then
        log_debug "Webhook não configurado, pulando alertas"
        return 0
    fi
    
    local message=""
    local level=""
    
    case "$overall_status" in
        "HEALTHY")
            message="✅ Sistema saudável - Todos os checks passaram"
            level="success"
            ;;
        "WARNING")
            message="⚠️ Sistema com avisos - Alguns checks falharam"
            level="warning"
            ;;
        "UNHEALTHY")
            message="❌ Sistema não saudável - Checks críticos falharam"
            level="error"
            ;;
    esac
    
    # Adicionar métricas importantes ao alerta
    if [[ -n "${CHECK_METRICS[api_avg_response_time]:-}" ]]; then
        message="$message (API: ${CHECK_METRICS[api_avg_response_time]}ms"
    fi
    
    if [[ -n "${CHECK_METRICS[system_cpu]:-}" ]]; then
        message="$message, CPU: ${CHECK_METRICS[system_cpu]}%"
    fi
    
    if [[ -n "${CHECK_METRICS[system_memory]:-}" ]]; then
        message="$message, Mem: ${CHECK_METRICS[system_memory]}%)"
    fi
    
    send_webhook_notification "$WEBHOOK_URL" "$message" "$level"
    log_success "Alerta enviado: $message"
}

# ===================================================================
# FUNÇÃO PRINCIPAL
# ===================================================================

main() {
    log_info "🔍 Iniciando health check avançado do RootGames API"
    log_info "Versão do script: 2.0.0 (melhorado)"
    
    local start_time=$(date +%s)
    
    # Criar diretório de logs de performance
    mkdir -p "$(dirname "$PERFORMANCE_LOG")"
    
    # Executar todos os checks
    log_info "Executando verificações de saúde..."
    
    check_api_endpoints || true
    check_database_advanced || true
    check_system_resources || true
    check_network_connectivity || true
    check_error_logs || true
    check_application_performance || true
    
    # Gerar relatório
    local report_file=$(generate_health_report)
    
    # Determinar status geral
    local fail_count=0
    local warn_count=0
    
    for result in "${CHECK_RESULTS[@]}"; do
        case "$result" in
            "WARN") ((warn_count++)) ;;
            "FAIL") ((fail_count++)) ;;
        esac
    done
    
    local overall_status="HEALTHY"
    if [[ $fail_count -gt 0 ]]; then
        overall_status="UNHEALTHY"
    elif [[ $warn_count -gt 0 ]]; then
        overall_status="WARNING"
    fi
    
    # Enviar alertas
    send_health_alerts "$overall_status" "$report_file"
    
    # Calcular tempo total
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Log final
    case "$overall_status" in
        "HEALTHY")
            log_success "✅ Sistema saudável - Todos os checks passaram (${duration}s)"
            ;;
        "WARNING")
            log_warning "⚠️ Sistema com avisos - $warn_count warnings detectados (${duration}s)"
            ;;
        "UNHEALTHY")
            log_error "❌ Sistema não saudável - $fail_count checks falharam (${duration}s)"
            
            # Executar rollback automático se configurado
            if [[ "$AUTO_ROLLBACK" == "true" ]]; then
                log_info "Executando rollback automático..."
                if [[ -x "$SCRIPT_DIR/rollback.sh" ]]; then
                    "$SCRIPT_DIR/rollback.sh" --auto
                else
                    log_error "Script de rollback não encontrado"
                fi
            fi
            
            exit 1
            ;;
    esac
    
    log_info "🎉 Health check finalizado"
    
    # Retornar código apropriado
    case "$overall_status" in
        "HEALTHY") exit 0 ;;
        "WARNING") exit 1 ;;
        "UNHEALTHY") exit 2 ;;
    esac
}

# ===================================================================
# EXECUÇÃO
# ===================================================================

# Verificar se está sendo executado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
