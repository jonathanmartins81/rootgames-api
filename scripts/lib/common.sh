#!/bin/bash
# scripts/lib/common.sh - Biblioteca comum de funções para todos os scripts

# ===================================================================
# CONFIGURAÇÕES GLOBAIS
# ===================================================================

# Versão da biblioteca
COMMON_LIB_VERSION="1.0.0"

# Configurações padrão (podem ser sobrescritas)
DEFAULT_TIMEOUT="${DEFAULT_TIMEOUT:-30}"
DEFAULT_RETRIES="${DEFAULT_RETRIES:-3}"
DEFAULT_LOG_LEVEL="${DEFAULT_LOG_LEVEL:-INFO}"

# Diretórios padrão
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="${LOG_DIR:-$PROJECT_ROOT/logs}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
CONFIG_DIR="${CONFIG_DIR:-$PROJECT_ROOT/config}"

# Criar diretórios necessários
mkdir -p "$LOG_DIR" "$BACKUP_DIR"

# ===================================================================
# CORES E FORMATAÇÃO
# ===================================================================

# Cores ANSI
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly GRAY='\033[0;37m'
readonly NC='\033[0m' # No Color

# Símbolos
readonly SUCCESS_SYMBOL="✅"
readonly ERROR_SYMBOL="❌"
readonly WARNING_SYMBOL="⚠️"
readonly INFO_SYMBOL="ℹ️"
readonly LOADING_SYMBOL="🔄"
readonly ROCKET_SYMBOL="🚀"

# ===================================================================
# FUNÇÕES DE LOG
# ===================================================================

# Função para obter timestamp
get_timestamp() {
    date +'%Y-%m-%d %H:%M:%S'
}

# Função para obter nome do script atual
get_script_name() {
    basename "$0" .sh
}

# Função de log genérica
_log() {
    local level="$1"
    local color="$2"
    local symbol="$3"
    local message="$4"
    local script_name="$(get_script_name)"
    local timestamp="$(get_timestamp)"
    
    # Log no console com cores
    echo -e "${color}${symbol} [${timestamp}] [${level}] [${script_name}]${NC} ${message}"
    
    # Log no arquivo sem cores
    echo "[${timestamp}] [${level}] [${script_name}] ${message}" >> "${LOG_DIR}/$(date +%Y-%m-%d).log"
}

# Funções de log específicas
log_info() {
    _log "INFO" "$BLUE" "$INFO_SYMBOL" "$1"
}

log_success() {
    _log "SUCCESS" "$GREEN" "$SUCCESS_SYMBOL" "$1"
}

log_warning() {
    _log "WARNING" "$YELLOW" "$WARNING_SYMBOL" "$1"
}

log_error() {
    _log "ERROR" "$RED" "$ERROR_SYMBOL" "$1"
}

log_debug() {
    if [[ "$DEFAULT_LOG_LEVEL" == "DEBUG" ]]; then
        _log "DEBUG" "$GRAY" "🐛" "$1"
    fi
}

log_loading() {
    _log "LOADING" "$CYAN" "$LOADING_SYMBOL" "$1"
}

# Função para seções (cabeçalhos)
log_section() {
    local message="$1"
    local script_name="$(get_script_name)"
    local timestamp="$(get_timestamp)"
    
    # Log no console com formatação especial
    echo -e "\n${PURPLE}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${WHITE}📋 ${message}${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════════════════════${NC}\n"
    
    # Log no arquivo
    echo "[${timestamp}] [SECTION] [${script_name}] ${message}" >> "${LOG_DIR}/$(date +%Y-%m-%d).log"
}

# ===================================================================
# FUNÇÕES DE VALIDAÇÃO
# ===================================================================

# Verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar se arquivo existe e é legível
file_readable() {
    [[ -f "$1" && -r "$1" ]]
}

# Verificar se diretório existe e é acessível
dir_accessible() {
    [[ -d "$1" && -r "$1" && -x "$1" ]]
}

# Verificar se porta está aberta
port_open() {
    local host="${1:-localhost}"
    local port="$2"
    local timeout="${3:-5}"
    
    timeout "$timeout" bash -c "echo >/dev/tcp/$host/$port" 2>/dev/null
}

# Verificar se URL está acessível
url_accessible() {
    local url="$1"
    local timeout="${2:-10}"
    
    if command_exists curl; then
        curl -s --max-time "$timeout" --head "$url" >/dev/null 2>&1
    elif command_exists wget; then
        wget -q --timeout="$timeout" --spider "$url" >/dev/null 2>&1
    else
        log_error "Nem curl nem wget estão disponíveis"
        return 1
    fi
}

# ===================================================================
# FUNÇÕES DE SISTEMA
# ===================================================================

# Obter uso de CPU
get_cpu_usage() {
    if command_exists top; then
        top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}'
    else
        echo "0"
    fi
}

# Obter uso de memória
get_memory_usage() {
    if [[ -f /proc/meminfo ]]; then
        local total_mem=$(grep MemTotal /proc/meminfo | awk '{print $2}')
        local free_mem=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
        local used_mem=$((total_mem - free_mem))
        echo $((used_mem * 100 / total_mem))
    else
        echo "0"
    fi
}

# Obter uso de disco
get_disk_usage() {
    local path="${1:-.}"
    df "$path" | tail -1 | awk '{print $5}' | sed 's/%//'
}

# Obter load average
get_load_average() {
    if [[ -f /proc/loadavg ]]; then
        cut -d' ' -f1 /proc/loadavg
    else
        echo "0.00"
    fi
}

# ===================================================================
# FUNÇÕES DE REDE
# ===================================================================

# Verificar conectividade com a internet
check_internet() {
    local test_hosts=("8.8.8.8" "1.1.1.1" "google.com")
    
    for host in "${test_hosts[@]}"; do
        if ping -c 1 -W 2 "$host" >/dev/null 2>&1; then
            return 0
        fi
    done
    
    return 1
}

# Obter IP público
get_public_ip() {
    if command_exists curl; then
        curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "unknown"
    elif command_exists wget; then
        wget -qO- --timeout=5 ifconfig.me 2>/dev/null || echo "unknown"
    else
        echo "unknown"
    fi
}

# ===================================================================
# FUNÇÕES DE BANCO DE DADOS
# ===================================================================

# Verificar conexão PostgreSQL
check_postgres_connection() {
    local host="${1:-${DB_HOST:-localhost}}"
    local port="${2:-${DB_PORT:-5432}}"
    local database="${3:-${DB_NAME:-postgres}}"
    local user="${4:-${DB_USER:-postgres}}"
    local password="${5:-${DB_PASS:-}}"
    
    if [[ -n "$password" ]]; then
        PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$database" -c "SELECT 1;" >/dev/null 2>&1
    else
        psql -h "$host" -p "$port" -U "$user" -d "$database" -c "SELECT 1;" >/dev/null 2>&1
    fi
}

# Obter tamanho do banco de dados
get_database_size() {
    local host="${1:-${DB_HOST:-localhost}}"
    local port="${2:-${DB_PORT:-5432}}"
    local database="${3:-${DB_NAME:-postgres}}"
    local user="${4:-${DB_USER:-postgres}}"
    local password="${5:-${DB_PASS:-}}"
    
    local query="SELECT pg_size_pretty(pg_database_size('$database'));"
    
    if [[ -n "$password" ]]; then
        PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$database" -t -c "$query" 2>/dev/null | xargs
    else
        psql -h "$host" -p "$port" -U "$user" -d "$database" -t -c "$query" 2>/dev/null | xargs
    fi
}

# ===================================================================
# FUNÇÕES DE BACKUP
# ===================================================================

# Criar backup com timestamp
create_timestamped_backup() {
    local source="$1"
    local destination="$2"
    local timestamp="$(date +%Y%m%d_%H%M%S)"
    local backup_name="backup_${timestamp}"
    
    if [[ -f "$source" ]]; then
        cp "$source" "${destination}/${backup_name}_$(basename "$source")"
    elif [[ -d "$source" ]]; then
        cp -r "$source" "${destination}/${backup_name}_$(basename "$source")"
    else
        log_error "Fonte de backup não encontrada: $source"
        return 1
    fi
    
    log_success "Backup criado: ${destination}/${backup_name}"
}

# Limpar backups antigos
cleanup_old_backups() {
    local backup_dir="$1"
    local retention_days="${2:-7}"
    
    if [[ ! -d "$backup_dir" ]]; then
        log_warning "Diretório de backup não encontrado: $backup_dir"
        return 1
    fi
    
    local deleted_count=0
    while IFS= read -r -d '' file; do
        rm -f "$file"
        ((deleted_count++))
    done < <(find "$backup_dir" -name "backup_*" -type f -mtime +$retention_days -print0)
    
    if [[ $deleted_count -gt 0 ]]; then
        log_info "Removidos $deleted_count backups antigos (mais de $retention_days dias)"
    fi
}

# ===================================================================
# FUNÇÕES DE CONFIGURAÇÃO
# ===================================================================

# Carregar configuração de arquivo .env
load_env_file() {
    local env_file="${1:-$PROJECT_ROOT/.env}"
    
    if [[ -f "$env_file" ]]; then
        log_debug "Carregando configurações de: $env_file"
        set -a
        source "$env_file"
        set +a
        log_success "Configurações carregadas de $env_file"
    else
        log_warning "Arquivo de configuração não encontrado: $env_file"
    fi
}

# Obter configuração com valor padrão
get_config() {
    local key="$1"
    local default_value="$2"
    local value="${!key:-$default_value}"
    echo "$value"
}

# ===================================================================
# FUNÇÕES DE NOTIFICAÇÃO
# ===================================================================

# Enviar notificação via webhook (Slack, Discord, etc.)
send_webhook_notification() {
    local webhook_url="$1"
    local message="$2"
    local level="${3:-info}"
    
    if [[ -z "$webhook_url" ]]; then
        log_debug "Webhook URL não configurada, pulando notificação"
        return 0
    fi
    
    local color=""
    case "$level" in
        "success") color="good" ;;
        "warning") color="warning" ;;
        "error") color="danger" ;;
        *) color="#36a64f" ;;
    esac
    
    local payload="{\"text\":\"$message\",\"color\":\"$color\"}"
    
    if command_exists curl; then
        curl -s -X POST -H 'Content-type: application/json' --data "$payload" "$webhook_url" >/dev/null
        log_debug "Notificação enviada via webhook"
    else
        log_warning "curl não disponível, não foi possível enviar notificação"
    fi
}

# ===================================================================
# FUNÇÕES DE RETRY E TIMEOUT
# ===================================================================

# Executar comando com retry
retry_command() {
    local max_attempts="${1:-$DEFAULT_RETRIES}"
    local delay="${2:-1}"
    shift 2
    local command=("$@")
    
    local attempt=1
    while [[ $attempt -le $max_attempts ]]; do
        log_debug "Tentativa $attempt de $max_attempts: ${command[*]}"
        
        if "${command[@]}"; then
            log_debug "Comando executado com sucesso na tentativa $attempt"
            return 0
        fi
        
        if [[ $attempt -lt $max_attempts ]]; then
            log_warning "Tentativa $attempt falhou, aguardando ${delay}s antes da próxima tentativa"
            sleep "$delay"
        fi
        
        ((attempt++))
    done
    
    log_error "Comando falhou após $max_attempts tentativas: ${command[*]}"
    return 1
}

# Executar comando com timeout
timeout_command() {
    local timeout_duration="${1:-$DEFAULT_TIMEOUT}"
    shift
    local command=("$@")
    
    log_debug "Executando comando com timeout de ${timeout_duration}s: ${command[*]}"
    
    if command_exists timeout; then
        timeout "$timeout_duration" "${command[@]}"
    else
        # Fallback para sistemas sem timeout
        "${command[@]}"
    fi
}

# ===================================================================
# FUNÇÕES DE VALIDAÇÃO DE SEGURANÇA
# ===================================================================

# Verificar permissões de arquivo
check_file_permissions() {
    local file="$1"
    local expected_permissions="$2"
    
    if [[ ! -f "$file" ]]; then
        log_error "Arquivo não encontrado: $file"
        return 1
    fi
    
    local current_permissions=$(stat -c "%a" "$file" 2>/dev/null)
    
    if [[ "$current_permissions" != "$expected_permissions" ]]; then
        log_warning "Permissões incorretas para $file: $current_permissions (esperado: $expected_permissions)"
        return 1
    fi
    
    log_success "Permissões corretas para $file: $current_permissions"
    return 0
}

# Sanitizar string para log
sanitize_for_log() {
    local input="$1"
    # Remove possíveis senhas, tokens, etc.
    echo "$input" | sed -E 's/(password|token|key|secret)=[^[:space:]]*/\1=***HIDDEN***/gi'
}

# ===================================================================
# FUNÇÕES DE INICIALIZAÇÃO
# ===================================================================

# Inicializar biblioteca comum
init_common_lib() {
    log_debug "Inicializando biblioteca comum v$COMMON_LIB_VERSION"
    
    # Carregar arquivo .env se existir
    load_env_file
    
    # Verificar comandos essenciais
    local essential_commands=("date" "basename" "dirname" "mkdir" "cp" "rm" "find")
    for cmd in "${essential_commands[@]}"; do
        if ! command_exists "$cmd"; then
            log_error "Comando essencial não encontrado: $cmd"
            exit 1
        fi
    done
    
    log_success "Biblioteca comum inicializada com sucesso"
}

# ===================================================================
# FUNÇÕES DE CLEANUP
# ===================================================================

# Função de cleanup para ser executada ao sair
cleanup_on_exit() {
    log_debug "Executando cleanup ao sair..."
    # Adicionar limpeza específica aqui se necessário
}

# Registrar função de cleanup
trap cleanup_on_exit EXIT

# ===================================================================
# INICIALIZAÇÃO AUTOMÁTICA
# ===================================================================

# Inicializar automaticamente quando o arquivo for sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    init_common_lib
fi
