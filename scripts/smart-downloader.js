#!/usr/bin/env node

/**
 * Script inteligente de download de imagens para RootGames API
 *
 * Funcionalidades:
 * - Download inteligente com priorização
 * - Retry automático para falhas
 * - Otimização de performance
 * - Monitoramento em tempo real
 * - Relatórios detalhados
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:1337/api';
const UPLOADS_DIR = path.join(process.cwd(), 'public/uploads');

class SmartImageDownloader {
  constructor() {
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      retries: 0,
      startTime: Date.now()
    };
    this.retryQueue = [];
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 segundos
    this.concurrentDownloads = 3;
    this.activeDownloads = 0;
  }

  async initialize() {
    console.log('🧠 DOWNLOAD INTELIGENTE DE IMAGENS ROOTGAMES 🎮');
    console.log('=================================================');

    this.ensureUploadsDir();
    await this.loadGameList();

    console.log(`📊 Total de jogos para processar: ${this.stats.total}`);
    console.log(`⚡ Downloads simultâneos: ${this.concurrentDownloads}`);
    console.log(`🔄 Máximo de tentativas: ${this.maxRetries}`);
  }

  ensureUploadsDir() {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  async loadGameList() {
    try {
      const response = await axios.get(`${API_BASE}/games`);
      this.games = response.data.data;
      this.stats.total = this.games.length;
    } catch (error) {
      console.log('❌ Erro ao carregar lista de jogos:', error.message);
      throw error;
    }
  }

  async startSmartDownload() {
    console.log('\n🚀 INICIANDO DOWNLOAD INTELIGENTE...');
    console.log('=====================================');

    // Filtrar jogos que precisam de imagens
    const gamesNeedingImages = this.games.filter(game => !game.cover);

    if (gamesNeedingImages.length === 0) {
      console.log('✅ Todos os jogos já têm imagens!');
      return;
    }

    console.log(`📸 Jogos que precisam de imagens: ${gamesNeedingImages.length}`);

    // Priorizar jogos por popularidade (simulado)
    const prioritizedGames = this.prioritizeGames(gamesNeedingImages);

    // Iniciar downloads em lotes
    await this.processBatch(prioritizedGames);

    // Processar fila de retry
    await this.processRetryQueue();

    // Gerar relatório final
    this.generateFinalReport();
  }

  prioritizeGames(games) {
    // Priorizar por nome (jogos conhecidos primeiro)
    const knownGames = [
      'Cyberpunk 2077', 'The Witcher 3', 'Baldur\'s Gate 3',
      'Fallout 4', 'DOOM', 'Batman', 'Hollow Knight'
    ];

    return games.sort((a, b) => {
      const aName = a.name || '';
      const bName = b.name || '';

      const aPriority = knownGames.some(known =>
        aName.toLowerCase().includes(known.toLowerCase())
      ) ? 1 : 0;

      const bPriority = knownGames.some(known =>
        bName.toLowerCase().includes(known.toLowerCase())
      ) ? 1 : 0;

      return bPriority - aPriority;
    });
  }

  async processBatch(games) {
    const batches = this.createBatches(games, this.concurrentDownloads);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\n📦 Processando lote ${i + 1}/${batches.length} (${batch.length} jogos)`);

      const promises = batch.map(game => this.downloadGameImage(game));
      await Promise.allSettled(promises);

      // Aguardar entre lotes para não sobrecarregar
      if (i < batches.length - 1) {
        console.log('⏳ Aguardando 2 segundos entre lotes...');
        await this.sleep(2000);
      }
    }
  }

  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  async downloadGameImage(game) {
    try {
      this.activeDownloads++;

      console.log(`🎮 Processando: ${game.name || `Jogo ID ${game.id}`}`);

      const response = await axios.post(
        `${API_BASE}/games/${game.id}/images/download`,
        {},
        { timeout: 30000 } // 30 segundos timeout
      );

      if (response.data.cover) {
        this.stats.success++;
        console.log(`   ✅ Sucesso: ${response.data.cover.name}`);
      } else {
        this.stats.failed++;
        console.log(`   ❌ Falha: Nenhuma imagem retornada`);
        this.addToRetryQueue(game);
      }

    } catch (error) {
      this.stats.failed++;
      console.log(`   ❌ Erro: ${error.message}`);

      if (error.response?.status === 429) {
        // Rate limit - aguardar mais tempo
        console.log(`   ⏳ Rate limit detectado, aguardando 10 segundos...`);
        await this.sleep(10000);
      } else {
        this.addToRetryQueue(game);
      }
    } finally {
      this.activeDownloads--;
    }
  }

  addToRetryQueue(game) {
    if (!this.retryQueue.find(item => item.game.id === game.id)) {
      this.retryQueue.push({
        game,
        attempts: 0,
        lastAttempt: Date.now()
      });
    }
  }

  async processRetryQueue() {
    if (this.retryQueue.length === 0) {
      console.log('\n✅ Nenhum item na fila de retry!');
      return;
    }

    console.log(`\n🔄 PROCESSANDO FILA DE RETRY (${this.retryQueue.length} itens)`);
    console.log('==================================================');

    let processed = 0;

    while (this.retryQueue.length > 0 && processed < this.retryQueue.length * 2) {
      const item = this.retryQueue.shift();

      if (item.attempts >= this.maxRetries) {
        console.log(`   ❌ Jogo ${item.game.name || `ID ${item.game.id}`} excedeu tentativas máximas`);
        continue;
      }

      // Aguardar antes de tentar novamente
      const timeSinceLastAttempt = Date.now() - item.lastAttempt;
      if (timeSinceLastAttempt < this.retryDelay) {
        await this.sleep(this.retryDelay - timeSinceLastAttempt);
      }

      item.attempts++;
      item.lastAttempt = Date.now();
      this.stats.retries++;

      console.log(`   🔄 Tentativa ${item.attempts}/${this.maxRetries}: ${item.game.name || `Jogo ID ${item.game.id}`}`);

      try {
        const response = await axios.post(
          `${API_BASE}/games/${item.game.id}/images/download`,
          {},
          { timeout: 30000 }
        );

        if (response.data.cover) {
          this.stats.success++;
          this.stats.failed--; // Corrigir contador
          console.log(`      ✅ Sucesso na tentativa ${item.attempts}!`);
        } else {
          console.log(`      ❌ Falha na tentativa ${item.attempts}`);
          this.retryQueue.push(item);
        }

      } catch (error) {
        console.log(`      ❌ Erro na tentativa ${item.attempts}: ${error.message}`);
        this.retryQueue.push(item);
      }

      processed++;

      // Aguardar entre tentativas
      await this.sleep(1000);
    }

    if (this.retryQueue.length > 0) {
      console.log(`⚠️ ${this.retryQueue.length} itens ainda na fila de retry após processamento`);
    }
  }

  generateFinalReport() {
    const totalTime = (Date.now() - this.stats.startTime) / 1000;
    const successRate = ((this.stats.success / this.stats.total) * 100).toFixed(1);

    console.log('\n📊 RELATÓRIO FINAL DO DOWNLOAD INTELIGENTE');
    console.log('===========================================');
    console.log(`⏱️ Tempo total: ${totalTime.toFixed(1)} segundos`);
    console.log(`📊 Total processado: ${this.stats.total}`);
    console.log(`✅ Sucessos: ${this.stats.success}`);
    console.log(`❌ Falhas: ${this.stats.failed}`);
    console.log(`🔄 Tentativas extras: ${this.stats.retries}`);
    console.log(`📈 Taxa de sucesso: ${successRate}%`);

    if (successRate >= 90) {
      console.log('🏆 Excelente performance!');
    } else if (successRate >= 70) {
      console.log('👍 Boa performance!');
    } else {
      console.log('⚠️ Performance pode ser melhorada');
    }

    // Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    if (this.stats.failed > 0) {
      console.log('   🔧 Verifique jogos com falha e execute download individual');
    }
    if (this.stats.retries > this.stats.total * 0.3) {
      console.log('   ⚡ Muitas tentativas - considere aumentar delay entre downloads');
    }
    if (successRate < 80) {
      console.log('   🌐 Verifique conectividade com APIs externas');
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  try {
    const downloader = new SmartImageDownloader();
    await downloader.initialize();
    await downloader.startSmartDownload();
  } catch (error) {
    console.log('❌ Erro no download inteligente:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SmartImageDownloader;
