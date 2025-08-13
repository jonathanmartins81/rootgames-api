# 🚀 Configuração do Strapi - RootGames API

## 📋 Visão Geral

Este documento explica como configurar e executar o projeto RootGames API usando Strapi CMS. O projeto é uma API headless para gerenciamento de catálogo de jogos com funcionalidades avançadas de importação automática.

---

## 🛠️ Pré-requisitos

### **Sistema Operacional**

- Linux (recomendado: Fedora, Ubuntu, CentOS)
- macOS
- Windows (WSL2 recomendado)

### **Software Necessário**

- **Node.js**: Versão 16.x - 20.x (recomendado: 18.x LTS)
- **Yarn**: Gerenciador de pacotes
- **PostgreSQL**: Versão 12+ (recomendado: 15+)
- **Git**: Controle de versão

### **Verificação de Versões**

```bash
node --version    # Deve ser >= 16.0.0 e <= 20.x.x
yarn --version    # Qualquer versão recente
psql --version    # Deve ser >= 12.0
git --version     # Qualquer versão recente
```

---

## 🗄️ Configuração do Banco de Dados

### **1. Instalação do PostgreSQL**

**Fedora/RHEL/CentOS:**

```bash
sudo dnf install postgresql postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### **2. Criação do Banco de Dados**

```bash
# Acessar PostgreSQL como superusuário
sudo -u postgres psql

# Criar usuário e banco de dados
CREATE USER rootgames WITH PASSWORD 'rootgames';
CREATE DATABASE rootgames OWNER rootgames;
GRANT ALL PRIVILEGES ON DATABASE rootgames TO rootgames;

# Sair do PostgreSQL
\q
```

### **3. Configuração de Autenticação**

**Importante**: O PostgreSQL pode usar diferentes métodos de autenticação. Para garantir compatibilidade:

```bash
# Editar arquivo de configuração
sudo nano /var/lib/pgsql/data/pg_hba.conf

# Adicionar/modificar estas linhas:
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### **4. Teste de Conexão**

```bash
# Testar conexão com senha
PGPASSWORD=rootgames psql -h 127.0.0.1 -p 5432 -U rootgames -d rootgames -c "SELECT version();"
```

---

## ⚙️ Configuração do Projeto

### **1. Clone e Instalação**

```bash
# Clonar o repositório
git clone <repository-url>
cd rootgames-api

# Instalar dependências
yarn install
```

### **2. Arquivo de Ambiente (.env)**

Criar arquivo `.env` na raiz do projeto:

```env
# Database Configuration
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=rootgames
DATABASE_USERNAME=rootgames
DATABASE_PASSWORD=rootgames
DATABASE_SSL=false

# App Configuration
HOST=0.0.0.0
PORT=1337

# Security Keys (GENERATE NEW ONES FOR PRODUCTION!)
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=salt123
ADMIN_JWT_SECRET=admin-secret
JWT_SECRET=jwt-secret
TRANSFER_TOKEN_SALT=transfer-salt

# Webhooks
WEBHOOKS_POPULATE_RELATIONS=false

# Optional: Environment
NODE_ENV=development
```

### **3. Geração de Chaves Seguras (Produção)**

Para produção, gere chaves seguras:

```bash
# Gerar APP_KEYS
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Gerar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Gerar ADMIN_JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🚀 Execução do Projeto

### **1. Modo Desenvolvimento**

```bash
# Iniciar servidor de desenvolvimento
yarn develop

# O servidor estará disponível em:
# - Admin Panel: http://localhost:1337/admin
# - API REST: http://localhost:1337/api
# - GraphQL: http://localhost:1337/graphql
```

### **2. Modo Produção**

```bash
# Construir o projeto
yarn build

# Iniciar servidor de produção
yarn start
```

### **3. Comandos Úteis**

```bash
# Limpar cache
yarn strapi cache:clean

# Verificar configuração
yarn strapi info

# Gerar nova chave de API
yarn strapi admin:create-user

# Backup do banco
yarn strapi database:backup
```

---

## 📊 Estrutura do Banco de Dados

### **Tabelas Principais**

Após a primeira execução, o Strapi criará automaticamente:

- **`games`** - Jogos do catálogo
- **`categories`** - Categorias/gêneros
- **`platforms`** - Plataformas (PC, PS5, Xbox, etc.)
- **`developers`** - Desenvolvedores
- **`publishers`** - Publicadores
- **`files`** - Sistema de upload de mídia
- **`admin_users`** - Usuários administrativos
- **`up_users`** - Usuários da API

### **Relacionamentos**

- **Games ↔ Categories**: Many-to-Many
- **Games ↔ Platforms**: Many-to-Many
- **Games ↔ Developers**: Many-to-Many
- **Games ↔ Publisher**: Many-to-One

---

## 🔧 Configurações Avançadas

### **1. Configuração de Upload**

**config/plugins.ts:**

```typescript
export default ({ env }) => ({
  upload: {
    config: {
      provider: 'local',
      providerOptions: {
        sizeLimit: 100000,
      },
    },
  },
});
```

### **2. Configuração de CORS**

**config/middlewares.ts:**

```typescript
export default [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'media-src': ["'self'", 'data:', 'blob:', 'https:'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

### **3. Configuração de Cache**

**config/database.ts:**

```typescript
export default ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      // ... configurações existentes
      pool: {
        min: env.int('DATABASE_POOL_MIN', 2),
        max: env.int('DATABASE_POOL_MAX', 10),
      },
    },
  },
});
```

---

## 🔐 Segurança

### **1. Configurações de Produção**

```env
# Produção - Sempre use HTTPS
NODE_ENV=production
DATABASE_SSL=true
CORS_ORIGIN=https://yourdomain.com

# Chaves seguras (geradas aleatoriamente)
APP_KEYS=chave1-segura,chave2-segura,chave3-segura,chave4-segura
API_TOKEN_SALT=salt-seguro-aleatorio
ADMIN_JWT_SECRET=jwt-secret-seguro
JWT_SECRET=jwt-secret-seguro
TRANSFER_TOKEN_SALT=transfer-salt-seguro
```

### **2. Firewall e Rede**

```bash
# Configurar firewall
sudo ufw allow 1337/tcp
sudo ufw allow 5432/tcp

# Restringir acesso ao PostgreSQL
sudo nano /var/lib/pgsql/data/pg_hba.conf
# Permitir apenas IPs específicos
```

### **3. Backup Automático**

```bash
# Script de backup
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
PGPASSWORD=rootgames pg_dump -h 127.0.0.1 -U rootgames rootgames > backup_$DATE.sql
```

---

## 🐛 Troubleshooting

### **Problemas Comuns**

**1. Erro de Conexão com PostgreSQL:**

```bash
# Verificar se o serviço está rodando
sudo systemctl status postgresql

# Verificar logs
sudo journalctl -u postgresql

# Testar conexão
PGPASSWORD=rootgames psql -h 127.0.0.1 -U rootgames -d rootgames
```

**2. Erro de Permissões:**

```bash
# Verificar permissões do diretório
ls -la /var/lib/pgsql/data/

# Corrigir permissões
sudo chown -R postgres:postgres /var/lib/pgsql/data/
sudo chmod 700 /var/lib/pgsql/data/
```

**3. Erro de Memória:**

```bash
# Aumentar memória do Node.js
export NODE_OPTIONS="--max-old-space-size=4096"
yarn develop
```

**4. Erro de Compilação TypeScript:**

```bash
# Limpar cache
rm -rf .cache dist
yarn develop
```

### **Logs Úteis**

```bash
# Logs do Strapi
tail -f .tmp/logs/strapi.log

# Logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log

# Logs do sistema
sudo journalctl -f
```

---

## 📚 Recursos Adicionais

### **Documentação Oficial**

- [Strapi Documentation](https://docs.strapi.io/)
- [Strapi Admin Customization](https://docs.strapi.io/dev-docs/admin-customization)
- [Strapi API Documentation](https://docs.strapi.io/dev-docs/api)

### **Comunidade**

- [Strapi Forum](https://forum.strapi.io/)
- [Strapi Discord](https://discord.strapi.io/)
- [GitHub Issues](https://github.com/strapi/strapi/issues)

### **Ferramentas Úteis**

- [Strapi CLI](https://docs.strapi.io/dev-docs/cli)
- [Strapi Plugin Development](https://docs.strapi.io/dev-docs/plugins-development)
- [Strapi Deployment](https://docs.strapi.io/dev-docs/deployment)

---

## 🎯 Próximos Passos

1. **Configurar usuário admin** no painel administrativo
2. **Testar funcionalidade de populate** de jogos
3. **Configurar permissões** da API
4. **Implementar autenticação** para aplicações cliente
5. **Configurar webhooks** para integrações
6. **Implementar cache** para melhor performance

---

_Última atualização: Agosto 2025_
_Versão do Strapi: 4.12.5_
