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

// Função para limpar banco usando método alternativo
async function clearGamesDatabaseAlternative() {
  console.log('🗑️ Iniciando limpeza alternativa do banco de dados...\n');

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

    console.log('📋 Jogos encontrados:');
    games.forEach((game, index) => {
      console.log(`   ${index + 1}. ${game.name} (ID: ${game.id})`);
    });

    console.log('\n💡 SOLUÇÕES PARA LIMPEZA:');
    console.log('\n1️⃣ **VIA ADMIN WEB (RECOMENDADO):**');
    console.log(`   🌐 Acesse: http://localhost:1337/admin`);
    console.log('   📁 Vá em: Content Manager > Game');
    console.log('   🗑️ Selecione todos os jogos e clique em "Delete"');

    console.log('\n2️⃣ **VIA API COM AUTENTICAÇÃO:**');
    console.log('   🔑 Faça login no admin para obter token de API');
    console.log('   📝 Use o token nas requisições DELETE');

    console.log('\n3️⃣ **VIA BANCO DE DADOS DIRETO:**');
    console.log('   🗄️ Acesse o banco PostgreSQL diretamente');
    console.log('   🗑️ Execute: DELETE FROM games;');

    console.log('\n4️⃣ **VIA SCRIPT DE POPULAÇÃO:**');
    console.log('   🔄 Use o script populate para recriar os jogos');
    console.log('   📝 Isso substituirá todos os dados existentes');

    console.log('\n🎯 **RECOMENDAÇÃO IMEDIATA:**');
    console.log('   🌐 Abra http://localhost:1337/admin no navegador');
    console.log('   🔐 Faça login (se necessário)');
    console.log('   📁 Vá em Content Manager > Game');
    console.log('   ✅ Selecione todos os jogos');
    console.log('   🗑️ Clique em "Delete"');

    console.log('\n💾 **APÓS LIMPEZA:**');
    console.log('   🚀 Execute: npm run develop');
    console.log('   📝 Use o script populate para recriar os jogos');
    console.log('   🖼️ Configure as imagens corretamente');
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  }
}

// Função para mostrar status atual
async function showCurrentStatus() {
  try {
    const games = await getAllGames();
    console.log('📊 STATUS ATUAL DO BANCO:');
    console.log(`🎮 Total de jogos: ${games.length}`);

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
    await showCurrentStatus();
  } else {
    await clearGamesDatabaseAlternative();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  clearGamesDatabaseAlternative,
  showCurrentStatus,
  getAllGames,
};
