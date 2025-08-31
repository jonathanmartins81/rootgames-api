#!/usr/bin/env node

const axios = require('axios');

// Função para testar uma URL de imagem
async function testImageUrl(url) {
  try {
    const response = await axios.head(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const contentType = response.headers['content-type'];
    return contentType && contentType.startsWith('image/');
  } catch (error) {
    return false;
  }
}

// Função para encontrar screenshots válidos para um jogo do Steam
async function findValidScreenshots(steamAppId) {
  const validScreenshots = [];

  // Testar diferentes padrões de screenshots
  const patterns = [
    'ss_1.jpg',
    'ss_2.jpg',
    'ss_3.jpg',
    'ss_01.jpg',
    'ss_02.jpg',
    'ss_03.jpg',
    'ss_a.jpg',
    'ss_b.jpg',
    'ss_c.jpg',
    'ss_001.jpg',
    'ss_002.jpg',
    'ss_003.jpg',
    'ss_1.png',
    'ss_2.png',
    'ss_3.png',
  ];

  console.log(`  🔍 Testando padrões para Steam App ID: ${steamAppId}`);

  for (const pattern of patterns) {
    const url = `https://cdn.akamai.steamstatic.com/steam/apps/${steamAppId}/${pattern}`;
    if (await testImageUrl(url)) {
      console.log(`    ✅ ${pattern} - VÁLIDO`);
      validScreenshots.push(url);
      if (validScreenshots.length >= 3) break; // Precisamos de 3 screenshots
    } else {
      console.log(`    ❌ ${pattern} - Inválido`);
    }
  }

  return validScreenshots;
}

// Função principal para corrigir screenshots
async function fixSteamScreenshots() {
  console.log('🔧 Corrigindo Screenshots do Steam...\n');

  // Lista de jogos Steam para corrigir
  const steamGames = [
    { name: 'RoboCop: Rogue City', appId: '1681010' },
    { name: 'Vampire®: The Masquerade - Bloodlines™', appId: '2600' },
    { name: 'Middle-earth™: Shadow of War™ Definitive Edition', appId: '356190' },
    { name: 'The Witcher 3: Wild Hunt - Complete Edition', appId: '292030' },
    { name: 'Rayman 3: Hoodlum Havoc', appId: '15540' },
  ];

  let totalFixed = 0;

  for (const game of steamGames) {
    console.log(`🎮 Processando: ${game.name}`);

    try {
      const validScreenshots = await findValidScreenshots(game.appId);

      if (validScreenshots.length > 0) {
        console.log(`  ✅ Screenshots válidos encontrados: ${validScreenshots.length}`);
        console.log(`  📸 URLs válidas:`);
        validScreenshots.forEach((url, index) => {
          console.log(`    ${index + 1}. ${url}`);
        });
        totalFixed++;
      } else {
        console.log(`  ❌ Nenhum screenshot válido encontrado`);
      }

      console.log('');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar entre jogos
    } catch (error) {
      console.log(`  ❌ Erro ao processar: ${error.message}`);
    }
  }

  console.log(`📊 RELATÓRIO FINAL:`);
  console.log(`✅ Jogos com screenshots válidos: ${totalFixed}`);
  console.log(`📝 Total processados: ${steamGames.length}`);

  if (totalFixed > 0) {
    console.log(`\n💡 Use essas URLs válidas para atualizar o banco de dados da API`);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixSteamScreenshots().catch(console.error);
}

module.exports = { fixSteamScreenshots };
