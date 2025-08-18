#!/bin/bash
# scripts/executar-diagnostico-completo.sh - Script mestre para executar toda a sequência de diagnósticos
# Executa todas as etapas em ordem sequencial com verificação de dependências

set -euo pipefail

# Carregar biblioteca comum
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# Configurações
REPORT_DIR="$PROJECT_ROOT/reports"
LOG_DIR="$PROJECT_ROOT/logs"
SEQUENCE_LOG="$LOG_DIR/diagnostic_sequence.log"

# Scripts da sequência de diagnóstico
DIAGNOSTIC_SCRIPTS=(
    "1_pre-diagnostico.sh"
    "2_diagnostico-sistema.sh"
    "3_diagnostico-aplicacao.sh"
    "4_diagnostico-performance.sh"
    "5_diagnostico-seguranca.sh"
    "6_backup-verificacao.sh"
    "7_relatorio-final.sh"
)

# Inicializar execução
init_master_execution() {
    log_info "🚀 INICIANDO SEQUÊNCIA COMPLETA DE DIAGNÓSTICOS"
    log_info "📅 Data/Hora: $(date)"
    log_info "📂 Projeto: RootGames API"
    
    # Criar diretórios necessários
    mkdir -p "$REPORT_DIR" "$LOG_DIR"
    
    # Inicializar log da sequência
    echo "$(date -Iseconds) - Sequência de diagnóstico iniciada" > "$SEQUENCE_LOG"
    
    # Criar arquivo de status inicial
    if command_exists jq; then
        cat > "$REPORT_DIR/diagnostic_status.json" << EOF
{
  "sequence_started": "$(date -Iseconds)",
  "current_step": 0,
  "total_steps": 7,
  "sequence_completed": false,
  "steps": {
    "1": {"name": "pre-diagnostico", "status": "pending"},
    "2": {"name": "sistema", "status": "pending"},
    "3": {"name": "aplicacao", "status": "pending"},
    "4": {"name": "performance", "status": "pending"},
    "5": {"name": "seguranca", "status": "pending"},
    "6": {"name": "backup", "status": "pending"},
    "7": {"name": "relatorio-final", "status": "pending"}
  }
}
EOF
    fi
}

# Verificar se script existe e é executável
check_script_availability() {
    local script_name="$1"
    local script_path="$SCRIPT_DIR/$script_name"
    
    if [[ ! -f "$script_path" ]]; then
        log_error "Script não encontrado: $script_name"
        return 1
    fi
    
    if [[ ! -x "$script_path" ]]; then
        log_warning "Script não executável, corrigindo permissões: $script_name"
        chmod +x "$script_path"
    fi
    
    return 0
}

# Executar script individual
execute_diagnostic_step() {
    local step_number="$1"
    local script_name="$2"
    local script_path="$SCRIPT_DIR/$script_name"
    
    log_section "🔄 EXECUTANDO ETAPA $step_number: $script_name"
    
    # Verificar disponibilidade do script
    if ! check_script_availability "$script_name"; then
        log_error "Não foi possível executar etapa $step_number"
        return 1
    fi
    
    # Executar script
    local start_time=$(date +%s)
    local exit_code=0
    
    if bash "$script_path"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_success "✅ Etapa $step_number concluída em ${duration}s"
        echo "$(date -Iseconds) - Etapa $step_number ($script_name) concluída: SUCESSO (${duration}s)" >> "$SEQUENCE_LOG"
        return 0
    else
        exit_code=$?
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_error "❌ Etapa $step_number falhou após ${duration}s (código: $exit_code)"
        echo "$(date -Iseconds) - Etapa $step_number ($script_name) falhou: ERRO $exit_code (${duration}s)" >> "$SEQUENCE_LOG"
        return $exit_code
    fi
}

# Executar toda a sequência
execute_full_sequence() {
    local total_steps=${#DIAGNOSTIC_SCRIPTS[@]}
    local completed_steps=0
    local failed_steps=0
    
    log_info "📋 Executando $total_steps etapas de diagnóstico..."
    
    for i in "${!DIAGNOSTIC_SCRIPTS[@]}"; do
        local step_number=$((i + 1))
        local script_name="${DIAGNOSTIC_SCRIPTS[$i]}"
        
        log_info "🔄 Iniciando etapa $step_number/$total_steps: $script_name"
        
        if execute_diagnostic_step "$step_number" "$script_name"; then
            ((completed_steps++))
            log_success "✅ Etapa $step_number/$total_steps concluída"
        else
            ((failed_steps++))
            log_error "❌ Etapa $step_number/$total_steps falhou"
            
            # Perguntar se deve continuar após falha
            if [[ $failed_steps -eq 1 ]]; then
                log_warning "⚠️ Primeira falha detectada. Continuando com próximas etapas..."
            fi
        fi
        
        # Pequena pausa entre etapas
        sleep 2
    done
    
    # Resumo final
    log_section "📊 RESUMO DA EXECUÇÃO"
    log_info "Total de etapas: $total_steps"
    log_info "Etapas concluídas: $completed_steps"
    log_info "Etapas falharam: $failed_steps"
    
    if [[ $failed_steps -eq 0 ]]; then
        log_success "🎉 Todas as etapas foram executadas com sucesso!"
        echo "$(date -Iseconds) - Sequência completa: SUCESSO TOTAL" >> "$SEQUENCE_LOG"
        return 0
    else
        log_warning "⚠️ Sequência concluída com $failed_steps falha(s)"
        echo "$(date -Iseconds) - Sequência completa: $failed_steps falhas" >> "$SEQUENCE_LOG"
        return 1
    fi
}

# Mostrar informações dos relatórios gerados
show_generated_reports() {
    log_section "📄 RELATÓRIOS GERADOS"
    
    if [[ -d "$REPORT_DIR" ]]; then
        local report_count=$(find "$REPORT_DIR" -name "*.json" -o -name "*.md" | wc -l)
        
        if [[ $report_count -gt 0 ]]; then
            log_success "Encontrados $report_count relatórios em: $REPORT_DIR"
            
            # Mostrar relatórios mais recentes
            log_info "📋 Relatórios principais:"
            find "$REPORT_DIR" -name "*relatorio_final*.json" -type f | sort | tail -1 | while read -r file; do
                log_info "  • Relatório final: $(basename "$file")"
            done
            
            find "$REPORT_DIR" -name "*sumario_executivo*.md" -type f | sort | tail -1 | while read -r file; do
                log_info "  • Sumário executivo: $(basename "$file")"
            done
        else
            log_warning "Nenhum relatório encontrado"
        fi
    else
        log_warning "Diretório de relatórios não encontrado"
    fi
}

# Função principal
main() {
    local start_time=$(date +%s)
    
    init_master_execution
    
    if execute_full_sequence; then
        local end_time=$(date +%s)
        local total_duration=$((end_time - start_time))
        
        log_success "🎯 DIAGNÓSTICO COMPLETO FINALIZADO!"
        log_success "⏱️ Tempo total: ${total_duration}s"
        
        show_generated_reports
        
        log_info "📋 Para ver o resumo executivo:"
        log_info "   cat $REPORT_DIR/sumario_executivo_*.md"
        log_info "📊 Para ver o relatório completo:"
        log_info "   cat $REPORT_DIR/relatorio_final_*.json"
        
        return 0
    else
        local end_time=$(date +%s)
        local total_duration=$((end_time - start_time))
        
        log_error "⚠️ DIAGNÓSTICO CONCLUÍDO COM PROBLEMAS"
        log_error "⏱️ Tempo total: ${total_duration}s"
        
        show_generated_reports
        
        log_info "📋 Verifique os logs para mais detalhes:"
        log_info "   tail -f $SEQUENCE_LOG"
        
        return 1
    fi
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
