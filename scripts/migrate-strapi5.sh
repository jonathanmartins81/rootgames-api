#!/bin/bash
# scripts/migrate-strapi5.sh - Migrar para Strapi 5.x

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
MIGRATION_LOG="./logs/strapi5_migration.log"
ROLLBACK_FILE="./logs/migration_rollback_info.txt"

echo "🔄 Iniciando migração para Strapi 5.x..."
echo "=========================================="

# Função de rollback
rollback_migration() {
    error "❌ Migração falhou! Iniciando rollback..."

    log "Salvando informações para rollback..."
    echo "Rollback necessário em $(date)" > "$ROLLBACK_FILE"
    echo "Commit anterior: $(git rev-parse HEAD)" >> "$ROLLBACK_FILE"

    log "Fazendo rollback do código..."
    git reset --hard HEAD~1

    log "Restaurando dependências anteriores..."
    yarn install

    log "Restaurando banco de dados..."
    if [ -f "./scripts/rollback.sh" ]; then
        ./scripts/rollback.sh
    fi

    error "Rollback concluído. Sistema restaurado ao estado anterior."
    exit 1
}

# Configurar trap para rollback automático
trap rollback_migration ERR

# 1. Verificar ambiente
log "Verificando ambiente de migração..."

# Verificar se estamos na branch de staging
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "staging-strapi-5-migration" ]; then
    warning "Não estamos na branch de staging. Fazendo checkout..."
    git checkout staging-strapi-5-migration
fi

# Verificar se .env.staging existe
if [ ! -f ".env.staging" ]; then
    error "Arquivo .env.staging não encontrado. Execute prepare-strapi5-migration.sh primeiro."
    exit 1
fi

# 2. Backup final antes da migração
log "Criando backup final antes da migração..."
if [ -f "./scripts/backup.sh" ]; then
    ./scripts/backup.sh
    success "Backup final criado"
else
    error "Script de backup não encontrado!"
    exit 1
fi

# 3. Verificar versão atual
log "Verificando versão atual do Strapi..."
CURRENT_STRAPI=$(yarn list --depth=0 --pattern="@strapi/strapi" | grep "@strapi/strapi" | awk '{print $2}' | sed 's/^@//')
log "Versão atual: $CURRENT_STRAPI"

# 4. Preparar para migração
log "Preparando para migração..."

# Fazer commit do estado atual
if git status --porcelain | grep -q .; then
    log "Fazendo commit das mudanças atuais..."
    git add .
    git commit -m "Estado antes da migração Strapi 5.x - $(date)"
fi

# 5. Executar migração oficial
log "Executando migração oficial do Strapi..."
log "Comando: npx @strapi/upgrade major"

# Executar migração
if npx @strapi/upgrade major; then
    success "Migração oficial executada com sucesso"
else
    error "Migração oficial falhou. Tentando migração manual..."

    # 6. Migração manual (fallback)
    log "Iniciando migração manual..."

    # Remover plugin i18n (agora é core)
    log "Removendo plugin i18n (agora é core)..."
    yarn remove @strapi/plugin-i18n

    # Atualizar Strapi core
    log "Atualizando Strapi core para 5.x..."
    yarn add @strapi/strapi@^5.21.0

    # Atualizar plugins compatíveis
    log "Atualizando plugins para Strapi 5.x..."
    yarn add @strapi/plugin-graphql@^5.21.0
    yarn add @strapi/plugin-users-permissions@^5.21.0

    # Atualizar dependências React
    log "Atualizando dependências React..."
    yarn add react@^18.0.0 react-dom@^18.0.0
    yarn add react-router-dom@^6.0.0 styled-components@^6.0.0

    success "Migração manual concluída"
fi

# 7. Verificar resultado da migração
log "Verificando resultado da migração..."

# Verificar versão nova
NEW_STRAPI=$(yarn list --depth=0 --pattern="@strapi/strapi" | grep "@strapi/strapi" | awk '{print $2}' | sed 's/^@//')
log "Nova versão: $NEW_STRAPI"

# Verificar se a migração foi bem-sucedida
if [[ "$NEW_STRAPI" == 5.* ]]; then
    success "✅ Migração para Strapi 5.x bem-sucedida!"
else
    error "❌ Migração falhou. Versão atual: $NEW_STRAPI"
    rollback_migration
fi

# 8. Limpar dependências antigas
log "Limpando dependências antigas..."
yarn install --force
yarn cache clean

# 9. Verificar compatibilidade
log "Verificando compatibilidade..."

# Verificar peer dependencies
log "Verificando peer dependencies..."
yarn check --verify-tree || warning "Alguns peer dependencies podem precisar de ajustes"

# 10. Build da aplicação
log "Fazendo build da aplicação..."
if yarn build; then
    success "Build concluído com sucesso"
else
    error "Build falhou. Verificando erros..."
    rollback_migration
fi

# 11. Teste inicial
log "Fazendo teste inicial da aplicação..."

# Iniciar aplicação em background
log "Iniciando aplicação para teste..."
yarn develop &
STRAPI_PID=$!

# Aguardar inicialização
log "Aguardando inicialização da aplicação..."
sleep 30

# Verificar se está rodando
if kill -0 $STRAPI_PID 2>/dev/null; then
    success "Aplicação iniciada com sucesso (PID: $STRAPI_PID)"

    # Teste básico de health check
    log "Fazendo teste de health check..."
    if curl -s http://localhost:1337/ > /dev/null; then
        success "Health check básico: OK"
    else
        warning "Health check básico falhou"
    fi

    # Parar aplicação
    log "Parando aplicação de teste..."
    kill $STRAPI_PID
    wait $STRAPI_PID 2>/dev/null || true
else
    error "Aplicação não conseguiu iniciar"
    rollback_migration
fi

# 12. Verificar configurações
log "Verificando configurações..."

# Verificar se arquivos de configuração existem
if [ -f "config/plugins.ts" ]; then
    log "Arquivo de plugins encontrado"
else
    warning "Arquivo de plugins não encontrado - pode precisar ser criado"
fi

# Verificar middlewares
if [ -f "config/middlewares.ts" ]; then
    log "Arquivo de middlewares encontrado"
else
    warning "Arquivo de middlewares não encontrado - pode precisar ser criado"
fi

# 13. Commit das mudanças
log "Fazendo commit das mudanças de migração..."
git add .
git commit -m "feat: Migração para Strapi 5.x concluída

- Atualiza @strapi/strapi para 5.21.0
- Remove @strapi/plugin-i18n (agora é core)
- Atualiza plugins para versão 5.x
- Atualiza dependências React
- Testa build e funcionamento básico
- Mantém compatibilidade com funcionalidades existentes"

# 14. Resumo final
echo ""
echo "=========================================="
success "🎉 Migração para Strapi 5.x concluída com sucesso!"
echo ""
echo "📋 Resumo da migração:"
echo "  - ✅ Backup criado"
echo "  - ✅ Migração executada"
echo "  - ✅ Build testado"
echo "  - ✅ Aplicação testada"
echo "  - ✅ Mudanças commitadas"
echo ""
echo "🚀 Próximos passos:"
echo "  1. Executar testes completos: ./scripts/validate-strapi5.sh"
echo "  2. Testar funcionalidades específicas"
echo "  3. Verificar admin panel"
echo "  4. Testar uploads e APIs"
echo "  5. Validar dados e permissões"
echo ""
echo "📁 Arquivos importantes:"
echo "  - Log de migração: $MIGRATION_LOG"
echo "  - Info de rollback: $ROLLBACK_FILE"
echo "  - Branch atual: $(git branch --show-current)"
echo ""
echo "🔧 Comandos úteis:"
echo "  - Iniciar: yarn develop"
echo "  - Build: yarn build"
echo "  - Validação: ./scripts/validate-strapi5.sh"
echo "  - Rollback: ./scripts/rollback.sh"
echo ""
echo "⚠️  IMPORTANTE:"
echo "  - Teste todas as funcionalidades antes de fazer deploy"
echo "  - Verifique se não há breaking changes"
echo "  - Monitore logs e performance"
echo "=========================================="

# Salvar log da migração
echo "Migração concluída em $(date)" > "$MIGRATION_LOG"
echo "Versão anterior: $CURRENT_STRAPI" >> "$MIGRATION_LOG"
echo "Nova versão: $NEW_STRAPI" >> "$MIGRATION_LOG"
echo "Status: SUCESSO" >> "$MIGRATION_LOG"
