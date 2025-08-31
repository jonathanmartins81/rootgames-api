#!/usr/bin/env node

const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';

// Função para testar população específica
async function testSpecificPopulate() {
  console.log('🧪 Testando população específica de jogos...\n');

  try {
    // Verificar se o Strapi está rodando
    await axios.get(`${STRAPI_URL}/_health`);
    console.log('✅ Strapi está rodando\n');

    // Testar a nova rota
    console.log('🚀 Testando rota /games/populate-specific...');

    const response = await axios.post(`${STRAPI_URL}/api/games/populate-specific`);

    if (response.status === 200) {
      console.log('✅ População específica executada com sucesso!');
      console.log(`📝 Resposta: ${response.data}`);
    } else {
      console.log(`⚠️ Resposta inesperada: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Erro ao testar população específica:', error.message);

    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Dados: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Função para verificar status atual
async function checkCurrentStatus() {
  try {
    console.log('📊 Verificando status atual do banco...');

    const response = await axios.get(`${STRAPI_URL}/api/games`);
    const games = response.data.data;

    console.log(`🎮 Total de jogos no banco: ${games.length}`);

    if (games.length > 0) {
      console.log('\n📋 Primeiros 5 jogos:');
      games.slice(0, 5).forEach((game, index) => {
        console.log(`   ${index + 1}. ${game.name} (ID: ${game.id})`);
      });

      if (games.length > 5) {
        console.log(`   ... e mais ${games.length - 5} jogos`);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error.message);
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--status') || args.includes('-s')) {
    await checkCurrentStatus();
  } else {
    await testSpecificPopulate();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testSpecificPopulate,
  checkCurrentStatus,
};
