#!/bin/bash
# scripts/backup.sh - Backup automático antes de cada deploy

set -e

# Configurações
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-rootgames}"
DB_USER="${DB_USER:-rootgames}"
DB_PASS="${DB_PASS:-rootgames}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCESSO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

# Verificar se PostgreSQL está rodando
check_postgres() {
    log "Verificando conexão com PostgreSQL..."
    if ! PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        error "Não foi possível conectar ao PostgreSQL"
        error "Verifique se o serviço está rodando e as credenciais estão corretas"
        exit 1
    fi
    success "Conexão com PostgreSQL estabelecida"
}

# Criar diretório de backup se não existir
create_backup_dir() {
    log "Criando diretório de backup..."
    mkdir -p "$BACKUP_DIR"
    success "Diretório de backup criado: $BACKUP_DIR"
}

# Fazer backup do banco de dados
backup_database() {
    log "Iniciando backup do banco de dados..."

    # Nome do arquivo de backup
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/rootgames_backup_$TIMESTAMP.sql"

    # Fazer backup
    PGPASSWORD="$DB_PASS" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        --format=custom \
        --compress=9 \
        > "$BACKUP_FILE"

    if [ $? -eq 0 ]; then
        success "Backup criado: $BACKUP_FILE"

        # Criar link simbólico para o backup mais recente
        ln -sf "$BACKUP_FILE" "$BACKUP_DIR/backup_latest.sql"
        success "Link simbólico criado: backup_latest.sql"

        # Verificar tamanho do backup
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log "Tamanho do backup: $BACKUP_SIZE"

        return 0
    else
        error "Falha ao criar backup"
        return 1
    fi
}

# Backup de arquivos importantes
backup_files() {
    log "Fazendo backup de arquivos importantes..."

    # Backup do .env
    if [ -f ".env" ]; then
        cp .env "$BACKUP_DIR/.env.backup.$(date +%Y%m%d_%H%M%S)"
        success "Backup do .env criado"
    fi

    # Backup da configuração
    if [ -d "config" ]; then
        tar -czf "$BACKUP_DIR/config_backup_$(date +%Y%m%d_%H%M%S).tar.gz" config/
        success "Backup da configuração criado"
    fi
}

# Limpar backups antigos
cleanup_old_backups() {
    log "Limpando backups antigos (mais de $RETENTION_DAYS dias)..."

    # Contar backups antes da limpeza
    BACKUP_COUNT_BEFORE=$(find "$BACKUP_DIR" -name "*.sql" -type f | wc -l)

    # Remover backups antigos
    find "$BACKUP_DIR" -name "*.sql" -type f -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

    # Contar backups após a limpeza
    BACKUP_COUNT_AFTER=$(find "$BACKUP_DIR" -name "*.sql" -type f | wc -l)
    REMOVED_COUNT=$((BACKUP_COUNT_BEFORE - BACKUP_COUNT_AFTER))

    if [ $REMOVED_COUNT -gt 0 ]; then
        warning "Removidos $REMOVED_COUNT backups antigos"
    else
        log "Nenhum backup antigo encontrado para remoção"
    fi

    success "Limpeza concluída"
}

# Verificar espaço em disco
check_disk_space() {
    log "Verificando espaço em disco..."

    # Calcular espaço usado pelos backups
    BACKUP_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "0")

    # Verificar espaço disponível
    AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')

    log "Espaço usado pelos backups: $BACKUP_SIZE"
    log "Espaço disponível: $AVAILABLE_SPACE"

    # Verificar se há espaço suficiente (mínimo 1GB)
    AVAILABLE_KB=$(df . | awk 'NR==2 {print $4}')
    if [ $AVAILABLE_KB -lt 1048576 ]; then # 1GB em KB
        warning "Pouco espaço em disco disponível ($AVAILABLE_SPACE)"
        warning "Considere limpar backups antigos ou liberar espaço"
    fi
}

# Função principal
main() {
    log "🚀 Iniciando backup automático..."

    # Verificar dependências
    if ! command -v pg_dump &> /dev/null; then
        error "pg_dump não encontrado. Instale o PostgreSQL client."
        exit 1
    fi

    # Executar etapas do backup
    check_postgres
    create_backup_dir
    backup_database
    backup_files
    cleanup_old_backups
    check_disk_space

    # Resumo final
    log "📊 Resumo do backup:"
    log "  - Diretório: $BACKUP_DIR"
    log "  - Backup mais recente: backup_latest.sql"
    log "  - Retenção: $RETENTION_DAYS dias"

    success "✅ Backup automático concluído com sucesso!"

    # Retornar caminho do backup mais recente para uso em outros scripts
    echo "$BACKUP_DIR/backup_latest.sql"
}

# Executar função principal
main "$@"
