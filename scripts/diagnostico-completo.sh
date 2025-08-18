#!/bin/bash
# scripts/diagnostico-completo.sh - Diagnóstico Completo do Projeto RootGames API
# Versão: 2.0.0 - Agosto 2025

set -euo pipefail

# Carregar biblioteca comum
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# Configurações
REPORT_DIR="$PROJECT_ROOT/reports"
REPORT_FILE="$REPORT_DIR/diagnostico_$(date +%Y%m%d_%H%M%S).json"
HTML_REPORT="$REPORT_DIR/diagnostico_$(date +%Y%m%d_%H%M%S).html"

mkdir -p "$REPORT_DIR"

# Estruturas para dados
declare -A DIAGNOSTICO
declare -A METRICAS
declare -A PROBLEMAS
declare -A RECOMENDACOES

# Inicializar diagnóstico
init_diagnostico() {
    log_info "🚀 Iniciando Diagnóstico Completo do RootGames API"
    DIAGNOSTICO[timestamp]=$(date -Iseconds)
    DIAGNOSTICO[version]="2.0.0"
    DIAGNOSTICO[start_time]=$(date +%s)
}

# Verificar sistema
check_system_info() {
    log_section "🖥️ Sistema"
    DIAGNOSTICO[os]=$(uname -s)
    DIAGNOSTICO[os_version]=$(uname -r)
    METRICAS[cpu_cores]=$(nproc 2>/dev/null || echo "N/A")
    METRICAS[memory_total]=$(free -h | awk '/^Mem:/ {print $2}' 2>/dev/null || echo "N/A")
    METRICAS[disk_usage]=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
    log_success "Sistema: ${DIAGNOSTICO[os]} ${DIAGNOSTICO[os_version]}"
}

# Verificar Node.js
check_nodejs_environment() {
    log_section "🟢 Node.js"
    if command_exists node; then
        DIAGNOSTICO[node_version]=$(node --version)
        local node_major=$(echo "${DIAGNOSTICO[node_version]}" | sed 's/v//' | cut -d. -f1)
        if [[ $node_major -ge 20 ]]; then
            DIAGNOSTICO[node_compatible]="true"
        else
            PROBLEMAS[node_version]="Node.js ${DIAGNOSTICO[node_version]} < 20.0.0"
            RECOMENDACOES[node_update]="Atualizar Node.js para versão 20+"
        fi
        log_success "Node.js: ${DIAGNOSTICO[node_version]}"
    else
        PROBLEMAS[node_missing]="Node.js não instalado"
        RECOMENDACOES[node_install]="Instalar Node.js 20+"
    fi
    
    if command_exists yarn; then
        DIAGNOSTICO[yarn_version]=$(yarn --version)
        log_success "Yarn: ${DIAGNOSTICO[yarn_version]}"
    else
        PROBLEMAS[yarn_missing]="Yarn não instalado"
    fi
}

# Verificar projeto
check_strapi_project() {
    log_section "🎮 Projeto Strapi"
    if [[ -f "$PROJECT_ROOT/package.json" ]]; then
        DIAGNOSTICO[package_json]="true"
        if command_exists jq; then
            DIAGNOSTICO[project_version]=$(jq -r '.version // "N/A"' "$PROJECT_ROOT/package.json")
            DIAGNOSTICO[strapi_version]=$(jq -r '.dependencies["@strapi/strapi"] // "N/A"' "$PROJECT_ROOT/package.json")
        fi
        log_success "package.json encontrado"
    else
        PROBLEMAS[package_json_missing]="package.json não encontrado"
    fi
    
    if [[ -d "$PROJECT_ROOT/node_modules" ]]; then
        DIAGNOSTICO[node_modules]="true"
        log_success "node_modules presente"
    else
        PROBLEMAS[node_modules_missing]="node_modules ausente"
        RECOMENDACOES[install_deps]="Executar 'yarn install'"
    fi
}

# Verificar banco
check_database() {
    log_section "🗄️ Banco de Dados"
    local db_host=$(get_config DB_HOST "127.0.0.1")
    local db_port=$(get_config DB_PORT "5432")
    local db_name=$(get_config DB_NAME "rootgames")
    local db_user=$(get_config DB_USER "rootgames")
    
    if command_exists psql; then
        DIAGNOSTICO[postgres_client]="true"
        log_success "PostgreSQL client disponível"
    else
        PROBLEMAS[postgres_client_missing]="Cliente PostgreSQL ausente"
    fi
    
    if check_postgres_connection "$db_host" "$db_port" "$db_name" "$db_user"; then
        DIAGNOSTICO[db_connection]="true"
        log_success "Conexão com banco: OK"
    else
        PROBLEMAS[db_connection_failed]="Falha na conexão com banco"
    fi
}

# Verificar API
check_api_endpoints() {
    log_section "🌐 API"
    local api_url=$(get_config API_URL "http://localhost:1337")
    local endpoints=("/api/health" "/admin")
    local success=0
    
    for endpoint in "${endpoints[@]}"; do
        if command_exists curl; then
            local code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$api_url$endpoint" 2>/dev/null || echo "000")
            if [[ "$code" =~ ^[23] ]]; then
                ((success++))
                log_success "$endpoint: $code ✓"
            else
                log_warning "$endpoint: $code"
            fi
        fi
    done
    
    METRICAS[endpoint_success_rate]=$(echo "scale=0; $success * 100 / ${#endpoints[@]}" | bc 2>/dev/null || echo "0")
}

# Verificar performance
check_system_performance() {
    log_section "⚡ Performance"
    METRICAS[cpu_usage]=$(get_cpu_usage)
    METRICAS[memory_usage]=$(get_memory_usage)
    
    if (( $(echo "${METRICAS[cpu_usage]} > 80" | bc -l 2>/dev/null || echo 0) )); then
        PROBLEMAS[high_cpu]="Alto uso de CPU: ${METRICAS[cpu_usage]}%"
    fi
    
    if (( $(echo "${METRICAS[memory_usage]} > 85" | bc -l 2>/dev/null || echo 0) )); then
        PROBLEMAS[high_memory]="Alto uso de memória: ${METRICAS[memory_usage]}%"
    fi
    
    log_info "CPU: ${METRICAS[cpu_usage]}% | Memória: ${METRICAS[memory_usage]}%"
}

# Gerar relatório
generate_report() {
    log_info "📄 Gerando relatório..."
    
    local total_problems=${#PROBLEMAS[@]}
    local health_status="Excelente"
    
    if [[ $total_problems -gt 5 ]]; then
        health_status="Crítico"
    elif [[ $total_problems -gt 2 ]]; then
        health_status="Atenção"
    elif [[ $total_problems -gt 0 ]]; then
        health_status="Bom"
    fi
    
    # Relatório JSON
    cat > "$REPORT_FILE" << EOF
{
  "metadata": {
    "timestamp": "${DIAGNOSTICO[timestamp]}",
    "version": "${DIAGNOSTICO[version]}",
    "health_status": "$health_status"
  },
  "system": {
    "os": "${DIAGNOSTICO[os]:-N/A}",
    "node_version": "${DIAGNOSTICO[node_version]:-N/A}",
    "yarn_version": "${DIAGNOSTICO[yarn_version]:-N/A}"
  },
  "metrics": {
    "cpu_usage": "${METRICAS[cpu_usage]:-0}",
    "memory_usage": "${METRICAS[memory_usage]:-0}",
    "disk_usage": "${METRICAS[disk_usage]:-0}",
    "endpoint_success_rate": "${METRICAS[endpoint_success_rate]:-0}"
  },
  "problems": $(printf '%s\n' "${PROBLEMAS[@]}" | jq -R . | jq -s . 2>/dev/null || echo "[]"),
  "recommendations": $(printf '%s\n' "${RECOMENDACOES[@]}" | jq -R . | jq -s . 2>/dev/null || echo "[]")
}
EOF
    
    log_success "Relatório salvo: $REPORT_FILE"
}

# Exibir resumo
show_summary() {
    log_section "📋 Resumo do Diagnóstico"
    
    local total_problems=${#PROBLEMAS[@]}
    local total_recommendations=${#RECOMENDACOES[@]}
    
    echo ""
    log_info "🎯 Status Geral: $([ $total_problems -eq 0 ] && echo "✅ Excelente" || echo "⚠️ Requer Atenção")"
    log_info "🔍 Problemas encontrados: $total_problems"
    log_info "💡 Recomendações: $total_recommendations"
    echo ""
    
    if [[ $total_problems -gt 0 ]]; then
        log_warning "🚨 Problemas Críticos:"
        for problem in "${PROBLEMAS[@]}"; do
            echo "   • $problem"
        done
        echo ""
    fi
    
    if [[ $total_recommendations -gt 0 ]]; then
        log_info "💡 Principais Recomendações:"
        for rec in "${RECOMENDACOES[@]}"; do
            echo "   • $rec"
        done
        echo ""
    fi
    
    log_success "📊 Relatório completo disponível em: $REPORT_FILE"
}

# Função principal
main() {
    init_diagnostico
    check_system_info
    check_nodejs_environment
    check_strapi_project
    check_database
    check_api_endpoints
    check_system_performance
    generate_report
    show_summary
    
    log_success "🎉 Diagnóstico concluído com sucesso!"
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
