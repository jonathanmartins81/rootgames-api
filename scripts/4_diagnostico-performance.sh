#!/bin/bash
# scripts/4_diagnostico-performance.sh - Análise de performance e otimização
# Sequência: 4 - Métricas de performance e gargalos

set -euo pipefail

# Carregar biblioteca comum
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# Configurações
REPORT_DIR="$PROJECT_ROOT/reports"
SEQUENCE_LOG="$LOG_DIR/diagnostic_sequence.log"
PERF_REPORT="$REPORT_DIR/performance_$(date +%Y%m%d_%H%M%S).json"

# Estruturas para dados
declare -A PERF_METRICS
declare -A PERF_ISSUES
declare -A PERF_RECOMMENDATIONS

# Inicializar etapa
init_step() {
    log_info "⚡ ETAPA 4/7: Diagnóstico de Performance"
    echo "$(date -Iseconds) - Etapa 4: Diagnóstico de performance iniciado" >> "$SEQUENCE_LOG"
    
    # Atualizar status
    if command_exists jq && [[ -f "$REPORT_DIR/diagnostic_status.json" ]]; then
        jq '.steps."4".status = "running" | .steps."4".start = "'$(date -Iseconds)'" | .current_step = 4' \
           "$REPORT_DIR/diagnostic_status.json" > "$REPORT_DIR/diagnostic_status.tmp" && \
           mv "$REPORT_DIR/diagnostic_status.tmp" "$REPORT_DIR/diagnostic_status.json"
    fi
}

# Analisar performance do sistema
analyze_system_performance() {
    log_section "🖥️ Performance do Sistema"
    
    # CPU
    PERF_METRICS[cpu_usage]=$(get_cpu_usage)
    PERF_METRICS[cpu_cores]=$(nproc)
    PERF_METRICS[load_average]=$(get_load_average)
    
    log_info "CPU: ${PERF_METRICS[cpu_usage]}% (${PERF_METRICS[cpu_cores]} cores)"
    log_info "Load average: ${PERF_METRICS[load_average]}"
    
    # Verificar se CPU está sobrecarregada
    if (( $(echo "${PERF_METRICS[cpu_usage]} > 80" | bc -l 2>/dev/null || echo 0) )); then
        PERF_ISSUES[high_cpu]="Alto uso de CPU: ${PERF_METRICS[cpu_usage]}%"
        PERF_RECOMMENDATIONS[cpu_optimization]="Investigar processos com alto uso de CPU"
    fi
    
    # Memória
    PERF_METRICS[memory_usage]=$(get_memory_usage)
    if [[ -f /proc/meminfo ]]; then
        local total_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
        local available_kb=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
        PERF_METRICS[memory_total_gb]=$(echo "scale=2; $total_kb / 1024 / 1024" | bc)
        PERF_METRICS[memory_available_gb]=$(echo "scale=2; $available_kb / 1024 / 1024" | bc)
    fi
    
    log_info "Memória: ${PERF_METRICS[memory_usage]}% (${PERF_METRICS[memory_available_gb]}GB disponível)"
    
    if (( $(echo "${PERF_METRICS[memory_usage]} > 85" | bc -l 2>/dev/null || echo 0) )); then
        PERF_ISSUES[high_memory]="Alto uso de memória: ${PERF_METRICS[memory_usage]}%"
        PERF_RECOMMENDATIONS[memory_optimization]="Considerar otimização de memória ou upgrade"
    fi
    
    # Disco
    PERF_METRICS[disk_usage]=$(get_disk_usage)
    local disk_info=$(df -h . | tail -1)
    PERF_METRICS[disk_total]=$(echo "$disk_info" | awk '{print $2}')
    PERF_METRICS[disk_available]=$(echo "$disk_info" | awk '{print $4}')
    
    log_info "Disco: ${PERF_METRICS[disk_usage]}% usado (${PERF_METRICS[disk_available]} disponível)"
    
    if (( ${PERF_METRICS[disk_usage]} > 90 )); then
        PERF_ISSUES[high_disk]="Disco quase cheio: ${PERF_METRICS[disk_usage]}%"
        PERF_RECOMMENDATIONS[disk_cleanup]="Executar limpeza de disco"
    fi
}

# Testar performance da API
test_api_performance() {
    log_section "🌐 Performance da API"
    
    local api_url=$(get_config API_URL "http://localhost:1337")
    local endpoints=("/api/games" "/api/categories" "/_health")
    
    local total_response_time=0
    local successful_requests=0
    
    for endpoint in "${endpoints[@]}"; do
        local full_url="$api_url$endpoint"
        
        if command_exists curl; then
            log_info "Testando: $endpoint"
            
            # Fazer 3 requisições para cada endpoint
            for i in {1..3}; do
                local start_time=$(date +%s%N)
                local response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$full_url" 2>/dev/null || echo "000")
                local end_time=$(date +%s%N)
                
                if [[ "$response_code" =~ ^[23] ]]; then
                    local response_time=$(( (end_time - start_time) / 1000000 ))
                    total_response_time=$((total_response_time + response_time))
                    ((successful_requests++))
                    log_success "  Tentativa $i: ${response_time}ms (${response_code})"
                else
                    log_warning "  Tentativa $i: Falha (${response_code})"
                fi
            done
        fi
    done
    
    if [[ $successful_requests -gt 0 ]]; then
        PERF_METRICS[avg_response_time]=$((total_response_time / successful_requests))
        PERF_METRICS[successful_requests]=$successful_requests
        PERF_METRICS[total_requests]=$((${#endpoints[@]} * 3))
        PERF_METRICS[success_rate]=$(echo "scale=0; $successful_requests * 100 / ${PERF_METRICS[total_requests]}" | bc)
        
        log_success "Tempo médio de resposta: ${PERF_METRICS[avg_response_time]}ms"
        log_success "Taxa de sucesso: ${PERF_METRICS[success_rate]}%"
        
        # Verificar se API está lenta
        if (( ${PERF_METRICS[avg_response_time]} > 2000 )); then
            PERF_ISSUES[slow_api]="API lenta: ${PERF_METRICS[avg_response_time]}ms"
            PERF_RECOMMENDATIONS[api_optimization]="Otimizar consultas e cache"
        fi
        
        # Verificar taxa de sucesso
        if (( ${PERF_METRICS[success_rate]} < 90 )); then
            PERF_ISSUES[low_success_rate]="Baixa taxa de sucesso: ${PERF_METRICS[success_rate]}%"
            PERF_RECOMMENDATIONS[api_stability]="Investigar falhas na API"
        fi
    else
        PERF_ISSUES[api_unavailable]="API completamente indisponível"
        PERF_RECOMMENDATIONS[api_restart]="Verificar se aplicação está rodando"
    fi
}

# Analisar performance do banco de dados
analyze_database_performance() {
    log_section "🗄️ Performance do Banco"
    
    load_env_file
    local db_host=$(get_config DB_HOST "127.0.0.1")
    local db_port=$(get_config DB_PORT "5432")
    local db_name=$(get_config DB_NAME "rootgames")
    local db_user=$(get_config DB_USER "rootgames")
    
    if check_postgres_connection "$db_host" "$db_port" "$db_name" "$db_user"; then
        log_success "Conexão com banco: OK"
        
        # Testar tempo de resposta do banco
        if command_exists psql; then
            local start_time=$(date +%s%N)
            PGPASSWORD="${DB_PASS}" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -c "SELECT 1;" >/dev/null 2>&1
            local end_time=$(date +%s%N)
            
            PERF_METRICS[db_response_time]=$(( (end_time - start_time) / 1000000 ))
            log_success "Tempo de resposta do banco: ${PERF_METRICS[db_response_time]}ms"
            
            if (( ${PERF_METRICS[db_response_time]} > 1000 )); then
                PERF_ISSUES[slow_database]="Banco lento: ${PERF_METRICS[db_response_time]}ms"
                PERF_RECOMMENDATIONS[db_optimization]="Otimizar índices e consultas"
            fi
            
            # Obter estatísticas do banco
            local db_size=$(get_database_size "$db_host" "$db_port" "$db_name" "$db_user")
            PERF_METRICS[db_size]="$db_size"
            log_info "Tamanho do banco: $db_size"
            
            # Contar conexões ativas
            local active_connections=$(PGPASSWORD="${DB_PASS}" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | xargs || echo "0")
            PERF_METRICS[active_connections]="$active_connections"
            log_info "Conexões ativas: $active_connections"
        fi
    else
        PERF_ISSUES[db_connection_failed]="Falha na conexão com banco"
        PERF_RECOMMENDATIONS[db_check]="Verificar se PostgreSQL está rodando"
    fi
}

# Analisar tamanho e estrutura do projeto
analyze_project_size() {
    log_section "📁 Análise do Projeto"
    
    # Tamanho total do projeto
    PERF_METRICS[project_size]=$(du -sh "$PROJECT_ROOT" 2>/dev/null | cut -f1 || echo "N/A")
    log_info "Tamanho total do projeto: ${PERF_METRICS[project_size]}"
    
    # node_modules
    if [[ -d "$PROJECT_ROOT/node_modules" ]]; then
        PERF_METRICS[node_modules_size]=$(du -sh "$PROJECT_ROOT/node_modules" 2>/dev/null | cut -f1 || echo "N/A")
        log_info "Tamanho node_modules: ${PERF_METRICS[node_modules_size]}"
    fi
    
    # Logs
    if [[ -d "$LOG_DIR" ]]; then
        PERF_METRICS[logs_size]=$(du -sh "$LOG_DIR" 2>/dev/null | cut -f1 || echo "N/A")
        PERF_METRICS[log_files_count]=$(find "$LOG_DIR" -name "*.log" -type f | wc -l)
        log_info "Logs: ${PERF_METRICS[logs_size]} (${PERF_METRICS[log_files_count]} arquivos)"
        
        # Verificar se logs estão muito grandes
        local logs_size_mb=$(du -sm "$LOG_DIR" 2>/dev/null | cut -f1 || echo "0")
        if (( logs_size_mb > 100 )); then
            PERF_ISSUES[large_logs]="Logs muito grandes: ${PERF_METRICS[logs_size]}"
            PERF_RECOMMENDATIONS[log_rotation]="Implementar rotação de logs"
        fi
    fi
    
    # Backups
    if [[ -d "$BACKUP_DIR" ]]; then
        PERF_METRICS[backups_size]=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "N/A")
        PERF_METRICS[backup_files_count]=$(find "$BACKUP_DIR" -name "*.sql" -o -name "*.tar.gz" | wc -l)
        log_info "Backups: ${PERF_METRICS[backups_size]} (${PERF_METRICS[backup_files_count]} arquivos)"
    fi
    
    # Contar arquivos TypeScript/JavaScript
    PERF_METRICS[ts_files]=$(find "$PROJECT_ROOT/src" -name "*.ts" -type f 2>/dev/null | wc -l || echo "0")
    PERF_METRICS[js_files]=$(find "$PROJECT_ROOT/src" -name "*.js" -type f 2>/dev/null | wc -l || echo "0")
    log_info "Arquivos TS: ${PERF_METRICS[ts_files]}, JS: ${PERF_METRICS[js_files]}"
}

# Verificar processos em execução
check_running_processes() {
    log_section "🔄 Processos em Execução"
    
    # Processos Node.js
    local node_processes=$(pgrep -f "node" | wc -l)
    PERF_METRICS[node_processes]=$node_processes
    log_info "Processos Node.js: $node_processes"
    
    # Processos PostgreSQL
    local postgres_processes=$(pgrep -f "postgres" | wc -l)
    PERF_METRICS[postgres_processes]=$postgres_processes
    log_info "Processos PostgreSQL: $postgres_processes"
    
    # Uso de memória por processo Node.js
    if command_exists ps && [[ $node_processes -gt 0 ]]; then
        local node_memory=$(ps -C node -o pid,rss --no-headers 2>/dev/null | awk '{sum+=$2} END {print sum/1024}' || echo "0")
        PERF_METRICS[node_memory_mb]=$(printf "%.0f" "$node_memory")
        log_info "Memória usada por Node.js: ${PERF_METRICS[node_memory_mb]}MB"
        
        if (( ${PERF_METRICS[node_memory_mb]} > 1000 )); then
            PERF_ISSUES[high_node_memory]="Alto uso de memória pelo Node.js: ${PERF_METRICS[node_memory_mb]}MB"
            PERF_RECOMMENDATIONS[node_memory_optimization]="Otimizar uso de memória na aplicação"
        fi
    fi
}

# Gerar recomendações de otimização
generate_optimization_recommendations() {
    log_section "💡 Recomendações de Otimização"
    
    # Recomendações baseadas nas métricas coletadas
    
    # Performance geral
    if [[ ${#PERF_ISSUES[@]} -eq 0 ]]; then
        PERF_RECOMMENDATIONS[general]="Sistema com boa performance geral"
    else
        PERF_RECOMMENDATIONS[general]="Foram identificados ${#PERF_ISSUES[@]} problemas de performance"
    fi
    
    # Cache
    if (( ${PERF_METRICS[avg_response_time]:-0} > 500 )); then
        PERF_RECOMMENDATIONS[implement_cache]="Implementar cache Redis para melhorar tempo de resposta"
    fi
    
    # Banco de dados
    if (( ${PERF_METRICS[db_response_time]:-0} > 100 )); then
        PERF_RECOMMENDATIONS[db_indexes]="Revisar e otimizar índices do banco de dados"
    fi
    
    # Monitoramento
    PERF_RECOMMENDATIONS[monitoring]="Implementar monitoramento contínuo com alertas"
    
    # Logs
    if [[ -n "${PERF_ISSUES[large_logs]:-}" ]]; then
        PERF_RECOMMENDATIONS[log_management]="Configurar rotação automática de logs"
    fi
    
    log_info "Geradas ${#PERF_RECOMMENDATIONS[@]} recomendações de otimização"
}

# Gerar relatório de performance
generate_performance_report() {
    log_section "📄 Gerando Relatório de Performance"
    
    cat > "$PERF_REPORT" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "step": 4,
  "step_name": "diagnostico-performance",
  "metrics": {
EOF

    # Adicionar métricas
    local first=true
    for key in "${!PERF_METRICS[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$PERF_REPORT"
        fi
        echo "    \"$key\": \"${PERF_METRICS[$key]}\"" >> "$PERF_REPORT"
    done

    cat >> "$PERF_REPORT" << EOF
  },
  "issues": {
EOF

    # Adicionar problemas
    first=true
    for key in "${!PERF_ISSUES[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$PERF_REPORT"
        fi
        echo "    \"$key\": \"${PERF_ISSUES[$key]}\"" >> "$PERF_REPORT"
    done

    cat >> "$PERF_REPORT" << EOF
  },
  "recommendations": {
EOF

    # Adicionar recomendações
    first=true
    for key in "${!PERF_RECOMMENDATIONS[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$PERF_REPORT"
        fi
        echo "    \"$key\": \"${PERF_RECOMMENDATIONS[$key]}\"" >> "$PERF_REPORT"
    done

    cat >> "$PERF_REPORT" << EOF
  }
}
EOF

    log_success "Relatório de performance salvo: $PERF_REPORT"
}

# Finalizar etapa
finalize_step() {
    local issues_count=${#PERF_ISSUES[@]}
    
    if [[ $issues_count -eq 0 ]]; then
        log_success "✅ Etapa 4 concluída: Performance adequada"
        echo "$(date -Iseconds) - Etapa 4 concluída: SUCESSO" >> "$SEQUENCE_LOG"
    else
        log_warning "⚠️ Etapa 4 concluída com $issues_count problema(s) de performance"
        echo "$(date -Iseconds) - Etapa 4 concluída: $issues_count problemas" >> "$SEQUENCE_LOG"
    fi
    
    # Atualizar status
    if command_exists jq; then
        jq '.steps."4".status = "completed" | .steps."4".end = "'$(date -Iseconds)'" | .current_step = 5' \
           "$REPORT_DIR/diagnostic_status.json" > "$REPORT_DIR/diagnostic_status.tmp" && \
           mv "$REPORT_DIR/diagnostic_status.tmp" "$REPORT_DIR/diagnostic_status.json"
    fi
    
    log_info "🔄 Próximo passo: ./scripts/5_diagnostico-seguranca.sh"
}

# Função principal
main() {
    init_step
    analyze_system_performance
    test_api_performance
    analyze_database_performance
    analyze_project_size
    check_running_processes
    generate_optimization_recommendations
    generate_performance_report
    finalize_step
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
