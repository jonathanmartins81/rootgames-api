# 🚀 Guia de Deploy - RootGames API

Este documento descreve como configurar e fazer deploy da RootGames API em diferentes ambientes.

## 📋 Pré-requisitos

### Servidor de Produção
- **OS**: Ubuntu 20.04+ ou CentOS 8+
- **Node.js**: 20.19.4+
- **PostgreSQL**: 15+
- **Nginx**: 1.18+
- **PM2**: Para gerenciamento de processos
- **Docker**: Para monitoramento (opcional)

### Recursos Mínimos
- **CPU**: 2 cores
- **RAM**: 4GB
- **Disco**: 20GB SSD
- **Rede**: 100Mbps

## 🔧 Configuração do Servidor

### 1. Instalar Dependências

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Instalar Nginx
sudo apt install nginx -y

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar Yarn
sudo npm install -g yarn
```

### 2. Configurar PostgreSQL

```bash
# Criar usuário e banco
sudo -u postgres psql
CREATE USER rootgames WITH PASSWORD 'rootgames123';
CREATE DATABASE rootgames OWNER rootgames;
GRANT ALL PRIVILEGES ON DATABASE rootgames TO rootgames;
\q

# Configurar PostgreSQL
sudo nano /etc/postgresql/15/main/postgresql.conf
# Descomentar e configurar:
# listen_addresses = 'localhost'
# port = 5432

sudo nano /etc/postgresql/15/main/pg_hba.conf
# Adicionar linha:
# local   rootgames        rootgames                    md5

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### 3. Configurar Nginx

```bash
# Criar configuração do site
sudo nano /etc/nginx/sites-available/rootgames-api

# Conteúdo da configuração:
server {
    listen 80;
    server_name api.rootgames.com.br;

    location / {
        proxy_pass http://localhost:1337;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Ativar site
sudo ln -s /etc/nginx/sites-available/rootgames-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🚀 Deploy Manual

### 1. Preparar Aplicação

```bash
# Clonar repositório
git clone https://github.com/jonathanmartins81/rootgames-api.git
cd rootgames-api

# Instalar dependências
yarn install --production

# Configurar variáveis de ambiente
cp .env.example .env
nano .env
```

### 2. Configurar .env

```env
# Ambiente
NODE_ENV=production

# Servidor
HOST=0.0.0.0
PORT=1337

# Banco de dados
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=rootgames
DATABASE_USERNAME=rootgames
DATABASE_PASSWORD=rootgames123
DATABASE_SSL=false

# Chaves de segurança
APP_KEYS=chave1-segura,chave2-segura,chave3-segura,chave4-segura
API_TOKEN_SALT=salt-seguro-aleatorio
ADMIN_JWT_SECRET=jwt-secret-seguro
JWT_SECRET=jwt-secret-seguro
TRANSFER_TOKEN_SALT=transfer-salt-seguro

# API Keys
VALID_API_KEYS=rootgames-prod-key-2024,rootgames-admin-key-2024

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Logging
SECURITY_LOG_LEVEL=warn
LOG_RETENTION_DAYS=30
```

### 3. Executar Deploy

```bash
# Build da aplicação
yarn build

# Executar migrações
yarn strapi migrate

# Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔗 Deploy Automático com Webhooks

### 1. Configurar Webhook Server

```bash
# Instalar dependências do webhook
npm install express crypto

# Iniciar servidor de webhooks
yarn webhook:start
```

### 2. Configurar GitHub Webhook

1. Acesse o repositório no GitHub
2. Vá em Settings > Webhooks
3. Adicione novo webhook:
   - **Payload URL**: `http://seu-servidor:5001/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: `rootgames-webhook-secret-2024`
   - **Events**: Push events, Release events

### 3. Configurar Deploy Script

```bash
# Tornar script executável
chmod +x scripts/deploy.sh

# Configurar permissões
sudo chown rootgames:rootgames /opt/rootgames-api
sudo chmod 755 /opt/rootgames-api
```

## 📊 Monitoramento

### 1. Configurar Prometheus + Grafana

```bash
# Executar script de configuração
yarn monitoring:setup

# Iniciar monitoramento
cd monitoring
docker-compose up -d
```

### 2. Acessar Dashboards

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin123)
- **Alertmanager**: http://localhost:9093

### 3. Health Checks

```bash
# Verificar status da aplicação
yarn health:check

# Verificar logs
pm2 logs rootgames-api

# Verificar métricas
curl http://localhost:1337/api/metrics
```

## 🔒 Segurança

### 1. Firewall

```bash
# Configurar UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 1337
```

### 2. SSL/TLS

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado
sudo certbot --nginx -d api.rootgames.com.br

# Renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Backup

```bash
# Script de backup automático
#!/bin/bash
pg_dump -h localhost -U rootgames rootgames > /opt/backups/rootgames-$(date +%Y%m%d).sql
find /opt/backups -name "*.sql" -mtime +7 -delete
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Aplicação não inicia
```bash
# Verificar logs
pm2 logs rootgames-api

# Verificar configuração
yarn strapi config:dump

# Verificar banco
psql -h localhost -U rootgames -d rootgames -c "SELECT 1;"
```

#### 2. Erro de permissão
```bash
# Corrigir permissões
sudo chown -R rootgames:rootgames /opt/rootgames-api
chmod -R 755 /opt/rootgames-api
```

#### 3. Erro de memória
```bash
# Aumentar limite de memória
export NODE_OPTIONS="--max-old-space-size=4096"
pm2 restart rootgames-api
```

### Logs Importantes

```bash
# Logs da aplicação
pm2 logs rootgames-api

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Logs de segurança
tail -f logs/security.log
```

## 📈 Escalabilidade

### 1. Load Balancer

```nginx
upstream rootgames_api {
    server localhost:1337;
    server localhost:1338;
    server localhost:1339;
}

server {
    listen 80;
    server_name api.rootgames.com.br;
    
    location / {
        proxy_pass http://rootgames_api;
        # ... outras configurações
    }
}
```

### 2. Cache Redis

```bash
# Instalar Redis
sudo apt install redis-server -y

# Configurar no .env
CACHE_PROVIDER=redis
CACHE_REDIS_HOST=localhost
CACHE_REDIS_PORT=6379
```

### 3. CDN

```bash
# Configurar CloudFlare ou AWS CloudFront
# Para servir arquivos estáticos
```

## 🔄 Atualizações

### 1. Atualização Manual

```bash
# Fazer backup
pm2 stop rootgames-api
pg_dump rootgames > backup-$(date +%Y%m%d).sql

# Atualizar código
git pull origin main
yarn install --production
yarn build
yarn strapi migrate

# Reiniciar
pm2 start rootgames-api
```

### 2. Rollback

```bash
# Parar aplicação
pm2 stop rootgames-api

# Restaurar backup
git checkout <commit-anterior>
yarn install --production
yarn build

# Restaurar banco (se necessário)
psql -h localhost -U rootgames -d rootgames < backup-YYYYMMDD.sql

# Reiniciar
pm2 start rootgames-api
```

## 📞 Suporte

Para problemas ou dúvidas:

- **GitHub Issues**: [Criar issue](https://github.com/jonathanmartins81/rootgames-api/issues)
- **Email**: support@rootgames.com.br
- **Documentação**: [docs/](docs/)

---

**Última atualização**: Setembro 2025  
**Versão**: 1.0.0  
**Mantido por**: Equipe RootGames
