#!/bin/bash
# Script de backup de segurança

BACKUP_DIR="logs/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="security_backup_$DATE.tar.gz"

echo "💾 Criando backup de segurança..."

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Fazer backup dos arquivos importantes
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
    config/security.js \
    src/middlewares/security.js \
    logs/security.log \
    logs/alerts.json \
    logs/vulnerabilities.json \
    package.json \
    yarn.lock

echo "✅ Backup criado: $BACKUP_FILE"

# Remover backups antigos (manter apenas últimos 7 dias)
find $BACKUP_DIR -name "security_backup_*.tar.gz" -mtime +7 -delete

echo "🧹 Backups antigos removidos"
