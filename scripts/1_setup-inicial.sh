#!/bin/bash
# scripts/setup-scripts.sh - Configuração inicial dos scripts
# Versão: 2.0.0 - Agosto 2025

set -euo pipefail

# Carregar biblioteca comum
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# Configurar permissões e dependências
setup_scripts() {
    log_info "🔧 Configurando scripts do RootGames API"
    
    # Tornar todos os scripts executáveis
    log_info "📝 Configurando permissões dos scripts..."
    find "$SCRIPT_DIR" -name "*.sh" -type f -exec chmod +x {} \;
    log_success "Permissões configuradas"
    
    # Criar diretórios necessários
    local dirs=("$LOG_DIR" "$BACKUP_DIR" "$PROJECT_ROOT/reports")
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log_success "Diretório criado: $dir"
        fi
    done
    
    # Verificar dependências
    log_info "🔍 Verificando dependências..."
    local missing_deps=()
    
    local required_commands=("curl" "jq" "bc" "psql" "pg_dump")
    for cmd in "${required_commands[@]}"; do
        if ! command_exists "$cmd"; then
            missing_deps+=("$cmd")
        fi
    done
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_warning "Dependências ausentes: ${missing_deps[*]}"
        log_info "Para instalar no Ubuntu/Debian:"
        echo "sudo apt update && sudo apt install -y curl jq bc postgresql-client"
    else
        log_success "Todas as dependências estão instaladas"
    fi
    
    # Configurar arquivo .env se não existir
    if [[ ! -f "$PROJECT_ROOT/.env" && -f "$PROJECT_ROOT/.env.example" ]]; then
        log_info "📄 Criando arquivo .env..."
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        log_success "Arquivo .env criado a partir do .env.example"
        log_warning "Configure as variáveis de ambiente em .env antes de usar os scripts"
    fi
    
    log_success "🎉 Scripts configurados com sucesso!"
    log_info "Execute './scripts/diagnostico-completo.sh' para verificar o sistema"
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    setup_scripts "$@"
fi
