#!/usr/bin/env node

const axios = require('axios');

const IMAGES_API_URL = 'http://localhost:3001';

// Lista de jogos para testar
const testGames = [
  'RoboCop: Rogue City',
  'Vampire®: The Masquerade - Bloodlines™',
  'Middle-earth™: Shadow of War™ Definitive Edition',
  'The Witcher 3: Wild Hunt - Complete Edition',
  'Rayman 3: Hoodlum Havoc',
];

// Função para testar uma URL de imagem
async function testImageUrl(url, gameName, imageType) {
  try {
    console.log(`  🔍 Testando ${imageType} de ${gameName}...`);

    const response = await axios.head(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const contentType = response.headers['content-type'];
    const contentLength = response.headers['content-length'];

    if (contentType && contentType.startsWith('image/')) {
      console.log(`  ✅ ${imageType} válida! Tipo: ${contentType}, Tamanho: ${(contentLength / 1024).toFixed(1)}KB`);
      return true;
    } else {
      console.log(`  ❌ ${imageType} inválida! Tipo: ${contentType}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Erro ao testar ${imageType}: ${error.message}`);
    return false;
  }
}

// Função principal para testar todos os jogos
async function testAllImageUrls() {
  console.log('🧪 Testando URLs de imagens da API...\n');

  let totalTests = 0;
  let successfulTests = 0;

  for (const gameName of testGames) {
    console.log(`🎮 Testando: ${gameName}`);

    try {
      // Buscar informações do jogo na API
      const response = await axios.get(`${IMAGES_API_URL}/api/game-images`, {
        params: { name: gameName },
        timeout: 10000,
      });

      if (response.data && response.data.success) {
        const gameData = response.data;

        // Testar capa
        if (gameData.cover) {
          totalTests++;
          const coverValid = await testImageUrl(gameData.cover, gameName, 'Capa');
          if (coverValid) successfulTests++;
        }

        // Testar galeria
        if (gameData.gallery && gameData.gallery.length > 0) {
          for (let i = 0; i < Math.min(gameData.gallery.length, 2); i++) {
            totalTests++;
            const galleryValid = await testImageUrl(gameData.gallery[i], gameName, `Galeria ${i + 1}`);
            if (galleryValid) successfulTests++;
          }
        }

        console.log(`  📊 Fonte: ${gameData.source}\n`);
      } else {
        console.log(`  ❌ Jogo não encontrado na API\n`);
      }

      // Aguardar entre testes
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`  ❌ Erro ao buscar jogo: ${error.message}\n`);
    }
  }

  // Relatório final
  console.log('📊 RELATÓRIO FINAL:');
  console.log(`🧪 Total de testes: ${totalTests}`);
  console.log(`✅ Testes bem-sucedidos: ${successfulTests}`);
  console.log(`❌ Testes falharam: ${totalTests - successfulTests}`);
  console.log(`📈 Taxa de sucesso: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
}

// Executar se chamado diretamente
if (require.main === module) {
  testAllImageUrls().catch(console.error);
}

module.exports = { testAllImageUrls };
