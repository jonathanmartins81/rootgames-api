# 🔄 Preparação para Migração Strapi 5.x - RootGames API

## 🎯 Visão Geral

Este documento detalha a preparação completa para migração do Strapi 4.25.23 para Strapi 5.21.0,
incluindo ambiente de staging, testes, análise de impacto e procedimentos de segurança.

---

## 📊 **Situação Atual (Agosto 2025)**

### **Versão Atual**

- **Strapi**: 4.25.23
- **Node.js**: 20.19.4 ✅ (compatível com Strapi 5.x)
- **Status**: Estável e funcional

### **Funcionalidades Críticas**

- ✅ API REST completa
- ✅ GraphQL funcional
- ✅ Sistema de upload
- ✅ Admin panel customizado
- ✅ Sistema de permissões
- ✅ i18n (internacionalização)

---

## 🚨 **Breaking Changes Identificados**

### **1. Plugin i18n Removido**

- **Antes**: `@strapi/plugin-i18n` separado
- **Depois**: Funcionalidade integrada ao core
- **Impacto**: Configurações podem precisar de ajustes

### **2. Estrutura de Plugins**

- **Antes**: Plugins separados
- **Depois**: Alguns plugins integrados ao core
- **Impacto**: Configurações de plugins podem mudar

### **3. Admin Panel**

- **Antes**: Interface atual
- **Depois**: Nova interface (possíveis mudanças)
- **Impacto**: Customizações podem quebrar

---

## 🛠️ **Preparação do Ambiente de Staging**

### **1. Criar Branch de Staging**

```bash
# Criar branch para migração
git checkout -b staging-strapi-5-migration

# Verificar status
git status
```

### **2. Configurar Ambiente de Staging**

```bash
# Criar arquivo .env.staging
cp .env .env.staging

# Configurar variáveis de staging
echo "NODE_ENV=staging" >> .env.staging
echo "DATABASE_NAME=rootgames_staging" >> .env.staging
```

### **3. Banco de Dados de Staging**

```bash
# Criar banco de staging
sudo -u postgres psql -c "CREATE DATABASE rootgames_staging OWNER rootgames;"

# Restaurar dados de produção
PGPASSWORD=rootgames pg_restore -h 127.0.0.1 -U rootgames -d rootgames_staging ./backups/backup_latest.sql
```

---

## 🔍 **Análise de Impacto Detalhada**

### **1. Análise de Código Customizado**

```bash
# Verificar arquivos customizados
find src/ -name "*.js" -o -name "*.ts" | grep -v node_modules

# Verificar patches aplicados
ls -la patches/

# Verificar configurações customizadas
grep -r "custom" config/
```

### **2. Análise de Dependências**

```bash
# Verificar dependências que podem conflitar
yarn list --depth=0

# Verificar peer dependencies
yarn check --verify-tree
```

### **3. Análise de Configurações**

```bash
# Verificar middlewares customizados
cat config/middlewares.ts

# Verificar configurações de plugins
cat config/plugins.ts

# Verificar configurações de upload
cat config/plugins.ts
```

---

## 📋 **Checklist de Preparação**

### **Pré-Migração**

- [ ] **Backup completo** do sistema atual
- [ ] **Ambiente de staging** configurado
- [ ] **Banco de dados** de staging criado
- [ ] **Análise de impacto** completa
- [ ] **Testes automatizados** implementados
- [ ] **Equipe notificada** sobre migração
- [ ] **Rollback plan** preparado

### **Durante Migração**

- [ ] **Migração em staging** primeiro
- [ ] **Testes extensivos** de funcionalidades
- [ ] **Verificação de performance**
- [ ] **Testes de integração**
- [ ] **Validação de dados**
- [ ] **Testes de admin panel**

### **Pós-Migração**

- [ ] **Health checks** completos
- [ ] **Testes de funcionalidades** críticas
- [ ] **Verificação de performance**
- [ ] **Validação de dados**
- [ ] **Testes de usuários**
- [ ] **Documentação atualizada**

---

## 🚀 **Procedimento de Migração**

### **1. Comando Oficial de Migração**

```bash
# Backup antes da migração
./scripts/backup.sh

# Usar comando oficial do Strapi
npx @strapi/upgrade major

# Verificar resultado
yarn build
yarn develop
```

### **2. Migração Manual (Alternativa)**

```bash
# Atualizar dependências principais
yarn add @strapi/strapi@^5.21.0
yarn add @strapi/plugin-graphql@^5.21.0
yarn add @strapi/plugin-users-permissions@^5.21.0

# REMOVER plugin i18n (agora é core)
yarn remove @strapi/plugin-i18n

# Atualizar outras dependências
yarn add react@^18.0.0 react-dom@^18.0.0
yarn add react-router-dom@^6.0.0 styled-components@^6.0.0
```

### **3. Ajustes Pós-Migração**

```bash
# Verificar configurações
yarn strapi config:dump

# Ajustar middlewares se necessário
# Ajustar configurações de plugins
# Ajustar customizações do admin
```

---

## 🧪 **Testes de Validação**

### **1. Testes de Funcionalidades**

```bash
# Testar API REST
curl http://localhost:1337/api/games?limit=1

# Testar GraphQL
curl -X POST http://localhost:1337/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { games { data { id attributes { name } } } }"}'

# Testar upload de arquivos
curl -X POST http://localhost:1337/api/upload \
  -F "files=@test.jpg" \
  -F "refId=1" \
  -F "ref=api::game.game" \
  -F "field=cover"
```

### **2. Testes de Admin Panel**

- [ ] Login no admin panel
- [ ] Criação de conteúdo
- [ ] Edição de conteúdo
- [ ] Upload de arquivos
- [ ] Configurações de permissões
- [ ] Funcionalidades de i18n

### **3. Testes de Performance**

```bash
# Health check
./scripts/health-check.sh

# Teste de carga básico
ab -n 100 -c 10 http://localhost:1337/api/games

# Verificar uso de memória
ps aux | grep strapi
```

---

## 🛡️ **Procedimentos de Segurança**

### **1. Backup Automático**

```bash
# Backup antes da migração
./scripts/backup.sh

# Backup do código
git add .
git commit -m "Backup antes da migração Strapi 5.x"
git push origin staging-strapi-5-migration
```

### **2. Rollback Automático**

```bash
# Se a migração falhar
./scripts/rollback.sh

# Ou rollback manual
git checkout main
git reset --hard HEAD~1
yarn install
./scripts/rollback.sh
```

### **3. Monitoramento Contínuo**

```bash
# Iniciar monitoramento
./scripts/start-monitoring.sh

# Verificar status
./scripts/monitor-status.sh
```

---

## 📅 **Cronograma de Migração**

### **Semana 1: Preparação**

- [ ] Configurar ambiente de staging
- [ ] Análise completa de impacto
- [ ] Implementar testes automatizados
- [ ] Preparar scripts de migração

### **Semana 2: Migração em Staging**

- [ ] Executar migração em staging
- [ ] Testes extensivos
- [ ] Ajustes e correções
- [ ] Validação completa

### **Semana 3: Testes e Validação**

- [ ] Testes de usuários
- [ ] Testes de performance
- [ ] Validação de dados
- [ ] Documentação atualizada

### **Semana 4: Deploy em Produção**

- [ ] Backup final
- [ ] Migração em produção
- [ ] Monitoramento pós-deploy
- [ ] Rollback se necessário

---

## 🔧 **Scripts de Migração**

### **1. Script de Preparação**

```bash
#!/bin/bash
# scripts/prepare-strapi5-migration.sh

echo "🚀 Preparando migração para Strapi 5.x..."

# Backup
./scripts/backup.sh

# Criar ambiente de staging
cp .env .env.staging
echo "NODE_ENV=staging" >> .env.staging

# Verificar compatibilidade
node --version
yarn --version

echo "✅ Preparação concluída!"
```

### **2. Script de Migração**

```bash
#!/bin/bash
# scripts/migrate-strapi5.sh

echo "🔄 Iniciando migração para Strapi 5.x..."

# Backup
./scripts/backup.sh

# Migração oficial
npx @strapi/upgrade major

# Verificar resultado
yarn build
yarn develop

echo "✅ Migração concluída!"
```

### **3. Script de Validação**

```bash
#!/bin/bash
# scripts/validate-strapi5.sh

echo "🧪 Validando migração Strapi 5.x..."

# Health check
./scripts/health-check.sh

# Testes de funcionalidades
curl -s http://localhost:1337/api/games?limit=1 > /dev/null && echo "✅ API REST: OK" || echo "❌ API REST: FALHOU"

# Verificar versão
yarn strapi info

echo "✅ Validação concluída!"
```

---

## 📚 **Recursos e Documentação**

### **Documentação Oficial**

- [Strapi 5.x Migration Guide](https://docs.strapi.io/dev-docs/migration-guides)
- [Breaking Changes v4 to v5](https://docs.strapi.io/dev-docs/migration-guides/migration-guide-4.x-to-v5.0.0)
- [Strapi 5.x Documentation](https://docs.strapi.io/)

### **Comunidade**

- [Strapi Forum](https://forum.strapi.io/)
- [Strapi Discord](https://discord.strapi.io/)
- [GitHub Issues](https://github.com/strapi/strapi/issues)

---

## 🎯 **Próximos Passos**

### **Imediato (Esta Semana)**

1. **Configurar ambiente de staging**
2. **Criar banco de dados de staging**
3. **Implementar testes automatizados**
4. **Análise completa de impacto**

### **Curto Prazo (Próximas 2 Semanas)**

1. **Executar migração em staging**
2. **Testes extensivos**
3. **Ajustes e correções**
4. **Validação completa**

### **Médio Prazo (1 Mês)**

1. **Deploy em produção**
2. **Monitoramento pós-deploy**
3. **Documentação atualizada**
4. **Treinamento da equipe**

---

_Última atualização: Agosto 2025_ _Versão do Documento: 1.0.0_ _Próxima revisão: Setembro 2025_
