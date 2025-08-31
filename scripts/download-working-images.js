#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const IMAGES_API_URL = 'http://localhost:3001';
const UPLOADS_DIR = '/home/jonathan/Workspace/Development/rootgames/rootgames-api/public/uploads';

// Função para testar se uma URL de imagem é válida
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

// Função para baixar uma imagem
async function downloadImage(url, filepath) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Erro ao baixar imagem: ${error.message}`);
  }
}

// Função para criar nome de arquivo seguro
function createSafeFilename(gameName, imageType, index = null) {
  const safeName = gameName
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '_') // Substitui espaços por underscores
    .toLowerCase();

  if (index !== null) {
    return `${safeName}_${imageType}_${index}.jpg`;
  }

  return `${safeName}_${imageType}.jpg`;
}

// Função para baixar imagens de um jogo
async function downloadGameImages(gameName, gameData) {
  console.log(`🎮 Processando: ${gameName}`);

  let downloadedCount = 0;
  const gameDir = path.join(
    UPLOADS_DIR,
    gameName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
  );

  // Criar diretório do jogo se não existir
  if (!fs.existsSync(gameDir)) {
    fs.mkdirSync(gameDir, { recursive: true });
  }

  try {
    // Baixar capa
    if (gameData.cover && (await testImageUrl(gameData.cover))) {
      const coverFilename = createSafeFilename(gameName, 'cover');
      const coverPath = path.join(gameDir, coverFilename);

      console.log(`  📥 Baixando capa...`);
      await downloadImage(gameData.cover, coverPath);
      console.log(`  ✅ Capa baixada: ${coverFilename}`);
      downloadedCount++;
    } else {
      console.log(`  ⚠️ Capa não disponível ou inválida`);
    }

    // Baixar galeria
    if (gameData.gallery && gameData.gallery.length > 0) {
      console.log(`  📥 Baixando galeria...`);

      for (let i = 0; i < gameData.gallery.length; i++) {
        const galleryUrl = gameData.gallery[i];

        if (await testImageUrl(galleryUrl)) {
          const galleryFilename = createSafeFilename(gameName, 'gallery', i + 1);
          const galleryPath = path.join(gameDir, galleryFilename);

          try {
            await downloadImage(galleryUrl, galleryPath);
            console.log(`    ✅ Imagem ${i + 1} baixada: ${galleryFilename}`);
            downloadedCount++;
          } catch (error) {
            console.log(`    ❌ Erro ao baixar imagem ${i + 1}: ${error.message}`);
          }

          // Aguardar entre downloads para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log(`    ⚠️ Imagem ${i + 1} não disponível ou inválida`);
        }
      }
    } else {
      console.log(`  ⚠️ Galeria não disponível`);
    }

    console.log(`  📊 Total baixado: ${downloadedCount} imagens\n`);
    return downloadedCount;
  } catch (error) {
    console.log(`  ❌ Erro ao processar jogo: ${error.message}\n`);
    return 0;
  }
}

// Função principal
async function downloadAllWorkingImages() {
  console.log('🚀 Iniciando download de imagens funcionais...\n');
  console.log(`📁 Diretório de destino: ${UPLOADS_DIR}\n`);

  // Verificar se o diretório de uploads existe
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log(`❌ Diretório de uploads não existe: ${UPLOADS_DIR}`);
    console.log('💡 Crie o diretório primeiro ou verifique o caminho');
    return;
  }

  try {
    // Buscar todos os jogos da API
    const response = await axios.get(`${IMAGES_API_URL}/api/games-list`);

    if (!response.data || !response.data.success) {
      console.log('❌ Erro ao buscar lista de jogos da API');
      return;
    }

    const games = response.data.games;
    console.log(`📊 Total de jogos encontrados: ${games.length}\n`);

    let totalDownloaded = 0;
    let processedGames = 0;

    for (const game of games) {
      try {
        const gameName = game.name;
        console.log(`🎮 Processando: ${gameName}`);

        // Buscar dados do jogo
        const gameResponse = await axios.get(`${IMAGES_API_URL}/api/game-images`, {
          params: { name: gameName },
          timeout: 10000,
        });

        if (gameResponse.data && gameResponse.data.success) {
          const gameData = gameResponse.data;
          const downloaded = await downloadGameImages(gameName, gameData);
          totalDownloaded += downloaded;
          processedGames++;
        } else {
          console.log(`  ⚠️ Dados não disponíveis\n`);
        }

        // Aguardar entre jogos para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.log(`🎮 ${gameName}: Erro ao processar - ${error.message}\n`);
      }
    }

    // Relatório final
    console.log('📊 RELATÓRIO FINAL:');
    console.log(`🎮 Jogos processados: ${processedGames}`);
    console.log(`📸 Total de imagens baixadas: ${totalDownloaded}`);
    console.log(`📁 Imagens salvas em: ${UPLOADS_DIR}`);

    if (totalDownloaded > 0) {
      console.log(`\n✅ Download concluído com sucesso!`);
      console.log(`💡 As imagens estão prontas para uso no Strapi`);
    } else {
      console.log(`\n⚠️ Nenhuma imagem foi baixada`);
    }
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  downloadAllWorkingImages().catch(console.error);
}

module.exports = { downloadAllWorkingImages };
