#!/bin/bash
# scripts/6_backup-verificacao.sh - Backup e verificação de integridade
# Sequência: 6 - Backup completo e validação antes de operações críticas

set -euo pipefail

# Carregar biblioteca comum
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# Configurações
REPORT_DIR="$PROJECT_ROOT/reports"
SEQUENCE_LOG="$LOG_DIR/diagnostic_sequence.log"
BACKUP_REPORT="$REPORT_DIR/backup_$(date +%Y%m%d_%H%M%S).json"

# Estruturas para dados
declare -A BACKUP_INFO
declare -A BACKUP_METRICS
declare -A BACKUP_ISSUES

# Inicializar etapa
init_step() {
    log_info "💾 ETAPA 6/7: Backup e Verificação"
    echo "$(date -Iseconds) - Etapa 6: Backup e verificação iniciado" >> "$SEQUENCE_LOG"
    
    # Atualizar status
    if command_exists jq && [[ -f "$REPORT_DIR/diagnostic_status.json" ]]; then
        jq '.steps."6".status = "running" | .steps."6".start = "'$(date -Iseconds)'" | .current_step = 6' \
           "$REPORT_DIR/diagnostic_status.json" > "$REPORT_DIR/diagnostic_status.tmp" && \
           mv "$REPORT_DIR/diagnostic_status.tmp" "$REPORT_DIR/diagnostic_status.json"
    fi
}

# Verificar espaço disponível
check_available_space() {
    log_section "💽 Verificação de Espaço"
    
    local backup_dir_space=$(df -h "$BACKUP_DIR" | tail -1 | awk '{print $4}')
    local backup_dir_usage=$(df -h "$BACKUP_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
    
    BACKUP_METRICS[available_space]="$backup_dir_space"
    BACKUP_METRICS[disk_usage]="$backup_dir_usage"
    
    log_success "Espaço disponível: $backup_dir_space"
    log_success "Uso do disco: $backup_dir_usage%"
    
    # Verificar se há espaço suficiente
    if (( backup_dir_usage > 90 )); then
        BACKUP_ISSUES[low_disk_space]="Pouco espaço em disco: $backup_dir_usage% usado"
        log_error "⚠️ Pouco espaço em disco para backup"
        return 1
    fi
    
    # Estimar tamanho necessário para backup
    local estimated_backup_size="N/A"
    if [[ -d "$PROJECT_ROOT" ]]; then
        estimated_backup_size=$(du -sh "$PROJECT_ROOT" 2>/dev/null | cut -f1 || echo "N/A")
        BACKUP_METRICS[estimated_size]="$estimated_backup_size"
        log_info "Tamanho estimado do backup: $estimated_backup_size"
    fi
    
    return 0
}

# Fazer backup do banco de dados
backup_database() {
    log_section "🗄️ Backup do Banco de Dados"
    
    # Carregar configurações
    load_env_file
    local db_host=$(get_config DB_HOST "127.0.0.1")
    local db_port=$(get_config DB_PORT "5432")
    local db_name=$(get_config DB_NAME "rootgames")
    local db_user=$(get_config DB_USER "rootgames")
    local db_pass=$(get_config DB_PASS "")
    
    if [[ -z "$db_pass" ]]; then
        BACKUP_ISSUES[db_password_missing]="Senha do banco não configurada"
        log_error "Senha do banco não configurada"
        return 1
    fi
    
    # Testar conexão antes do backup
    if ! check_postgres_connection "$db_host" "$db_port" "$db_name" "$db_user"; then
        BACKUP_ISSUES[db_connection_failed]="Falha na conexão com banco para backup"
        log_error "Não foi possível conectar ao banco para backup"
        return 1
    fi
    
    # Criar backup
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/db_backup_${backup_timestamp}.sql"
    
    log_info "Criando backup do banco de dados..."
    local start_time=$(date +%s)
    
    if PGPASSWORD="$db_pass" pg_dump -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" \
       --verbose --clean --if-exists --create > "$backup_file" 2>/dev/null; then
        
        local end_time=$(date +%s)
        local backup_duration=$((end_time - start_time))
        local backup_size=$(du -sh "$backup_file" | cut -f1)
        
        BACKUP_INFO[db_backup_file]="$backup_file"
        BACKUP_INFO[db_backup_success]="true"
        BACKUP_METRICS[db_backup_size]="$backup_size"
        BACKUP_METRICS[db_backup_duration]="$backup_duration"
        
        log_success "Backup do banco criado: $backup_file"
        log_success "Tamanho: $backup_size, Duração: ${backup_duration}s"
        
        # Verificar integridade do backup
        if head -n 10 "$backup_file" | grep -q "PostgreSQL database dump"; then
            BACKUP_INFO[db_backup_valid]="true"
            log_success "Backup do banco validado"
        else
            BACKUP_ISSUES[db_backup_invalid]="Backup do banco parece inválido"
            log_error "Backup do banco pode estar corrompido"
        fi
    else
        BACKUP_INFO[db_backup_success]="false"
        BACKUP_ISSUES[db_backup_failed]="Falha ao criar backup do banco"
        log_error "Falha ao criar backup do banco de dados"
        return 1
    fi
    
    return 0
}

# Fazer backup dos arquivos de configuração
backup_config_files() {
    log_section "⚙️ Backup de Configurações"
    
    local config_backup_file="$BACKUP_DIR/config_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    local config_files=(
        ".env"
        "config/"
        "package.json"
        "yarn.lock"
        "tsconfig.json"
        ".gitignore"
    )
    
    local existing_files=()
    for file in "${config_files[@]}"; do
        if [[ -e "$PROJECT_ROOT/$file" ]]; then
            existing_files+=("$file")
        fi
    done
    
    if [[ ${#existing_files[@]} -gt 0 ]]; then
        log_info "Criando backup de configurações..."
        
        if (cd "$PROJECT_ROOT" && tar -czf "$config_backup_file" "${existing_files[@]}" 2>/dev/null); then
            local config_backup_size=$(du -sh "$config_backup_file" | cut -f1)
            
            BACKUP_INFO[config_backup_file]="$config_backup_file"
            BACKUP_INFO[config_backup_success]="true"
            BACKUP_METRICS[config_backup_size]="$config_backup_size"
            BACKUP_METRICS[config_files_count]="${#existing_files[@]}"
            
            log_success "Backup de configurações criado: $config_backup_file"
            log_success "Arquivos: ${#existing_files[@]}, Tamanho: $config_backup_size"
        else
            BACKUP_INFO[config_backup_success]="false"
            BACKUP_ISSUES[config_backup_failed]="Falha ao criar backup de configurações"
            log_error "Falha ao criar backup de configurações"
        fi
    else
        BACKUP_ISSUES[no_config_files]="Nenhum arquivo de configuração encontrado"
        log_warning "Nenhum arquivo de configuração encontrado para backup"
    fi
}

# Fazer backup dos logs importantes
backup_logs() {
    log_section "📋 Backup de Logs"
    
    if [[ -d "$LOG_DIR" && $(find "$LOG_DIR" -name "*.log" | wc -l) -gt 0 ]]; then
        local logs_backup_file="$BACKUP_DIR/logs_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
        
        log_info "Criando backup de logs..."
        
        if tar -czf "$logs_backup_file" -C "$LOG_DIR" . 2>/dev/null; then
            local logs_backup_size=$(du -sh "$logs_backup_file" | cut -f1)
            local log_files_count=$(find "$LOG_DIR" -name "*.log" | wc -l)
            
            BACKUP_INFO[logs_backup_file]="$logs_backup_file"
            BACKUP_INFO[logs_backup_success]="true"
            BACKUP_METRICS[logs_backup_size]="$logs_backup_size"
            BACKUP_METRICS[log_files_backed_up]="$log_files_count"
            
            log_success "Backup de logs criado: $logs_backup_file"
            log_success "Arquivos: $log_files_count, Tamanho: $logs_backup_size"
        else
            BACKUP_INFO[logs_backup_success]="false"
            BACKUP_ISSUES[logs_backup_failed]="Falha ao criar backup de logs"
            log_error "Falha ao criar backup de logs"
        fi
    else
        log_info "Nenhum log encontrado para backup"
        BACKUP_INFO[logs_backup_success]="skipped"
    fi
}

# Verificar backups existentes
check_existing_backups() {
    log_section "📦 Backups Existentes"
    
    if [[ -d "$BACKUP_DIR" ]]; then
        local total_backups=$(find "$BACKUP_DIR" -name "*.sql" -o -name "*.tar.gz" | wc -l)
        local backup_dir_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "0")
        local oldest_backup=""
        local newest_backup=""
        
        if [[ $total_backups -gt 0 ]]; then
            oldest_backup=$(find "$BACKUP_DIR" -name "*.sql" -o -name "*.tar.gz" | xargs ls -t | tail -1 | xargs basename)
            newest_backup=$(find "$BACKUP_DIR" -name "*.sql" -o -name "*.tar.gz" | xargs ls -t | head -1 | xargs basename)
        fi
        
        BACKUP_METRICS[total_existing_backups]="$total_backups"
        BACKUP_METRICS[backup_dir_total_size]="$backup_dir_size"
        BACKUP_INFO[oldest_backup]="$oldest_backup"
        BACKUP_INFO[newest_backup]="$newest_backup"
        
        log_success "Backups existentes: $total_backups"
        log_success "Tamanho total: $backup_dir_size"
        
        if [[ -n "$oldest_backup" ]]; then
            log_info "Backup mais antigo: $oldest_backup"
            log_info "Backup mais recente: $newest_backup"
        fi
        
        # Verificar se há muitos backups antigos
        local old_backups=$(find "$BACKUP_DIR" -name "*.sql" -o -name "*.tar.gz" -mtime +7 | wc -l)
        if [[ $old_backups -gt 10 ]]; then
            BACKUP_ISSUES[too_many_old_backups]="Muitos backups antigos: $old_backups (>7 dias)"
            log_warning "Considere limpar backups antigos: $old_backups arquivos"
        fi
    else
        BACKUP_ISSUES[backup_dir_missing]="Diretório de backup não existe"
        log_error "Diretório de backup não encontrado"
    fi
}

# Testar restauração (simulação)
test_backup_restoration() {
    log_section "🔄 Teste de Restauração"
    
    # Testar se o backup do banco pode ser lido
    if [[ -n "${BACKUP_INFO[db_backup_file]:-}" && -f "${BACKUP_INFO[db_backup_file]}" ]]; then
        log_info "Testando integridade do backup do banco..."
        
        # Verificar se o arquivo não está corrompido
        if gzip -t "${BACKUP_INFO[db_backup_file]}" 2>/dev/null || head -n 1 "${BACKUP_INFO[db_backup_file]}" | grep -q "PostgreSQL"; then
            BACKUP_INFO[db_backup_readable]="true"
            log_success "Backup do banco é legível"
        else
            BACKUP_ISSUES[db_backup_corrupted]="Backup do banco pode estar corrompido"
            log_error "Backup do banco não é legível"
        fi
        
        # Contar linhas do backup para validação básica
        local backup_lines=$(wc -l < "${BACKUP_INFO[db_backup_file]}" 2>/dev/null || echo "0")
        BACKUP_METRICS[db_backup_lines]="$backup_lines"
        
        if [[ $backup_lines -gt 100 ]]; then
            log_success "Backup do banco tem conteúdo substancial ($backup_lines linhas)"
        else
            BACKUP_ISSUES[db_backup_too_small]="Backup do banco muito pequeno ($backup_lines linhas)"
            log_warning "Backup do banco parece muito pequeno"
        fi
    fi
    
    # Testar se backups de configuração podem ser extraídos
    if [[ -n "${BACKUP_INFO[config_backup_file]:-}" && -f "${BACKUP_INFO[config_backup_file]}" ]]; then
        log_info "Testando backup de configurações..."
        
        if tar -tzf "${BACKUP_INFO[config_backup_file]}" >/dev/null 2>&1; then
            BACKUP_INFO[config_backup_readable]="true"
            log_success "Backup de configurações é válido"
        else
            BACKUP_ISSUES[config_backup_corrupted]="Backup de configurações corrompido"
            log_error "Backup de configurações não é válido"
        fi
    fi
}

# Criar plano de recuperação
create_recovery_plan() {
    log_section "📋 Plano de Recuperação"
    
    local recovery_plan_file="$BACKUP_DIR/recovery_plan_$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$recovery_plan_file" << EOF
# Plano de Recuperação - RootGames API
**Gerado em:** $(date)
**Versão:** $(grep '"version"' "$PROJECT_ROOT/package.json" 2>/dev/null | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/' || echo "N/A")

## Backups Disponíveis

### Banco de Dados
- **Arquivo:** ${BACKUP_INFO[db_backup_file]:-"N/A"}
- **Tamanho:** ${BACKUP_METRICS[db_backup_size]:-"N/A"}
- **Duração do backup:** ${BACKUP_METRICS[db_backup_duration]:-"N/A"}s
- **Status:** ${BACKUP_INFO[db_backup_success]:-"false"}

### Configurações
- **Arquivo:** ${BACKUP_INFO[config_backup_file]:-"N/A"}
- **Tamanho:** ${BACKUP_METRICS[config_backup_size]:-"N/A"}
- **Arquivos incluídos:** ${BACKUP_METRICS[config_files_count]:-"0"}

### Logs
- **Arquivo:** ${BACKUP_INFO[logs_backup_file]:-"N/A"}
- **Tamanho:** ${BACKUP_METRICS[logs_backup_size]:-"N/A"}

## Procedimento de Recuperação

### 1. Restaurar Banco de Dados
\`\`\`bash
# Parar aplicação
pm2 stop rootgames-api

# Restaurar banco
psql -h \$DB_HOST -p \$DB_PORT -U \$DB_USER -d postgres -c "DROP DATABASE IF EXISTS \$DB_NAME;"
psql -h \$DB_HOST -p \$DB_PORT -U \$DB_USER -d postgres -c "CREATE DATABASE \$DB_NAME;"
psql -h \$DB_HOST -p \$DB_PORT -U \$DB_USER -d \$DB_NAME < ${BACKUP_INFO[db_backup_file]:-"backup_file.sql"}
\`\`\`

### 2. Restaurar Configurações
\`\`\`bash
# Extrair configurações
tar -xzf ${BACKUP_INFO[config_backup_file]:-"config_backup.tar.gz"} -C $PROJECT_ROOT
\`\`\`

### 3. Reinstalar Dependências
\`\`\`bash
cd $PROJECT_ROOT
yarn install
\`\`\`

### 4. Reiniciar Aplicação
\`\`\`bash
yarn build
pm2 start rootgames-api
\`\`\`

## Verificações Pós-Recuperação
- [ ] Aplicação inicia sem erros
- [ ] Banco de dados acessível
- [ ] Endpoints da API respondem
- [ ] Admin panel acessível
- [ ] Logs sendo gerados

## Contatos de Emergência
- **Desenvolvedor:** rocinante626s@gmail.com
- **Repositório:** https://github.com/jonathanmartins81/rootgames-api

---
*Plano gerado automaticamente pelo sistema de diagnóstico*
EOF

    BACKUP_INFO[recovery_plan_file]="$recovery_plan_file"
    log_success "Plano de recuperação criado: $recovery_plan_file"
}

# Limpar backups antigos
cleanup_old_backups() {
    log_section "🧹 Limpeza de Backups Antigos"
    
    local retention_days=7
    local deleted_count=0
    
    # Remover backups mais antigos que retention_days
    while IFS= read -r -d '' file; do
        rm -f "$file"
        ((deleted_count++))
        log_info "Removido: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "*.sql" -o -name "*.tar.gz" -mtime +$retention_days -print0 2>/dev/null)
    
    BACKUP_METRICS[deleted_old_backups]="$deleted_count"
    
    if [[ $deleted_count -gt 0 ]]; then
        log_success "Removidos $deleted_count backups antigos (>$retention_days dias)"
    else
        log_info "Nenhum backup antigo para remover"
    fi
}

# Gerar relatório de backup
generate_backup_report() {
    log_section "📄 Gerando Relatório de Backup"
    
    cat > "$BACKUP_REPORT" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "step": 6,
  "step_name": "backup-verificacao",
  "backup_info": {
EOF

    # Adicionar informações de backup
    local first=true
    for key in "${!BACKUP_INFO[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$BACKUP_REPORT"
        fi
        echo "    \"$key\": \"${BACKUP_INFO[$key]}\"" >> "$BACKUP_REPORT"
    done

    cat >> "$BACKUP_REPORT" << EOF
  },
  "metrics": {
EOF

    # Adicionar métricas
    first=true
    for key in "${!BACKUP_METRICS[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$BACKUP_REPORT"
        fi
        echo "    \"$key\": \"${BACKUP_METRICS[$key]}\"" >> "$BACKUP_REPORT"
    done

    cat >> "$BACKUP_REPORT" << EOF
  },
  "issues": {
EOF

    # Adicionar problemas
    first=true
    for key in "${!BACKUP_ISSUES[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$BACKUP_REPORT"
        fi
        echo "    \"$key\": \"${BACKUP_ISSUES[$key]}\"" >> "$BACKUP_REPORT"
    done

    cat >> "$BACKUP_REPORT" << EOF
  }
}
EOF

    log_success "Relatório de backup salvo: $BACKUP_REPORT"
}

# Finalizar etapa
finalize_step() {
    local issues_count=${#BACKUP_ISSUES[@]}
    local backup_success=true
    
    # Verificar se backups críticos foram bem-sucedidos
    if [[ "${BACKUP_INFO[db_backup_success]:-false}" != "true" ]]; then
        backup_success=false
    fi
    
    if [[ "$backup_success" == "true" && $issues_count -eq 0 ]]; then
        log_success "✅ Etapa 6 concluída: Backups criados com sucesso"
        echo "$(date -Iseconds) - Etapa 6 concluída: SUCESSO" >> "$SEQUENCE_LOG"
    else
        log_warning "⚠️ Etapa 6 concluída com problemas: $issues_count problema(s)"
        echo "$(date -Iseconds) - Etapa 6 concluída: $issues_count problemas" >> "$SEQUENCE_LOG"
    fi
    
    # Atualizar status
    if command_exists jq; then
        jq '.steps."6".status = "completed" | .steps."6".end = "'$(date -Iseconds)'" | .current_step = 7' \
           "$REPORT_DIR/diagnostic_status.json" > "$REPORT_DIR/diagnostic_status.tmp" && \
           mv "$REPORT_DIR/diagnostic_status.tmp" "$REPORT_DIR/diagnostic_status.json"
    fi
    
    log_info "🔄 Próximo passo: ./scripts/7_relatorio-final.sh"
}

# Função principal
main() {
    init_step
    
    if check_available_space; then
        backup_database
        backup_config_files
        backup_logs
        check_existing_backups
        test_backup_restoration
        create_recovery_plan
        cleanup_old_backups
        generate_backup_report
    else
        log_error "Espaço insuficiente para backup"
        BACKUP_ISSUES[insufficient_space]="Espaço insuficiente para realizar backup"
    fi
    
    finalize_step
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
