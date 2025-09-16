#!/usr/bin/env node

/**
 * Script para monitorar qualidade das buscas de imagens
 *
 * Funcionalidades:
 * - Testar busca em múltiplos jogos
 * - Avaliar qualidade das imagens encontradas
 * - Gerar relatório de performance
 * - Identificar jogos com problemas
 */

const axios = require('axios');

const API_BASE = 'http://localhost:1337/api';
const TEST_GAMES = [
  'Cyberpunk 2077',
  'The Witcher 3: Wild Hunt',
  'Baldur\'s Gate 3',
  'Fallout 4',
  'DOOM',
  'Batman: Arkham City',
  'Hollow Knight',
  'No Man\'s Sky',
  'Divinity: Original Sin 2',
  'Vampire: The Masquerade - Bloodlines'
];

class QualityMonitor {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async testGame(gameName) {
    try {
      console.log(`🎮 Testando: ${gameName}`);

      const startTime = Date.now();
      const response = await axios.get(`${API_BASE}/games/images/search-advanced?gameName=${encodeURIComponent(gameName)}`);
      const searchTime = Date.now() - startTime;

      const result = {
        gameName,
        searchTime,
        success: true,
        quality: response.data.searchQuality,
        images: response.data.images,
        timestamp: new Date().toISOString()
      };

      console.log(`  ✅ ${result.quality.score}/100 pontos - ${result.searchTime}ms`);
      return result;

    } catch (error) {
      console.log(`  ❌ Erro: ${error.message}`);
      return {
        gameName,
        searchTime: 0,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async testAllGames() {
    console.log('🚀 INICIANDO TESTE DE QUALIDADE 🎮');
    console.log('=====================================');
    console.log(`📊 Testando ${TEST_GAMES.length} jogos...\n`);

    for (const gameName of TEST_GAMES) {
      const result = await this.testGame(gameName);
      this.results.push(result);

      // Aguardar entre testes para não sobrecarregar
      await this.sleep(1000);
    }

    console.log('\n📈 ANÁLISE COMPLETA');
    console.log('===================');
    this.generateReport();
  }

  generateReport() {
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);

    if (successful.length === 0) {
      console.log('❌ Nenhum teste foi bem-sucedido!');
      return;
    }

    // Estatísticas de qualidade
    const qualityScores = successful.map(r => r.quality.score);
    const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
    const maxQuality = Math.max(...qualityScores);
    const minQuality = Math.min(...qualityScores);

    // Estatísticas de performance
    const searchTimes = successful.map(r => r.searchTime);
    const avgSearchTime = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
    const maxSearchTime = Math.max(...searchTimes);
    const minSearchTime = Math.min(...searchTimes);

    // Análise por fonte
    const sources = {};
    successful.forEach(result => {
      const source = result.images.source;
      if (!sources[source]) {
        sources[source] = { count: 0, totalQuality: 0, avgTime: 0 };
      }
      sources[source].count++;
      sources[source].totalQuality += result.quality.score;
      sources[source].avgTime += result.searchTime;
    });

    Object.keys(sources).forEach(source => {
      sources[source].avgQuality = sources[source].totalQuality / sources[source].count;
      sources[source].avgTime = sources[source].avgTime / sources[source].count;
    });

    console.log(`📊 RESULTADOS GERAIS:`);
    console.log(`   Total testado: ${this.results.length}`);
    console.log(`   Sucessos: ${successful.length} ✅`);
    console.log(`   Falhas: ${failed.length} ❌`);
    console.log(`   Taxa de sucesso: ${((successful.length / this.results.length) * 100).toFixed(1)}%`);

    console.log(`\n🎯 QUALIDADE DAS IMAGENS:`);
    console.log(`   Média: ${avgQuality.toFixed(1)}/100`);
    console.log(`   Melhor: ${maxQuality}/100`);
    console.log(`   Pior: ${minQuality}/100`);

    console.log(`\n⚡ PERFORMANCE:`);
    console.log(`   Tempo médio de busca: ${avgSearchTime.toFixed(0)}ms`);
    console.log(`   Mais rápido: ${minSearchTime}ms`);
    console.log(`   Mais lento: ${maxSearchTime}ms`);

    console.log(`\n🌐 ANÁLISE POR FONTE:`);
    Object.entries(sources).forEach(([source, stats]) => {
      console.log(`   ${source}:`);
      console.log(`     Jogos encontrados: ${stats.count}`);
      console.log(`     Qualidade média: ${stats.avgQuality.toFixed(1)}/100`);
      console.log(`     Tempo médio: ${stats.avgTime.toFixed(0)}ms`);
    });

    console.log(`\n🏆 TOP 3 MELHORES RESULTADOS:`);
    const topResults = successful
      .sort((a, b) => b.quality.score - a.quality.score)
      .slice(0, 3);

    topResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.gameName} - ${result.quality.score}/100 pontos`);
      console.log(`      Fonte: ${result.images.source}`);
      console.log(`      Tempo: ${result.searchTime}ms`);
    });

    if (failed.length > 0) {
      console.log(`\n⚠️ JOGOS COM PROBLEMAS:`);
      failed.forEach(result => {
        console.log(`   ❌ ${result.gameName}: ${result.error}`);
      });
    }

    console.log(`\n💡 RECOMENDAÇÕES:`);
    this.generateRecommendations(avgQuality, avgSearchTime, sources);

    console.log(`\n⏱️ Tempo total do teste: ${((Date.now() - this.startTime) / 1000).toFixed(1)}s`);
  }

  generateRecommendations(avgQuality, avgSearchTime, sources) {
    if (avgQuality < 60) {
      console.log(`   🔧 Qualidade baixa (${avgQuality.toFixed(1)}/100) - Configure mais APIs externas`);
    } else if (avgQuality < 80) {
      console.log(`   👍 Qualidade boa (${avgQuality.toFixed(1)}/100) - Considere ajustar prioridades das fontes`);
    } else {
      console.log(`   🎉 Qualidade excelente (${avgQuality.toFixed(1)}/100) - Sistema funcionando perfeitamente!`);
    }

    if (avgSearchTime > 2000) {
      console.log(`   🐌 Busca lenta (${avgSearchTime.toFixed(0)}ms) - Ative o sistema de cache`);
    } else if (avgSearchTime > 1000) {
      console.log(`   ⚡ Busca moderada (${avgSearchTime.toFixed(0)}ms) - Cache pode melhorar performance`);
    } else {
      console.log(`   🚀 Busca rápida (${avgSearchTime.toFixed(0)}ms) - Performance excelente!`);
    }

    const sourceCount = Object.keys(sources).length;
    if (sourceCount < 2) {
      console.log(`   📡 Poucas fontes (${sourceCount}) - Configure mais APIs para melhor cobertura`);
    } else if (sourceCount < 3) {
      console.log(`   📡 Fontes adequadas (${sourceCount}) - Considere adicionar mais uma API`);
    } else {
      console.log(`   📡 Muitas fontes (${sourceCount}) - Cobertura excelente!`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  try {
    const monitor = new QualityMonitor();
    await monitor.testAllGames();
  } catch (error) {
    console.log('❌ Erro durante o teste:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = QualityMonitor;
