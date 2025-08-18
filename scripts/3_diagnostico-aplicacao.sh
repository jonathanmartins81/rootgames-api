#!/bin/bash
# scripts/3_diagnostico-aplicacao.sh - Diagnóstico da aplicação Strapi
# Sequência: 3 - Análise específica do RootGames API

set -euo pipefail

# Carregar biblioteca comum
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# Configurações
REPORT_DIR="$PROJECT_ROOT/reports"
SEQUENCE_LOG="$LOG_DIR/diagnostic_sequence.log"
APP_REPORT="$REPORT_DIR/aplicacao_$(date +%Y%m%d_%H%M%S).json"

# Estruturas para dados
declare -A APP_INFO
declare -A APP_METRICS
declare -A APP_ISSUES

# Inicializar etapa
init_step() {
    log_info "🎮 ETAPA 3/7: Diagnóstico da Aplicação"
    echo "$(date -Iseconds) - Etapa 3: Diagnóstico da aplicação iniciado" >> "$SEQUENCE_LOG"
    
    # Atualizar status
    if command_exists jq && [[ -f "$REPORT_DIR/diagnostic_status.json" ]]; then
        jq '.steps."3".status = "running" | .steps."3".start = "'$(date -Iseconds)'" | .current_step = 3' \
           "$REPORT_DIR/diagnostic_status.json" > "$REPORT_DIR/diagnostic_status.tmp" && \
           mv "$REPORT_DIR/diagnostic_status.tmp" "$REPORT_DIR/diagnostic_status.json"
    fi
}

# Verificar ambiente Node.js
check_nodejs_environment() {
    log_section "🟢 Ambiente Node.js"
    
    if command_exists node; then
        APP_INFO[node_version]=$(node --version)
        local node_major=$(echo "${APP_INFO[node_version]}" | sed 's/v//' | cut -d. -f1)
        
        if [[ $node_major -ge 20 ]]; then
            APP_INFO[node_compatible]="true"
            log_success "Node.js: ${APP_INFO[node_version]} ✓"
        else
            APP_INFO[node_compatible]="false"
            APP_ISSUES[node_version]="Node.js ${APP_INFO[node_version]} < 20.0.0 (requerido)"
            log_error "Node.js versão incompatível: ${APP_INFO[node_version]}"
        fi
    else
        APP_ISSUES[node_missing]="Node.js não instalado"
        log_error "Node.js não encontrado"
    fi
    
    # NPM e Yarn
    if command_exists npm; then
        APP_INFO[npm_version]=$(npm --version)
        log_success "npm: ${APP_INFO[npm_version]}"
    fi
    
    if command_exists yarn; then
        APP_INFO[yarn_version]=$(yarn --version)
        log_success "Yarn: ${APP_INFO[yarn_version]}"
    else
        APP_ISSUES[yarn_missing]="Yarn não instalado"
    fi
}

# Analisar projeto Strapi
analyze_strapi_project() {
    log_section "🎮 Projeto RootGames API"
    
    # package.json
    if [[ -f "$PROJECT_ROOT/package.json" ]]; then
        APP_INFO[package_json]="true"
        
        if command_exists jq; then
            APP_INFO[project_version]=$(jq -r '.version // "N/A"' "$PROJECT_ROOT/package.json")
            APP_INFO[strapi_version]=$(jq -r '.dependencies["@strapi/strapi"] // "N/A"' "$PROJECT_ROOT/package.json")
            APP_INFO[react_version]=$(jq -r '.dependencies.react // "N/A"' "$PROJECT_ROOT/package.json")
            
            log_success "Projeto: v${APP_INFO[project_version]}"
            log_success "Strapi: ${APP_INFO[strapi_version]}"
            log_success "React: ${APP_INFO[react_version]}"
        fi
    else
        APP_ISSUES[package_json_missing]="package.json não encontrado"
        log_error "package.json ausente"
    fi
    
    # node_modules
    if [[ -d "$PROJECT_ROOT/node_modules" ]]; then
        APP_INFO[node_modules]="true"
        APP_METRICS[node_modules_size]=$(du -sh "$PROJECT_ROOT/node_modules" 2>/dev/null | cut -f1 || echo "N/A")
        log_success "node_modules: ${APP_METRICS[node_modules_size]}"
    else
        APP_ISSUES[node_modules_missing]="node_modules não encontrado"
        log_error "node_modules ausente - execute 'yarn install'"
    fi
}

# Verificar configurações Strapi
check_strapi_config() {
    log_section "⚙️ Configurações Strapi"
    
    # Arquivos de configuração
    local config_files=("config/database.ts" "config/server.ts" "config/admin.ts" ".env")
    
    for file in "${config_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            APP_INFO[config_${file//[^a-zA-Z0-9]/_}]="true"
            log_success "✓ $file"
        else
            APP_INFO[config_${file//[^a-zA-Z0-9]/_}]="false"
            APP_ISSUES[config_missing_${file//[^a-zA-Z0-9]/_}]="Configuração ausente: $file"
            log_error "✗ $file ausente"
        fi
    done
    
    # Verificar estrutura src/
    if [[ -d "$PROJECT_ROOT/src" ]]; then
        APP_INFO[src_directory]="true"
        
        # Contar APIs
        if [[ -d "$PROJECT_ROOT/src/api" ]]; then
            APP_METRICS[api_count]=$(find "$PROJECT_ROOT/src/api" -maxdepth 1 -type d | wc -l)
            log_success "APIs encontradas: ${APP_METRICS[api_count]}"
        fi
    else
        APP_ISSUES[src_missing]="Diretório src/ não encontrado"
        log_error "Diretório src/ ausente"
    fi
}

# Testar conectividade com banco
test_database_connection() {
    log_section "🗄️ Conectividade com Banco"
    
    # Carregar configurações
    load_env_file
    local db_host=$(get_config DB_HOST "127.0.0.1")
    local db_port=$(get_config DB_PORT "5432")
    local db_name=$(get_config DB_NAME "rootgames")
    local db_user=$(get_config DB_USER "rootgames")
    
    APP_INFO[db_host]="$db_host"
    APP_INFO[db_port]="$db_port"
    APP_INFO[db_name]="$db_name"
    APP_INFO[db_user]="$db_user"
    
    if check_postgres_connection "$db_host" "$db_port" "$db_name" "$db_user"; then
        APP_INFO[db_connection]="true"
        log_success "Conexão com PostgreSQL: OK"
        
        # Obter informações do banco
        APP_METRICS[db_size]=$(get_database_size "$db_host" "$db_port" "$db_name" "$db_user" || echo "N/A")
        log_success "Tamanho do banco: ${APP_METRICS[db_size]}"
    else
        APP_INFO[db_connection]="false"
        APP_ISSUES[db_connection_failed]="Falha na conexão com PostgreSQL"
        log_error "Falha na conexão com banco de dados"
    fi
}

# Testar endpoints da API
test_api_endpoints() {
    log_section "🌐 Endpoints da API"
    
    local api_url=$(get_config API_URL "http://localhost:1337")
    APP_INFO[api_url]="$api_url"
    
    # Lista de endpoints para testar
    local endpoints=("/" "/admin" "/api/games" "/_health")
    local successful_endpoints=0
    
    for endpoint in "${endpoints[@]}"; do
        local full_url="$api_url$endpoint"
        
        if command_exists curl; then
            local response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$full_url" 2>/dev/null || echo "000")
            
            if [[ "$response_code" =~ ^[23] ]]; then
                APP_INFO[endpoint_${endpoint//[^a-zA-Z0-9]/_}]="true"
                log_success "✓ $endpoint: $response_code"
                ((successful_endpoints++))
            else
                APP_INFO[endpoint_${endpoint//[^a-zA-Z0-9]/_}]="false"
                log_warning "✗ $endpoint: $response_code"
            fi
        fi
    done
    
    APP_METRICS[endpoint_success_rate]=$(echo "scale=0; $successful_endpoints * 100 / ${#endpoints[@]}" | bc 2>/dev/null || echo "0")
    log_info "Taxa de sucesso dos endpoints: ${APP_METRICS[endpoint_success_rate]}%"
}

# Verificar build da aplicação
check_application_build() {
    log_section "🔨 Build da Aplicação"
    
    # Verificar se existe build
    if [[ -d "$PROJECT_ROOT/build" ]]; then
        APP_INFO[build_exists]="true"
        APP_METRICS[build_size]=$(du -sh "$PROJECT_ROOT/build" 2>/dev/null | cut -f1 || echo "N/A")
        log_success "Build existe: ${APP_METRICS[build_size]}"
    else
        APP_INFO[build_exists]="false"
        log_info "Build não encontrado (normal em desenvolvimento)"
    fi
    
    # Verificar scripts do package.json
    if [[ -f "$PROJECT_ROOT/package.json" ]] && command_exists jq; then
        local has_build_script=$(jq -r '.scripts.build // "N/A"' "$PROJECT_ROOT/package.json")
        local has_dev_script=$(jq -r '.scripts.develop // .scripts.dev // "N/A"' "$PROJECT_ROOT/package.json")
        
        if [[ "$has_build_script" != "N/A" ]]; then
            APP_INFO[build_script]="true"
            log_success "Script de build disponível"
        else
            APP_ISSUES[build_script_missing]="Script de build ausente"
        fi
        
        if [[ "$has_dev_script" != "N/A" ]]; then
            APP_INFO[dev_script]="true"
            log_success "Script de desenvolvimento disponível"
        else
            APP_ISSUES[dev_script_missing]="Script de desenvolvimento ausente"
        fi
    fi
}

# Analisar logs da aplicação
analyze_application_logs() {
    log_section "📋 Logs da Aplicação"
    
    # Verificar logs do projeto
    if [[ -d "$LOG_DIR" ]]; then
        APP_METRICS[log_files]=$(find "$LOG_DIR" -name "*.log" -type f | wc -l)
        APP_METRICS[log_size]=$(du -sh "$LOG_DIR" 2>/dev/null | cut -f1 || echo "0")
        
        log_success "Arquivos de log: ${APP_METRICS[log_files]}"
        log_success "Tamanho total dos logs: ${APP_METRICS[log_size]}"
        
        # Verificar erros recentes
        local today_log="$LOG_DIR/$(date +%Y-%m-%d).log"
        if [[ -f "$today_log" ]]; then
            APP_METRICS[errors_today]=$(grep -c "ERROR" "$today_log" 2>/dev/null || echo "0")
            log_info "Erros hoje: ${APP_METRICS[errors_today]}"
        else
            APP_METRICS[errors_today]="0"
        fi
    else
        APP_ISSUES[logs_dir_missing]="Diretório de logs não encontrado"
        log_warning "Diretório de logs ausente"
    fi
}

# Gerar relatório da aplicação
generate_application_report() {
    log_section "📄 Gerando Relatório da Aplicação"
    
    cat > "$APP_REPORT" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "step": 3,
  "step_name": "diagnostico-aplicacao",
  "app_info": {
EOF

    # Adicionar informações da aplicação
    local first=true
    for key in "${!APP_INFO[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$APP_REPORT"
        fi
        echo "    \"$key\": \"${APP_INFO[$key]}\"" >> "$APP_REPORT"
    done

    cat >> "$APP_REPORT" << EOF
  },
  "metrics": {
EOF

    # Adicionar métricas
    first=true
    for key in "${!APP_METRICS[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$APP_REPORT"
        fi
        echo "    \"$key\": \"${APP_METRICS[$key]}\"" >> "$APP_REPORT"
    done

    cat >> "$APP_REPORT" << EOF
  },
  "issues": {
EOF

    # Adicionar problemas
    first=true
    for key in "${!APP_ISSUES[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$APP_REPORT"
        fi
        echo "    \"$key\": \"${APP_ISSUES[$key]}\"" >> "$APP_REPORT"
    done

    cat >> "$APP_REPORT" << EOF
  }
}
EOF

    log_success "Relatório da aplicação salvo: $APP_REPORT"
}

# Finalizar etapa
finalize_step() {
    local issues_count=${#APP_ISSUES[@]}
    
    if [[ $issues_count -eq 0 ]]; then
        log_success "✅ Etapa 3 concluída: Aplicação em bom estado"
        echo "$(date -Iseconds) - Etapa 3 concluída: SUCESSO" >> "$SEQUENCE_LOG"
    else
        log_warning "⚠️ Etapa 3 concluída com $issues_count problema(s)"
        echo "$(date -Iseconds) - Etapa 3 concluída: $issues_count problemas" >> "$SEQUENCE_LOG"
    fi
    
    # Atualizar status
    if command_exists jq; then
        jq '.steps."3".status = "completed" | .steps."3".end = "'$(date -Iseconds)'" | .current_step = 4' \
           "$REPORT_DIR/diagnostic_status.json" > "$REPORT_DIR/diagnostic_status.tmp" && \
           mv "$REPORT_DIR/diagnostic_status.tmp" "$REPORT_DIR/diagnostic_status.json"
    fi
    
    log_info "🔄 Próximo passo: ./scripts/4_diagnostico-performance.sh"
}

# Função principal
main() {
    init_step
    check_nodejs_environment
    analyze_strapi_project
    check_strapi_config
    test_database_connection
    test_api_endpoints
    check_application_build
    analyze_application_logs
    generate_application_report
    finalize_step
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
