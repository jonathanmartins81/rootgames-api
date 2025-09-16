#!/usr/bin/env node

/**
 * Script para configurar APIs externas para busca de imagens de jogos
 *
 * APIs disponíveis:
 * - IGDB (Internet Game Database) - Maior base de dados de jogos do mundo
 * - Giant Bomb - Base de dados da CBS Interactive
 * - Steam - Já configurado (fallback)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const ENV_FILE = path.join(process.cwd(), '.env');

async function readEnvFile() {
  try {
    if (fs.existsSync(ENV_FILE)) {
      return fs.readFileSync(ENV_FILE, 'utf8');
    }
    return '';
  } catch (error) {
    console.log('❌ Erro ao ler arquivo .env:', error.message);
    return '';
  }
}

async function writeEnvFile(content) {
  try {
    fs.writeFileSync(ENV_FILE, content);
    console.log('✅ Arquivo .env atualizado com sucesso!');
  } catch (error) {
    console.log('❌ Erro ao escrever arquivo .env:', error.message);
  }
}

async function updateEnvVariable(envContent, key, value) {
  const lines = envContent.split('\n');
  let found = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(`${key}=`)) {
      lines[i] = `${key}=${value}`;
      found = true;
      break;
    }
  }

  if (!found) {
    lines.push(`${key}=${value}`);
  }

  return lines.join('\n');
}

async function configureIGDB() {
  console.log('\n🔧 Configurando IGDB (Internet Game Database)');
  console.log('==============================================');
  console.log('📖 O IGDB é a maior base de dados de jogos do mundo');
  console.log('🌐 Acesse: https://api.igdb.com/');
  console.log('📝 Para obter credenciais:');
  console.log('   1. Faça login em https://api.igdb.com/');
  console.log('   2. Vá em "My Account" > "API Access"');
  console.log('   3. Copie Client ID e Client Secret\n');

  const clientId = await question('🔑 Client ID do IGDB: ');
  const clientSecret = await question('🔐 Client Secret do IGDB: ');

  if (clientId && clientSecret) {
    return { clientId, clientSecret };
  }

  return null;
}

async function configureGiantBomb() {
  console.log('\n🔧 Configurando Giant Bomb');
  console.log('============================');
  console.log('📖 Base de dados da CBS Interactive com informações detalhadas');
  console.log('🌐 Acesse: https://www.giantbomb.com/api/');
  console.log('📝 Para obter API key:');
  console.log('   1. Faça login em https://www.giantbomb.com/');
  console.log('   2. Vá em "Account" > "API Access"');
  console.log('   3. Copie sua API Key\n');

  const apiKey = await question('🔑 API Key do Giant Bomb: ');

  if (apiKey) {
    return { apiKey };
  }

  return null;
}

async function configureSteam() {
  console.log('\n🔧 Configurando Steam API');
  console.log('==========================');
  console.log('📖 API oficial da Valve para dados de jogos');
  console.log('🌐 Acesse: https://steamcommunity.com/dev/apikey');
  console.log('📝 Para obter API key:');
  console.log('   1. Acesse https://steamcommunity.com/dev/apikey');
  console.log('   2. Faça login com sua conta Steam');
  console.log('   3. Digite um nome para a API');
  console.log('   4. Copie a API Key gerada\n');

  const apiKey = await question('🔑 API Key do Steam (opcional): ');

  if (apiKey) {
    return { apiKey };
  }

  return null;
}

async function testAPIs(envContent) {
  console.log('\n🧪 Testando APIs configuradas...');
  console.log('================================');

  const lines = envContent.split('\n');
  const config = {};

  lines.forEach(line => {
    if (line.includes('=')) {
      const [key, value] = line.split('=');
      config[key.trim()] = value.trim();
    }
  });

  console.log('📊 Status das APIs:');
  console.log(`   RAWG.io: ${config.RAWG_API_KEY && config.RAWG_API_KEY !== 'your_rawg_api_key_here' ? '✅ Configurada' : '❌ Não configurada'}`);
  console.log(`   IGDB: ${config.IGDB_CLIENT_ID && config.IGDB_CLIENT_SECRET && config.IGDB_CLIENT_ID !== 'your_igdb_client_id_here' ? '✅ Configurada' : '❌ Não configurada'}`);
  console.log(`   Giant Bomb: ${config.GIANT_BOMB_API_KEY && config.GIANT_BOMB_API_KEY !== 'your_giant_bomb_api_key_here' ? '✅ Configurada' : '❌ Não configurada'}`);
  console.log(`   Steam: ${config.STEAM_API_KEY && config.STEAM_API_KEY !== 'your_steam_api_key_here' ? '✅ Configurada' : '❌ Não configurada'}`);

  const totalConfigured = [
    config.RAWG_API_KEY && config.RAWG_API_KEY !== 'your_rawg_api_key_here',
    config.IGDB_CLIENT_ID && config.IGDB_CLIENT_SECRET && config.IGDB_CLIENT_ID !== 'your_igdb_client_id_here',
    config.GIANT_BOMB_API_KEY && config.GIANT_BOMB_API_KEY !== 'your_giant_bomb_api_key_here',
    config.STEAM_API_KEY && config.STEAM_API_KEY !== 'your_steam_api_key_here'
  ].filter(Boolean).length;

  console.log(`\n🎯 Total de APIs configuradas: ${totalConfigured}/4`);

  if (totalConfigured >= 2) {
    console.log('🎉 Excelente! Sua API terá alta cobertura de imagens!');
  } else if (totalConfigured === 1) {
    console.log('👍 Bom! Mas configure mais APIs para melhorar a cobertura.');
  } else {
    console.log('⚠️ Configure pelo menos uma API para melhorar a busca de imagens.');
  }
}

async function main() {
  console.log('🚀 CONFIGURADOR DE APIS - ROOTGAMES 🎮');
  console.log('=========================================');
  console.log('Este script irá configurar APIs externas para melhorar');
  console.log('a busca e download de imagens de jogos.\n');

  try {
    let envContent = await readEnvFile();

    console.log('🔍 Verificando configuração atual...');

    // Configurar IGDB
    const igdb = await configureIGDB();
    if (igdb) {
      envContent = await updateEnvVariable(envContent, 'IGDB_CLIENT_ID', igdb.clientId);
      envContent = await updateEnvVariable(envContent, 'IGDB_CLIENT_SECRET', igdb.clientSecret);
      console.log('✅ IGDB configurado com sucesso!');
    }

    // Configurar Giant Bomb
    const giantBomb = await configureGiantBomb();
    if (giantBomb) {
      envContent = await updateEnvVariable(envContent, 'GIANT_BOMB_API_KEY', giantBomb.apiKey);
      console.log('✅ Giant Bomb configurado com sucesso!');
    }

    // Configurar Steam
    const steam = await configureSteam();
    if (steam) {
      envContent = await updateEnvVariable(envContent, 'STEAM_API_KEY', steam.apiKey);
      console.log('✅ Steam configurado com sucesso!');
    }

    // Salvar alterações
    if (igdb || giantBomb || steam) {
      await writeEnvFile(envContent);
    }

    // Testar APIs
    await testAPIs(envContent);

    console.log('\n🎯 Próximos passos:');
    console.log('   1. Reinicie o servidor Strapi para aplicar as mudanças');
    console.log('   2. Teste as novas APIs com: curl "http://localhost:1337/api/games/images/api-status"');
    console.log('   3. Teste busca avançada com: curl "http://localhost:1337/api/games/images/search-advanced?gameName=Cyberpunk%202077"');

  } catch (error) {
    console.log('❌ Erro durante a configuração:', error.message);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { configureIGDB, configureGiantBomb, configureSteam };
