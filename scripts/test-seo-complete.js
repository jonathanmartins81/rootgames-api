#!/usr/bin/env node

/**
 * Script de Teste SEO Completo para Root Games
 *
 * Funcionalidades testadas:
 * - Middleware SEO
 * - API de SEO
 * - Geração de arquivos estáticos
 * - Análise de performance
 * - Otimização de conteúdo
 * - Substituição "Won Games" → "Root Games"
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:1337/api';
const UPLOADS_DIR = path.join(process.cwd(), 'public/uploads');

class SEOTestSuite {
  constructor() {
    this.results = {
      tests: 0,
      passed: 0,
      failed: 0,
      details: []
    };
    this.startTime = Date.now();
  }

  async initialize() {
    console.log('🧪 TESTE SEO COMPLETO - ROOT GAMES 🎮');
    console.log('=========================================');
    console.log('Executando bateria completa de testes SEO...\n');

    // Verificar se o servidor está rodando
    await this.checkServerStatus();
  }

  async checkServerStatus() {
    try {
      const response = await axios.get(`${API_BASE}/games`);
      if (response.status === 200 && response.data && response.data.data) {
        console.log('✅ Servidor Strapi está rodando');
        this.logTest('Server Status', true, 'Servidor respondendo corretamente');
      }
    } catch (error) {
      console.log('❌ Servidor Strapi não está rodando');
      console.log('   Execute: yarn develop');
      process.exit(1);
    }
  }

  async runAllTests() {
    console.log('🚀 INICIANDO TESTES SEO...\n');

    // Teste 1: Configurações SEO
    await this.testSEOConfig();

    // Teste 2: Geração de arquivos estáticos
    await this.testStaticFiles();

    // Teste 3: API de metadados
    await this.testMetadataAPI();

    // Teste 4: Análise de performance
    await this.testPerformanceAnalysis();

    // Teste 5: Otimização de conteúdo
    await this.testContentOptimization();

    // Teste 6: Middleware SEO
    await this.testSEOMiddleware();

    // Teste 7: Substituição "Won Games" → "Root Games"
    await this.testWonToRootReplacement();

    // Teste 8: Validação de arquivos gerados
    await this.testGeneratedFiles();

    // Gerar relatório final
    this.generateFinalReport();
  }

  async testSEOConfig() {
    console.log('🔧 TESTE 1: Configurações SEO');
    console.log('==============================');

    try {
      // Obter configurações atuais
      const response = await axios.get(`${API_BASE}/seo/config`);

      if (response.data.success && response.data.data) {
        const config = response.data.data;

        // Verificar campos obrigatórios
        const requiredFields = ['site', 'social', 'analytics', 'seo'];
        const missingFields = requiredFields.filter(field => !config[field]);

        if (missingFields.length === 0) {
          this.logTest('SEO Config Structure', true, 'Estrutura de configuração válida');

          // Verificar configurações específicas
          if (config.site.name === 'Root Games') {
            this.logTest('Site Name', true, 'Nome do site configurado corretamente');
          } else {
            this.logTest('Site Name', false, `Nome esperado: "Root Games", obtido: "${config.site.name}"`);
          }

          if (config.site.url.includes('rootgames')) {
            this.logTest('Site URL', true, 'URL do site contém "rootgames"');
          } else {
            this.logTest('Site URL', false, 'URL do site não contém "rootgames"');
          }

        } else {
          this.logTest('SEO Config Structure', false, `Campos faltantes: ${missingFields.join(', ')}`);
        }

      } else {
        this.logTest('SEO Config API', false, 'API não retornou dados válidos');
      }

    } catch (error) {
      this.logTest('SEO Config API', false, `Erro na API: ${error.message}`);
    }
  }

  async testStaticFiles() {
    console.log('\n📁 TESTE 2: Arquivos Estáticos SEO');
    console.log('===================================');

    try {
      // Testar geração de sitemap
      const sitemapResponse = await axios.get(`${API_BASE}/seo/sitemap`);
      if (sitemapResponse.status === 200 && sitemapResponse.data.includes('<?xml')) {
        this.logTest('Sitemap Generation', true, 'Sitemap XML gerado corretamente');
      } else {
        this.logTest('Sitemap Generation', false, 'Sitemap não foi gerado corretamente');
      }

      // Testar geração de robots.txt
      const robotsResponse = await axios.get(`${API_BASE}/seo/robots`);
      if (robotsResponse.status === 200 && robotsResponse.data.includes('User-agent')) {
        this.logTest('Robots.txt Generation', true, 'Robots.txt gerado corretamente');
      } else {
        this.logTest('Robots.txt Generation', false, 'Robots.txt não foi gerado corretamente');
      }

      // Testar geração de manifest.json
      const manifestResponse = await axios.get(`${API_BASE}/seo/manifest`);
      if (manifestResponse.status === 200 && manifestResponse.data.name === 'Root Games') {
        this.logTest('Manifest Generation', true, 'Manifest.json gerado corretamente');
      } else {
        this.logTest('Manifest Generation', false, 'Manifest.json não foi gerado corretamente');
      }

    } catch (error) {
      this.logTest('Static Files Generation', false, `Erro na geração: ${error.message}`);
    }
  }

  async testMetadataAPI() {
    console.log('\n🏷️ TESTE 3: API de Metadados');
    console.log('==============================');

    try {
      // Testar geração de metadados para página de jogo
      const gameMetadataResponse = await axios.get(`${API_BASE}/seo/metadata`, {
        params: {
          type: 'game',
          title: 'Cyberpunk 2077',
          description: 'Um RPG de mundo aberto',
          keywords: 'rpg,cyberpunk,open world',
          url: '/games/cyberpunk-2077'
        }
      });

      if (gameMetadataResponse.data.success && gameMetadataResponse.data.data) {
        const metadata = gameMetadataResponse.data.data;

        // Verificar meta tags básicas
        if (metadata.title && metadata.title.includes('Cyberpunk 2077')) {
          this.logTest('Game Title Metadata', true, 'Título do jogo incluído corretamente');
        } else {
          this.logTest('Game Title Metadata', false, 'Título do jogo não foi incluído');
        }

        if (metadata.description && metadata.description.includes('RPG de mundo aberto')) {
          this.logTest('Game Description Metadata', true, 'Descrição do jogo incluída corretamente');
        } else {
          this.logTest('Game Description Metadata', false, 'Descrição do jogo não foi incluída');
        }

        // Verificar Open Graph tags
        if (metadata['og:title'] && metadata['og:type'] === 'website') {
          this.logTest('Open Graph Tags', true, 'Tags Open Graph geradas corretamente');
        } else {
          this.logTest('Open Graph Tags', false, 'Tags Open Graph não foram geradas');
        }

        // Verificar Twitter Card tags
        if (metadata['twitter:card'] && metadata['twitter:title']) {
          this.logTest('Twitter Card Tags', true, 'Tags Twitter Card geradas corretamente');
        } else {
          this.logTest('Twitter Card Tags', false, 'Tags Twitter Card não foram geradas');
        }

        // Verificar Schema.org markup
        if (metadata.schema && metadata.schema['@type'] === 'VideoGame') {
          this.logTest('Schema.org Markup', true, 'Schema.org markup gerado corretamente');
        } else {
          this.logTest('Schema.org Markup', false, 'Schema.org markup não foi gerado');
        }

      } else {
        this.logTest('Metadata API Response', false, 'API não retornou metadados válidos');
      }

    } catch (error) {
      this.logTest('Metadata API', false, `Erro na API: ${error.message}`);
    }
  }

  async testPerformanceAnalysis() {
    console.log('\n📊 TESTE 4: Análise de Performance SEO');
    console.log('=========================================');

    try {
      // Testar análise de URL
      const analysisResponse = await axios.get(`${API_BASE}/seo/analyze`, {
        params: {
          url: '/games/cyberpunk-2077'
        }
      });

      if (analysisResponse.data.success && analysisResponse.data.data) {
        const analysis = analysisResponse.data.data;

        if (analysis.performance && analysis.performance.percentage !== undefined) {
          this.logTest('Performance Analysis', true, `Performance: ${analysis.performance.percentage}%`);

          // Verificar se há recomendações
          if (analysis.recommendations && analysis.recommendations.length > 0) {
            this.logTest('SEO Recommendations', true, `${analysis.recommendations.length} recomendações geradas`);
          } else {
            this.logTest('SEO Recommendations', false, 'Nenhuma recomendação foi gerada');
          }

        } else {
          this.logTest('Performance Analysis', false, 'Análise de performance não foi gerada');
        }

      } else {
        this.logTest('Performance Analysis API', false, 'API não retornou análise válida');
      }

    } catch (error) {
      this.logTest('Performance Analysis', false, `Erro na análise: ${error.message}`);
    }
  }

  async testContentOptimization() {
    console.log('\n🔍 TESTE 5: Otimização de Conteúdo');
    console.log('=====================================');

    try {
      // Testar otimização de conteúdo
      const optimizationResponse = await axios.post(`${API_BASE}/seo/optimize`, {
        content: 'Este é um jogo da Won Games que você pode comprar na Won Games Store',
        type: 'text'
      });

      if (optimizationResponse.data.success && optimizationResponse.data.data) {
        const result = optimizationResponse.data.data;

        if (result.optimized.includes('Root Games') && !result.optimized.includes('Won Games')) {
          this.logTest('Content Optimization', true, 'Conteúdo otimizado corretamente');

          if (result.changes.wonToRoot > 0) {
            this.logTest('Won to Root Replacement', true, `${result.changes.wonToRoot} substituições realizadas`);
          } else {
            this.logTest('Won to Root Replacement', false, 'Nenhuma substituição foi realizada');
          }

        } else {
          this.logTest('Content Optimization', false, 'Conteúdo não foi otimizado corretamente');
        }

      } else {
        this.logTest('Content Optimization API', false, 'API não retornou resultado válido');
      }

    } catch (error) {
      this.logTest('Content Optimization', false, `Erro na otimização: ${error.message}`);
    }
  }

  async testSEOMiddleware() {
    console.log('\n⚙️ TESTE 6: Middleware SEO');
    console.log('============================');

    try {
      // Testar se o middleware está aplicando metadados
      const gamesResponse = await axios.get(`${API_BASE}/games`);

      if (gamesResponse.data && gamesResponse.data._seo) {
        this.logTest('SEO Middleware Injection', true, 'Metadados SEO injetados na resposta');

        const seoData = gamesResponse.data._seo;

        if (seoData.title && seoData.description) {
          this.logTest('SEO Metadata Fields', true, 'Campos de metadados presentes');
        } else {
          this.logTest('SEO Metadata Fields', false, 'Campos de metadados ausentes');
        }

      } else {
        this.logTest('SEO Middleware Injection', false, 'Metadados SEO não foram injetados');
      }

    } catch (error) {
      this.logTest('SEO Middleware', false, `Erro no middleware: ${error.message}`);
    }
  }

  async testWonToRootReplacement() {
    console.log('\n🔄 TESTE 7: Substituição Won → Root');
    console.log('=====================================');

    try {
      // Testar diferentes variações de "Won Games"
      const testCases = [
        'Won Games',
        'won games',
        'WON GAMES',
        'WonGames',
        'won-games'
      ];

      let allPassed = true;
      let totalReplacements = 0;

      for (const testCase of testCases) {
        const response = await axios.post(`${API_BASE}/seo/optimize`, {
          content: `Este é um teste com ${testCase}`,
          type: 'text'
        });

        if (response.data.success) {
          const result = response.data.data;
          if (result.optimized.includes('Root Games') && !result.optimized.includes(testCase)) {
            totalReplacements += result.changes.wonToRoot;
          } else {
            allPassed = false;
          }
        } else {
          allPassed = false;
        }
      }

      if (allPassed) {
        this.logTest('Won to Root Replacement (All Cases)', true, `${totalReplacements} substituições realizadas`);
      } else {
        this.logTest('Won to Root Replacement (All Cases)', false, 'Algumas substituições falharam');
      }

    } catch (error) {
      this.logTest('Won to Root Replacement', false, `Erro na substituição: ${error.message}`);
    }
  }

  async testGeneratedFiles() {
    console.log('\n📄 TESTE 8: Validação de Arquivos Gerados');
    console.log('===========================================');

    try {
      // Verificar se os arquivos foram criados
      const filesToCheck = [
        'public/sitemap.xml',
        'public/robots.txt',
        'public/manifest.json'
      ];

      let filesCreated = 0;

      for (const file of filesToCheck) {
        if (fs.existsSync(file)) {
          const stats = fs.statSync(file);
          if (stats.size > 0) {
            filesCreated++;
            this.logTest(`File: ${path.basename(file)}`, true, `Arquivo criado (${stats.size} bytes)`);
          } else {
            this.logTest(`File: ${path.basename(file)}`, false, 'Arquivo vazio');
          }
        } else {
          this.logTest(`File: ${path.basename(file)}`, false, 'Arquivo não encontrado');
        }
      }

      if (filesCreated === filesToCheck.length) {
        this.logTest('All SEO Files Created', true, 'Todos os arquivos SEO foram criados');
      } else {
        this.logTest('All SEO Files Created', false, `${filesCreated}/${filesToCheck.length} arquivos criados`);
      }

    } catch (error) {
      this.logTest('File Validation', false, `Erro na validação: ${error.message}`);
    }
  }

  logTest(testName, passed, message) {
    this.results.tests++;

    if (passed) {
      this.results.passed++;
      console.log(`   ✅ ${testName}: ${message}`);
    } else {
      this.results.failed++;
      console.log(`   ❌ ${testName}: ${message}`);
    }

    this.results.details.push({
      name: testName,
      passed,
      message
    });
  }

  generateFinalReport() {
    const totalTime = (Date.now() - this.startTime) / 1000;
    const successRate = ((this.results.passed / this.results.tests) * 100).toFixed(1);

    console.log('\n📊 RELATÓRIO FINAL DOS TESTES SEO');
    console.log('====================================');
    console.log(`⏱️ Tempo total: ${totalTime.toFixed(1)} segundos`);
    console.log(`🧪 Total de testes: ${this.results.tests}`);
    console.log(`✅ Testes aprovados: ${this.results.passed}`);
    console.log(`❌ Testes falharam: ${this.results.failed}`);
    console.log(`📈 Taxa de sucesso: ${successRate}%`);

    if (successRate >= 90) {
      console.log('\n🏆 EXCELENTE! Sistema SEO funcionando perfeitamente!');
    } else if (successRate >= 70) {
      console.log('\n👍 BOM! Sistema SEO funcionando bem, com algumas melhorias necessárias');
    } else {
      console.log('\n⚠️ ATENÇÃO! Sistema SEO precisa de correções');
    }

    // Detalhes dos testes que falharam
    if (this.results.failed > 0) {
      console.log('\n🔍 DETALHES DOS TESTES QUE FALHARAM:');
      this.results.details
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`   ❌ ${test.name}: ${test.message}`);
        });
    }

    // Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    if (this.results.failed === 0) {
      console.log('   🎉 Todos os testes passaram! Sistema SEO está funcionando perfeitamente');
      console.log('   🚀 Considere implementar testes automatizados para CI/CD');
    } else {
      console.log('   🔧 Corrija os testes que falharam antes de prosseguir');
      console.log('   📚 Revise a documentação das funcionalidades que falharam');
      console.log('   🧪 Execute os testes novamente após as correções');
    }

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Implementar testes automatizados');
    console.log('   2. Configurar monitoramento contínuo de SEO');
    console.log('   3. Implementar cache para otimizar performance');
    console.log('   4. Adicionar mais casos de teste');
  }
}

async function main() {
  try {
    const testSuite = new SEOTestSuite();
    await testSuite.initialize();
    await testSuite.runAllTests();
  } catch (error) {
    console.log('❌ Erro na execução dos testes:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SEOTestSuite;
