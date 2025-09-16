#!/bin/bash
# Script de inicialização do monitor de segurança

echo "🔒 Iniciando monitor de segurança RootGames API..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js primeiro."
    exit 1
fi

# Verificar se o servidor Strapi está rodando
if ! curl -s http://localhost:1337/api/games?pagination%5BpageSize%5D=1 > /dev/null; then
    echo "⚠️  Servidor Strapi não está respondendo. Iniciando monitoramento offline..."
fi

# Iniciar monitor de segurança
node scripts/security-monitor.js
