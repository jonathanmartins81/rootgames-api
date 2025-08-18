#!/bin/bash
# scripts/1_pre-diagnostico.sh - Preparação e verificação inicial
# Sequência: 1 - Primeiro passo obrigatório

set -euo pipefail

# Carregar biblioteca comum
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# Configurações
REPORT_DIR="$PROJECT_ROOT/reports"
SEQUENCE_LOG="$LOG_DIR/diagnostic_sequence.log"

# Inicializar sequência de diagnóstico
init_sequence() {
    log_info "🚀 INICIANDO SEQUÊNCIA DE DIAGNÓSTICO OTIMIZADA"
    log_info "📋 Etapa 1/7: Preparação e Verificação Inicial"
    
    # Criar estrutura de diretórios
    mkdir -p "$LOG_DIR" "$BACKUP_DIR" "$REPORT_DIR"
    
    # Inicializar log da sequência
    echo "$(date -Iseconds) - INÍCIO DA SEQUÊNCIA DE DIAGNÓSTICO" > "$SEQUENCE_LOG"
    echo "$(date -Iseconds) - Etapa 1: Pré-diagnóstico iniciado" >> "$SEQUENCE_LOG"
}

# Verificar dependências críticas
check_critical_dependencies() {
    log_section "🔍 Verificação de Dependências Críticas"
    
    local missing_deps=()
    local critical_commands=("curl" "jq" "bc" "node" "npm" "psql" "pg_dump")
    
    for cmd in "${critical_commands[@]}"; do
        if ! command_exists "$cmd"; then
            missing_deps+=("$cmd")
            log_error "Dependência ausente: $cmd"
        else
            log_success "✓ $cmd disponível"
        fi
    done
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "❌ Dependências críticas ausentes: ${missing_deps[*]}"
        log_info "💡 Para instalar no Ubuntu/Debian:"
        echo "sudo apt update && sudo apt install -y curl jq bc nodejs npm postgresql-client"
        echo "$(date -Iseconds) - FALHA: Dependências ausentes: ${missing_deps[*]}" >> "$SEQUENCE_LOG"
        return 1
    fi
    
    log_success "✅ Todas as dependências críticas estão disponíveis"
    echo "$(date -Iseconds) - Dependências verificadas: OK" >> "$SEQUENCE_LOG"
    return 0
}

# Configurar permissões dos scripts
setup_script_permissions() {
    log_section "🔧 Configuração de Permissões"
    
    # Tornar todos os scripts executáveis
    find "$SCRIPT_DIR" -name "*.sh" -type f -exec chmod +x {} \;
    log_success "Permissões configuradas para todos os scripts"
    
    # Verificar se biblioteca comum está acessível
    if [[ -f "$SCRIPT_DIR/lib/common.sh" && -r "$SCRIPT_DIR/lib/common.sh" ]]; then
        log_success "Biblioteca comum acessível"
    else
        log_error "Biblioteca comum não encontrada ou inacessível"
        return 1
    fi
    
    echo "$(date -Iseconds) - Permissões configuradas" >> "$SEQUENCE_LOG"
}

# Verificar estrutura do projeto
verify_project_structure() {
    log_section "📁 Verificação da Estrutura do Projeto"
    
    local critical_files=(
        "package.json"
        "config/database.ts"
        "src"
        ".env.example"
    )
    
    local missing_files=()
    
    for file in "${critical_files[@]}"; do
        if [[ -e "$PROJECT_ROOT/$file" ]]; then
            log_success "✓ $file encontrado"
        else
            missing_files+=("$file")
            log_warning "⚠️ $file ausente"
        fi
    done
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        log_warning "Arquivos ausentes: ${missing_files[*]}"
        echo "$(date -Iseconds) - Arquivos ausentes: ${missing_files[*]}" >> "$SEQUENCE_LOG"
    else
        log_success "✅ Estrutura do projeto verificada"
        echo "$(date -Iseconds) - Estrutura do projeto: OK" >> "$SEQUENCE_LOG"
    fi
}

# Preparar ambiente para diagnóstico
prepare_diagnostic_environment() {
    log_section "⚙️ Preparação do Ambiente de Diagnóstico"
    
    # Configurar arquivo .env se necessário
    if [[ ! -f "$PROJECT_ROOT/.env" && -f "$PROJECT_ROOT/.env.example" ]]; then
        log_info "Criando .env a partir do .env.example"
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        log_warning "⚠️ Configure as variáveis em .env antes de continuar"
    fi
    
    # Limpar logs antigos se necessário
    if [[ -d "$LOG_DIR" ]]; then
        find "$LOG_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null || true
        log_info "Logs antigos limpos (>7 dias)"
    fi
    
    # Preparar arquivo de status da sequência
    cat > "$REPORT_DIR/diagnostic_status.json" << EOF
{
  "sequence_start": "$(date -Iseconds)",
  "current_step": 1,
  "total_steps": 7,
  "status": "running",
  "steps": {
    "1": {"name": "pre-diagnostico", "status": "running", "start": "$(date -Iseconds)"},
    "2": {"name": "diagnostico-sistema", "status": "pending"},
    "3": {"name": "diagnostico-aplicacao", "status": "pending"},
    "4": {"name": "diagnostico-performance", "status": "pending"},
    "5": {"name": "diagnostico-seguranca", "status": "pending"},
    "6": {"name": "backup-verificacao", "status": "pending"},
    "7": {"name": "relatorio-final", "status": "pending"}
  }
}
EOF
    
    log_success "Ambiente de diagnóstico preparado"
    echo "$(date -Iseconds) - Ambiente preparado" >> "$SEQUENCE_LOG"
}

# Verificar se pode prosseguir para próxima etapa
check_readiness_for_next_step() {
    log_section "🎯 Verificação de Prontidão"
    
    local ready=true
    local issues=()
    
    # Verificar se dependências estão OK
    if ! check_critical_dependencies >/dev/null 2>&1; then
        ready=false
        issues+=("Dependências críticas ausentes")
    fi
    
    # Verificar se .env existe
    if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
        ready=false
        issues+=("Arquivo .env não configurado")
    fi
    
    if [[ "$ready" == "true" ]]; then
        log_success "✅ Sistema pronto para próxima etapa"
        echo "$(date -Iseconds) - Etapa 1 concluída: SUCESSO" >> "$SEQUENCE_LOG"
        echo "$(date -Iseconds) - Pronto para etapa 2" >> "$SEQUENCE_LOG"
        
        # Atualizar status
        if command_exists jq; then
            jq '.steps."1".status = "completed" | .steps."1".end = "'$(date -Iseconds)'" | .current_step = 2' \
               "$REPORT_DIR/diagnostic_status.json" > "$REPORT_DIR/diagnostic_status.tmp" && \
               mv "$REPORT_DIR/diagnostic_status.tmp" "$REPORT_DIR/diagnostic_status.json"
        fi
        
        return 0
    else
        log_error "❌ Problemas encontrados: ${issues[*]}"
        log_warning "🛑 Corrija os problemas antes de prosseguir para a etapa 2"
        echo "$(date -Iseconds) - Etapa 1 falhou: ${issues[*]}" >> "$SEQUENCE_LOG"
        return 1
    fi
}

# Exibir próximos passos
show_next_steps() {
    log_section "📋 Próximos Passos"
    
    echo ""
    log_info "🎯 Sequência de Diagnóstico Completa:"
    echo "   1. ✅ Pré-diagnóstico (atual)"
    echo "   2. 🔄 Diagnóstico do Sistema      → ./scripts/2_diagnostico-sistema.sh"
    echo "   3. 🔄 Diagnóstico da Aplicação   → ./scripts/3_diagnostico-aplicacao.sh"
    echo "   4. 🔄 Diagnóstico de Performance → ./scripts/4_diagnostico-performance.sh"
    echo "   5. 🔄 Diagnóstico de Segurança   → ./scripts/5_diagnostico-seguranca.sh"
    echo "   6. 🔄 Backup e Verificação       → ./scripts/6_backup-verificacao.sh"
    echo "   7. 🔄 Relatório Final            → ./scripts/7_relatorio-final.sh"
    echo ""
    log_info "💡 Execute: ./scripts/2_diagnostico-sistema.sh para continuar"
    echo ""
}

# Função principal
main() {
    init_sequence
    
    if check_critical_dependencies && \
       setup_script_permissions && \
       verify_project_structure && \
       prepare_diagnostic_environment && \
       check_readiness_for_next_step; then
        
        log_success "🎉 Etapa 1 concluída com sucesso!"
        show_next_steps
        exit 0
    else
        log_error "❌ Etapa 1 falhou. Corrija os problemas antes de continuar."
        exit 1
    fi
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
