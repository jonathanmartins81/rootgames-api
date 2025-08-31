#!/usr/bin/env node

const axios = require('axios');

const IMAGES_API_URL = 'http://localhost:3001';

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
  ];

  for (const pattern of patterns) {
    const url = `https://cdn.akamai.steamstatic.com/steam/apps/${steamAppId}/${pattern}`;
    if (await testImageUrl(url)) {
      validScreenshots.push(url);
      if (validScreenshots.length >= 3) break; // Precisamos de 3 screenshots
    }
  }

  return validScreenshots;
}

// Função para corrigir URLs das galerias
async function fixGalleryUrls() {
  console.log('🔧 Corrigindo URLs das galerias...\n');

  try {
    // Buscar todos os jogos da API
    const response = await axios.get(`${IMAGES_API_URL}/api/games`);

    if (!response.data || !response.data.success) {
      console.log('❌ Erro ao buscar jogos da API');
      return;
    }

    const games = response.data.games;
    let fixedCount = 0;

    for (const game of games) {
      if (game.source === 'Steam' && game.gallery) {
        console.log(`🎮 Processando: ${game.name}`);

        // Extrair Steam App ID da URL da capa
        const coverMatch = game.cover.match(/steam\/apps\/(\d+)/);
        if (coverMatch) {
          const steamAppId = coverMatch[1];
          console.log(`  🔍 Steam App ID: ${steamAppId}`);

          // Buscar screenshots válidos
          const validScreenshots = await findValidScreenshots(steamAppId);

          if (validScreenshots.length > 0) {
            console.log(`  ✅ Encontrados ${validScreenshots.length} screenshots válidos`);

            // Atualizar galeria com URLs válidas
            game.gallery = validScreenshots;
            game.lastUpdated = new Date().toISOString();

            // Atualizar na API
            try {
              await axios.put(`${IMAGES_API_URL}/api/games/${game.name}`, game);
              console.log(`  🔄 Galeria atualizada com sucesso`);
              fixedCount++;
            } catch (updateError) {
              console.log(`  ❌ Erro ao atualizar: ${updateError.message}`);
            }
          } else {
            console.log(`  ⚠️ Nenhum screenshot válido encontrado`);
          }
        } else {
          console.log(`  ⚠️ Não foi possível extrair Steam App ID`);
        }

        console.log('');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar entre requisições
      }
    }

    console.log(`📊 RELATÓRIO FINAL:`);
    console.log(`✅ Jogos corrigidos: ${fixedCount}`);
    console.log(`📝 Total processados: ${games.length}`);
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixGalleryUrls().catch(console.error);
}

module.exports = { fixGalleryUrls };
