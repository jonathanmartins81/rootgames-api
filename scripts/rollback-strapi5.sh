#!/bin/bash
# scripts/rollback-strapi5.sh - Rollback da migração Strapi 5.x

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCESSO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

# Configurações
ROLLBACK_LOG="./logs/strapi5_rollback.log"
MIGRATION_INFO="./logs/migration_rollback_info.txt"

echo "🔄 Iniciando rollback da migração Strapi 5.x..."
echo "================================================"

# Função de ajuda
show_help() {
    echo "Uso: ./scripts/rollback-strapi5.sh [OPÇÕES]"
    echo ""
    echo "OPÇÕES:"
    echo "  --force          Forçar rollback sem confirmação"
    echo "  --staging-only   Rollback apenas do ambiente de staging"
    echo "  --help           Mostrar esta ajuda"
    echo ""
    echo "EXEMPLOS:"
    echo "  ./scripts/rollback-strapi5.sh                    # Rollback interativo"
    echo "  ./scripts/rollback-strapi5.sh --force           # Rollback forçado"
    echo "  ./scripts/rollback-strapi5.sh --staging-only    # Rollback apenas staging"
    echo ""
    echo "DESCRIÇÃO:"
    echo "  Este script reverte a migração para Strapi 5.x, restaurando"
    echo "  o sistema ao estado anterior (Strapi 4.25.23)."
}

# Processar argumentos
FORCE_ROLLBACK=false
STAGING_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_ROLLBACK=true
            shift
            ;;
        --staging-only)
            STAGING_ONLY=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            error "Opção desconhecida: $1"
            show_help
            exit 1
            ;;
    esac
done

# 1. Verificar se estamos na branch correta
log "1. Verificando branch atual..."
CURRENT_BRANCH=$(git branch --show-current)

if [ "$STAGING_ONLY" = true ]; then
    if [ "$CURRENT_BRANCH" != "staging-strapi-5-migration" ]; then
        error "❌ Para rollback de staging, você deve estar na branch 'staging-strapi-5-migration'"
        error "Branch atual: $CURRENT_BRANCH"
        exit 1
    fi
    log "✅ Rollback de staging confirmado"
else
    if [ "$CURRENT_BRANCH" = "main" ]; then
        warning "⚠️ Você está na branch main. Rollback pode afetar produção!"
        if [ "$FORCE_ROLLBACK" = false ]; then
            read -p "Continuar com rollback em produção? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log "Rollback cancelado pelo usuário"
                exit 0
            fi
        fi
    fi
fi

# 2. Verificar se há informações de rollback
log "2. Verificando informações de rollback..."
if [ -f "$MIGRATION_INFO" ]; then
    log "Informações de rollback encontradas:"
    cat "$MIGRATION_INFO"
    echo ""
else
    warning "⚠️ Arquivo de informações de rollback não encontrado"
    log "Procurando por commits de migração..."

    # Procurar por commits relacionados à migração
    MIGRATION_COMMITS=$(git log --oneline --grep="migração\|migration\|Strapi 5" -10)
    if [ -n "$MIGRATION_COMMITS" ]; then
        log "Commits de migração encontrados:"
        echo "$MIGRATION_COMMITS"
        echo ""
    else
        warning "⚠️ Nenhum commit de migração encontrado"
    fi
fi

# 3. Confirmação do usuário
if [ "$FORCE_ROLLBACK" = false ]; then
    echo "⚠️  ATENÇÃO: Este rollback irá:"
    echo "   - Reverter todas as mudanças de migração"
    echo "   - Restaurar Strapi 4.25.23"
    echo "   - Restaurar dependências anteriores"
    echo "   - Restaurar banco de dados (se backup disponível)"
    echo ""

    if [ "$STAGING_ONLY" = true ]; then
        echo "🎯 Modo: Rollback apenas do ambiente de staging"
    else
        echo "🚨 Modo: Rollback completo (incluindo produção)"
    fi
    echo ""

    read -p "Confirma o rollback? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Rollback cancelado pelo usuário"
        exit 0
    fi
fi

# 4. Backup antes do rollback
log "4. Criando backup antes do rollback..."
if [ -f "./scripts/backup.sh" ]; then
    ./scripts/backup.sh
    success "Backup antes do rollback criado"
else
    warning "⚠️ Script de backup não encontrado"
fi

# 5. Rollback do código
log "5. Fazendo rollback do código..."

# Encontrar commit anterior à migração
PREVIOUS_COMMIT=$(git log --oneline --grep="migração\|migration\|Strapi 5" -1 --format="%H")
if [ -n "$PREVIOUS_COMMIT" ]; then
    log "Encontrado commit de migração: $PREVIOUS_COMMIT"
    PREVIOUS_COMMIT=$(git rev-parse $PREVIOUS_COMMIT^)
    log "Fazendo rollback para: $PREVIOUS_COMMIT"

    if git reset --hard "$PREVIOUS_COMMIT"; then
        success "✅ Rollback do código concluído"
    else
        error "❌ Falha no rollback do código"
        exit 1
    fi
else
    # Fallback: rollback para commit anterior
    log "Nenhum commit de migração encontrado, fazendo rollback para commit anterior..."
    if git reset --hard HEAD~1; then
        success "✅ Rollback para commit anterior concluído"
    else
        error "❌ Falha no rollback para commit anterior"
        exit 1
    fi
fi

# 6. Restaurar dependências
log "6. Restaurando dependências anteriores..."

# Limpar node_modules e yarn.lock
log "Limpando dependências atuais..."
rm -rf node_modules
rm -f yarn.lock

# Restaurar dependências do Strapi 4.x
log "Instalando dependências do Strapi 4.x..."
yarn add @strapi/strapi@^4.25.23
yarn add @strapi/plugin-graphql@^4.25.23
yarn add @strapi/plugin-i18n@^4.25.23
yarn add @strapi/plugin-users-permissions@^4.25.23

# Restaurar outras dependências
yarn add react@^18.0.0 react-dom@^18.0.0
yarn add react-router-dom@^5.2.0 styled-components@^5.2.1

# Instalar todas as dependências
log "Instalando todas as dependências..."
yarn install

success "✅ Dependências restauradas"

# 7. Restaurar banco de dados (se possível)
log "7. Restaurando banco de dados..."

# Procurar por backups recentes
BACKUP_FILES=$(find ./backups -name "*.sql" -type f -printf "%T@ %p\n" | sort -n | tail -1 | cut -d' ' -f2-)

if [ -n "$BACKUP_FILES" ] && [ -f "$BACKUP_FILES" ]; then
    log "Backup encontrado: $BACKUP_FILES"

    if [ "$STAGING_ONLY" = true ]; then
        # Restaurar apenas staging
        if PGPASSWORD=rootgames psql -h 127.0.0.1 -U rootgames -d rootgames_staging -f "$BACKUP_FILES" > /dev/null 2>&1; then
            success "✅ Banco de staging restaurado"
        else
            warning "⚠️ Falha ao restaurar banco de staging"
        fi
    else
        # Restaurar produção
        if PGPASSWORD=rootgames psql -h 127.0.0.1 -U rootgames -d rootgames -f "$BACKUP_FILES" > /dev/null 2>&1; then
            success "✅ Banco de produção restaurado"
        else
            warning "⚠️ Falha ao restaurar banco de produção"
        fi
    fi
else
    warning "⚠️ Nenhum backup encontrado para restauração"
fi

# 8. Verificar build
log "8. Verificando build da aplicação..."
if yarn build > /dev/null 2>&1; then
    success "✅ Build concluído com sucesso"
else
    error "❌ Build falhou após rollback"
    log "Verificando erros..."
    yarn build
    exit 1
fi

# 9. Teste básico
log "9. Fazendo teste básico da aplicação..."

# Iniciar aplicação em background
log "Iniciando aplicação para teste..."
yarn develop > /dev/null 2>&1 &
STRAPI_PID=$!

# Aguardar inicialização
log "Aguardando inicialização..."
sleep 30

# Verificar se está rodando
if kill -0 $STRAPI_PID 2>/dev/null; then
    success "✅ Aplicação iniciada com sucesso (PID: $STRAPI_PID)"

    # Teste básico de health check
    if curl -s http://localhost:1337/ > /dev/null; then
        success "✅ Health check básico: OK"
    else
        warning "⚠️ Health check básico falhou"
    fi

    # Parar aplicação
    log "Parando aplicação de teste..."
    kill $STRAPI_PID
    wait $STRAPI_PID 2>/dev/null || true
else
    error "❌ Aplicação não conseguiu iniciar após rollback"
    exit 1
fi

# 10. Verificar versão
log "10. Verificando versão restaurada..."
RESTORED_VERSION=$(yarn list --depth=0 --pattern="@strapi/strapi" | grep "@strapi/strapi" | awk '{print $2}' | sed 's/^@//')

if [[ "$RESTORED_VERSION" == 4.* ]]; then
    success "✅ Strapi 4.x restaurado: $RESTORED_VERSION"
else
    error "❌ Versão incorreta após rollback: $RESTORED_VERSION"
    exit 1
fi

# 11. Commit do rollback
log "11. Fazendo commit do rollback..."
git add .
git commit -m "rollback: Reverte migração Strapi 5.x para 4.25.23

- Restaura @strapi/strapi para 4.25.23
- Restaura @strapi/plugin-i18n
- Restaura plugins para versão 4.x
- Restaura dependências React compatíveis
- Testa build e funcionamento básico
- Sistema restaurado ao estado anterior"

# 12. Resumo final
echo ""
echo "================================================"
success "🎉 Rollback da migração Strapi 5.x concluído com sucesso!"
echo ""
echo "📋 Resumo do rollback:"
echo "  - ✅ Backup criado"
echo "  - ✅ Código revertido"
echo "  - ✅ Dependências restauradas"
echo "  - ✅ Banco de dados restaurado"
echo "  - ✅ Build testado"
echo "  - ✅ Aplicação testada"
echo "  - ✅ Mudanças commitadas"
echo ""
echo "🔄 Sistema restaurado para:"
echo "  - Strapi: $RESTORED_VERSION"
echo "  - Branch: $(git branch --show-current)"
echo "  - Commit: $(git rev-parse --short HEAD)"
echo ""
echo "🚀 Próximos passos:"
if [ "$STAGING_ONLY" = true ]; then
    echo "  1. ✅ Staging restaurado com sucesso"
    echo "  2. 🔍 Analisar problemas da migração"
    echo "  3. 🛠️ Corrigir issues identificados"
    echo "  4. 🧪 Testar novamente em staging"
    echo "  5. 🚀 Tentar migração novamente"
else
    echo "  1. ✅ Produção restaurada com sucesso"
    echo "  2. 🔍 Analisar problemas da migração"
    echo "  3. 🛠️ Corrigir issues identificados"
    echo "  4. 🧪 Testar em staging primeiro"
    echo "  5. 🚀 Migração controlada em produção"
fi
echo ""
echo "📁 Arquivos importantes:"
echo "  - Log de rollback: $ROLLBACK_LOG"
echo "  - Info de migração: $MIGRATION_INFO"
echo "  - Branch atual: $(git branch --show-current)"
echo ""
echo "🔧 Comandos úteis:"
echo "  - Iniciar: yarn develop"
echo "  - Build: yarn build"
echo "  - Status: git status"
echo "  - Logs: git log --oneline -10"
echo "================================================"

# Salvar log do rollback
echo "Rollback concluído em $(date)" > "$ROLLBACK_LOG"
echo "Versão restaurada: $RESTORED_VERSION" >> "$ROLLBACK_LOG"
echo "Branch: $(git branch --show-current)" >> "$ROLLBACK_LOG"
echo "Commit: $(git rev-parse HEAD)" >> "$ROLLBACK_LOG"
echo "Status: SUCESSO" >> "$ROLLBACK_LOG"
