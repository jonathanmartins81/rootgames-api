#!/usr/bin/env node

/**
 * Script para verificar status das imagens dos games no Strapi
 *
 * Funcionalidades:
 * - Verificar se todos os games têm cover e gallery preenchidos
 * - Gerar relatório detalhado do status das imagens
 * - Identificar games que precisam de imagens
 */

const axios = require('axios');

const API_BASE = 'http://localhost:1337/api';

class GamesImageChecker {
  constructor() {
    this.stats = {
      totalGames: 0,
      gamesWithCover: 0,
      gamesWithGallery: 0,
      gamesWithBoth: 0,
      gamesWithoutImages: 0,
      gamesWithPartialImages: 0
    };
    this.games = [];
  }

  async checkAllGames() {
    console.log('🎮 VERIFICANDO STATUS DAS IMAGENS DOS GAMES');
    console.log('============================================');

    try {
      // Buscar todos os games
      const response = await axios.get(`${API_BASE}/games?pagination[pageSize]=1000&populate=*`);
      this.games = response.data.data;
      this.stats.totalGames = this.games.length;

      console.log(`📊 Total de games encontrados: ${this.stats.totalGames}\n`);

      // Analisar cada game
      this.games.forEach((game, index) => {
        this.analyzeGame(game, index + 1);
      });

      // Gerar relatório
      this.generateReport();

    } catch (error) {
      console.log('❌ Erro ao buscar games:', error.message);
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', error.response.data);
      }
    }
  }

  analyzeGame(game, index) {
    const hasCover = game.attributes.cover && game.attributes.cover.data;
    const hasGallery = game.attributes.gallery && game.attributes.gallery.data && game.attributes.gallery.data.length > 0;

    const gameInfo = {
      id: game.id,
      name: game.attributes.name,
      hasCover,
      hasGallery,
      coverCount: hasCover ? 1 : 0,
      galleryCount: hasGallery ? game.attributes.gallery.data.length : 0,
      status: this.getGameStatus(hasCover, hasGallery)
    };

    // Atualizar estatísticas
    if (hasCover) this.stats.gamesWithCover++;
    if (hasGallery) this.stats.gamesWithGallery++;
    if (hasCover && hasGallery) this.stats.gamesWithBoth++;
    if (!hasCover && !hasGallery) this.stats.gamesWithoutImages++;
    if ((hasCover && !hasGallery) || (!hasCover && hasGallery)) this.stats.gamesWithPartialImages++;

    // Mostrar status do game
    const statusIcon = this.getStatusIcon(gameInfo.status);
    console.log(`${index.toString().padStart(3)}. ${statusIcon} ${gameInfo.name}`);
    console.log(`     Cover: ${hasCover ? '✅' : '❌'} | Gallery: ${hasGallery ? `✅ (${gameInfo.galleryCount})` : '❌'}`);

    if (gameInfo.status === 'incomplete') {
      console.log(`     ⚠️  Precisa de ${!hasCover ? 'cover' : ''}${!hasCover && !hasGallery ? ' e ' : ''}${!hasGallery ? 'gallery' : ''}`);
    }
    console.log('');
  }

  getGameStatus(hasCover, hasGallery) {
    if (hasCover && hasGallery) return 'complete';
    if (!hasCover && !hasGallery) return 'empty';
    return 'incomplete';
  }

  getStatusIcon(status) {
    switch (status) {
      case 'complete': return '🟢';
      case 'incomplete': return '🟡';
      case 'empty': return '🔴';
      default: return '⚪';
    }
  }

  generateReport() {
    console.log('\n📊 RELATÓRIO COMPLETO');
    console.log('=====================');

    console.log('\n🎮 ESTATÍSTICAS GERAIS:');
    console.log(`   Total de games: ${this.stats.totalGames}`);
    console.log(`   Games com cover: ${this.stats.gamesWithCover} (${((this.stats.gamesWithCover / this.stats.totalGames) * 100).toFixed(1)}%)`);
    console.log(`   Games com gallery: ${this.stats.gamesWithGallery} (${((this.stats.gamesWithGallery / this.stats.totalGames) * 100).toFixed(1)}%)`);
    console.log(`   Games completos: ${this.stats.gamesWithBoth} (${((this.stats.gamesWithBoth / this.stats.totalGames) * 100).toFixed(1)}%)`);
    console.log(`   Games sem imagens: ${this.stats.gamesWithoutImages} (${((this.stats.gamesWithoutImages / this.stats.totalGames) * 100).toFixed(1)}%)`);
    console.log(`   Games parciais: ${this.stats.gamesWithPartialImages} (${((this.stats.gamesWithPartialImages / this.stats.totalGames) * 100).toFixed(1)}%)`);

    // Games que precisam de atenção
    const incompleteGames = this.games.filter(game => {
      const hasCover = game.attributes.cover && game.attributes.cover.data;
      const hasGallery = game.attributes.gallery && game.attributes.gallery.data && game.attributes.gallery.data.length > 0;
      return !hasCover || !hasGallery;
    });

    if (incompleteGames.length > 0) {
      console.log('\n⚠️  GAMES QUE PRECISAM DE ATENÇÃO:');
      console.log('==================================');

      incompleteGames.forEach((game, index) => {
        const hasCover = game.attributes.cover && game.attributes.cover.data;
        const hasGallery = game.attributes.gallery && game.attributes.gallery.data && game.attributes.gallery.data.length > 0;

        console.log(`${index + 1}. ${game.attributes.name}`);
        console.log(`   ID: ${game.id}`);
        console.log(`   Cover: ${hasCover ? '✅' : '❌'}`);
        console.log(`   Gallery: ${hasGallery ? `✅ (${game.attributes.gallery.data.length})` : '❌'}`);
        console.log(`   URL: http://localhost:8000/admin/content-manager/collectionType/api::game.game/${game.id}`);
        console.log('');
      });
    }

    // Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('==================');

    if (this.stats.gamesWithoutImages > 0) {
      console.log(`   🔧 ${this.stats.gamesWithoutImages} games precisam de imagens - Execute download em massa`);
    }

    if (this.stats.gamesWithPartialImages > 0) {
      console.log(`   🎯 ${this.stats.gamesWithPartialImages} games têm imagens parciais - Complete as imagens faltantes`);
    }

    if (this.stats.gamesWithBoth === this.stats.totalGames) {
      console.log('   🎉 Todos os games estão com imagens completas!');
    }

    // Score de completude
    const completenessScore = ((this.stats.gamesWithBoth / this.stats.totalGames) * 100).toFixed(1);
    console.log(`\n🏆 SCORE DE COMPLETUDE: ${completenessScore}%`);

    if (completenessScore >= 90) {
      console.log('   🌟 Excelente! Sistema de imagens funcionando muito bem');
    } else if (completenessScore >= 70) {
      console.log('   👍 Bom! Alguns ajustes podem melhorar ainda mais');
    } else if (completenessScore >= 50) {
      console.log('   ⚠️  Regular! Recomenda-se executar download em massa');
    } else {
      console.log('   🚨 Crítico! Sistema de imagens precisa de atenção urgente');
    }
  }
}

async function main() {
  try {
    const checker = new GamesImageChecker();
    await checker.checkAllGames();
  } catch (error) {
    console.log('❌ Erro durante a verificação:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = GamesImageChecker;
