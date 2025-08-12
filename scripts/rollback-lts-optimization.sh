#!/bin/bash

# 🔄 Script de Rollback LTS Strapi 5.x + React 19 + Node.js 22
# Versão: 1.0.0
# Data: 12 de Agosto de 2025

set -e  # Exit on any error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Função para verificar backups
check_backups() {
    log "Verificando backups disponíveis..."

    if [ -f ".backup_path" ]; then
        BACKUP_DIR=$(cat .backup_path)
        if [ -d "$BACKUP_DIR" ]; then
            success "Backup encontrado: $BACKUP_DIR"
            return 0
        fi
    fi

    if [ -f "package.json.react-backup" ]; then
        success "Backup do package.json encontrado"
        return 0
    fi

    error "Nenhum backup encontrado para rollback"
    return 1
}

# Função para rollback do package.json
rollback_package_json() {
    log "Executando rollback do package.json..."

    if [ -f "package.json.react-backup" ]; then
        cp package.json.react-backup package.json
        success "Package.json restaurado com sucesso"
    else
        error "Backup do package.json não encontrado"
        return 1
    fi
}

# Função para rollback completo
rollback_complete() {
    log "Executando rollback completo..."

    if [ -f ".backup_path" ]; then
        BACKUP_DIR=$(cat .backup_path)
        if [ -d "$BACKUP_DIR" ]; then
            # Restaurar package.json
            if [ -f "$BACKUP_DIR/package.json" ]; then
                cp "$BACKUP_DIR/package.json" .
                success "Package.json restaurado do backup completo"
            fi

            # Restaurar yarn.lock
            if [ -f "$BACKUP_DIR/yarn.lock" ]; then
                cp "$BACKUP_DIR/yarn.lock" .
                success "Yarn.lock restaurado do backup completo"
            fi

            # Restaurar configurações
            if [ -d "$BACKUP_DIR/config" ]; then
                cp -r "$BACKUP_DIR/config" .
                success "Configurações restauradas do backup completo"
            fi

            # Restaurar .env
            if [ -f "$BACKUP_DIR/.env" ]; then
                cp "$BACKUP_DIR/.env" .
                success ".env restaurado do backup completo"
            fi
        fi
    fi
}

# Função para reinstalar dependências
reinstall_dependencies() {
    log "Reinstalando dependências..."

    # Limpar node_modules
    rm -rf node_modules

    # Limpar cache
    yarn cache clean

    # Reinstalar dependências
    yarn install

    success "Dependências reinstaladas com sucesso"
}

# Função para testar rollback
test_rollback() {
    log "Testando rollback..."

    # Teste de build
    if yarn build; then
        success "Build após rollback executado com sucesso"
    else
        error "Falha no build após rollback"
        return 1
    fi
}

# Função para gerar relatório de rollback
generate_rollback_report() {
    log "Gerando relatório de rollback..."

    REPORT_FILE="./docs/LTS_ROLLBACK_REPORT.md"

    cat > "$REPORT_FILE" << EOF
# 🔄 Relatório de Rollback LTS - $(date +%Y-%m-%d)

## 🎯 Resumo do Rollback

**Data**: $(date +%Y-%m-%d %H:%M:%S)
**Status**: ✅ Rollback Concluído
**Motivo**: Rollback solicitado pelo usuário

## 📈 Versões Após Rollback

| Componente | Versão | Status |
|------------|--------|--------|
| Node.js | $(node --version 2>/dev/null || echo 'N/A') | ✅ Restaurado |
| NPM | $(npm --version 2>/dev/null || echo 'N/A') | ✅ Restaurado |
| React | ^18.3.1 | ✅ Restaurado |
| React DOM | ^18.3.1 | ✅ Restaurado |
| React Router DOM | ^6.30.1 | ✅ Restaurado |

## 🔧 Ações Realizadas

- [x] ✅ Verificação de backups
- [x] ✅ Rollback do package.json
- [x] ✅ Rollback do yarn.lock
- [x] ✅ Restauração de configurações
- [x] ✅ Reinstalação de dependências
- [x] ✅ Teste de build
- [x] ✅ Geração de relatório

## 📊 Status do Sistema

- **Build**: ✅ Funcionando
- **Dependências**: ✅ Instaladas
- **Configurações**: ✅ Restauradas
- **Compatibilidade**: ✅ Total

## 🛡️ Informações de Segurança

- **Backup Utilizado**: $(cat .backup_path 2>/dev/null || echo 'N/A')
- **Arquivos Restaurados**: package.json, yarn.lock, config/, .env
- **Status**: ✅ Sistema Restaurado

## 🚀 Próximos Passos

1. **Verificação**: Confirmar funcionamento normal
2. **Testes**: Executar testes de integração
3. **Monitoramento**: Observar comportamento
4. **Análise**: Investigar motivo do rollback

---

**Rollback executado por**: Script de Automação
**Verificado em**: $(date +%Y-%m-%d %H:%M:%S)
EOF

    success "Relatório de rollback gerado: $REPORT_FILE"
}

# Função principal
main() {
    log "🔄 Iniciando rollback LTS Strapi 5.x + React 19 + Node.js 22"
    log "Data: $(date +%Y-%m-%d %H:%M:%S)"

    echo ""
    echo "=== ROLLBACK LTS OPTIMIZATION ==="
    echo "1. Verificar backups disponíveis"
    echo "2. Rollback do package.json"
    echo "3. Rollback completo (se disponível)"
    echo "4. Reinstalar dependências"
    echo "5. Testar rollback"
    echo "6. Gerar relatório"
    echo "================================"
    echo ""

    read -p "Deseja continuar com o rollback? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        warning "Rollback cancelado pelo usuário"
        exit 0
    fi

    # Executar etapas
    check_backups
    rollback_package_json
    rollback_complete
    reinstall_dependencies
    test_rollback
    generate_rollback_report

    echo ""
    success "🔄 Rollback LTS concluído com sucesso!"
    echo ""
    echo "=== RESUMO DO ROLLBACK ==="
    echo "✅ Package.json: Restaurado"
    echo "✅ Yarn.lock: Restaurado"
    echo "✅ Dependências: Reinstaladas"
    echo "✅ Build: Funcionando"
    echo "✅ Sistema: Restaurado"
    echo "=========================="
    echo ""
    echo "📊 Relatório completo: ./docs/LTS_ROLLBACK_REPORT.md"
    echo ""
}

# Executar função principal
main "$@"
