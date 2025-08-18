#!/bin/bash
# scripts/2_diagnostico-sistema.sh - Diagnóstico completo do sistema
# Sequência: 2 - Análise do ambiente e infraestrutura

set -euo pipefail

# Carregar biblioteca comum
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# Configurações
REPORT_DIR="$PROJECT_ROOT/reports"
SEQUENCE_LOG="$LOG_DIR/diagnostic_sequence.log"
SYSTEM_REPORT="$REPORT_DIR/sistema_$(date +%Y%m%d_%H%M%S).json"

# Estruturas para dados
declare -A SYSTEM_INFO
declare -A SYSTEM_METRICS
declare -A SYSTEM_ISSUES

# Inicializar etapa
init_step() {
    log_info "🖥️ ETAPA 2/7: Diagnóstico do Sistema"
    echo "$(date -Iseconds) - Etapa 2: Diagnóstico do sistema iniciado" >> "$SEQUENCE_LOG"
    
    # Atualizar status
    if command_exists jq && [[ -f "$REPORT_DIR/diagnostic_status.json" ]]; then
        jq '.steps."2".status = "running" | .steps."2".start = "'$(date -Iseconds)'" | .current_step = 2' \
           "$REPORT_DIR/diagnostic_status.json" > "$REPORT_DIR/diagnostic_status.tmp" && \
           mv "$REPORT_DIR/diagnostic_status.tmp" "$REPORT_DIR/diagnostic_status.json"
    fi
}

# Coletar informações do sistema operacional
collect_os_info() {
    log_section "🐧 Sistema Operacional"
    
    SYSTEM_INFO[os]=$(uname -s)
    SYSTEM_INFO[os_version]=$(uname -r)
    SYSTEM_INFO[architecture]=$(uname -m)
    SYSTEM_INFO[hostname]=$(hostname)
    SYSTEM_INFO[kernel]=$(uname -v 2>/dev/null || echo "N/A")
    
    # Informações específicas do Linux
    if [[ -f /etc/os-release ]]; then
        SYSTEM_INFO[distro]=$(grep '^PRETTY_NAME=' /etc/os-release | cut -d'"' -f2)
        SYSTEM_INFO[distro_id]=$(grep '^ID=' /etc/os-release | cut -d'=' -f2)
        SYSTEM_INFO[distro_version]=$(grep '^VERSION_ID=' /etc/os-release | cut -d'"' -f2)
    fi
    
    # Uptime do sistema
    if command_exists uptime; then
        SYSTEM_INFO[uptime]=$(uptime -p 2>/dev/null || uptime | awk '{print $3,$4}')
    fi
    
    log_success "OS: ${SYSTEM_INFO[distro]:-${SYSTEM_INFO[os]}} ${SYSTEM_INFO[distro_version]:-${SYSTEM_INFO[os_version]}}"
    log_success "Arquitetura: ${SYSTEM_INFO[architecture]}"
    log_success "Uptime: ${SYSTEM_INFO[uptime]}"
}

# Analisar recursos do sistema
analyze_system_resources() {
    log_section "💾 Recursos do Sistema"
    
    # CPU
    SYSTEM_METRICS[cpu_cores]=$(nproc 2>/dev/null || echo "1")
    SYSTEM_METRICS[cpu_usage]=$(get_cpu_usage)
    SYSTEM_METRICS[load_average]=$(get_load_average)
    
    if [[ -f /proc/cpuinfo ]]; then
        SYSTEM_INFO[cpu_model]=$(grep "model name" /proc/cpuinfo | head -1 | cut -d':' -f2 | xargs)
    fi
    
    log_success "CPU: ${SYSTEM_INFO[cpu_model]:-N/A}"
    log_success "Cores: ${SYSTEM_METRICS[cpu_cores]}"
    log_success "Uso atual: ${SYSTEM_METRICS[cpu_usage]}%"
    log_success "Load average: ${SYSTEM_METRICS[load_average]}"
    
    # Memória
    if [[ -f /proc/meminfo ]]; then
        local total_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
        local available_kb=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
        
        SYSTEM_METRICS[memory_total_gb]=$(echo "scale=2; $total_kb / 1024 / 1024" | bc)
        SYSTEM_METRICS[memory_available_gb]=$(echo "scale=2; $available_kb / 1024 / 1024" | bc)
        SYSTEM_METRICS[memory_usage]=$(get_memory_usage)
        
        log_success "Memória total: ${SYSTEM_METRICS[memory_total_gb]}GB"
        log_success "Memória disponível: ${SYSTEM_METRICS[memory_available_gb]}GB"
        log_success "Uso de memória: ${SYSTEM_METRICS[memory_usage]}%"
    fi
    
    # Disco
    SYSTEM_METRICS[disk_usage]=$(get_disk_usage)
    local disk_info=$(df -h . | tail -1)
    SYSTEM_METRICS[disk_total]=$(echo "$disk_info" | awk '{print $2}')
    SYSTEM_METRICS[disk_used]=$(echo "$disk_info" | awk '{print $3}')
    SYSTEM_METRICS[disk_available]=$(echo "$disk_info" | awk '{print $4}')
    
    log_success "Disco total: ${SYSTEM_METRICS[disk_total]}"
    log_success "Disco usado: ${SYSTEM_METRICS[disk_used]} (${SYSTEM_METRICS[disk_usage]}%)"
    log_success "Disco disponível: ${SYSTEM_METRICS[disk_available]}"
}

# Verificar conectividade de rede
check_network_connectivity() {
    log_section "🌐 Conectividade de Rede"
    
    # Internet
    if check_internet; then
        SYSTEM_INFO[internet_status]="connected"
        log_success "Conectividade com internet: OK"
        
        # IP público
        SYSTEM_INFO[public_ip]=$(get_public_ip)
        log_success "IP público: ${SYSTEM_INFO[public_ip]}"
    else
        SYSTEM_INFO[internet_status]="disconnected"
        SYSTEM_ISSUES[no_internet]="Sem conectividade com a internet"
        log_error "Sem conectividade com internet"
    fi
    
    # DNS
    if nslookup google.com >/dev/null 2>&1; then
        SYSTEM_INFO[dns_status]="working"
        log_success "Resolução DNS: OK"
    else
        SYSTEM_INFO[dns_status]="failed"
        SYSTEM_ISSUES[dns_failed]="Falha na resolução DNS"
        log_error "Falha na resolução DNS"
    fi
    
    # Portas locais importantes
    local important_ports=("1337:Strapi" "5432:PostgreSQL" "80:HTTP" "443:HTTPS")
    for port_info in "${important_ports[@]}"; do
        local port=$(echo "$port_info" | cut -d: -f1)
        local service=$(echo "$port_info" | cut -d: -f2)
        
        if port_open "localhost" "$port"; then
            log_success "Porta $port ($service): Aberta"
            SYSTEM_INFO[port_$port]="open"
        else
            log_info "Porta $port ($service): Fechada"
            SYSTEM_INFO[port_$port]="closed"
        fi
    done
}

# Verificar serviços do sistema
check_system_services() {
    log_section "🔧 Serviços do Sistema"
    
    # PostgreSQL
    if command_exists systemctl; then
        if systemctl is-active postgresql >/dev/null 2>&1; then
            SYSTEM_INFO[postgresql_service]="active"
            log_success "PostgreSQL service: Ativo"
        else
            SYSTEM_INFO[postgresql_service]="inactive"
            log_warning "PostgreSQL service: Inativo"
        fi
    fi
    
    # Verificar processos Node.js
    local node_processes=$(pgrep -f "node\|npm\|yarn" | wc -l)
    SYSTEM_METRICS[node_processes]=$node_processes
    log_info "Processos Node.js ativos: $node_processes"
    
    # Verificar processos PostgreSQL
    local postgres_processes=$(pgrep -f "postgres" | wc -l)
    SYSTEM_METRICS[postgres_processes]=$postgres_processes
    log_info "Processos PostgreSQL: $postgres_processes"
}

# Analisar logs do sistema
analyze_system_logs() {
    log_section "📋 Logs do Sistema"
    
    # Verificar logs de erro recentes
    local error_count=0
    if [[ -f /var/log/syslog ]]; then
        error_count=$(grep -c "$(date +%b\ %d)" /var/log/syslog | grep -i error | wc -l 2>/dev/null || echo "0")
    fi
    
    SYSTEM_METRICS[system_errors_today]=$error_count
    log_info "Erros do sistema hoje: $error_count"
    
    # Verificar espaço em /var/log
    if [[ -d /var/log ]]; then
        local log_size=$(du -sh /var/log 2>/dev/null | cut -f1 || echo "N/A")
        SYSTEM_METRICS[system_log_size]="$log_size"
        log_info "Tamanho dos logs do sistema: $log_size"
    fi
}

# Verificar segurança básica do sistema
check_system_security() {
    log_section "🔒 Segurança do Sistema"
    
    # Verificar usuário atual
    SYSTEM_INFO[current_user]=$(whoami)
    log_info "Usuário atual: ${SYSTEM_INFO[current_user]}"
    
    # Verificar se está rodando como root
    if [[ "$EUID" -eq 0 ]]; then
        SYSTEM_ISSUES[running_as_root]="Script rodando como root (não recomendado)"
        log_warning "⚠️ Rodando como root"
    else
        log_success "Rodando como usuário não-root"
    fi
    
    # Verificar firewall
    if command_exists ufw; then
        local ufw_status=$(ufw status 2>/dev/null | head -1 | awk '{print $2}')
        SYSTEM_INFO[firewall_status]="$ufw_status"
        log_info "UFW Firewall: $ufw_status"
    fi
    
    # Verificar permissões do diretório do projeto
    local project_perms=$(stat -c "%a" "$PROJECT_ROOT" 2>/dev/null || echo "N/A")
    SYSTEM_INFO[project_permissions]="$project_perms"
    log_info "Permissões do projeto: $project_perms"
}

# Identificar problemas críticos
identify_critical_issues() {
    log_section "⚠️ Análise de Problemas"
    
    local critical_issues=0
    
    # CPU alto
    if (( $(echo "${SYSTEM_METRICS[cpu_usage]} > 90" | bc -l 2>/dev/null || echo 0) )); then
        SYSTEM_ISSUES[high_cpu]="CPU muito alto: ${SYSTEM_METRICS[cpu_usage]}%"
        ((critical_issues++))
    fi
    
    # Memória alta
    if (( $(echo "${SYSTEM_METRICS[memory_usage]} > 90" | bc -l 2>/dev/null || echo 0) )); then
        SYSTEM_ISSUES[high_memory]="Memória muito alta: ${SYSTEM_METRICS[memory_usage]}%"
        ((critical_issues++))
    fi
    
    # Disco cheio
    if (( ${SYSTEM_METRICS[disk_usage]} > 95 )); then
        SYSTEM_ISSUES[disk_full]="Disco quase cheio: ${SYSTEM_METRICS[disk_usage]}%"
        ((critical_issues++))
    fi
    
    # Pouca memória disponível
    if (( $(echo "${SYSTEM_METRICS[memory_available_gb]} < 0.5" | bc -l 2>/dev/null || echo 0) )); then
        SYSTEM_ISSUES[low_memory]="Pouca memória disponível: ${SYSTEM_METRICS[memory_available_gb]}GB"
        ((critical_issues++))
    fi
    
    SYSTEM_METRICS[critical_issues_count]=$critical_issues
    
    if [[ $critical_issues -eq 0 ]]; then
        log_success "✅ Nenhum problema crítico identificado"
    else
        log_warning "⚠️ $critical_issues problema(s) crítico(s) identificado(s)"
    fi
}

# Gerar relatório do sistema
generate_system_report() {
    log_section "📄 Gerando Relatório do Sistema"
    
    cat > "$SYSTEM_REPORT" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "step": 2,
  "step_name": "diagnostico-sistema",
  "system_info": {
EOF

    # Adicionar informações do sistema
    local first=true
    for key in "${!SYSTEM_INFO[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$SYSTEM_REPORT"
        fi
        echo "    \"$key\": \"${SYSTEM_INFO[$key]}\"" >> "$SYSTEM_REPORT"
    done

    cat >> "$SYSTEM_REPORT" << EOF
  },
  "metrics": {
EOF

    # Adicionar métricas
    first=true
    for key in "${!SYSTEM_METRICS[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$SYSTEM_REPORT"
        fi
        echo "    \"$key\": \"${SYSTEM_METRICS[$key]}\"" >> "$SYSTEM_REPORT"
    done

    cat >> "$SYSTEM_REPORT" << EOF
  },
  "issues": {
EOF

    # Adicionar problemas
    first=true
    for key in "${!SYSTEM_ISSUES[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$SYSTEM_REPORT"
        fi
        echo "    \"$key\": \"${SYSTEM_ISSUES[$key]}\"" >> "$SYSTEM_REPORT"
    done

    cat >> "$SYSTEM_REPORT" << EOF
  }
}
EOF

    log_success "Relatório do sistema salvo: $SYSTEM_REPORT"
}

# Finalizar etapa
finalize_step() {
    local issues_count=${#SYSTEM_ISSUES[@]}
    
    if [[ $issues_count -eq 0 ]]; then
        log_success "✅ Etapa 2 concluída: Sistema em bom estado"
        echo "$(date -Iseconds) - Etapa 2 concluída: SUCESSO" >> "$SEQUENCE_LOG"
        
        # Atualizar status
        if command_exists jq; then
            jq '.steps."2".status = "completed" | .steps."2".end = "'$(date -Iseconds)'" | .current_step = 3' \
               "$REPORT_DIR/diagnostic_status.json" > "$REPORT_DIR/diagnostic_status.tmp" && \
               mv "$REPORT_DIR/diagnostic_status.tmp" "$REPORT_DIR/diagnostic_status.json"
        fi
        
        log_info "🔄 Próximo passo: ./scripts/3_diagnostico-aplicacao.sh"
        return 0
    else
        log_warning "⚠️ Etapa 2 concluída com $issues_count problema(s)"
        echo "$(date -Iseconds) - Etapa 2 concluída: $issues_count problemas" >> "$SEQUENCE_LOG"
        
        log_info "🔄 Próximo passo: ./scripts/3_diagnostico-aplicacao.sh"
        return 0
    fi
}

# Função principal
main() {
    init_step
    collect_os_info
    analyze_system_resources
    check_network_connectivity
    check_system_services
    analyze_system_logs
    check_system_security
    identify_critical_issues
    generate_system_report
    finalize_step
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
