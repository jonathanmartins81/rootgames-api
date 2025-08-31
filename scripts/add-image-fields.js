#!/usr/bin/env node

const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';

// Função para adicionar campos de imagem ao modelo de games
async function addImageFieldsToGames() {
  try {
    console.log('🚀 Adicionando campos de imagem ao modelo de games...\n');

    // Primeiro, vamos verificar se conseguimos fazer um update simples
    console.log('🔍 Testando update simples...');

    const testResponse = await axios.put(`${STRAPI_URL}/api/games/57`, {
      data: {
        cover: 313,
        gallery: [313, 314, 315, 316],
      },
    });

    console.log('✅ Campos de imagem adicionados com sucesso!');
    console.log('📊 Resposta:', JSON.stringify(testResponse.data, null, 2));

    return true;
  } catch (error) {
    console.log('❌ Erro ao adicionar campos de imagem:', error.message);

    if (error.response) {
      console.log('📋 Status:', error.response.status);
      console.log('📋 Resposta:', JSON.stringify(error.response.data, null, 2));
    }

    return false;
  }
}

// Função para verificar se os campos foram adicionados
async function checkImageFields() {
  try {
    console.log('🔍 Verificando se os campos de imagem foram adicionados...\n');

    const response = await axios.get(`${STRAPI_URL}/api/games/57?populate=*`);

    if (response.data.data) {
      const game = response.data.data;
      console.log('✅ Jogo encontrado:', game.name);
      console.log('📊 Campos disponíveis:', Object.keys(game.attributes || {}));

      if (game.attributes?.cover) {
        console.log('🖼️  Campo cover:', game.attributes.cover);
      }

      if (game.attributes?.gallery) {
        console.log('📸 Campo gallery:', game.attributes.gallery);
      }

      return true;
    } else {
      console.log('❌ Jogo não encontrado');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao verificar campos:', error.message);
    return false;
  }
}

// Função para associar imagens aos jogos
async function associateImagesToGames() {
  try {
    console.log('🚀 Associando imagens aos jogos...\n');

    // Lista de jogos com suas imagens
    const gamesWithImages = [
      {
        gameId: 57,
        gameName: 'Stardew Valley',
        cover: 313,
        gallery: [313, 314, 315, 316],
      },
      {
        gameId: 58,
        gameName: 'Dark Souls III',
        cover: 141,
        gallery: [141, 142, 143, 144, 145],
      },
      {
        gameId: 59,
        gameName: 'Hades',
        cover: 142,
        gallery: [142, 143, 144, 145, 146],
      },
      {
        gameId: 60,
        gameName: 'Disco Elysium',
        cover: 143,
        gallery: [143, 144, 145, 146, 147],
      },
      {
        gameId: 61,
        gameName: "Sid Meier's Civilization VI",
        cover: 264,
        gallery: [262, 263, 264, 265, 266],
      },
      {
        gameId: 62,
        gameName: "Baldur's Gate 3",
        cover: 145,
        gallery: [145, 146, 147, 148, 149],
      },
      {
        gameId: 63,
        gameName: 'Control Ultimate Edition',
        cover: 146,
        gallery: [146, 147, 148, 149, 150],
      },
      {
        gameId: 64,
        gameName: 'Monster Hunter: World',
        cover: 259,
        gallery: [257, 258, 259, 260, 261],
      },
      {
        gameId: 65,
        gameName: 'Hollow Knight',
        cover: 148,
        gallery: [148, 149, 150, 151, 152],
      },
    ];

    let successCount = 0;

    for (const game of gamesWithImages) {
      try {
        console.log(`🎮 Associando imagens a ${game.gameName}...`);

        const updateData = {
          cover: game.cover,
          gallery: game.gallery,
        };

        const response = await axios.put(`${STRAPI_URL}/api/games/${game.gameId}`, {
          data: updateData,
        });

        if (response.data.data) {
          console.log(`   ✅ ${game.gameName}: Imagens associadas com sucesso!`);
          successCount++;
        } else {
          console.log(`   ❌ ${game.gameName}: Falha na associação`);
        }

        // Pausa entre atualizações
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`   ❌ ${game.gameName}: ${error.message}`);
      }
    }

    console.log(`\n🏁 ASSOCIAÇÃO CONCLUÍDA!`);
    console.log(`📊 RESUMO:`);
    console.log(`   🎮 Total de jogos: ${gamesWithImages.length}`);
    console.log(`   ✅ Sucessos: ${successCount}`);
    console.log(`   ❌ Falhas: ${gamesWithImages.length - successCount}`);

    return successCount;
  } catch (error) {
    console.error('❌ Erro ao associar imagens:', error.message);
    return 0;
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('🚀 Adicionador de Campos de Imagem para Strapi');
    console.log('\n📋 USO:');
    console.log('   node scripts/add-image-fields.js [opções]');
    console.log('\n🔧 OPÇÕES:');
    console.log('   --add-fields        Adicionar campos de imagem ao modelo');
    console.log('   --check-fields      Verificar se os campos foram adicionados');
    console.log('   --associate         Associar imagens aos jogos');
    console.log('   --all               Executar todas as operações');
    console.log('\n💡 EXEMPLOS:');
    console.log('   node scripts/add-image-fields.js --add-fields');
    console.log('   node scripts/add-image-fields.js --all');
    return;
  }

  if (args[0] === '--add-fields') {
    await addImageFieldsToGames();
  } else if (args[0] === '--check-fields') {
    await checkImageFields();
  } else if (args[0] === '--associate') {
    await associateImagesToGames();
  } else if (args[0] === '--all') {
    console.log('🚀 Executando todas as operações...\n');

    const fieldsAdded = await addImageFieldsToGames();
    if (fieldsAdded) {
      console.log('\n⏳ Aguardando 3 segundos...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      await checkImageFields();

      console.log('\n⏳ Aguardando 3 segundos...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      await associateImagesToGames();
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  addImageFieldsToGames,
  checkImageFields,
  associateImagesToGames,
};
