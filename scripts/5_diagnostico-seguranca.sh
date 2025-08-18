#!/bin/bash
# scripts/5_diagnostico-seguranca.sh - Auditoria de segurança
# Sequência: 5 - Análise de segurança e vulnerabilidades

set -euo pipefail

# Carregar biblioteca comum
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# Configurações
REPORT_DIR="$PROJECT_ROOT/reports"
SEQUENCE_LOG="$LOG_DIR/diagnostic_sequence.log"
SECURITY_REPORT="$REPORT_DIR/seguranca_$(date +%Y%m%d_%H%M%S).json"

# Estruturas para dados
declare -A SECURITY_CHECKS
declare -A SECURITY_ISSUES
declare -A SECURITY_RECOMMENDATIONS

# Inicializar etapa
init_step() {
    log_info "🔒 ETAPA 5/7: Diagnóstico de Segurança"
    echo "$(date -Iseconds) - Etapa 5: Diagnóstico de segurança iniciado" >> "$SEQUENCE_LOG"
    
    # Atualizar status
    if command_exists jq && [[ -f "$REPORT_DIR/diagnostic_status.json" ]]; then
        jq '.steps."5".status = "running" | .steps."5".start = "'$(date -Iseconds)'" | .current_step = 5' \
           "$REPORT_DIR/diagnostic_status.json" > "$REPORT_DIR/diagnostic_status.tmp" && \
           mv "$REPORT_DIR/diagnostic_status.tmp" "$REPORT_DIR/diagnostic_status.json"
    fi
}

# Verificar permissões de arquivos
check_file_permissions() {
    log_section "📁 Permissões de Arquivos"
    
    local sensitive_files=(
        ".env:600"
        "config/database.ts:644"
        "config/admin.ts:644"
        "config/server.ts:644"
    )
    
    local permission_score=0
    local total_files=0
    
    for file_info in "${sensitive_files[@]}"; do
        local file=$(echo "$file_info" | cut -d: -f1)
        local expected_perm=$(echo "$file_info" | cut -d: -f2)
        
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            ((total_files++))
            local current_perm=$(stat -c "%a" "$PROJECT_ROOT/$file" 2>/dev/null || echo "000")
            
            if [[ "$current_perm" == "$expected_perm" ]] || [[ "$current_perm" == "600" ]]; then
                SECURITY_CHECKS[perm_${file//[^a-zA-Z0-9]/_}]="secure"
                log_success "✓ $file: $current_perm"
                ((permission_score++))
            else
                SECURITY_CHECKS[perm_${file//[^a-zA-Z0-9]/_}]="insecure"
                SECURITY_ISSUES[perm_${file//[^a-zA-Z0-9]/_}]="Permissões inadequadas para $file: $current_perm (recomendado: $expected_perm)"
                SECURITY_RECOMMENDATIONS[fix_perm_${file//[^a-zA-Z0-9]/_}]="chmod $expected_perm $file"
                log_warning "⚠️ $file: $current_perm (deveria ser $expected_perm)"
            fi
        fi
    done
    
    if [[ $total_files -gt 0 ]]; then
        local perm_percentage=$(echo "scale=0; $permission_score * 100 / $total_files" | bc)
        SECURITY_CHECKS[permission_score]="$perm_percentage"
        log_info "Score de permissões: $perm_percentage%"
    fi
}

# Verificar configurações de segurança
check_security_config() {
    log_section "⚙️ Configurações de Segurança"
    
    # Verificar .env
    if [[ -f "$PROJECT_ROOT/.env" ]]; then
        SECURITY_CHECKS[env_file]="exists"
        
        # Verificar se contém senhas em texto claro
        if grep -q "PASSWORD.*=" "$PROJECT_ROOT/.env" 2>/dev/null; then
            log_info "Arquivo .env contém configurações de senha"
            
            # Verificar se senhas são complexas (básico)
            local weak_passwords=$(grep "PASSWORD.*=" "$PROJECT_ROOT/.env" | grep -E "(password|123|admin|root)" | wc -l)
            if [[ $weak_passwords -gt 0 ]]; then
                SECURITY_ISSUES[weak_passwords]="Possíveis senhas fracas detectadas no .env"
                SECURITY_RECOMMENDATIONS[strong_passwords]="Use senhas complexas com letras, números e símbolos"
            fi
        fi
        
        # Verificar JWT_SECRET
        if grep -q "JWT_SECRET" "$PROJECT_ROOT/.env" 2>/dev/null; then
            local jwt_secret=$(grep "JWT_SECRET" "$PROJECT_ROOT/.env" | cut -d= -f2)
            if [[ ${#jwt_secret} -lt 32 ]]; then
                SECURITY_ISSUES[weak_jwt_secret]="JWT_SECRET muito curto (< 32 caracteres)"
                SECURITY_RECOMMENDATIONS[strong_jwt_secret]="Gerar JWT_SECRET com pelo menos 64 caracteres aleatórios"
            else
                SECURITY_CHECKS[jwt_secret]="strong"
                log_success "JWT_SECRET adequadamente configurado"
            fi
        else
            SECURITY_ISSUES[missing_jwt_secret]="JWT_SECRET não configurado"
            SECURITY_RECOMMENDATIONS[add_jwt_secret]="Configurar JWT_SECRET no arquivo .env"
        fi
    else
        SECURITY_ISSUES[env_missing]="Arquivo .env não encontrado"
        SECURITY_RECOMMENDATIONS[create_env]="Criar arquivo .env baseado no .env.example"
    fi
    
    # Verificar .gitignore
    if [[ -f "$PROJECT_ROOT/.gitignore" ]]; then
        SECURITY_CHECKS[gitignore_file]="exists"
        
        # Verificar se .env está no .gitignore
        if grep -q "^\.env$" "$PROJECT_ROOT/.gitignore"; then
            SECURITY_CHECKS[env_gitignored]="true"
            log_success ".env está protegido no .gitignore"
        else
            SECURITY_ISSUES[env_not_gitignored]=".env não está no .gitignore"
            SECURITY_RECOMMENDATIONS[add_env_gitignore]="Adicionar .env ao .gitignore"
        fi
        
        # Verificar outras entradas importantes
        local important_ignores=("node_modules" "*.log" ".env*" "build" "dist")
        for ignore in "${important_ignores[@]}"; do
            if grep -q "$ignore" "$PROJECT_ROOT/.gitignore"; then
                log_success "✓ $ignore está no .gitignore"
            else
                log_warning "⚠️ $ignore não está no .gitignore"
            fi
        done
    else
        SECURITY_ISSUES[gitignore_missing]="Arquivo .gitignore não encontrado"
        SECURITY_RECOMMENDATIONS[create_gitignore]="Criar arquivo .gitignore adequado"
    fi
}

# Verificar dependências por vulnerabilidades
check_dependencies_security() {
    log_section "📦 Segurança das Dependências"
    
    if [[ -f "$PROJECT_ROOT/package.json" ]]; then
        # Verificar se npm audit está disponível
        if command_exists npm; then
            log_info "Executando auditoria de segurança das dependências..."
            
            # Executar npm audit
            local audit_output
            if audit_output=$(cd "$PROJECT_ROOT" && npm audit --json 2>/dev/null); then
                if command_exists jq; then
                    local vulnerabilities=$(echo "$audit_output" | jq -r '.metadata.vulnerabilities.total // 0')
                    local high_vulns=$(echo "$audit_output" | jq -r '.metadata.vulnerabilities.high // 0')
                    local critical_vulns=$(echo "$audit_output" | jq -r '.metadata.vulnerabilities.critical // 0')
                    
                    SECURITY_CHECKS[total_vulnerabilities]="$vulnerabilities"
                    SECURITY_CHECKS[high_vulnerabilities]="$high_vulns"
                    SECURITY_CHECKS[critical_vulnerabilities]="$critical_vulns"
                    
                    if [[ $vulnerabilities -eq 0 ]]; then
                        log_success "Nenhuma vulnerabilidade encontrada nas dependências"
                    else
                        log_warning "Vulnerabilidades encontradas: $vulnerabilities (High: $high_vulns, Critical: $critical_vulns)"
                        
                        if [[ $critical_vulns -gt 0 ]]; then
                            SECURITY_ISSUES[critical_vulnerabilities]="$critical_vulns vulnerabilidades críticas encontradas"
                            SECURITY_RECOMMENDATIONS[fix_critical_vulns]="Execute 'npm audit fix' para corrigir vulnerabilidades"
                        fi
                        
                        if [[ $high_vulns -gt 0 ]]; then
                            SECURITY_ISSUES[high_vulnerabilities]="$high_vulns vulnerabilidades de alta severidade"
                        fi
                    fi
                else
                    log_warning "jq não disponível, análise limitada do audit"
                fi
            else
                log_warning "Não foi possível executar npm audit"
            fi
        else
            log_warning "npm não disponível para auditoria de segurança"
        fi
        
        # Verificar dependências desatualizadas
        if command_exists yarn; then
            log_info "Verificando dependências desatualizadas..."
            local outdated_count=$(cd "$PROJECT_ROOT" && yarn outdated --json 2>/dev/null | wc -l || echo "0")
            SECURITY_CHECKS[outdated_dependencies]="$outdated_count"
            
            if [[ $outdated_count -gt 0 ]]; then
                log_warning "$outdated_count dependências desatualizadas"
                SECURITY_RECOMMENDATIONS[update_dependencies]="Atualizar dependências com 'yarn upgrade'"
            else
                log_success "Dependências estão atualizadas"
            fi
        fi
    else
        SECURITY_ISSUES[package_json_missing]="package.json não encontrado"
    fi
}

# Verificar configurações do servidor
check_server_security() {
    log_section "🌐 Segurança do Servidor"
    
    # Verificar se está rodando como root
    if [[ "$EUID" -eq 0 ]]; then
        SECURITY_ISSUES[running_as_root]="Aplicação rodando como root (alto risco)"
        SECURITY_RECOMMENDATIONS[avoid_root]="Execute a aplicação com usuário não-root"
        log_error "⚠️ Rodando como root - ALTO RISCO"
    else
        SECURITY_CHECKS[non_root_user]="true"
        log_success "Rodando como usuário não-root"
    fi
    
    # Verificar portas expostas
    local exposed_ports=()
    if command_exists netstat; then
        while IFS= read -r line; do
            local port=$(echo "$line" | awk '{print $4}' | cut -d: -f2)
            if [[ -n "$port" && "$port" != "22" ]]; then
                exposed_ports+=("$port")
            fi
        done < <(netstat -tlnp 2>/dev/null | grep LISTEN || true)
    fi
    
    SECURITY_CHECKS[exposed_ports]="${#exposed_ports[@]}"
    if [[ ${#exposed_ports[@]} -gt 0 ]]; then
        log_info "Portas expostas: ${exposed_ports[*]}"
        
        # Verificar se porta 1337 (Strapi) está exposta
        if [[ " ${exposed_ports[*]} " =~ " 1337 " ]]; then
            SECURITY_CHECKS[strapi_port_exposed]="true"
            log_info "Porta 1337 (Strapi) está exposta"
        fi
    fi
    
    # Verificar firewall
    if command_exists ufw; then
        local ufw_status=$(ufw status 2>/dev/null | head -1 | awk '{print $2}' || echo "unknown")
        SECURITY_CHECKS[firewall_status]="$ufw_status"
        
        if [[ "$ufw_status" == "active" ]]; then
            log_success "Firewall UFW está ativo"
        else
            SECURITY_ISSUES[firewall_inactive]="Firewall não está ativo"
            SECURITY_RECOMMENDATIONS[enable_firewall]="Ativar firewall: sudo ufw enable"
        fi
    fi
}

# Verificar logs de segurança
check_security_logs() {
    log_section "📋 Logs de Segurança"
    
    # Verificar logs de autenticação
    if [[ -f /var/log/auth.log ]]; then
        local failed_logins=$(grep "Failed password" /var/log/auth.log 2>/dev/null | wc -l || echo "0")
        SECURITY_CHECKS[failed_login_attempts]="$failed_logins"
        
        if [[ $failed_logins -gt 10 ]]; then
            SECURITY_ISSUES[many_failed_logins]="Muitas tentativas de login falharam: $failed_logins"
            SECURITY_RECOMMENDATIONS[monitor_auth]="Monitorar tentativas de autenticação"
        fi
        
        log_info "Tentativas de login falharam: $failed_logins"
    fi
    
    # Verificar logs da aplicação por padrões suspeitos
    if [[ -d "$LOG_DIR" ]]; then
        local suspicious_patterns=("SQL injection" "XSS" "unauthorized" "403" "401")
        local total_suspicious=0
        
        for pattern in "${suspicious_patterns[@]}"; do
            local count=$(find "$LOG_DIR" -name "*.log" -exec grep -i "$pattern" {} \; 2>/dev/null | wc -l || echo "0")
            total_suspicious=$((total_suspicious + count))
        done
        
        SECURITY_CHECKS[suspicious_log_entries]="$total_suspicious"
        if [[ $total_suspicious -gt 0 ]]; then
            log_warning "Entradas suspeitas nos logs: $total_suspicious"
            SECURITY_RECOMMENDATIONS[investigate_logs]="Investigar entradas suspeitas nos logs"
        else
            log_success "Nenhuma entrada suspeita nos logs"
        fi
    fi
}

# Verificar configurações Strapi específicas
check_strapi_security() {
    log_section "🎮 Segurança Específica do Strapi"
    
    # Verificar configurações de admin
    if [[ -f "$PROJECT_ROOT/config/admin.ts" ]]; then
        SECURITY_CHECKS[admin_config]="exists"
        
        # Verificar se watchIgnoreFiles está configurado
        if grep -q "watchIgnoreFiles" "$PROJECT_ROOT/config/admin.ts" 2>/dev/null; then
            log_success "watchIgnoreFiles configurado"
        else
            SECURITY_RECOMMENDATIONS[configure_watch_ignore]="Configurar watchIgnoreFiles no admin.ts"
        fi
    fi
    
    # Verificar configurações de servidor
    if [[ -f "$PROJECT_ROOT/config/server.ts" ]]; then
        SECURITY_CHECKS[server_config]="exists"
        
        # Verificar se host está configurado adequadamente
        if grep -q "host.*0\.0\.0\.0" "$PROJECT_ROOT/config/server.ts" 2>/dev/null; then
            SECURITY_ISSUES[host_all_interfaces]="Servidor configurado para escutar em todas as interfaces (0.0.0.0)"
            SECURITY_RECOMMENDATIONS[restrict_host]="Configurar host específico em produção"
        fi
    fi
    
    # Verificar se existe configuração de CORS
    if [[ -f "$PROJECT_ROOT/config/middlewares.ts" ]]; then
        if grep -q "cors" "$PROJECT_ROOT/config/middlewares.ts" 2>/dev/null; then
            SECURITY_CHECKS[cors_configured]="true"
            log_success "CORS configurado"
        else
            SECURITY_ISSUES[cors_not_configured]="CORS não configurado"
            SECURITY_RECOMMENDATIONS[configure_cors]="Configurar CORS adequadamente"
        fi
    fi
    
    # Verificar plugins de segurança
    if [[ -f "$PROJECT_ROOT/config/plugins.ts" ]]; then
        if grep -q "users-permissions" "$PROJECT_ROOT/config/plugins.ts" 2>/dev/null; then
            SECURITY_CHECKS[users_permissions_plugin]="configured"
            log_success "Plugin users-permissions configurado"
        fi
    fi
}

# Calcular score de segurança
calculate_security_score() {
    log_section "📊 Score de Segurança"
    
    local total_checks=0
    local passed_checks=0
    local critical_issues=0
    
    # Contar verificações
    for check in "${SECURITY_CHECKS[@]}"; do
        ((total_checks++))
        if [[ "$check" == "true" || "$check" == "exists" || "$check" == "secure" || "$check" == "configured" ]]; then
            ((passed_checks++))
        fi
    done
    
    # Contar problemas críticos
    for issue in "${!SECURITY_ISSUES[@]}"; do
        if [[ "$issue" =~ (root|critical|jwt|env_not_gitignored) ]]; then
            ((critical_issues++))
        fi
    done
    
    local security_score=0
    if [[ $total_checks -gt 0 ]]; then
        security_score=$(echo "scale=0; $passed_checks * 100 / $total_checks" | bc)
    fi
    
    # Penalizar por problemas críticos
    security_score=$((security_score - (critical_issues * 10)))
    if [[ $security_score -lt 0 ]]; then
        security_score=0
    fi
    
    SECURITY_CHECKS[security_score]="$security_score"
    SECURITY_CHECKS[total_issues]="${#SECURITY_ISSUES[@]}"
    SECURITY_CHECKS[critical_issues]="$critical_issues"
    
    log_info "Score de Segurança: $security_score/100"
    log_info "Problemas encontrados: ${#SECURITY_ISSUES[@]} (Críticos: $critical_issues)"
    
    if [[ $security_score -ge 80 ]]; then
        log_success "Nível de segurança: BOM"
    elif [[ $security_score -ge 60 ]]; then
        log_warning "Nível de segurança: MÉDIO"
    else
        log_error "Nível de segurança: BAIXO - Ação necessária"
    fi
}

# Gerar relatório de segurança
generate_security_report() {
    log_section "📄 Gerando Relatório de Segurança"
    
    cat > "$SECURITY_REPORT" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "step": 5,
  "step_name": "diagnostico-seguranca",
  "security_checks": {
EOF

    # Adicionar verificações
    local first=true
    for key in "${!SECURITY_CHECKS[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$SECURITY_REPORT"
        fi
        echo "    \"$key\": \"${SECURITY_CHECKS[$key]}\"" >> "$SECURITY_REPORT"
    done

    cat >> "$SECURITY_REPORT" << EOF
  },
  "issues": {
EOF

    # Adicionar problemas
    first=true
    for key in "${!SECURITY_ISSUES[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$SECURITY_REPORT"
        fi
        echo "    \"$key\": \"${SECURITY_ISSUES[$key]}\"" >> "$SECURITY_REPORT"
    done

    cat >> "$SECURITY_REPORT" << EOF
  },
  "recommendations": {
EOF

    # Adicionar recomendações
    first=true
    for key in "${!SECURITY_RECOMMENDATIONS[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$SECURITY_REPORT"
        fi
        echo "    \"$key\": \"${SECURITY_RECOMMENDATIONS[$key]}\"" >> "$SECURITY_REPORT"
    done

    cat >> "$SECURITY_REPORT" << EOF
  }
}
EOF

    log_success "Relatório de segurança salvo: $SECURITY_REPORT"
}

# Finalizar etapa
finalize_step() {
    local issues_count=${#SECURITY_ISSUES[@]}
    local security_score=${SECURITY_CHECKS[security_score]:-0}
    
    if [[ $security_score -ge 80 && $issues_count -eq 0 ]]; then
        log_success "✅ Etapa 5 concluída: Segurança adequada"
        echo "$(date -Iseconds) - Etapa 5 concluída: SUCESSO" >> "$SEQUENCE_LOG"
    else
        log_warning "⚠️ Etapa 5 concluída: Score $security_score/100, $issues_count problema(s)"
        echo "$(date -Iseconds) - Etapa 5 concluída: Score $security_score, $issues_count problemas" >> "$SEQUENCE_LOG"
    fi
    
    # Atualizar status
    if command_exists jq; then
        jq '.steps."5".status = "completed" | .steps."5".end = "'$(date -Iseconds)'" | .current_step = 6' \
           "$REPORT_DIR/diagnostic_status.json" > "$REPORT_DIR/diagnostic_status.tmp" && \
           mv "$REPORT_DIR/diagnostic_status.tmp" "$REPORT_DIR/diagnostic_status.json"
    fi
    
    log_info "🔄 Próximo passo: ./scripts/6_backup-verificacao.sh"
}

# Função principal
main() {
    init_step
    check_file_permissions
    check_security_config
    check_dependencies_security
    check_server_security
    check_security_logs
    check_strapi_security
    calculate_security_score
    generate_security_report
    finalize_step
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
