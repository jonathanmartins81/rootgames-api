#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Configurador de APIs para RootGames\n');

// Função para fazer pergunta
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Função para verificar se arquivo .env existe
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ Arquivo .env não encontrado!');
    console.log('📝 Criando arquivo .env...\n');

    const defaultEnv = `HOST=0.0.0.0
PORT=1337
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=rootgames
DATABASE_USERNAME=rootgames
DATABASE_PASSWORD=rootgames1234
DATABASE_SSL=false
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=salt123
ADMIN_JWT_SECRET=admin-secret
JWT_SECRET=jwt-secret
TRANSFER_TOKEN_SALT=transfer-salt

# API Keys para fontes externas de imagens
RAWG_API_KEY=your_rawg_api_key_here
IGDB_CLIENT_ID=your_igdb_client_id_here
IGDB_CLIENT_SECRET=your_igdb_client_secret_here
GIANT_BOMB_API_KEY=your_giant_bomb_api_key_here
STEAM_API_KEY=your_steam_api_key_here`;

    fs.writeFileSync(envPath, defaultEnv);
    console.log('✅ Arquivo .env criado com sucesso!\n');
  } else {
    console.log('✅ Arquivo .env encontrado!\n');
  }
}

// Função para configurar RAWG API
async function setupRAWG() {
  console.log('🎮 Configurando RAWG.io API...');
  console.log('📖 RAWG.io é uma base de dados de jogos com +1M títulos');
  console.log('🔗 Obtenha sua chave em: https://rawg.io/apidocs\n');

  const hasKey = await ask('Você já tem uma chave da API RAWG? (s/n): ');

  if (hasKey.toLowerCase() === 's') {
    const apiKey = await ask('Digite sua chave da API RAWG: ');
    updateEnvFile('RAWG_API_KEY', apiKey);
    console.log('✅ Chave RAWG configurada!\n');
  } else {
    console.log('⏭️ Pulando configuração da RAWG API\n');
  }
}

// Função para configurar IGDB API
async function setupIGDB() {
  console.log('🌐 Configurando IGDB API...');
  console.log('📖 IGDB é a maior base de dados de jogos do mundo');
  console.log('🔗 Obtenha suas credenciais em: https://api.igdb.com/\n');

  const hasCredentials = await ask('Você já tem credenciais da IGDB API? (s/n): ');

  if (hasCredentials.toLowerCase() === 's') {
    const clientId = await ask('Digite seu Client ID da IGDB: ');
    const clientSecret = await ask('Digite seu Client Secret da IGDB: ');

    updateEnvFile('IGDB_CLIENT_ID', clientId);
    updateEnvFile('IGDB_CLIENT_SECRET', clientSecret);
    console.log('✅ Credenciais IGDB configuradas!\n');
  } else {
    console.log('⏭️ Pulando configuração da IGDB API\n');
  }
}

// Função para configurar Giant Bomb API
async function setupGiantBomb() {
  console.log('💣 Configurando Giant Bomb API...');
  console.log('📖 Giant Bomb oferece informações detalhadas sobre jogos');
  console.log('🔗 Obtenha sua chave em: https://www.giantbomb.com/api/\n');

  const hasKey = await ask('Você já tem uma chave da API Giant Bomb? (s/n): ');

  if (hasKey.toLowerCase() === 's') {
    const apiKey = await ask('Digite sua chave da API Giant Bomb: ');
    updateEnvFile('GIANT_BOMB_API_KEY', apiKey);
    console.log('✅ Chave Giant Bomb configurada!\n');
  } else {
    console.log('⏭️ Pulando configuração da Giant Bomb API\n');
  }
}

// Função para configurar Steam API
async function setupSteam() {
  console.log('🎯 Configurando Steam API...');
  console.log('📖 Steam API oferece acesso direto aos dados da loja');
  console.log('🔗 Obtenha sua chave em: https://steamcommunity.com/dev/apikey\n');

  const hasKey = await ask('Você já tem uma chave da API Steam? (s/n): ');

  if (hasKey.toLowerCase() === 's') {
    const apiKey = await ask('Digite sua chave da API Steam: ');
    updateEnvFile('STEAM_API_KEY', apiKey);
    console.log('✅ Chave Steam configurada!\n');
  } else {
    console.log('⏭️ Pulando configuração da Steam API\n');
  }
}

// Função para atualizar arquivo .env
function updateEnvFile(key, value) {
  const envPath = path.join(process.cwd(), '.env');
  let content = fs.readFileSync(envPath, 'utf8');

  // Substituir a linha existente ou adicionar nova
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}`;
  }

  fs.writeFileSync(envPath, content);
}

// Função para testar APIs
async function testAPIs() {
  console.log('🧪 Testando APIs configuradas...\n');

  // Carregar variáveis de ambiente
  require('dotenv').config();

  const imageSearchService = require('../src/api/game/services/image-search.service.js');
  const status = await imageSearchService.checkAPIStatus();

  console.log('📊 Status das APIs:');
  Object.entries(status.apis).forEach(([api, configured]) => {
    const icon = configured ? '✅' : '❌';
    const status = configured ? 'Configurada' : 'Não configurada';
    console.log(`  ${icon} ${api}: ${status}`);
  });

  console.log(`\n📈 Total: ${status.totalConfigured}/${status.totalAvailable} APIs configuradas`);

  if (status.totalConfigured > 0) {
    console.log('\n🎯 Testando busca de imagens...');
    const testResult = await imageSearchService.searchMultipleSources('Cyberpunk 2077');
    console.log(`✅ Teste concluído! Fonte: ${testResult.source}`);
  }
}

// Função principal
async function main() {
  try {
    console.log('🔧 Iniciando configuração das APIs...\n');

    // Verificar arquivo .env
    checkEnvFile();

    // Configurar cada API
    await setupRAWG();
    await setupIGDB();
    await setupGiantBomb();
    await setupSteam();

    // Testar APIs
    await testAPIs();

    console.log('\n🎉 Configuração concluída!');
    console.log('💡 Dica: Reinicie o servidor Strapi para aplicar as mudanças');

  } catch (error) {
    console.error('❌ Erro durante a configuração:', error.message);
  } finally {
    rl.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main };
