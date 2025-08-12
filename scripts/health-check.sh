#!/bin/bash
# scripts/health-check.sh - Health check com rollback automático

set -e

# Configurações
API_URL="${API_URL:-http://localhost:1337}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-rootgames}"
DB_USER="${DB_USER:-rootgames}"
DB_PASS="${DB_PASS:-rootgames}"
TIMEOUT="${TIMEOUT:-30}"
RETRIES="${RETRIES:-3}"
AUTO_ROLLBACK="${AUTO_ROLLBACK:-true}"
LOG_FILE="${LOG_FILE:-./logs/health-check.log}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ERRO] $1" >> "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCESSO]${NC} $1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [SUCESSO] $1" >> "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [AVISO] $1" >> "$LOG_FILE"
}

# Criar diretório de logs se não existir
mkdir -p "$(dirname "$LOG_FILE")"

# Função para verificar endpoint
check_endpoint() {
    local endpoint="$1"
    local description="$2"
    local expected_status="${3:-200}"

    for i in $(seq 1 $RETRIES); do
        log "  Verificando $description... (tentativa $i/$RETRIES)"

        # Fazer requisição HTTP
        HTTP_RESPONSE=$(curl -s -w "%{http_code}" --max-time $TIMEOUT "$API_URL$endpoint" 2>/dev/null || echo "000")
        HTTP_STATUS="${HTTP_RESPONSE: -3}"
        HTTP_BODY="${HTTP_RESPONSE%???}"

        if [ "$HTTP_STATUS" = "$expected_status" ]; then
            success "  ✅ $description: OK (HTTP $HTTP_STATUS)"
            return 0
        else
            error "  ❌ $description: FALHOU (HTTP $HTTP_STATUS)"
            if [ $i -eq $RETRIES ]; then
                return 1
            fi
            sleep 2
        fi
    done
}

# Verificar banco de dados
check_database() {
    log "Verificando banco de dados..."

    if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        success "  ✅ Banco de dados: OK"
        return 0
    else
        error "  ❌ Banco de dados: FALHOU"
        return 1
    fi
}

# Verificar uso de memória
check_memory() {
    log "Verificando uso de memória..."

    # Encontrar processo do Strapi
    STRAPI_PID=$(pgrep -f "strapi" | head -1)

    if [ -z "$STRAPI_PID" ]; then
        error "  ❌ Processo Strapi não encontrado"
        return 1
    fi

    # Verificar uso de memória
    MEMORY_USAGE=$(ps -p "$STRAPI_PID" -o %mem --no-headers 2>/dev/null || echo "0")

    if [ -z "$MEMORY_USAGE" ] || [ "$MEMORY_USAGE" = "0" ]; then
        warning "  ⚠️ Não foi possível obter uso de memória"
        return 0
    fi

    log "  💾 Uso de memória: ${MEMORY_USAGE}%"

    # Verificar se uso está alto
    if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
        warning "  ⚠️ Uso de memória alto: $MEMORY_USAGE%"
        return 1
    fi

    success "  ✅ Uso de memória: OK"
    return 0
}

# Verificar uso de CPU
check_cpu() {
    log "Verificando uso de CPU..."

    STRAPI_PID=$(pgrep -f "strapi" | head -1)

    if [ -z "$STRAPI_PID" ]; then
        error "  ❌ Processo Strapi não encontrado"
        return 1
    fi

    # Verificar uso de CPU
    CPU_USAGE=$(ps -p "$STRAPI_PID" -o %cpu --no-headers 2>/dev/null || echo "0")

    if [ -z "$CPU_USAGE" ] || [ "$CPU_USAGE" = "0" ]; then
        warning "  ⚠️ Não foi possível obter uso de CPU"
        return 0
    fi

    log "  🔥 Uso de CPU: ${CPU_USAGE}%"

    # Verificar se uso está alto
    if (( $(echo "$CPU_USAGE > 70" | bc -l) )); then
        warning "  ⚠️ Uso de CPU alto: $CPU_USAGE%"
        return 1
    fi

    success "  ✅ Uso de CPU: OK"
    return 0
}

# Verificar espaço em disco
check_disk() {
    log "Verificando espaço em disco..."

    # Verificar espaço disponível
    AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
    AVAILABLE_KB=$(df . | awk 'NR==2 {print $4}')

    log "  💿 Espaço disponível: $AVAILABLE_SPACE"

    # Verificar se há espaço suficiente (mínimo 1GB)
    if [ $AVAILABLE_KB -lt 1048576 ]; then # 1GB em KB
        error "  ❌ Pouco espaço em disco: $AVAILABLE_SPACE"
        return 1
    fi

    success "  ✅ Espaço em disco: OK"
    return 0
}

# Verificar conectividade de rede
check_network() {
    log "Verificando conectividade de rede..."

    # Testar conectividade básica
    if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        success "  ✅ Conectividade de rede: OK"
        return 0
    else
        error "  ❌ Conectividade de rede: FALHOU"
        return 1
    fi
}

# Verificar logs de erro
check_logs() {
    log "Verificando logs de erro..."

    LOG_FILE_STRAPI=".tmp/logs/strapi.log"

    if [ -f "$LOG_FILE_STRAPI" ]; then
        # Contar erros nas últimas 100 linhas
        ERROR_COUNT=$(tail -100 "$LOG_FILE_STRAPI" | grep -i "error\|fatal\|exception" | wc -l)

        if [ $ERROR_COUNT -gt 10 ]; then
            warning "  ⚠️ Muitos erros nos logs: $ERROR_COUNT erros nas últimas 100 linhas"
            return 1
        else
            success "  ✅ Logs: OK ($ERROR_COUNT erros nas últimas 100 linhas)"
            return 0
        fi
    else
        warning "  ⚠️ Arquivo de log não encontrado"
        return 0
    fi
}

# Executar rollback automático
trigger_rollback() {
    if [ "$AUTO_ROLLBACK" = "true" ]; then
        error "🚨 Health check falhou! Iniciando rollback automático..."

        # Executar script de rollback
        if [ -f "./scripts/rollback.sh" ]; then
            log "Executando rollback..."
            ./scripts/rollback.sh

            # Verificar se rollback foi bem-sucedido
            sleep 10
            if ./scripts/health-check.sh --no-rollback; then
                success "✅ Rollback executado com sucesso!"
                return 0
            else
                error "❌ Rollback falhou! Intervenção manual necessária."
                return 1
            fi
        else
            error "❌ Script de rollback não encontrado!"
            return 1
        fi
    else
        error "🚨 Health check falhou! Rollback automático desabilitado."
        return 1
    fi
}

# Função principal
main() {
    log "🔍 Iniciando health check da aplicação..."

    # Verificar se é apenas verificação (sem rollback)
    if [ "$1" = "--no-rollback" ]; then
        AUTO_ROLLBACK="false"
    fi

    # Contadores
    TOTAL_CHECKS=0
    FAILED_CHECKS=0

    # Executar verificações
    log "📊 Executando verificações..."

    # 1. Verificar endpoints críticos
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if check_endpoint "/" "Root Endpoint" "200"; then
        success "✅ Root endpoint: OK"
    else
        error "❌ Root endpoint: FALHOU"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if check_endpoint "/api/games?limit=1" "API Games" "403"; then
        success "✅ API Games: OK"
    else
        error "❌ API Games: FALHOU"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if check_endpoint "/admin" "Admin Panel" "200"; then
        success "✅ Admin Panel: OK"
    else
        error "❌ Admin Panel: FALHOU"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi

    # 2. Verificar banco de dados
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if check_database; then
        success "✅ Banco de dados: OK"
    else
        error "❌ Banco de dados: FALHOU"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi

    # 3. Verificar recursos do sistema
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if check_memory; then
        success "✅ Memória: OK"
    else
        error "❌ Memória: PROBLEMA"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if check_cpu; then
        success "✅ CPU: OK"
    else
        error "❌ CPU: PROBLEMA"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if check_disk; then
        success "✅ Disco: OK"
    else
        error "❌ Disco: PROBLEMA"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi

    # 4. Verificar conectividade
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if check_network; then
        success "✅ Rede: OK"
    else
        error "❌ Rede: FALHOU"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi

    # 5. Verificar logs
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if check_logs; then
        success "✅ Logs: OK"
    else
        error "❌ Logs: PROBLEMA"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi

    # Resumo final
    log "📊 Resumo do health check:"
    log "  - Total de verificações: $TOTAL_CHECKS"
    log "  - Verificações com sucesso: $((TOTAL_CHECKS - FAILED_CHECKS))"
    log "  - Verificações com falha: $FAILED_CHECKS"

    # Calcular taxa de sucesso
    SUCCESS_RATE=$(( (TOTAL_CHECKS - FAILED_CHECKS) * 100 / TOTAL_CHECKS ))
    log "  - Taxa de sucesso: ${SUCCESS_RATE}%"

    # Decidir se executar rollback
    if [ $FAILED_CHECKS -gt 0 ]; then
        if [ $SUCCESS_RATE -lt 70 ]; then
            error "🚨 Taxa de sucesso muito baixa (${SUCCESS_RATE}%). Sistema em estado crítico."
            trigger_rollback
            exit 1
        else
            warning "⚠️ Alguns problemas detectados, mas sistema ainda funcional."
            if [ "$AUTO_ROLLBACK" = "true" ]; then
                log "Rollback automático disponível se necessário."
            fi
        fi
    else
        success "✅ Health check concluído com sucesso! Sistema saudável."
    fi

    # Retornar código de saída baseado no resultado
    if [ $FAILED_CHECKS -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Executar função principal
main "$@"
