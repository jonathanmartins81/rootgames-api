#!/usr/bin/env node

/**
 * Script de Configuração de Segurança para RootGames API
 *
 * Este script configura todas as medidas de segurança
 * e inicia o monitoramento
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SecuritySetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.configDir = path.join(this.projectRoot, 'config');
    this.middlewareDir = path.join(this.projectRoot, 'src', 'middlewares');
    this.scriptsDir = path.join(this.projectRoot, 'scripts');
    this.logsDir = path.join(this.projectRoot, 'logs');
  }

  async setup() {
    console.log('🔒 CONFIGURANDO SEGURANÇA ROOTGAMES API');
    console.log('=======================================');

    try {
      // 1. Criar diretórios necessários
      await this.createDirectories();

      // 2. Configurar variáveis de ambiente
      await this.setupEnvironmentVariables();

      // 3. Configurar middlewares de segurança
      await this.setupSecurityMiddlewares();

      // 4. Configurar monitoramento
      await this.setupMonitoring();

      // 5. Configurar backup de segurança
      await this.setupBackup();

      // 6. Testar configurações
      await this.testSecuritySetup();

      console.log('\n✅ CONFIGURAÇÃO DE SEGURANÇA CONCLUÍDA!');
      console.log('=====================================');
      console.log('📋 Próximos passos:');
      console.log('   1. Reinicie o servidor Strapi');
      console.log('   2. Execute: node scripts/security-monitor.js');
      console.log('   3. Configure notificações em produção');
      console.log('   4. Revise os logs em logs/security.log');

    } catch (error) {
      console.error('❌ Erro na configuração:', error.message);
      process.exit(1);
    }
  }

  async createDirectories() {
    console.log('📁 Criando diretórios necessários...');

    const directories = [
      this.logsDir,
      path.join(this.logsDir, 'backups'),
      path.join(this.logsDir, 'reports'),
      path.join(this.projectRoot, 'security')
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`   ✅ Criado: ${dir}`);
      }
    });
  }

  async setupEnvironmentVariables() {
    console.log('🔧 Configurando variáveis de ambiente...');

    const envFile = path.join(this.projectRoot, '.env');
    const securityEnv = `
# Configurações de Segurança RootGames API
# ======================================

# API Keys válidas (separadas por vírgula)
VALID_API_KEYS=rootgames-dev-key-2024,rootgames-admin-key-2024

# Configurações de Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Configurações de Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Configurações de Logging
SECURITY_LOG_LEVEL=warn
LOG_RETENTION_DAYS=30

# Configurações de Monitoramento
MONITORING_ENABLED=true
ALERT_EMAIL=admin@rootgames.com.br
SLACK_WEBHOOK_URL=

# Configurações de Backup
BACKUP_ENABLED=true
BACKUP_INTERVAL=24
BACKUP_RETENTION_DAYS=7

# Configurações de CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8000,http://localhost:1337
CORS_CREDENTIALS=true

# Configurações de Sessão
SESSION_SECRET=your-super-secret-session-key-change-in-production
SESSION_MAX_AGE=86400000

# Configurações de Banco de Dados (já existentes)
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=rootgames
DATABASE_USERNAME=rootgames
DATABASE_PASSWORD=rootgames123
DATABASE_SSL=false

# Configurações do Strapi (já existentes)
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-app-keys-here
API_TOKEN_SALT=your-api-token-salt-here
ADMIN_JWT_SECRET=your-admin-jwt-secret-here
TRANSFER_TOKEN_SALT=your-transfer-token-salt-here
JWT_SECRET=your-jwt-secret-here
`;

    // Ler arquivo .env existente
    let existingEnv = '';
    if (fs.existsSync(envFile)) {
      existingEnv = fs.readFileSync(envFile, 'utf8');
    }

    // Adicionar apenas as configurações de segurança que não existem
    const lines = securityEnv.split('\n');
    const newLines = lines.filter(line => {
      if (line.trim() === '' || line.startsWith('#')) return true;
      const key = line.split('=')[0];
      return !existingEnv.includes(key);
    });

    if (newLines.length > 1) {
      fs.appendFileSync(envFile, '\n' + newLines.join('\n'));
      console.log('   ✅ Variáveis de ambiente de segurança adicionadas');
    } else {
      console.log('   ✅ Variáveis de ambiente já configuradas');
    }
  }

  async setupSecurityMiddlewares() {
    console.log('🛡️ Configurando middlewares de segurança...');

    // Verificar se os middlewares já existem
    const securityFile = path.join(this.middlewareDir, 'security.js');
    if (fs.existsSync(securityFile)) {
      console.log('   ✅ Middlewares de segurança já configurados');
      return;
    }

    console.log('   ⚠️  Middlewares de segurança não encontrados');
    console.log('   📝 Execute: node scripts/setup-security.js para configurar');
  }

  async setupMonitoring() {
    console.log('📊 Configurando monitoramento de segurança...');

    // Criar script de inicialização do monitor
    const monitorScript = `#!/bin/bash
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
`;

    const monitorFile = path.join(this.scriptsDir, 'start-security-monitor.sh');
    fs.writeFileSync(monitorFile, monitorScript);

    // Tornar o script executável
    execSync(`chmod +x ${monitorFile}`);

    console.log('   ✅ Script de monitoramento criado');
  }

  async setupBackup() {
    console.log('💾 Configurando backup de segurança...');

    const backupScript = `#!/bin/bash
# Script de backup de segurança

BACKUP_DIR="logs/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="security_backup_$DATE.tar.gz"

echo "💾 Criando backup de segurança..."

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Fazer backup dos arquivos importantes
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \\
    config/security.js \\
    src/middlewares/security.js \\
    logs/security.log \\
    logs/alerts.json \\
    logs/vulnerabilities.json \\
    package.json \\
    yarn.lock

echo "✅ Backup criado: $BACKUP_FILE"

# Remover backups antigos (manter apenas últimos 7 dias)
find $BACKUP_DIR -name "security_backup_*.tar.gz" -mtime +7 -delete

echo "🧹 Backups antigos removidos"
`;

    const backupFile = path.join(this.scriptsDir, 'backup-security.sh');
    fs.writeFileSync(backupFile, backupScript);

    // Tornar o script executável
    execSync(`chmod +x ${backupFile}`);

    console.log('   ✅ Script de backup criado');
  }

  async testSecuritySetup() {
    console.log('🧪 Testando configurações de segurança...');

    try {
      // Testar se os arquivos de configuração existem
      const configFiles = [
        'config/security.js',
        'src/middlewares/security.js',
        'scripts/security-monitor.js'
      ];

      let allFilesExist = true;
      configFiles.forEach(file => {
        if (fs.existsSync(path.join(this.projectRoot, file))) {
          console.log(`   ✅ ${file}`);
        } else {
          console.log(`   ❌ ${file} - Arquivo não encontrado`);
          allFilesExist = false;
        }
      });

      if (allFilesExist) {
        console.log('   ✅ Todos os arquivos de segurança estão presentes');
      } else {
        console.log('   ⚠️  Alguns arquivos de segurança estão faltando');
      }

      // Testar se as dependências estão instaladas
      try {
        require('helmet');
        require('express-rate-limit');
        console.log('   ✅ Dependências de segurança instaladas');
      } catch (e) {
        console.log('   ❌ Dependências de segurança não encontradas');
        console.log('   📝 Execute: yarn add helmet express-rate-limit http-proxy-middleware');
      }

    } catch (error) {
      console.log('   ❌ Erro no teste:', error.message);
    }
  }

  // Método para gerar relatório de configuração
  generateConfigReport() {
    const report = {
      timestamp: new Date().toISOString(),
      project: 'RootGames API',
      securityVersion: '1.0.0',
      features: [
        'Rate Limiting',
        'Security Headers',
        'Input Validation',
        'API Key Authentication',
        'Security Logging',
        'Vulnerability Monitoring',
        'Automated Backups'
      ],
      files: [
        'config/security.js',
        'src/middlewares/security.js',
        'scripts/security-monitor.js',
        'scripts/setup-security.js',
        'scripts/start-security-monitor.sh',
        'scripts/backup-security.sh'
      ],
      recommendations: [
        'Configure notificações de alerta em produção',
        'Revise e atualize as API keys regularmente',
        'Monitore os logs de segurança diariamente',
        'Execute backups regulares',
        'Mantenha as dependências atualizadas'
      ]
    };

    const reportFile = path.join(this.logsDir, 'security-config-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`📋 Relatório de configuração salvo: ${reportFile}`);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const setup = new SecuritySetup();
  setup.setup().then(() => {
    setup.generateConfigReport();
  }).catch(console.error);
}

module.exports = SecuritySetup;
