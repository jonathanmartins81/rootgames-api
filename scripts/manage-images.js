#!/usr/bin/env node

/**
 * Script completo de gerenciamento de imagens para RootGames API
 *
 * Funcionalidades:
 * - Download em massa de imagens
 * - Organização de arquivos
 * - Limpeza de duplicatas
 * - Associação automática aos jogos
 * - Relatórios de status
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const API_BASE = 'http://localhost:1337/api';
const UPLOADS_DIR = path.join(process.cwd(), 'public/uploads');

class ImageManager {
  constructor() {
    this.stats = {
      totalGames: 0,
      gamesWithImages: 0,
      totalImages: 0,
      duplicateImages: 0,
      orphanedImages: 0
    };
  }

  async initialize() {
    console.log('🚀 INICIANDO GERENCIADOR DE IMAGENS ROOTGAMES 🎮');
    console.log('==================================================');

    this.ensureUploadsDir();
    await this.loadStats();

    console.log('\n📊 ESTATÍSTICAS ATUAIS:');
    console.log(`   🎮 Total de jogos: ${this.stats.totalGames}`);
    console.log(`   📸 Jogos com imagens: ${this.stats.gamesWithImages}`);
    console.log(`   🖼️ Total de imagens: ${this.stats.totalImages}`);
    console.log(`   🔄 Duplicatas: ${this.stats.duplicateImages}`);
    console.log(`   🗑️ Imagens órfãs: ${this.stats.orphanedImages}`);
  }

  ensureUploadsDir() {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      console.log('📁 Pasta de uploads criada');
    }
  }

  async loadStats() {
    try {
      // Estatísticas dos jogos
      const gamesResponse = await axios.get(`${API_BASE}/games`);
      this.stats.totalGames = gamesResponse.data.data.length;

      this.stats.gamesWithImages = gamesResponse.data.data.filter(
        game => game.cover !== null
      ).length;

      // Estatísticas das imagens
      const imageFiles = fs.readdirSync(UPLOADS_DIR);
      this.stats.totalImages = imageFiles.length;

      // Contar duplicatas
      this.stats.duplicateImages = this.countDuplicates(imageFiles);

      // Contar imagens órfãs
      this.stats.orphanedImages = this.countOrphanedImages(imageFiles);

    } catch (error) {
      console.log('❌ Erro ao carregar estatísticas:', error.message);
    }
  }

  countDuplicates(files) {
    const fileCounts = {};
    let duplicates = 0;

    files.forEach(file => {
      const baseName = this.getBaseFileName(file);
      fileCounts[baseName] = (fileCounts[baseName] || 0) + 1;
    });

    Object.values(fileCounts).forEach(count => {
      if (count > 1) duplicates += count - 1;
    });

    return duplicates;
  }

  countOrphanedImages(files) {
    // Imagens que não estão associadas a jogos
    const coverFiles = files.filter(file =>
      file.includes('cover_real') && !file.includes('_')
    );
    return coverFiles.length;
  }

  getBaseFileName(filename) {
    // Remove extensões e hashes para identificar duplicatas
    return filename
      .replace(/_\w{8,}\./g, '.') // Remove hashes
      .replace(/\.(png|jpg|jpeg|gif|webp)$/i, ''); // Remove extensões
  }

  async showMainMenu() {
    while (true) {
      console.log('\n🎯 MENU PRINCIPAL:');
      console.log('==================');
      console.log('1. 📥 Download em massa de imagens');
      console.log('2. 🗂️ Organizar arquivos de imagens');
      console.log('3. 🧹 Limpar duplicatas');
      console.log('4. 🔗 Associar imagens aos jogos');
      console.log('5. 📊 Relatório completo');
      console.log('6. 🎮 Testar busca de imagens');
      console.log('7. 🗑️ Limpar imagens órfãs');
      console.log('0. ❌ Sair');

      const choice = await question('\n🔑 Escolha uma opção: ');

      switch (choice) {
        case '1':
          await this.downloadAllImages();
          break;
        case '2':
          await this.organizeImages();
          break;
        case '3':
          await this.cleanDuplicates();
          break;
        case '4':
          await this.associateImages();
          break;
        case '5':
          await this.generateReport();
          break;
        case '6':
          await this.testImageSearch();
          break;
        case '7':
          await this.cleanOrphanedImages();
          break;
        case '0':
          console.log('👋 Até logo!');
          rl.close();
          return;
        default:
          console.log('❌ Opção inválida!');
      }

      await this.loadStats(); // Recarregar estatísticas
    }
  }

  async downloadAllImages() {
    console.log('\n📥 INICIANDO DOWNLOAD EM MASSA DE IMAGENS');
    console.log('==========================================');

    try {
      const response = await axios.post(`${API_BASE}/games/images/download-all`);
      console.log('✅ Download em massa concluído!');
      console.log(`📊 Processados: ${response.data.processed} jogos`);
      console.log(`⏱️ Tempo: ${response.data.timestamp}`);

      // Mostrar alguns resultados
      if (response.data.results && response.data.results.length > 0) {
        console.log('\n🏆 TOP 5 RESULTADOS:');
        response.data.results.slice(0, 5).forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.game}: ${result.status}`);
        });
      }

    } catch (error) {
      console.log('❌ Erro no download em massa:', error.message);
    }
  }

  async organizeImages() {
    console.log('\n🗂️ ORGANIZANDO ARQUIVOS DE IMAGENS');
    console.log('====================================');

    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      const organized = {
        covers: [],
        galleries: [],
        others: []
      };

      files.forEach(file => {
        if (file.includes('cover')) {
          organized.covers.push(file);
        } else if (file.includes('gallery')) {
          organized.galleries.push(file);
        } else {
          organized.others.push(file);
        }
      });

      console.log('📊 Organização concluída:');
      console.log(`   🖼️ Covers: ${organized.covers.length}`);
      console.log(`   🎨 Galerias: ${organized.galleries.length}`);
      console.log(`   📁 Outros: ${organized.others.length}`);

      // Criar subpastas organizadas
      const subdirs = ['covers', 'galleries', 'others'];
      subdirs.forEach(dir => {
        const dirPath = path.join(UPLOADS_DIR, dir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath);
        }
      });

      console.log('✅ Subpastas criadas para organização');

    } catch (error) {
      console.log('❌ Erro na organização:', error.message);
    }
  }

  async cleanDuplicates() {
    console.log('\n🧹 LIMPANDO DUPLICATAS');
    console.log('======================');

    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      const fileGroups = {};
      let removedCount = 0;

      // Agrupar arquivos similares
      files.forEach(file => {
        const baseName = this.getBaseFileName(file);
        if (!fileGroups[baseName]) {
          fileGroups[baseName] = [];
        }
        fileGroups[baseName].push(file);
      });

      // Remover duplicatas (manter o mais recente)
      Object.entries(fileGroups).forEach(([baseName, fileList]) => {
        if (fileList.length > 1) {
          // Ordenar por data de modificação
          fileList.sort((a, b) => {
            const statA = fs.statSync(path.join(UPLOADS_DIR, a));
            const statB = fs.statSync(path.join(UPLOADS_DIR, b));
            return statB.mtime.getTime() - statA.mtime.getTime();
          });

          // Manter o primeiro (mais recente) e remover os outros
          for (let i = 1; i < fileList.length; i++) {
            const filePath = path.join(UPLOADS_DIR, fileList[i]);
            fs.unlinkSync(filePath);
            removedCount++;
            console.log(`   🗑️ Removido: ${fileList[i]}`);
          }
        }
      });

      console.log(`✅ Limpeza concluída! ${removedCount} duplicatas removidas`);

    } catch (error) {
      console.log('❌ Erro na limpeza:', error.message);
    }
  }

  async associateImages() {
    console.log('\n🔗 ASSOCIANDO IMAGENS AOS JOGOS');
    console.log('=================================');

    try {
      // Buscar jogos sem imagens
      const gamesResponse = await axios.get(`${API_BASE}/games`);
      const gamesWithoutImages = gamesResponse.data.data.filter(
        game => !game.cover
      );

      if (gamesWithoutImages.length === 0) {
        console.log('✅ Todos os jogos já têm imagens!');
        return;
      }

      console.log(`📊 Jogos sem imagens: ${gamesWithoutImages.length}`);

      // Tentar associar imagens automaticamente
      for (const game of gamesWithoutImages.slice(0, 5)) { // Limitar a 5 para teste
        try {
          console.log(`🎮 Processando: ${game.name || `Jogo ID ${game.id}`}`);

          const response = await axios.post(
            `${API_BASE}/games/${game.id}/images/download`
          );

          if (response.data.cover) {
            console.log(`   ✅ Imagem associada: ${response.data.cover.name}`);
          } else {
            console.log(`   ❌ Falha na associação`);
          }

          // Aguardar entre requisições
          await this.sleep(1000);

        } catch (error) {
          console.log(`   ❌ Erro: ${error.message}`);
        }
      }

      console.log('✅ Associação concluída!');

    } catch (error) {
      console.log('❌ Erro na associação:', error.message);
    }
  }

  async generateReport() {
    console.log('\n📊 RELATÓRIO COMPLETO DO SISTEMA');
    console.log('==================================');

    await this.loadStats();

    console.log('\n🎮 ESTATÍSTICAS DOS JOGOS:');
    console.log(`   Total: ${this.stats.totalGames}`);
    console.log(`   Com imagens: ${this.stats.gamesWithImages}`);
    console.log(`   Sem imagens: ${this.stats.totalGames - this.stats.gamesWithImages}`);
    console.log(`   Taxa de cobertura: ${((this.stats.gamesWithImages / this.stats.totalGames) * 100).toFixed(1)}%`);

    console.log('\n🖼️ ESTATÍSTICAS DAS IMAGENS:');
    console.log(`   Total de arquivos: ${this.stats.totalImages}`);
    console.log(`   Duplicatas: ${this.stats.duplicateImages}`);
    console.log(`   Imagens órfãs: ${this.stats.orphanedImages}`);
    console.log(`   Eficiência: ${(((this.stats.totalImages - this.stats.duplicateImages - this.stats.orphanedImages) / this.stats.totalImages) * 100).toFixed(1)}%`);

    console.log('\n💾 USO DE DISCO:');
    const diskUsage = this.calculateDiskUsage();
    console.log(`   Tamanho total: ${(diskUsage.total / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`   Tamanho útil: ${(diskUsage.useful / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`   Espaço desperdiçado: ${(diskUsage.wasted / (1024 * 1024)).toFixed(2)} MB`);

    console.log('\n🎯 RECOMENDAÇÕES:');
    this.generateRecommendations();
  }

  calculateDiskUsage() {
    const files = fs.readdirSync(UPLOADS_DIR);
    let total = 0;
    let useful = 0;

    files.forEach(file => {
      const filePath = path.join(UPLOADS_DIR, file);
      const stats = fs.statSync(filePath);
      total += stats.size;

      // Considerar útil se não for duplicata ou órfã
      if (!this.isDuplicate(file) && !this.isOrphaned(file)) {
        useful += stats.size;
      }
    });

    return {
      total,
      useful,
      wasted: total - useful
    };
  }

  isDuplicate(filename) {
    const baseName = this.getBaseFileName(filename);
    const files = fs.readdirSync(UPLOADS_DIR);
    const similarFiles = files.filter(f => this.getBaseFileName(f) === baseName);
    return similarFiles.length > 1;
  }

  isOrphaned(filename) {
    return filename.includes('cover_real') && !filename.includes('_');
  }

  generateRecommendations() {
    if (this.stats.gamesWithImages < this.stats.totalGames * 0.8) {
      console.log('   🔧 Baixa cobertura de imagens - Execute download em massa');
    }

    if (this.stats.duplicateImages > this.stats.totalImages * 0.1) {
      console.log('   🧹 Muitas duplicatas - Execute limpeza');
    }

    if (this.stats.orphanedImages > 0) {
      console.log('   🔗 Imagens órfãs encontradas - Execute associação');
    }

    if (this.stats.totalImages > 1000) {
      console.log('   💾 Muitas imagens - Considere organização em subpastas');
    }
  }

  async testImageSearch() {
    console.log('\n🎮 TESTANDO BUSCA DE IMAGENS');
    console.log('=============================');

    const testGames = [
      'Cyberpunk 2077',
      'The Witcher 3: Wild Hunt',
      'Baldur\'s Gate 3',
      'Fallout 4',
      'DOOM'
    ];

    for (const gameName of testGames) {
      try {
        console.log(`🔍 Testando: ${gameName}`);

        const response = await axios.get(
          `${API_BASE}/games/images/search?gameName=${encodeURIComponent(gameName)}`
        );

        if (response.data.images && response.data.images.cover) {
          console.log(`   ✅ Encontrado: ${response.data.images.source}`);
        } else {
          console.log(`   ❌ Nenhuma imagem encontrada`);
        }

        await this.sleep(500); // Aguardar entre testes

      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
      }
    }

    console.log('✅ Teste de busca concluído!');
  }

  async cleanOrphanedImages() {
    console.log('\n🗑️ LIMPANDO IMAGENS ÓRFÃS');
    console.log('===========================');

    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      let removedCount = 0;

      for (const file of files) {
        if (this.isOrphaned(file)) {
          const filePath = path.join(UPLOADS_DIR, file);
          fs.unlinkSync(filePath);
          removedCount++;
          console.log(`   🗑️ Removido: ${file}`);
        }
      }

      if (removedCount === 0) {
        console.log('✅ Nenhuma imagem órfã encontrada!');
      } else {
        console.log(`✅ Limpeza concluída! ${removedCount} imagens órfãs removidas`);
      }

    } catch (error) {
      console.log('❌ Erro na limpeza:', error.message);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  try {
    const manager = new ImageManager();
    await manager.initialize();
    await manager.showMainMenu();
  } catch (error) {
    console.log('❌ Erro no gerenciador:', error.message);
    rl.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = ImageManager;
