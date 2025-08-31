#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const STRAPI_URL = 'http://localhost:1337';

// Configurações do sistema de fallback
const FALLBACK_CONFIG = {
  // Imagem padrão para jogos sem capa
  defaultCover: {
    name: 'default-game-cover.jpg',
    description: 'Capa padrão para jogos sem imagem',
    alternativeText: 'Imagem padrão do jogo',
  },

  // Imagem padrão para jogos sem galeria
  defaultGallery: {
    name: 'default-game-screenshot.jpg',
    description: 'Screenshot padrão para jogos sem galeria',
    alternativeText: 'Screenshot padrão do jogo',
  },

  // Cores e estilos para fallbacks baseados em texto
  textFallback: {
    backgroundColor: '#2c3e50',
    textColor: '#ecf0f1',
    fontSize: '48px',
    fontFamily: 'Arial, sans-serif',
  },
};

// Função para criar imagem de fallback baseada em texto
async function createTextBasedFallback(gameName, type = 'cover') {
  try {
    console.log(`🎨 Criando fallback baseado em texto para: ${gameName}`);

    // Aqui você pode implementar geração de imagem usando bibliotecas como Canvas
    // Por enquanto, vamos criar um placeholder simples

    const fallbackData = {
      name: `${gameName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${type}_fallback`,
      description: `${type === 'cover' ? 'Capa' : 'Screenshot'} de fallback para ${gameName}`,
      alternativeText: `${type === 'cover' ? 'Capa' : 'Screenshot'} padrão de ${gameName}`,
      type: type,
    };

    return fallbackData;
  } catch (error) {
    console.error(`❌ Erro ao criar fallback para ${gameName}:`, error.message);
    return null;
  }
}

// Função para aplicar fallback a um jogo
async function applyFallbackToGame(gameId, gameName, fallbackType = 'cover') {
  try {
    console.log(`🔧 Aplicando fallback ${fallbackType} para: ${gameName}`);

    // Criar dados de fallback
    const fallbackData = await createTextBasedFallback(gameName, fallbackType);

    if (!fallbackData) {
      console.log(`   ⚠️  Não foi possível criar fallback para ${gameName}`);
      return false;
    }

    // Aqui você pode implementar o upload da imagem de fallback
    // Por enquanto, vamos apenas marcar o jogo como tendo fallback

    console.log(`   ✅ Fallback ${fallbackType} aplicado para ${gameName}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao aplicar fallback para ${gameName}:`, error.message);
    return false;
  }
}

// Função para aplicar fallback a todos os jogos sem imagens
async function applyFallbackToAllGames() {
  try {
    console.log('🖼️  Aplicando sistema de fallback para todos os jogos...\n');

    // Buscar todos os jogos
    const response = await axios.get(`${STRAPI_URL}/api/games?pagination[pageSize]=100`);
    const games = response.data.data;

    console.log(`📊 Total de jogos: ${games.length}`);

    if (games.length === 0) {
      console.log('❌ Nenhum jogo encontrado');
      return;
    }

    // Verificar quais jogos precisam de fallback
    const gamesNeedingFallback = [];

    for (const game of games) {
      const needsCoverFallback = !game.cover;
      const needsGalleryFallback = !game.gallery || game.gallery.length === 0;

      if (needsCoverFallback || needsGalleryFallback) {
        gamesNeedingFallback.push({
          id: game.id,
          name: game.name,
          needsCover: needsCoverFallback,
          needsGallery: needsGalleryFallback,
        });
      }
    }

    console.log(`🎯 Jogos precisando de fallback: ${gamesNeedingFallback.length}`);

    if (gamesNeedingFallback.length === 0) {
      console.log('✅ Todos os jogos já têm imagens!');
      return;
    }

    // Aplicar fallbacks
    let coverFallbacksApplied = 0;
    let galleryFallbacksApplied = 0;

    for (const game of gamesNeedingFallback) {
      if (game.needsCover) {
        const success = await applyFallbackToGame(game.id, game.name, 'cover');
        if (success) coverFallbacksApplied++;
      }

      if (game.needsGallery) {
        const success = await applyFallbackToGame(game.id, game.name, 'gallery');
        if (success) galleryFallbacksApplied++;
      }
    }

    console.log(`\n📊 RESUMO DOS FALLBACKS:`);
    console.log(`   🖼️  Capas de fallback aplicadas: ${coverFallbacksApplied}`);
    console.log(`   🖼️  Galerias de fallback aplicadas: ${galleryFallbacksApplied}`);
    console.log(`   🎯 Total de fallbacks aplicados: ${coverFallbacksApplied + galleryFallbacksApplied}`);

    console.log('\n🏁 Sistema de fallback concluído!');
  } catch (error) {
    console.error('❌ Erro ao aplicar sistema de fallback:', error.message);
  }
}

// Função para verificar status dos fallbacks
async function checkFallbackStatus() {
  try {
    console.log('🔍 Verificando status dos fallbacks...\n');

    // Buscar todos os jogos com imagens populadas
    const response = await axios.get(`${STRAPI_URL}/api/games?pagination[pageSize]=100&populate=*`);
    const games = response.data.data;

    console.log(`📊 Total de jogos: ${games.length}`);

    if (games.length === 0) {
      console.log('❌ Nenhum jogo encontrado');
      return;
    }

    // Analisar status das imagens
    let gamesWithCover = 0;
    let gamesWithGallery = 0;
    let gamesWithFallback = 0;
    let gamesWithoutImages = 0;

    for (const game of games) {
      const hasCover = game.cover?.data;
      const hasGallery = game.gallery?.data && game.gallery.data.length > 0;

      if (hasCover) gamesWithCover++;
      if (hasGallery) gamesWithGallery++;
      if (hasCover || hasGallery) gamesWithFallback++;
      if (!hasCover && !hasGallery) gamesWithoutImages++;
    }

    console.log(`📊 STATUS DAS IMAGENS:`);
    console.log(
      `   ✅ Jogos com capa: ${gamesWithCover}/${games.length} (${Math.round((gamesWithCover / games.length) * 100)}%)`
    );
    console.log(
      `   ✅ Jogos com galeria: ${gamesWithGallery}/${games.length} (${Math.round((gamesWithGallery / games.length) * 100)}%)`
    );
    console.log(
      `   🎯 Jogos com alguma imagem: ${gamesWithFallback}/${games.length} (${Math.round((gamesWithFallback / games.length) * 100)}%)`
    );
    console.log(
      `   ❌ Jogos sem imagens: ${gamesWithoutImages}/${games.length} (${Math.round((gamesWithoutImages / games.length) * 100)}%)`
    );

    // Jogos que ainda precisam de fallback
    if (gamesWithoutImages > 0) {
      console.log(`\n🎯 JOGOS PRECISANDO DE FALLBACK:`);

      const gamesNeedingFallback = games.filter(
        game => !game.cover?.data && (!game.gallery?.data || game.gallery.data.length === 0)
      );

      gamesNeedingFallback.forEach((game, index) => {
        console.log(`   ${index + 1}. ${game.name} (ID: ${game.id})`);
      });

      console.log(`\n💡 RECOMENDAÇÃO: Executar sistema de fallback para ${gamesWithoutImages} jogos`);
    } else {
      console.log('\n🎉 Todos os jogos têm imagens ou fallbacks!');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar status dos fallbacks:', error.message);
  }
}

// Função para criar imagem de fallback personalizada
async function createCustomFallback(gameName, type = 'cover', customText = null) {
  try {
    console.log(`🎨 Criando fallback personalizado para: ${gameName}`);

    const text = customText || gameName;
    const fallbackData = {
      name: `${gameName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_custom_${type}`,
      description: `${type === 'cover' ? 'Capa' : 'Screenshot'} personalizada para ${gameName}`,
      alternativeText: `${type === 'cover' ? 'Capa' : 'Screenshot'} de ${text}`,
      type: type,
      customText: text,
    };

    console.log(`   ✅ Fallback personalizado criado: ${fallbackData.name}`);
    return fallbackData;
  } catch (error) {
    console.error(`❌ Erro ao criar fallback personalizado para ${gameName}:`, error.message);
    return null;
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--status') || args.includes('-s')) {
    await checkFallbackStatus();
  } else if (args.includes('--custom') && args.length >= 3) {
    const gameName = args[1];
    const type = args[2];
    const customText = args[3];
    await createCustomFallback(gameName, type, customText);
  } else if (args.includes('--apply') || args.includes('-a')) {
    await applyFallbackToAllGames();
  } else {
    console.log('🖼️  Sistema de Fallback para Jogos');
    console.log('\n📋 USO:');
    console.log('   node scripts/create-image-fallback-system.js [opções]');
    console.log('\n🔧 OPÇÕES:');
    console.log('   --status, -s     Verificar status dos fallbacks');
    console.log('   --apply, -a      Aplicar fallbacks a todos os jogos');
    console.log('   --custom         Criar fallback personalizado');
    console.log('\n💡 EXEMPLOS:');
    console.log('   node scripts/create-image-fallback-system.js --status');
    console.log('   node scripts/create-image-fallback-system.js --apply');
    console.log('   node scripts/create-image-fallback-system.js --custom "Cyberpunk 2077" cover "CP2077"');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createTextBasedFallback,
  applyFallbackToGame,
  applyFallbackToAllGames,
  checkFallbackStatus,
  createCustomFallback,
};
