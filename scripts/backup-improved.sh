#!/bin/bash
# scripts/backup-improved.sh - Backup automático melhorado com segurança e integridade

set -euo pipefail

# ===================================================================
# CONFIGURAÇÕES E INICIALIZAÇÃO
# ===================================================================

# Carregar biblioteca comum
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# Configurações específicas do backup
DB_HOST="$(get_config DB_HOST "127.0.0.1")"
DB_PORT="$(get_config DB_PORT "5432")"
DB_NAME="$(get_config DB_NAME "rootgames")"
DB_USER="$(get_config DB_USER "rootgames")"
DB_PASS="$(get_config DB_PASS "")"
BACKUP_DIR="$(get_config BACKUP_DIR "$PROJECT_ROOT/backups")"
RETENTION_DAYS="$(get_config RETENTION_DAYS "7")"
ENCRYPT_BACKUPS="$(get_config ENCRYPT_BACKUPS "true")"
BACKUP_PASSWORD="$(get_config BACKUP_PASSWORD "")"
WEBHOOK_URL="$(get_config BACKUP_WEBHOOK_URL "")"
VERIFY_INTEGRITY="$(get_config VERIFY_INTEGRITY "true")"
COMPRESS_BACKUPS="$(get_config COMPRESS_BACKUPS "true")"

# Validações iniciais
if [[ -z "$DB_PASS" ]]; then
    log_error "DB_PASS não configurado. Configure via .env ou variável de ambiente"
    exit 1
fi

if [[ "$ENCRYPT_BACKUPS" == "true" && -z "$BACKUP_PASSWORD" ]]; then
    log_warning "ENCRYPT_BACKUPS habilitado mas BACKUP_PASSWORD não configurado"
    log_info "Backup será criado sem criptografia"
    ENCRYPT_BACKUPS="false"
fi

# ===================================================================
# FUNÇÕES DE BACKUP
# ===================================================================

# Verificar pré-requisitos
check_prerequisites() {
    log_info "Verificando pré-requisitos para backup..."
    
    # Verificar comandos necessários
    local required_commands=("pg_dump" "psql")
    
    if [[ "$COMPRESS_BACKUPS" == "true" ]]; then
        required_commands+=("gzip")
    fi
    
    if [[ "$ENCRYPT_BACKUPS" == "true" ]]; then
        required_commands+=("gpg")
    fi
    
    for cmd in "${required_commands[@]}"; do
        if ! command_exists "$cmd"; then
            log_error "Comando necessário não encontrado: $cmd"
            send_webhook_notification "$WEBHOOK_URL" "❌ Backup falhou: comando $cmd não encontrado" "error"
            exit 1
        fi
    done
    
    # Verificar conexão com banco
    if ! check_postgres_connection "$DB_HOST" "$DB_PORT" "$DB_NAME" "$DB_USER" "$DB_PASS"; then
        log_error "Não foi possível conectar ao PostgreSQL"
        log_error "Host: $DB_HOST:$DB_PORT, Database: $DB_NAME, User: $DB_USER"
        send_webhook_notification "$WEBHOOK_URL" "❌ Backup falhou: conexão com banco de dados" "error"
        exit 1
    fi
    
    # Verificar espaço em disco
    local disk_usage=$(get_disk_usage "$BACKUP_DIR")
    if [[ $disk_usage -gt 90 ]]; then
        log_warning "Espaço em disco baixo: ${disk_usage}% usado"
        send_webhook_notification "$WEBHOOK_URL" "⚠️ Backup: espaço em disco baixo (${disk_usage}%)" "warning"
    fi
    
    # Criar diretório de backup
    mkdir -p "$BACKUP_DIR"
    
    log_success "Pré-requisitos verificados com sucesso"
}

# Fazer backup do banco de dados
backup_database() {
    log_info "Iniciando backup do banco de dados..."
    
    local timestamp="$(date +%Y%m%d_%H%M%S)"
    local backup_file="$BACKUP_DIR/db_backup_${timestamp}.sql"
    local final_backup_file="$backup_file"
    
    # Fazer dump do banco
    log_loading "Criando dump do banco de dados..."
    if ! PGPASSWORD="$DB_PASS" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=custom \
        --compress=9 \
        --file="$backup_file" 2>/dev/null; then
        
        log_error "Falha ao criar backup do banco de dados"
        send_webhook_notification "$WEBHOOK_URL" "❌ Backup falhou: erro no pg_dump" "error"
        return 1
    fi
    
    # Verificar integridade do backup
    if [[ "$VERIFY_INTEGRITY" == "true" ]]; then
        log_loading "Verificando integridade do backup..."
        if ! verify_backup_integrity "$backup_file"; then
            log_error "Falha na verificação de integridade do backup"
            rm -f "$backup_file"
            send_webhook_notification "$WEBHOOK_URL" "❌ Backup falhou: falha na verificação de integridade" "error"
            return 1
        fi
    fi
    
    # Comprimir backup se solicitado
    if [[ "$COMPRESS_BACKUPS" == "true" ]]; then
        log_loading "Comprimindo backup..."
        if gzip "$backup_file"; then
            final_backup_file="${backup_file}.gz"
            log_success "Backup comprimido: $(basename "$final_backup_file")"
        else
            log_warning "Falha ao comprimir backup, mantendo arquivo original"
        fi
    fi
    
    # Criptografar backup se solicitado
    if [[ "$ENCRYPT_BACKUPS" == "true" ]]; then
        log_loading "Criptografando backup..."
        if encrypt_backup_file "$final_backup_file"; then
            final_backup_file="${final_backup_file}.gpg"
            log_success "Backup criptografado: $(basename "$final_backup_file")"
        else
            log_warning "Falha ao criptografar backup, mantendo arquivo original"
        fi
    fi
    
    # Obter informações do backup
    local backup_size=$(du -h "$final_backup_file" | cut -f1)
    local db_size=$(get_database_size "$DB_HOST" "$DB_PORT" "$DB_NAME" "$DB_USER" "$DB_PASS")
    
    log_success "Backup do banco criado: $(basename "$final_backup_file") (${backup_size})"
    log_info "Tamanho do banco: $db_size"
    
    # Salvar metadados do backup
    save_backup_metadata "$final_backup_file" "$db_size"
    
    echo "$final_backup_file"
}

# Verificar integridade do backup
verify_backup_integrity() {
    local backup_file="$1"
    
    # Verificar se o arquivo não está corrompido
    if ! PGPASSWORD="$DB_PASS" pg_restore \
        --list \
        --file="$backup_file" >/dev/null 2>&1; then
        return 1
    fi
    
    # Verificar tamanho mínimo (deve ter pelo menos 1KB)
    local file_size=$(stat -c%s "$backup_file" 2>/dev/null || echo "0")
    if [[ $file_size -lt 1024 ]]; then
        log_error "Backup muito pequeno: ${file_size} bytes"
        return 1
    fi
    
    log_success "Integridade do backup verificada"
    return 0
}

# Criptografar arquivo de backup
encrypt_backup_file() {
    local file="$1"
    local encrypted_file="${file}.gpg"
    
    if echo "$BACKUP_PASSWORD" | gpg \
        --batch \
        --yes \
        --passphrase-fd 0 \
        --cipher-algo AES256 \
        --compress-algo 2 \
        --symmetric \
        --output "$encrypted_file" \
        "$file" 2>/dev/null; then
        
        # Remover arquivo original após criptografia bem-sucedida
        rm -f "$file"
        return 0
    else
        return 1
    fi
}

# Salvar metadados do backup
save_backup_metadata() {
    local backup_file="$1"
    local db_size="$2"
    local metadata_file="${backup_file}.meta"
    
    cat > "$metadata_file" << EOF
{
    "backup_file": "$(basename "$backup_file")",
    "timestamp": "$(date -Iseconds)",
    "database": {
        "host": "$DB_HOST",
        "port": "$DB_PORT",
        "name": "$DB_NAME",
        "user": "$DB_USER",
        "size": "$db_size"
    },
    "backup": {
        "size": "$(du -h "$backup_file" | cut -f1)",
        "compressed": "$COMPRESS_BACKUPS",
        "encrypted": "$ENCRYPT_BACKUPS",
        "integrity_verified": "$VERIFY_INTEGRITY"
    },
    "system": {
        "hostname": "$(hostname)",
        "user": "$(whoami)",
        "script_version": "2.0.0"
    }
}
EOF
    
    log_debug "Metadados salvos: $(basename "$metadata_file")"
}

# Backup de arquivos importantes
backup_files() {
    log_info "Fazendo backup de arquivos importantes..."
    
    local timestamp="$(date +%Y%m%d_%H%M%S)"
    local files_backup="$BACKUP_DIR/files_backup_${timestamp}.tar.gz"
    
    # Lista de arquivos/diretórios importantes
    local important_files=(
        "$PROJECT_ROOT/.env"
        "$PROJECT_ROOT/config"
        "$PROJECT_ROOT/src"
        "$PROJECT_ROOT/package.json"
        "$PROJECT_ROOT/yarn.lock"
        "$PROJECT_ROOT/tsconfig.json"
    )
    
    # Filtrar apenas arquivos que existem
    local existing_files=()
    for file in "${important_files[@]}"; do
        if [[ -e "$file" ]]; then
            existing_files+=("$file")
        fi
    done
    
    if [[ ${#existing_files[@]} -eq 0 ]]; then
        log_warning "Nenhum arquivo importante encontrado para backup"
        return 0
    fi
    
    # Criar backup dos arquivos
    if tar -czf "$files_backup" -C "$PROJECT_ROOT" \
        $(printf '%s\n' "${existing_files[@]}" | sed "s|$PROJECT_ROOT/||g") 2>/dev/null; then
        
        local backup_size=$(du -h "$files_backup" | cut -f1)
        log_success "Backup de arquivos criado: $(basename "$files_backup") (${backup_size})"
        
        # Criptografar se solicitado
        if [[ "$ENCRYPT_BACKUPS" == "true" ]]; then
            if encrypt_backup_file "$files_backup"; then
                log_success "Backup de arquivos criptografado"
            fi
        fi
    else
        log_error "Falha ao criar backup de arquivos"
        return 1
    fi
}

# Limpar backups antigos
cleanup_old_backups() {
    log_info "Limpando backups antigos (mais de $RETENTION_DAYS dias)..."
    
    local deleted_count=0
    local total_size_freed=0
    
    # Encontrar e remover backups antigos
    while IFS= read -r -d '' file; do
        local file_size=$(stat -c%s "$file" 2>/dev/null || echo "0")
        total_size_freed=$((total_size_freed + file_size))
        
        # Remover arquivo e seus metadados
        rm -f "$file" "${file}.meta" 2>/dev/null
        ((deleted_count++))
        
        log_debug "Removido backup antigo: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "*backup_*" -type f -mtime +$RETENTION_DAYS -print0)
    
    if [[ $deleted_count -gt 0 ]]; then
        local size_freed_mb=$((total_size_freed / 1024 / 1024))
        log_success "Removidos $deleted_count backups antigos (${size_freed_mb}MB liberados)"
    else
        log_info "Nenhum backup antigo para remover"
    fi
}

# Gerar relatório de backup
generate_backup_report() {
    local backup_file="$1"
    
    log_info "Gerando relatório de backup..."
    
    local report_file="$BACKUP_DIR/backup_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
========================================
RELATÓRIO DE BACKUP - ROOTGAMES API
========================================

Data/Hora: $(date)
Hostname: $(hostname)
Usuário: $(whoami)

CONFIGURAÇÕES:
- Banco: $DB_HOST:$DB_PORT/$DB_NAME
- Diretório: $BACKUP_DIR
- Retenção: $RETENTION_DAYS dias
- Compressão: $COMPRESS_BACKUPS
- Criptografia: $ENCRYPT_BACKUPS
- Verificação: $VERIFY_INTEGRITY

BACKUP CRIADO:
- Arquivo: $(basename "$backup_file")
- Tamanho: $(du -h "$backup_file" | cut -f1)
- Banco: $(get_database_size "$DB_HOST" "$DB_PORT" "$DB_NAME" "$DB_USER" "$DB_PASS")

SISTEMA:
- CPU: $(get_cpu_usage)%
- Memória: $(get_memory_usage)%
- Disco: $(get_disk_usage "$BACKUP_DIR")%
- Load: $(get_load_average)

BACKUPS EXISTENTES:
$(find "$BACKUP_DIR" -name "*backup_*" -type f | wc -l) arquivos
$(du -sh "$BACKUP_DIR" | cut -f1) total

========================================
EOF
    
    log_success "Relatório gerado: $(basename "$report_file")"
}

# ===================================================================
# FUNÇÃO PRINCIPAL
# ===================================================================

main() {
    log_info "🚀 Iniciando backup automático do RootGames API"
    log_info "Versão do script: 2.0.0 (melhorado)"
    
    local start_time=$(date +%s)
    local backup_file=""
    local success=true
    
    # Verificar pré-requisitos
    if ! check_prerequisites; then
        log_error "Falha na verificação de pré-requisitos"
        exit 1
    fi
    
    # Fazer backup do banco de dados
    if backup_file=$(backup_database); then
        log_success "Backup do banco concluído"
    else
        log_error "Falha no backup do banco de dados"
        success=false
    fi
    
    # Fazer backup de arquivos importantes
    if ! backup_files; then
        log_warning "Falha no backup de arquivos (continuando...)"
    fi
    
    # Limpar backups antigos
    cleanup_old_backups
    
    # Gerar relatório
    if [[ -n "$backup_file" ]]; then
        generate_backup_report "$backup_file"
    fi
    
    # Calcular tempo total
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Enviar notificação
    if [[ "$success" == "true" ]]; then
        local message="✅ Backup concluído com sucesso em ${duration}s"
        log_success "$message"
        send_webhook_notification "$WEBHOOK_URL" "$message" "success"
    else
        local message="❌ Backup falhou após ${duration}s"
        log_error "$message"
        send_webhook_notification "$WEBHOOK_URL" "$message" "error"
        exit 1
    fi
    
    log_info "🎉 Backup automático finalizado"
}

# ===================================================================
# EXECUÇÃO
# ===================================================================

# Verificar se está sendo executado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
