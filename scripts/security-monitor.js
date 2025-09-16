#!/usr/bin/env node

/**
 * Script de Monitoramento de Segurança para RootGames API
 *
 * Funcionalidades:
 * - Verificação de vulnerabilidades
 * - Monitoramento de logs de segurança
 * - Alertas automáticos
 * - Relatórios de segurança
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');

class SecurityMonitor {
  constructor() {
    this.config = {
      apiBase: 'http://localhost:1337',
      logFile: path.join(process.cwd(), 'logs', 'security.log'),
      alertThresholds: {
        errorRate: 0.1, // 10%
        responseTime: 5000, // 5 segundos
        failedLogins: 5, // por minuto
        suspiciousRequests: 10 // por minuto
      }
    };

    this.metrics = {
      totalRequests: 0,
      errorRequests: 0,
      suspiciousRequests: 0,
      failedLogins: 0,
      uploadAttempts: 0,
      startTime: Date.now()
    };

    this.alerts = [];
  }

  async initialize() {
    console.log('🔒 INICIANDO MONITOR DE SEGURANÇA ROOTGAMES');
    console.log('============================================');

    // Criar diretório de logs se não existir
    const logDir = path.dirname(this.config.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Verificar se o servidor está rodando
    await this.checkServerHealth();

    // Iniciar monitoramento
    this.startMonitoring();
  }

  async checkServerHealth() {
    try {
      const response = await axios.get(`${this.config.apiBase}/api/games?pagination%5BpageSize%5D=1`, {
        timeout: 5000
      });

      if (response.status === 200) {
        console.log('✅ Servidor Strapi está funcionando');
        return true;
      }
    } catch (error) {
      console.log('❌ Servidor Strapi não está respondendo');
      console.log('   Erro:', error.message);
      return false;
    }
  }

  startMonitoring() {
    console.log('📊 Iniciando monitoramento de segurança...');

    // Verificar vulnerabilidades a cada 6 horas
    setInterval(() => {
      this.checkVulnerabilities();
    }, 6 * 60 * 60 * 1000);

    // Verificar logs de segurança a cada minuto
    setInterval(() => {
      this.analyzeSecurityLogs();
    }, 60 * 1000);

    // Gerar relatório diário
    setInterval(() => {
      this.generateDailyReport();
    }, 24 * 60 * 60 * 1000);

    // Verificação inicial
    this.checkVulnerabilities();
    this.analyzeSecurityLogs();

    console.log('✅ Monitor de segurança ativo');
  }

  async checkVulnerabilities() {
    console.log('🔍 Verificando vulnerabilidades...');

    try {
      // Executar yarn audit
      const auditResult = execSync('yarn audit --json', {
        encoding: 'utf8',
        cwd: process.cwd()
      });

      const vulnerabilities = this.parseAuditResults(auditResult);

      if (vulnerabilities.length > 0) {
        console.log(`⚠️  ${vulnerabilities.length} vulnerabilidades encontradas`);

        // Filtrar vulnerabilidades críticas e altas
        const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high');

        if (criticalVulns.length > 0) {
          this.createAlert('CRITICAL', `Encontradas ${criticalVulns.length} vulnerabilidades críticas/altas`, {
            vulnerabilities: criticalVulns
          });
        }

        // Salvar relatório de vulnerabilidades
        this.saveVulnerabilityReport(vulnerabilities);
      } else {
        console.log('✅ Nenhuma vulnerabilidade encontrada');
      }

    } catch (error) {
      console.log('❌ Erro ao verificar vulnerabilidades:', error.message);
    }
  }

  parseAuditResults(auditOutput) {
    const vulnerabilities = [];
    const lines = auditOutput.split('\n');

    lines.forEach(line => {
      try {
        const data = JSON.parse(line);
        if (data.type === 'auditAdvisory') {
          vulnerabilities.push({
            severity: data.data.severity,
            package: data.data.module_name,
            title: data.data.title,
            description: data.data.overview,
            recommendation: data.data.recommendation,
            url: data.data.url
          });
        }
      } catch (e) {
        // Ignorar linhas que não são JSON válido
      }
    });

    return vulnerabilities;
  }

  analyzeSecurityLogs() {
    if (!fs.existsSync(this.config.logFile)) {
      return;
    }

    try {
      const logContent = fs.readFileSync(this.config.logFile, 'utf8');
      const lines = logContent.split('\n').filter(line => line.trim());

      // Analisar últimas 100 linhas
      const recentLines = lines.slice(-100);

      recentLines.forEach(line => {
        this.analyzeLogLine(line);
      });

      // Verificar alertas
      this.checkAlertThresholds();

    } catch (error) {
      console.log('❌ Erro ao analisar logs:', error.message);
    }
  }

  analyzeLogLine(line) {
    this.metrics.totalRequests++;

    // Detectar erros
    if (line.includes('ERROR') || line.includes('error')) {
      this.metrics.errorRequests++;
    }

    // Detectar tentativas de login falhadas
    if (line.includes('authentication_failure') || line.includes('invalid_api_key')) {
      this.metrics.failedLogins++;
    }

    // Detectar requisições suspeitas
    if (line.includes('suspicious') || line.includes('rate_limit_exceeded')) {
      this.metrics.suspiciousRequests++;
    }

    // Detectar tentativas de upload
    if (line.includes('upload_attempt')) {
      this.metrics.uploadAttempts++;
    }
  }

  checkAlertThresholds() {
    const now = Date.now();
    const timeWindow = 60 * 1000; // 1 minuto
    const recentTime = now - timeWindow;

    // Calcular taxa de erro
    const errorRate = this.metrics.totalRequests > 0
      ? this.metrics.errorRequests / this.metrics.totalRequests
      : 0;

    // Verificar alertas
    if (errorRate > this.config.alertThresholds.errorRate) {
      this.createAlert('HIGH', `Taxa de erro alta: ${(errorRate * 100).toFixed(1)}%`);
    }

    if (this.metrics.failedLogins > this.config.alertThresholds.failedLogins) {
      this.createAlert('HIGH', `Muitas tentativas de login falhadas: ${this.metrics.failedLogins}`);
    }

    if (this.metrics.suspiciousRequests > this.config.alertThresholds.suspiciousRequests) {
      this.createAlert('MEDIUM', `Muitas requisições suspeitas: ${this.metrics.suspiciousRequests}`);
    }
  }

  createAlert(level, message, data = {}) {
    const alert = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      id: Date.now()
    };

    this.alerts.push(alert);

    console.log(`🚨 ALERTA ${level}: ${message}`);

    // Salvar alerta em arquivo
    this.saveAlert(alert);

    // Em produção, enviar notificação (email, Slack, etc.)
    if (level === 'CRITICAL' || level === 'HIGH') {
      this.sendNotification(alert);
    }
  }

  saveAlert(alert) {
    const alertFile = path.join(process.cwd(), 'logs', 'alerts.json');
    let alerts = [];

    if (fs.existsSync(alertFile)) {
      try {
        alerts = JSON.parse(fs.readFileSync(alertFile, 'utf8'));
      } catch (e) {
        alerts = [];
      }
    }

    alerts.push(alert);

    // Manter apenas últimos 1000 alertas
    if (alerts.length > 1000) {
      alerts = alerts.slice(-1000);
    }

    fs.writeFileSync(alertFile, JSON.stringify(alerts, null, 2));
  }

  saveVulnerabilityReport(vulnerabilities) {
    const reportFile = path.join(process.cwd(), 'logs', 'vulnerabilities.json');
    const report = {
      timestamp: new Date().toISOString(),
      total: vulnerabilities.length,
      critical: vulnerabilities.filter(v => v.severity === 'critical').length,
      high: vulnerabilities.filter(v => v.severity === 'high').length,
      moderate: vulnerabilities.filter(v => v.severity === 'moderate').length,
      low: vulnerabilities.filter(v => v.severity === 'low').length,
      vulnerabilities
    };

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  }

  generateDailyReport() {
    const uptime = Date.now() - this.metrics.startTime;
    const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));

    const report = {
      date: new Date().toISOString().split('T')[0],
      uptime: `${uptimeHours} horas`,
      metrics: {
        totalRequests: this.metrics.totalRequests,
        errorRequests: this.metrics.errorRequests,
        errorRate: this.metrics.totalRequests > 0
          ? (this.metrics.errorRequests / this.metrics.totalRequests * 100).toFixed(2) + '%'
          : '0%',
        suspiciousRequests: this.metrics.suspiciousRequests,
        failedLogins: this.metrics.failedLogins,
        uploadAttempts: this.metrics.uploadAttempts
      },
      alerts: this.alerts.length,
      recommendations: this.generateRecommendations()
    };

    const reportFile = path.join(process.cwd(), 'logs', `security-report-${report.date}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`📊 Relatório diário gerado: ${reportFile}`);

    // Resetar métricas para o próximo dia
    this.resetMetrics();
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.metrics.errorRequests > this.metrics.totalRequests * 0.05) {
      recommendations.push('Investigar causa dos erros elevados');
    }

    if (this.metrics.failedLogins > 10) {
      recommendations.push('Implementar bloqueio de IP após tentativas falhadas');
    }

    if (this.metrics.suspiciousRequests > 5) {
      recommendations.push('Revisar logs de requisições suspeitas');
    }

    if (this.alerts.length > 20) {
      recommendations.push('Revisar configurações de alertas');
    }

    return recommendations;
  }

  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      errorRequests: 0,
      suspiciousRequests: 0,
      failedLogins: 0,
      uploadAttempts: 0,
      startTime: Date.now()
    };
    this.alerts = [];
  }

  sendNotification(alert) {
    // Em produção, implementar envio de notificações
    console.log(`📧 NOTIFICAÇÃO: ${alert.level} - ${alert.message}`);
  }

  // Método para parar o monitoramento
  stop() {
    console.log('🛑 Parando monitor de segurança...');
    process.exit(0);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const monitor = new SecurityMonitor();

  // Tratar sinais de parada
  process.on('SIGINT', () => {
    monitor.stop();
  });

  process.on('SIGTERM', () => {
    monitor.stop();
  });

  monitor.initialize().catch(console.error);
}

module.exports = SecurityMonitor;
