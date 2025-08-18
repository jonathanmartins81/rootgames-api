#!/bin/bash
# scripts/7_relatorio-final.sh - Relatório final e consolidação dos diagnósticos
# Sequência: 7 - Geração do relatório consolidado e recomendações finais

set -euo pipefail

# Carregar biblioteca comum
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# Configurações
REPORT_DIR="$PROJECT_ROOT/reports"
SEQUENCE_LOG="$LOG_DIR/diagnostic_sequence.log"
FINAL_REPORT="$REPORT_DIR/relatorio_final_$(date +%Y%m%d_%H%M%S).json"
SUMMARY_FILE="$REPORT_DIR/sumario_executivo_$(date +%Y%m%d_%H%M%S).md"

# Estruturas para dados consolidados
declare -A CONSOLIDATED_METRICS
declare -A STEP_RESULTS
declare -A RECOMMENDATIONS

# Inicializar etapa final
init_final_step() {
    log_info "📊 ETAPA 7/7: Relatório Final e Consolidação"
    echo "$(date -Iseconds) - Etapa 7: Relatório final iniciado" >> "$SEQUENCE_LOG"
    
    # Atualizar status
    if command_exists jq && [[ -f "$REPORT_DIR/diagnostic_status.json" ]]; then
        jq '.steps."7".status = "running" | .steps."7".start = "'$(date -Iseconds)'" | .current_step = 7' \
           "$REPORT_DIR/diagnostic_status.json" > "$REPORT_DIR/diagnostic_status.tmp" && \
           mv "$REPORT_DIR/diagnostic_status.tmp" "$REPORT_DIR/diagnostic_status.json"
    fi
}

# Coletar resultados de todas as etapas
collect_step_results() {
    log_section "📋 Coletando Resultados das Etapas"
    
    local total_issues=0
    local completed_steps=0
    
    for i in {1..6}; do
        local step_name=""
        local pattern=""
        
        case $i in
            1) step_name="pre-diagnostico"; pattern="pre_diagnostico_*.json" ;;
            2) step_name="sistema"; pattern="sistema_*.json" ;;
            3) step_name="aplicacao"; pattern="aplicacao_*.json" ;;
            4) step_name="performance"; pattern="performance_*.json" ;;
            5) step_name="seguranca"; pattern="seguranca_*.json" ;;
            6) step_name="backup"; pattern="backup_*.json" ;;
        esac
        
        # Procurar arquivo mais recente da etapa
        local latest_file=$(find "$REPORT_DIR" -name "$pattern" -type f 2>/dev/null | sort | tail -1)
        
        if [[ -n "$latest_file" && -f "$latest_file" ]]; then
            log_success "Etapa $i ($step_name): $(basename "$latest_file")"
            
            # Extrair informações básicas se jq estiver disponível
            if command_exists jq; then
                local step_issues=$(jq -r '.issues | length' "$latest_file" 2>/dev/null || echo "0")
                total_issues=$((total_issues + step_issues))
                
                STEP_RESULTS["step_${i}_file"]="$latest_file"
                STEP_RESULTS["step_${i}_issues"]="$step_issues"
                STEP_RESULTS["step_${i}_status"]="completed"
                
                completed_steps=$((completed_steps + 1))
            else
                STEP_RESULTS["step_${i}_file"]="$latest_file"
                STEP_RESULTS["step_${i}_status"]="completed"
                completed_steps=$((completed_steps + 1))
            fi
        else
            log_warning "Etapa $i ($step_name): Relatório não encontrado"
            STEP_RESULTS["step_${i}_status"]="missing"
        fi
    done
    
    CONSOLIDATED_METRICS[completed_steps]="$completed_steps"
    CONSOLIDATED_METRICS[total_issues]="$total_issues"
    
    log_info "Etapas concluídas: $completed_steps/6"
    log_info "Total de problemas identificados: $total_issues"
}

# Consolidar métricas principais
consolidate_metrics() {
    log_section "📈 Consolidando Métricas"
    
    # Métricas do sistema (da etapa 2)
    local sistema_file="${STEP_RESULTS[step_2_file]:-}"
    if [[ -n "$sistema_file" && -f "$sistema_file" ]] && command_exists jq; then
        local cpu_usage=$(jq -r '.metrics.cpu_usage // "N/A"' "$sistema_file" 2>/dev/null)
        local memory_usage=$(jq -r '.metrics.memory_usage // "N/A"' "$sistema_file" 2>/dev/null)
        local disk_usage=$(jq -r '.metrics.disk_usage // "N/A"' "$sistema_file" 2>/dev/null)
        
        CONSOLIDATED_METRICS[cpu_usage]="$cpu_usage"
        CONSOLIDATED_METRICS[memory_usage]="$memory_usage"
        CONSOLIDATED_METRICS[disk_usage]="$disk_usage"
    fi
    
    # Métricas da aplicação (da etapa 3)
    local app_file="${STEP_RESULTS[step_3_file]:-}"
    if [[ -n "$app_file" && -f "$app_file" ]] && command_exists jq; then
        local node_version=$(jq -r '.metrics.node_version // "N/A"' "$app_file" 2>/dev/null)
        local strapi_version=$(jq -r '.metrics.strapi_version // "N/A"' "$app_file" 2>/dev/null)
        local db_status=$(jq -r '.metrics.database_status // "N/A"' "$app_file" 2>/dev/null)
        
        CONSOLIDATED_METRICS[node_version]="$node_version"
        CONSOLIDATED_METRICS[strapi_version]="$strapi_version"
        CONSOLIDATED_METRICS[database_status]="$db_status"
    fi
    
    log_success "Métricas consolidadas coletadas"
}

# Gerar recomendações
generate_recommendations() {
    log_section "💡 Gerando Recomendações"
    
    local rec_count=0
    
    # Recomendações baseadas em etapas não concluídas
    if [[ ${CONSOLIDATED_METRICS[completed_steps]:-0} -lt 6 ]]; then
        ((rec_count++))
        RECOMMENDATIONS["rec_${rec_count}"]="Executar todas as etapas de diagnóstico para análise completa"
    fi
    
    # Recomendações gerais
    ((rec_count++))
    RECOMMENDATIONS["rec_${rec_count}"]="Executar diagnósticos semanalmente para monitoramento contínuo"
    
    ((rec_count++))
    RECOMMENDATIONS["rec_${rec_count}"]="Manter dependências atualizadas com 'yarn upgrade'"
    
    ((rec_count++))
    RECOMMENDATIONS["rec_${rec_count}"]="Configurar backup automático do banco de dados"
    
    ((rec_count++))
    RECOMMENDATIONS["rec_${rec_count}"]="Implementar monitoramento de logs em tempo real"
    
    CONSOLIDATED_METRICS[recommendations_count]="$rec_count"
    log_success "Geradas $rec_count recomendações"
}

# Calcular score geral do projeto
calculate_overall_score() {
    log_section "🎯 Calculando Score Geral"
    
    local score=100
    
    # Deduzir pontos por etapas não concluídas
    local completed=${CONSOLIDATED_METRICS[completed_steps]:-0}
    if [[ "$completed" =~ ^[0-9]+$ ]] && [[ $completed -lt 6 ]]; then
        local missing=$((6 - completed))
        score=$((score - (missing * 15)))   # -15 pontos por etapa não concluída
    fi
    
    # Garantir que o score não seja negativo
    if [[ $score -lt 0 ]]; then
        score=0
    fi
    
    # Determinar status baseado no score
    local status="EXCELENTE"
    local status_color="🟢"
    
    if [[ $score -lt 50 ]]; then
        status="CRÍTICO"
        status_color="🔴"
    elif [[ $score -lt 70 ]]; then
        status="ATENÇÃO"
        status_color="🟡"
    elif [[ $score -lt 85 ]]; then
        status="BOM"
        status_color="🟠"
    fi
    
    CONSOLIDATED_METRICS[overall_score]="$score"
    CONSOLIDATED_METRICS[overall_status]="$status"
    CONSOLIDATED_METRICS[status_color]="$status_color"
    
    log_success "Score geral: $score/100 ($status)"
}

# Gerar relatório JSON
generate_json_report() {
    log_section "📄 Gerando Relatório JSON"
    
    cat > "$FINAL_REPORT" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "diagnostic_sequence": "completed",
  "project_info": {
    "name": "RootGames API",
    "version": "$(grep '"version"' "$PROJECT_ROOT/package.json" 2>/dev/null | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/' || echo "N/A")"
  },
  "overall_assessment": {
    "score": ${CONSOLIDATED_METRICS[overall_score]:-0},
    "status": "${CONSOLIDATED_METRICS[overall_status]:-"UNKNOWN"}",
    "completed_steps": ${CONSOLIDATED_METRICS[completed_steps]:-0},
    "total_steps": 6
  },
  "recommendations": {
EOF

    # Adicionar recomendações
    local first=true
    for key in "${!RECOMMENDATIONS[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$FINAL_REPORT"
        fi
        echo "    \"$key\": \"${RECOMMENDATIONS[$key]}\"" >> "$FINAL_REPORT"
    done

    cat >> "$FINAL_REPORT" << EOF
  }
}
EOF

    log_success "Relatório JSON salvo: $FINAL_REPORT"
}

# Criar sumário executivo
create_executive_summary() {
    log_section "📋 Criando Sumário Executivo"
    
    cat > "$SUMMARY_FILE" << EOF
# Sumário Executivo - Diagnóstico RootGames API

**Data:** $(date)  
**Score:** ${CONSOLIDATED_METRICS[overall_score]:-0}/100  
**Status:** ${CONSOLIDATED_METRICS[overall_status]:-UNKNOWN} ${CONSOLIDATED_METRICS[status_color]:-🟢}

## Etapas Concluídas: ${CONSOLIDATED_METRICS[completed_steps]:-0}/6

## Principais Recomendações:
EOF

    # Adicionar recomendações
    for key in "${!RECOMMENDATIONS[@]}"; do
        echo "- ${RECOMMENDATIONS[$key]}" >> "$SUMMARY_FILE"
    done

    cat >> "$SUMMARY_FILE" << EOF

## Próximos Passos:
1. Resolver problemas críticos identificados
2. Executar etapas faltantes do diagnóstico
3. Implementar monitoramento contínuo

**Contato:** rocinante626s@gmail.com
EOF

    log_success "Sumário executivo salvo: $SUMMARY_FILE"
}

# Finalizar sequência
finalize_sequence() {
    local score=${CONSOLIDATED_METRICS[overall_score]:-0}
    local status="${CONSOLIDATED_METRICS[overall_status]:-UNKNOWN}"
    
    log_success "✅ Sequência de diagnóstico concluída!"
    log_success "📊 Score final: $score/100 ($status)"
    echo "$(date -Iseconds) - Sequência completa: Score $score/100" >> "$SEQUENCE_LOG"
    
    # Atualizar status final
    if command_exists jq; then
        jq '.steps."7".status = "completed" | .steps."7".end = "'$(date -Iseconds)'" | .sequence_completed = true' \
           "$REPORT_DIR/diagnostic_status.json" > "$REPORT_DIR/diagnostic_status.tmp" && \
           mv "$REPORT_DIR/diagnostic_status.tmp" "$REPORT_DIR/diagnostic_status.json"
    fi
    
    log_info "📁 Relatórios salvos em: $REPORT_DIR"
    log_info "📊 Relatório principal: $(basename "$FINAL_REPORT")"
}

# Função principal
main() {
    init_final_step
    collect_step_results
    consolidate_metrics
    generate_recommendations
    calculate_overall_score
    generate_json_report
    create_executive_summary
    finalize_sequence
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
