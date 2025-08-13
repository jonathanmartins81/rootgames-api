#!/bin/bash
# scripts/validate-strapi5.sh - Validar migração Strapi 5.x

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
VALIDATION_LOG="./logs/strapi5_validation.log"
TEST_RESULTS="./logs/validation_results.json"

echo "🧪 Validando migração Strapi 5.x..."
echo "====================================="

# Inicializar resultados
echo '{"timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'","tests":[],"summary":{"total":0,"passed":0,"failed":0,"warnings":0}}' > "$TEST_RESULTS"

# Função para adicionar resultado de teste
add_test_result() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    local details="$4"

    local result='{"name":"'$test_name'","status":"'$status'","message":"'$message'","details":"'$details'","timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'

    # Adicionar ao arquivo JSON
    jq --argjson result "$result" '.tests += [$result]' "$TEST_RESULTS" > "$TEST_RESULTS.tmp" && mv "$TEST_RESULTS.tmp" "$TEST_RESULTS"

    # Atualizar contadores
    local total=$(jq '.summary.total' "$TEST_RESULTS")
    local passed=$(jq '.summary.passed' "$TEST_RESULTS")
    local failed=$(jq '.summary.failed' "$TEST_RESULTS")
    local warnings=$(jq '.summary.warnings' "$TEST_RESULTS")

    if [ "$status" = "PASSED" ]; then
        passed=$((passed + 1))
    elif [ "$status" = "FAILED" ]; then
        failed=$((failed + 1))
    elif [ "$status" = "WARNING" ]; then
        warnings=$((warnings + 1))
    fi

    total=$((total + 1))

    jq --argjson total $total --argjson passed $passed --argjson failed $failed --argjson warnings $warnings \
       '.summary.total = $total | .summary.passed = $passed | .summary.failed = $failed | .summary.warnings = $warnings' \
       "$TEST_RESULTS" > "$TEST_RESULTS.tmp" && mv "$TEST_RESULTS.tmp" "$TEST_RESULTS"
}

# 1. Verificar versão do Strapi
log "1. Verificando versão do Strapi..."
STRAPI_VERSION=$(yarn list --depth=0 --pattern="@strapi/strapi" | grep "@strapi/strapi" | awk '{print $2}' | sed 's/^@//')

if [[ "$STRAPI_VERSION" == 5.* ]]; then
    success "✅ Strapi 5.x detectado: $STRAPI_VERSION"
    add_test_result "Strapi Version" "PASSED" "Versão 5.x detectada" "$STRAPI_VERSION"
else
    error "❌ Versão incorreta: $STRAPI_VERSION (esperado 5.x)"
    add_test_result "Strapi Version" "FAILED" "Versão incorreta" "$STRAPI_VERSION"
fi

# 2. Verificar plugins
log "2. Verificando plugins..."
log "Verificando plugin GraphQL..."
if yarn list --depth=0 --pattern="@strapi/plugin-graphql" | grep -q "@strapi/plugin-graphql"; then
    GRAPHQL_VERSION=$(yarn list --depth=0 --pattern="@strapi/plugin-graphql" | grep "@strapi/plugin-graphql" | awk '{print $2}' | sed 's/^@//')
    if [[ "$GRAPHQL_VERSION" == 5.* ]]; then
        success "✅ Plugin GraphQL 5.x: $GRAPHQL_VERSION"
        add_test_result "GraphQL Plugin" "PASSED" "Plugin GraphQL 5.x" "$GRAPHQL_VERSION"
    else
        warning "⚠️ Plugin GraphQL versão incorreta: $GRAPHQL_VERSION"
        add_test_result "GraphQL Plugin" "WARNING" "Versão incorreta" "$GRAPHQL_VERSION"
    fi
else
    error "❌ Plugin GraphQL não encontrado"
    add_test_result "GraphQL Plugin" "FAILED" "Plugin não encontrado" "N/A"
fi

log "Verificando plugin Users & Permissions..."
if yarn list --depth=0 --pattern="@strapi/plugin-users-permissions" | grep -q "@strapi/plugin-users-permissions"; then
    PERMISSIONS_VERSION=$(yarn list --depth=0 --pattern="@strapi/plugin-users-permissions" | grep "@strapi/plugin-users-permissions" | awk '{print $2}' | sed 's/^@//')
    if [[ "$PERMISSIONS_VERSION" == 5.* ]]; then
        success "✅ Plugin Users & Permissions 5.x: $PERMISSIONS_VERSION"
        add_test_result "Users Permissions Plugin" "PASSED" "Plugin 5.x" "$PERMISSIONS_VERSION"
    else
        warning "⚠️ Plugin Users & Permissions versão incorreta: $PERMISSIONS_VERSION"
        add_test_result "Users Permissions Plugin" "WARNING" "Versão incorreta" "$PERMISSIONS_VERSION"
    fi
else
    error "❌ Plugin Users & Permissions não encontrado"
    add_test_result "Users Permissions Plugin" "FAILED" "Plugin não encontrado" "N/A"
fi

log "Verificando plugin i18n (deve estar no core)..."
if yarn list --depth=0 --pattern="@strapi/plugin-i18n" | grep -q "@strapi/plugin-i18n"; then
    warning "⚠️ Plugin i18n ainda presente (deve ser removido no Strapi 5.x)"
    add_test_result "i18n Plugin" "WARNING" "Plugin ainda presente" "Deve ser removido"
else
    success "✅ Plugin i18n removido (agora é core)"
    add_test_result "i18n Plugin" "PASSED" "Plugin removido corretamente" "Core integrado"
fi

# 3. Verificar dependências React
log "3. Verificando dependências React..."
REACT_VERSION=$(yarn list --depth=0 --pattern="react" | grep "react@" | awk '{print $2}' | sed 's/^react@//')
REACT_DOM_VERSION=$(yarn list --depth=0 --pattern="react-dom" | grep "react-dom@" | awk '{print $2}' | sed 's/^react-dom@//')

if [[ "$REACT_VERSION" == 18.* ]]; then
    success "✅ React 18.x: $REACT_VERSION"
    add_test_result "React Version" "PASSED" "React 18.x" "$REACT_VERSION"
else
    warning "⚠️ React versão incorreta: $REACT_VERSION (recomendado 18.x)"
    add_test_result "React Version" "WARNING" "Versão incorreta" "$REACT_VERSION"
fi

if [[ "$REACT_DOM_VERSION" == 18.* ]]; then
    success "✅ React DOM 18.x: $REACT_DOM_VERSION"
    add_test_result "React DOM Version" "PASSED" "React DOM 18.x" "$REACT_DOM_VERSION"
else
    warning "⚠️ React DOM versão incorreta: $REACT_DOM_VERSION (recomendado 18.x)"
    add_test_result "React DOM Version" "WARNING" "Versão incorreta" "$REACT_DOM_VERSION"
fi

# 4. Verificar build
log "4. Verificando build da aplicação..."
if yarn build > /dev/null 2>&1; then
    success "✅ Build concluído com sucesso"
    add_test_result "Build" "PASSED" "Build bem-sucedido" "Sem erros"
else
    error "❌ Build falhou"
    add_test_result "Build" "FAILED" "Build falhou" "Verificar logs"
fi

# 5. Verificar arquivos de configuração
log "5. Verificando arquivos de configuração..."

# Verificar middlewares
if [ -f "config/middlewares.ts" ]; then
    success "✅ Arquivo middlewares.ts encontrado"
    add_test_result "Middlewares Config" "PASSED" "Arquivo encontrado" "config/middlewares.ts"
else
    warning "⚠️ Arquivo middlewares.ts não encontrado"
    add_test_result "Middlewares Config" "WARNING" "Arquivo não encontrado" "Pode precisar ser criado"
fi

# Verificar plugins
if [ -f "config/plugins.ts" ]; then
    success "✅ Arquivo plugins.ts encontrado"
    add_test_result "Plugins Config" "PASSED" "Arquivo encontrado" "config/plugins.ts"
else
    warning "⚠️ Arquivo plugins.ts não encontrado"
    add_test_result "Plugins Config" "WARNING" "Arquivo não encontrado" "Pode precisar ser criado"
fi

# Verificar database
if [ -f "config/database.ts" ]; then
    success "✅ Arquivo database.ts encontrado"
    add_test_result "Database Config" "PASSED" "Arquivo encontrado" "config/database.ts"
else
    error "❌ Arquivo database.ts não encontrado"
    add_test_result "Database Config" "FAILED" "Arquivo não encontrado" "Crítico"
fi

# 6. Teste de funcionalidades básicas
log "6. Testando funcionalidades básicas..."

# Iniciar aplicação em background
log "Iniciando aplicação para testes..."
yarn develop > /dev/null 2>&1 &
STRAPI_PID=$!

# Aguardar inicialização
log "Aguardando inicialização..."
sleep 30

# Verificar se está rodando
if kill -0 $STRAPI_PID 2>/dev/null; then
    success "✅ Aplicação iniciada (PID: $STRAPI_PID)"
    add_test_result "Application Startup" "PASSED" "Aplicação iniciada" "PID: $STRAPI_PID"

    # Teste de endpoints
    log "Testando endpoints..."

    # Teste root endpoint
    if curl -s http://localhost:1337/ > /dev/null; then
        success "✅ Root endpoint: OK"
        add_test_result "Root Endpoint" "PASSED" "Endpoint responde" "HTTP 200"
    else
        error "❌ Root endpoint: FALHOU"
        add_test_result "Root Endpoint" "FAILED" "Endpoint não responde" "Timeout/Erro"
    fi

    # Teste admin panel
    if curl -s http://localhost:1337/admin > /dev/null; then
        success "✅ Admin panel: OK"
        add_test_result "Admin Panel" "PASSED" "Admin panel responde" "HTTP 200"
    else
        error "❌ Admin panel: FALHOU"
        add_test_result "Admin Panel" "FAILED" "Admin panel não responde" "Timeout/Erro"
    fi

    # Teste API (deve retornar 403 sem autenticação)
    API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:1337/api/games?limit=1)
    if [ "$API_RESPONSE" = "403" ]; then
        success "✅ API Games (protegida): OK (403 esperado)"
        add_test_result "API Games Protected" "PASSED" "API protegida corretamente" "HTTP 403"
    else
        warning "⚠️ API Games: Status inesperado $API_RESPONSE"
        add_test_result "API Games Protected" "WARNING" "Status inesperado" "HTTP $API_RESPONSE"
    fi

    # Teste GraphQL
    if curl -s -X POST http://localhost:1337/graphql \
       -H "Content-Type: application/json" \
       -d '{"query":"query { games { data { id attributes { name } } } }"}' > /dev/null; then
        success "✅ GraphQL endpoint: OK"
        add_test_result "GraphQL Endpoint" "PASSED" "GraphQL responde" "Query executada"
    else
        warning "⚠️ GraphQL endpoint: FALHOU"
        add_test_result "GraphQL Endpoint" "WARNING" "GraphQL não responde" "Query falhou"
    fi

    # Parar aplicação
    log "Parando aplicação..."
    kill $STRAPI_PID
    wait $STRAPI_PID 2>/dev/null || true

else
    error "❌ Aplicação não conseguiu iniciar"
    add_test_result "Application Startup" "FAILED" "Aplicação não iniciou" "Timeout/Erro"
fi

# 7. Verificar peer dependencies
log "7. Verificando peer dependencies..."
if yarn check --verify-tree > /dev/null 2>&1; then
    success "✅ Peer dependencies: OK"
    add_test_result "Peer Dependencies" "PASSED" "Sem conflitos" "Verificação OK"
else
    warning "⚠️ Peer dependencies: Alguns conflitos detectados"
    add_test_result "Peer Dependencies" "WARNING" "Conflitos detectados" "Verificar yarn check"
fi

# 8. Verificar estrutura de arquivos
log "8. Verificando estrutura de arquivos..."

# Verificar se content-types existem
if [ -d "src/api" ]; then
    success "✅ Estrutura de APIs encontrada"
    add_test_result "API Structure" "PASSED" "Estrutura encontrada" "src/api/"
else
    error "❌ Estrutura de APIs não encontrada"
    add_test_result "API Structure" "FAILED" "Estrutura não encontrada" "Crítico"
fi

# Verificar se admin customizations existem
if [ -d "src/admin" ]; then
    success "✅ Customizações do admin encontradas"
    add_test_result "Admin Customizations" "PASSED" "Customizações encontradas" "src/admin/"
else
    warning "⚠️ Customizações do admin não encontradas"
    add_test_result "Admin Customizations" "WARNING" "Customizações não encontradas" "Pode precisar ser criado"
fi

# 9. Resumo dos resultados
log "9. Gerando resumo dos resultados..."

# Ler resultados do JSON
TOTAL=$(jq '.summary.total' "$TEST_RESULTS")
PASSED=$(jq '.summary.passed' "$TEST_RESULTS")
FAILED=$(jq '.summary.failed' "$TEST_RESULTS")
WARNINGS=$(jq '.summary.warnings' "$TEST_RESULTS")

echo ""
echo "====================================="
echo "📊 RESUMO DA VALIDAÇÃO"
echo "====================================="
echo "Total de testes: $TOTAL"
echo "✅ Aprovados: $PASSED"
echo "❌ Falharam: $FAILED"
echo "⚠️ Avisos: $WARNINGS"
echo ""

# Calcular percentual de sucesso
if [ "$TOTAL" -gt 0 ]; then
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
    echo "📈 Taxa de sucesso: $SUCCESS_RATE%"

    if [ "$SUCCESS_RATE" -ge 90 ]; then
        success "🎉 Validação EXCELENTE! Sistema pronto para produção."
    elif [ "$SUCCESS_RATE" -ge 80 ]; then
        success "✅ Validação BEM-SUCEDIDA! Alguns ajustes menores necessários."
    elif [ "$SUCCESS_RATE" -ge 70 ]; then
        warning "⚠️ Validação ACEITÁVEL. Ajustes necessários antes da produção."
    else
        error "❌ Validação FALHOU! Corrija os problemas antes de continuar."
    fi
fi

echo ""
echo "📁 Arquivos de resultado:"
echo "  - Log completo: $VALIDATION_LOG"
echo "  - Resultados JSON: $TEST_RESULTS"
echo ""
echo "🚀 Próximos passos:"
if [ "$FAILED" -gt 0 ]; then
    echo "  1. ❌ Corrigir testes que falharam"
    echo "  2. 🔧 Ajustar configurações"
    echo "  3. 🧪 Executar validação novamente"
else
    echo "  1. ✅ Sistema validado com sucesso"
    echo "  2. 🚀 Pronto para deploy em produção"
    echo "  3. 📊 Monitorar performance pós-deploy"
fi

echo ""
echo "🔧 Comandos úteis:"
echo "  - Ver detalhes: cat $TEST_RESULTS | jq '.'"
echo "  - Filtrar falhas: cat $TEST_RESULTS | jq '.tests[] | select(.status == \"FAILED\")'"
echo "  - Filtrar avisos: cat $TEST_RESULTS | jq '.tests[] | select(.status == \"WARNING\")'"
echo "====================================="

# Salvar log da validação
echo "Validação concluída em $(date)" > "$VALIDATION_LOG"
echo "Total: $TOTAL, Aprovados: $PASSED, Falharam: $FAILED, Avisos: $WARNINGS" >> "$VALIDATION_LOG"
echo "Taxa de sucesso: $SUCCESS_RATE%" >> "$VALIDATION_LOG"
echo "Status: $([ "$FAILED" -eq 0 ] && echo "SUCESSO" || echo "FALHOU")" >> "$VALIDATION_LOG"
