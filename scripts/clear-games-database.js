#!/usr/bin/env node

const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';

// Função para buscar todos os jogos
async function getAllGames() {
  try {
    const response = await axios.get(`${STRAPI_URL}/api/games?pagination[pageSize]=100`);
    return response.data.data;
  } catch (error) {
    throw new Error(`Erro ao buscar jogos: ${error.message}`);
  }
}

// Função para deletar um jogo
async function deleteGame(gameId) {
  try {
    await axios.delete(`${STRAPI_URL}/api/games/${gameId}`);
    return true;
  } catch (error) {
    throw new Error(`Erro ao deletar jogo ${gameId}: ${error.message}`);
  }
}

// Função para limpar todos os jogos
async function clearGamesDatabase() {
  console.log('🗑️ Iniciando limpeza do banco de dados de jogos...\n');

  try {
    // Verificar se o Strapi está rodando
    await axios.get(`${STRAPI_URL}/_health`);
    console.log('✅ Strapi está rodando\n');

    // Buscar todos os jogos
    console.log('📊 Buscando jogos no banco de dados...');
    const games = await getAllGames();
    console.log(`✅ ${games.length} jogos encontrados\n`);

    if (games.length === 0) {
      console.log('🎉 O banco de dados já está vazio!');
      return;
    }

    // Confirmar com o usuário
    console.log('⚠️ ATENÇÃO: Esta ação irá DELETAR TODOS os jogos do banco de dados!');
    console.log('📋 Jogos que serão deletados:');
    games.forEach((game, index) => {
      console.log(`   ${index + 1}. ${game.name} (ID: ${game.id})`);
    });

    console.log('\n❓ Tem certeza que deseja continuar? (s/N)');

    // Aguardar confirmação do usuário
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise(resolve => {
      rl.question('', input => {
        rl.close();
        resolve(input.toLowerCase());
      });
    });

    if (answer !== 's' && answer !== 'sim' && answer !== 'y' && answer !== 'yes') {
      console.log('❌ Operação cancelada pelo usuário');
      return;
    }

    console.log('\n🗑️ Iniciando deleção...\n');

    // Deletar jogos um por um
    let deletedCount = 0;
    let errorCount = 0;

    for (const game of games) {
      try {
        console.log(`🗑️ Deletando: ${game.name} (ID: ${game.id})`);
        await deleteGame(game.id);
        console.log(`✅ Deletado com sucesso: ${game.name}`);
        deletedCount++;

        // Aguardar um pouco entre deleções para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`❌ Erro ao deletar ${game.name}: ${error.message}`);
        errorCount++;
      }
    }

    // Relatório final
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log(`🎮 Total de jogos encontrados: ${games.length}`);
    console.log(`✅ Jogos deletados com sucesso: ${deletedCount}`);
    console.log(`❌ Erros durante deleção: ${errorCount}`);

    if (deletedCount === games.length) {
      console.log('\n🎉 Banco de dados limpo com sucesso!');
      console.log('💡 Agora você pode recriar os jogos com a estrutura correta de imagens');
    } else {
      console.log('\n⚠️ Alguns jogos não puderam ser deletados');
      console.log('💡 Verifique os erros acima e tente novamente se necessário');
    }
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  }
}

// Função para limpeza automática (sem confirmação)
async function clearGamesDatabaseAuto() {
  console.log('🗑️ Iniciando limpeza automática do banco de dados de jogos...\n');

  try {
    // Verificar se o Strapi está rodando
    await axios.get(`${STRAPI_URL}/_health`);
    console.log('✅ Strapi está rodando\n');

    // Buscar todos os jogos
    console.log('📊 Buscando jogos no banco de dados...');
    const games = await getAllGames();
    console.log(`✅ ${games.length} jogos encontrados\n`);

    if (games.length === 0) {
      console.log('🎉 O banco de dados já está vazio!');
      return;
    }

    console.log('🔄 Iniciando deleção automática...\n');

    // Deletar jogos um por um
    let deletedCount = 0;
    let errorCount = 0;

    for (const game of games) {
      try {
        console.log(`🗑️ Deletando: ${game.name} (ID: ${game.id})`);
        await deleteGame(game.id);
        console.log(`✅ Deletado com sucesso: ${game.name}`);
        deletedCount++;

        // Aguardar um pouco entre deleções para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`❌ Erro ao deletar ${game.name}: ${error.message}`);
        errorCount++;
      }
    }

    // Relatório final
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log(`🎮 Total de jogos encontrados: ${games.length}`);
    console.log(`✅ Jogos deletados com sucesso: ${deletedCount}`);
    console.log(`❌ Erros durante deleção: ${errorCount}`);

    if (deletedCount === games.length) {
      console.log('\n🎉 Banco de dados limpo com sucesso!');
    } else {
      console.log('\n⚠️ Alguns jogos não puderam ser deletados');
    }
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  // Verificar argumentos da linha de comando
  const args = process.argv.slice(2);

  if (args.includes('--auto') || args.includes('-a')) {
    clearGamesDatabaseAuto().catch(console.error);
  } else {
    clearGamesDatabase().catch(console.error);
  }
}

module.exports = {
  clearGamesDatabase,
  clearGamesDatabaseAuto,
  getAllGames,
  deleteGame,
};
