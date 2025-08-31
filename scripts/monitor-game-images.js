#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3001';
const LOG_DIR = './logs/game-images';
const LOG_FILE = path.join(LOG_DIR, `monitor-${new Date().toISOString().split('T')[0]}.log`);

// Configurações de monitoramento
const MONITOR_CONFIG = {
  healthCheckInterval: 30000, // 30 segundos
  performanceThreshold: 1000, // 1 segundo
  maxRetries: 3,
  alertOnFailure: true,
};

// Função para criar diretório de logs
function ensureLogDirectory() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

// Função para escrever log
function writeLog(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data,
  };

  const logLine = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  console.log(logLine);

  // Salvar no arquivo de log
  ensureLogDirectory();
  fs.appendFileSync(LOG_FILE, logLine + '\n');

  // Salvar dados estruturados se houver
  if (data) {
    const dataFile = LOG_FILE.replace('.log', '-data.json');
    const existingData = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8')) : [];
    existingData.push(logEntry);
    fs.writeFileSync(dataFile, JSON.stringify(existingData, null, 2));
  }
}

// Função para verificar saúde da API
async function checkHealth() {
  try {
    const startTime = Date.now();
    const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
    const responseTime = Date.now() - startTime;

    if (response.data.status === 'OK') {
      writeLog('info', `Health check OK - Response time: ${responseTime}ms`, {
        responseTime,
        uptime: response.data.uptime,
        totalGames: response.data.totalGames,
        version: response.data.version,
      });

      // Alertar se performance estiver abaixo do threshold
      if (responseTime > MONITOR_CONFIG.performanceThreshold) {
        writeLog('warn', `Performance warning - Response time: ${responseTime}ms`, {
          responseTime,
          threshold: MONITOR_CONFIG.performanceThreshold,
        });
      }

      return { success: true, responseTime, data: response.data };
    } else {
      writeLog('error', 'Health check failed - API status not OK', response.data);
      return { success: false, error: 'API status not OK' };
    }
  } catch (error) {
    writeLog('error', `Health check failed: ${error.message}`, {
      error: error.message,
      code: error.code,
    });
    return { success: false, error: error.message };
  }
}

// Função para verificar performance dos endpoints
async function checkEndpointPerformance() {
  const endpoints = [
    '/api/games-list',
    '/api/game-images?name=Fallout 4: Game of the Year Edition',
    '/api/game-images/search?query=witcher',
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${API_URL}${endpoint}`, { timeout: 10000 });
      const responseTime = Date.now() - startTime;

      results.push({
        endpoint,
        success: true,
        responseTime,
        statusCode: response.status,
      });

      writeLog('info', `Endpoint ${endpoint} - ${responseTime}ms`, {
        endpoint,
        responseTime,
        statusCode: response.status,
      });
    } catch (error) {
      results.push({
        endpoint,
        success: false,
        error: error.message,
      });

      writeLog('error', `Endpoint ${endpoint} failed: ${error.message}`, {
        endpoint,
        error: error.message,
      });
    }

    // Aguardar entre requisições
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

// Função para verificar uso de recursos
async function checkResourceUsage() {
  try {
    // Verificar tamanho dos logs
    let logSize = 0;
    if (fs.existsSync(LOG_DIR)) {
      const files = fs.readdirSync(LOG_DIR);
      for (const file of files) {
        const filePath = path.join(LOG_DIR, file);
        const stats = fs.statSync(filePath);
        logSize += stats.size;
      }
    }

    // Verificar espaço em disco (aproximado)
    const diskUsage = process.memoryUsage();

    const resourceData = {
      logSizeKB: (logSize / 1024).toFixed(2),
      memoryUsage: {
        rss: (diskUsage.rss / 1024 / 1024).toFixed(2),
        heapUsed: (diskUsage.heapUsed / 1024 / 1024).toFixed(2),
        heapTotal: (diskUsage.heapTotal / 1024 / 1024).toFixed(2),
      },
      uptime: process.uptime(),
    };

    writeLog('info', 'Resource usage check completed', resourceData);
    return resourceData;
  } catch (error) {
    writeLog('error', `Resource usage check failed: ${error.message}`);
    return null;
  }
}

// Função para gerar relatório de status
async function generateStatusReport() {
  try {
    writeLog('info', 'Generating status report...');

    const healthCheck = await checkHealth();
    const endpointPerformance = await checkEndpointPerformance();
    const resourceUsage = await checkResourceUsage();

    const report = {
      timestamp: new Date().toISOString(),
      health: healthCheck,
      endpoints: endpointPerformance,
      resources: resourceUsage,
      summary: {
        overallStatus: healthCheck.success ? 'HEALTHY' : 'UNHEALTHY',
        totalEndpoints: endpointPerformance.length,
        successfulEndpoints: endpointPerformance.filter(e => e.success).length,
        averageResponseTime:
          endpointPerformance.filter(e => e.success).reduce((sum, e) => sum + e.responseTime, 0) /
            endpointPerformance.filter(e => e.success).length || 0,
      },
    };

    // Salvar relatório
    const reportFile = path.join(LOG_DIR, `status-report-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    writeLog('info', 'Status report generated successfully', {
      reportFile,
      overallStatus: report.summary.overallStatus,
    });

    return report;
  } catch (error) {
    writeLog('error', `Status report generation failed: ${error.message}`);
    return null;
  }
}

// Função para monitoramento contínuo
async function startContinuousMonitoring() {
  writeLog('info', 'Starting continuous monitoring...');

  let consecutiveFailures = 0;

  const monitorInterval = setInterval(async () => {
    try {
      const healthCheck = await checkHealth();

      if (healthCheck.success) {
        consecutiveFailures = 0;

        // Verificar performance a cada 5 minutos
        if (Date.now() % 300000 < MONITOR_CONFIG.healthCheckInterval) {
          await checkEndpointPerformance();
        }

        // Verificar recursos a cada 10 minutos
        if (Date.now() % 600000 < MONITOR_CONFIG.healthCheckInterval) {
          await checkResourceUsage();
        }
      } else {
        consecutiveFailures++;
        writeLog('warn', `Consecutive failures: ${consecutiveFailures}/${MONITOR_CONFIG.maxRetries}`);

        if (consecutiveFailures >= MONITOR_CONFIG.maxRetries) {
          writeLog('error', 'Maximum consecutive failures reached. API may be down.');

          if (MONITOR_CONFIG.alertOnFailure) {
            // Aqui você implementaria alertas (email, Slack, etc.)
            writeLog('alert', 'ALERT: API is down or unresponsive!');
          }
        }
      }
    } catch (error) {
      writeLog('error', `Monitoring error: ${error.message}`);
      consecutiveFailures++;
    }
  }, MONITOR_CONFIG.healthCheckInterval);

  // Retornar função para parar o monitoramento
  return () => {
    clearInterval(monitorInterval);
    writeLog('info', 'Continuous monitoring stopped');
  };
}

// Função para mostrar estatísticas dos logs
function showLogStats() {
  try {
    console.log('📊 Estatísticas dos Logs:');

    if (!fs.existsSync(LOG_DIR)) {
      console.log('  Nenhum log encontrado');
      return;
    }

    const files = fs.readdirSync(LOG_DIR);
    const logFiles = files.filter(f => f.endsWith('.log'));
    const dataFiles = files.filter(f => f.endsWith('-data.json'));
    const reportFiles = files.filter(f => f.startsWith('status-report-'));

    console.log(`  📝 Arquivos de log: ${logFiles.length}`);
    console.log(`  📊 Arquivos de dados: ${dataFiles.length}`);
    console.log(`  📋 Relatórios: ${reportFiles.length}`);

    if (logFiles.length > 0) {
      const latestLog = logFiles.sort().reverse()[0];
      const logPath = path.join(LOG_DIR, latestLog);
      const stats = fs.statSync(logPath);
      const size = (stats.size / 1024).toFixed(1);
      console.log(`  📄 Último log: ${latestLog} (${size}KB)`);

      // Contar linhas do último log
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim()).length;
      console.log(`  📊 Total de entradas: ${lines}`);
    }
  } catch (error) {
    console.error('❌ Erro ao mostrar estatísticas dos logs:', error.message);
  }
}

// Função para limpar logs antigos
function cleanupOldLogs(daysToKeep = 7) {
  try {
    console.log(`🧹 Limpando logs mais antigos que ${daysToKeep} dias...`);

    if (!fs.existsSync(LOG_DIR)) {
      console.log('  Nenhum log para limpar');
      return;
    }

    const files = fs.readdirSync(LOG_DIR);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let deletedCount = 0;
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(LOG_DIR, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime < cutoffDate) {
        const size = stats.size;
        fs.unlinkSync(filePath);
        deletedCount++;
        totalSize += size;
        console.log(`  🗑️  Deletado: ${file}`);
      }
    }

    const totalSizeKB = (totalSize / 1024).toFixed(1);
    console.log(`✅ Limpeza concluída: ${deletedCount} arquivos deletados, ${totalSizeKB}KB liberados`);
  } catch (error) {
    console.error('❌ Erro na limpeza dos logs:', error.message);
  }
}

// Função para mostrar ajuda
function showHelp() {
  console.log(`
🎮 Monitor de API de Imagens de Jogos

📋 Comandos disponíveis:

  monitor                    - Iniciar monitoramento contínuo
  health                     - Verificar saúde da API
  performance                - Verificar performance dos endpoints
  resources                  - Verificar uso de recursos
  report                     - Gerar relatório de status
  logs                       - Mostrar estatísticas dos logs
  cleanup [dias]            - Limpar logs antigos (padrão: 7 dias)
  help                       - Mostrar esta ajuda

📝 Exemplos:
  node scripts/monitor-game-images.js monitor
  node scripts/monitor-game-images.js health
  node scripts/monitor-game-images.js cleanup 30
`);
}

// Função principal
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case 'monitor':
        writeLog('info', 'Starting monitoring...');
        const stopMonitoring = await startContinuousMonitoring();

        // Manter o processo rodando
        process.on('SIGINT', () => {
          console.log('\n🛑 Parando monitoramento...');
          stopMonitoring();
          process.exit(0);
        });
        break;

      case 'health':
        await checkHealth();
        break;

      case 'performance':
        await checkEndpointPerformance();
        break;

      case 'resources':
        await checkResourceUsage();
        break;

      case 'report':
        await generateStatusReport();
        break;

      case 'logs':
        showLogStats();
        break;

      case 'cleanup':
        const days = args[1] ? parseInt(args[1]) : 7;
        cleanupOldLogs(days);
        break;

      case 'help':
        showHelp();
        break;

      default:
        console.log(`❌ Comando desconhecido: ${command}`);
        showHelp();
        break;
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  checkHealth,
  checkEndpointPerformance,
  checkResourceUsage,
  generateStatusReport,
  startContinuousMonitoring,
  showLogStats,
  cleanupOldLogs,
};
