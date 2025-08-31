#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { intelligentImageSearch } = require('./intelligent-image-finder');

const STRAPI_URL = 'http://localhost:1337';

// Configuração de pastas
const DOWNLOAD_DIR = path.join(__dirname, '../public/uploads');
const TEMP_DIR = path.join(__dirname, '../temp');

// Criar diretórios se não existirem
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Função para baixar imagem
async function downloadImage(url, filename) {
  try {
    console.log(`   📥 Baixando: ${filename}`);

    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const filePath = path.join(TEMP_DIR, filename);
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`   ✅ Download concluído: ${filename}`);
        resolve(filePath);
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.log(`   ❌ Erro ao baixar ${filename}: ${error.message}`);
    return null;
  }
}

// Função para fazer upload para o Strapi
async function uploadToStrapi(filePath, gameName, imageType) {
  try {
    console.log(`   📤 Fazendo upload para Strapi: ${imageType}`);

    const formData = new FormData();
    formData.append('files', fs.createReadStream(filePath));

    const response = await axios.post(`${STRAPI_URL}/api/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data && response.data.length > 0) {
      const uploadedFile = response.data[0];
      console.log(`   ✅ Upload concluído: ${uploadedFile.name} (ID: ${uploadedFile.id})`);

      // Limpar arquivo temporário
      fs.unlinkSync(filePath);

      return uploadedFile;
    }

    return null;
  } catch (error) {
    console.log(`   ❌ Erro no upload para Strapi: ${error.message}`);
    // Limpar arquivo temporário em caso de erro
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return null;
  }
}

// Função para associar imagem ao jogo no Strapi
async function associateImageToGame(gameId, uploadedFile, imageType) {
  try {
    console.log(`   🔗 Associando ${imageType} ao jogo...`);

    let updateData = {};

    if (imageType === 'cover') {
      updateData.cover = uploadedFile.id;
    } else if (imageType === 'gallery') {
      // Buscar galeria atual
      const currentGame = await axios.get(`${STRAPI_URL}/api/games/${gameId}?populate=*`);
      const currentGallery = currentGame.data.data.gallery?.data || [];

      // Adicionar nova imagem à galeria
      updateData.gallery = [...currentGallery.map(img => img.id), uploadedFile.id];
    }

    const response = await axios.put(`${STRAPI_URL}/api/games/${gameId}`, {
      data: updateData,
    });

    console.log(`   ✅ ${imageType} associado com sucesso!`);
    return true;
  } catch (error) {
    console.log(`   ❌ Erro ao associar ${imageType}: ${error.message}`);
    return false;
  }
}

// Função para processar um jogo específico
async function processGameImages(gameName, gameId = null) {
  try {
    console.log(`🎮 Processando imagens para: ${gameName}`);

    // Buscar imagens usando o sistema inteligente
    const searchResults = await intelligentImageSearch(gameName);

    if (!searchResults || searchResults.bestMatches.length === 0) {
      console.log(`   ⚠️  Nenhuma imagem encontrada para ${gameName}`);
      return null;
    }

    // Pegar o melhor resultado
    const bestMatch = searchResults.bestMatches[0];
    console.log(`   🎯 Melhor fonte: ${bestMatch.source} (confiança: ${(bestMatch.confidence * 100).toFixed(0)}%)`);

    const results = {
      gameName,
      gameId,
      source: bestMatch.source,
      confidence: bestMatch.confidence,
      images: {
        cover: null,
        gallery: [],
      },
    };

    // Processar capa
    if (bestMatch.images.cover) {
      console.log(`   🖼️  Processando capa...`);

      const coverFilename = `${gameName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_cover.jpg`;
      const downloadedCover = await downloadImage(bestMatch.images.cover, coverFilename);

      if (downloadedCover) {
        const uploadedCover = await uploadToStrapi(downloadedCover, gameName, 'cover');

        if (uploadedCover && gameId) {
          await associateImageToGame(gameId, uploadedCover, 'cover');
          results.images.cover = uploadedCover;
        }
      }
    }

    // Processar screenshots (máximo 5)
    if (bestMatch.images.screenshots && bestMatch.images.screenshots.length > 0) {
      console.log(`   📸 Processando screenshots...`);

      const screenshotsToProcess = bestMatch.images.screenshots.slice(0, 5);

      for (let i = 0; i < screenshotsToProcess.length; i++) {
        const screenshotUrl = screenshotsToProcess[i];
        const screenshotFilename = `${gameName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_screenshot_${i + 1}.jpg`;

        const downloadedScreenshot = await downloadImage(screenshotUrl, screenshotFilename);

        if (downloadedScreenshot) {
          const uploadedScreenshot = await uploadToStrapi(downloadedScreenshot, gameName, 'gallery');

          if (uploadedScreenshot && gameId) {
            await associateImageToGame(gameId, uploadedScreenshot, 'gallery');
            results.images.gallery.push(uploadedScreenshot);
          }
        }

        // Pausa entre downloads
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Processar artworks
    if (bestMatch.images.artworks && bestMatch.images.artworks.length > 0) {
      console.log(`   🎨 Processando artworks...`);

      const artworksToProcess = bestMatch.images.artworks.slice(0, 3);

      for (let i = 0; i < artworksToProcess.length; i++) {
        const artworkUrl = artworksToProcess[i];
        const artworkFilename = `${gameName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_artwork_${i + 1}.jpg`;

        const downloadedArtwork = await downloadImage(artworkUrl, artworkFilename);

        if (downloadedArtwork) {
          const uploadedArtwork = await uploadToStrapi(downloadedArtwork, gameName, 'gallery');

          if (uploadedArtwork && gameId) {
            await associateImageToGame(gameId, uploadedArtwork, 'gallery');
            results.images.gallery.push(uploadedArtwork);
          }
        }

        // Pausa entre downloads
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`   🎉 Processamento concluído para ${gameName}`);
    console.log(`      📊 Capa: ${results.images.cover ? '✅' : '❌'}`);
    console.log(`      📊 Galeria: ${results.images.gallery.length} imagens`);

    return results;
  } catch (error) {
    console.error(`❌ Erro ao processar ${gameName}:`, error.message);
    return null;
  }
}

// Função para processar todos os jogos
async function processAllGames() {
  try {
    console.log('🚀 Iniciando processamento de imagens para todos os jogos...\n');

    // Buscar todos os jogos
    const response = await axios.get(`${STRAPI_URL}/api/games?pagination[pageSize]=100`);
    const games = response.data.data;

    console.log(`📊 Total de jogos: ${games.length}`);

    const results = [];
    let processedCount = 0;
    let successCount = 0;

    for (const game of games) {
      processedCount++;
      console.log(`\n[${processedCount}/${games.length}] 🎮 ${game.name}`);

      const result = await processGameImages(game.name, game.id);

      if (result) {
        results.push(result);
        successCount++;
      }

      // Pausa entre jogos para não sobrecarregar
      if (processedCount < games.length) {
        console.log(`   ⏳ Aguardando 3 segundos...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Relatório final
    console.log('\n🏁 PROCESSAMENTO CONCLUÍDO!');
    console.log(`📊 RESUMO:`);
    console.log(`   🎮 Total de jogos: ${games.length}`);
    console.log(`   ✅ Processados com sucesso: ${successCount}`);
    console.log(`   ❌ Falhas: ${games.length - successCount}`);
    console.log(
      `   🖼️  Total de imagens baixadas: ${results.reduce((sum, r) => sum + r.images.gallery.length + (r.images.cover ? 1 : 0), 0)}`
    );

    // Salvar resultados
    const outputPath = path.join(__dirname, 'image-download-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Resultados salvos em: ${outputPath}`);

    return results;
  } catch (error) {
    console.error('❌ Erro ao processar todos os jogos:', error.message);
    return null;
  }
}

// Função para verificar status das imagens
async function checkImageStatus() {
  try {
    console.log('🔍 Verificando status das imagens...\n');

    const response = await axios.get(`${STRAPI_URL}/api/games?pagination[pageSize]=100&populate=*`);
    const games = response.data.data;

    console.log(`📊 Total de jogos: ${games.length}`);

    let gamesWithCover = 0;
    let gamesWithGallery = 0;
    let gamesWithoutImages = 0;

    for (const game of games) {
      const hasCover = game.cover?.data;
      const hasGallery = game.gallery?.data && game.gallery.data.length > 0;

      if (hasCover) gamesWithCover++;
      if (hasGallery) gamesWithGallery++;
      if (!hasCover && !hasGallery) gamesWithoutImages++;
    }

    console.log(`\n📊 STATUS DAS IMAGENS:`);
    console.log(
      `   🖼️  Jogos com capa: ${gamesWithCover}/${games.length} (${Math.round((gamesWithCover / games.length) * 100)}%)`
    );
    console.log(
      `   📸 Jogos com galeria: ${gamesWithGallery}/${games.length} (${Math.round((gamesWithGallery / games.length) * 100)}%)`
    );
    console.log(
      `   ❌ Jogos sem imagens: ${gamesWithoutImages}/${games.length} (${Math.round((gamesWithoutImages / games.length) * 100)}%)`
    );

    if (gamesWithoutImages > 0) {
      console.log(`\n🎯 JOGOS PRECISANDO DE IMAGENS:`);
      const gamesNeedingImages = games.filter(
        game => !game.cover?.data && (!game.gallery?.data || game.gallery.data.length === 0)
      );

      gamesNeedingImages.forEach((game, index) => {
        console.log(`   ${index + 1}. ${game.name} (ID: ${game.id})`);
      });

      console.log(`\n💡 RECOMENDAÇÃO: Executar processamento para ${gamesWithoutImages} jogos`);
    }
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error.message);
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('🚀 Sistema de Download e Integração de Imagens com Strapi');
    console.log('\n📋 USO:');
    console.log('   node scripts/strapi-image-downloader.js [opções]');
    console.log('\n🔧 OPÇÕES:');
    console.log('   <nome_do_jogo>     Processar imagens para jogo específico');
    console.log('   --all              Processar imagens para todos os jogos');
    console.log('   --status           Verificar status das imagens');
    console.log('   --test             Testar com jogo específico');
    console.log('\n💡 EXEMPLOS:');
    console.log('   node scripts/strapi-image-downloader.js "Cyberpunk 2077"');
    console.log('   node scripts/strapi-image-downloader.js --all');
    console.log('   node scripts/strapi-image-downloader.js --status');
    console.log('   node scripts/strapi-image-downloader.js --test');
    return;
  }

  if (args[0] === '--all') {
    await processAllGames();
  } else if (args[0] === '--status') {
    await checkImageStatus();
  } else if (args[0] === '--test') {
    console.log('🧪 Testando sistema de download...');
    const testGame = 'The Witcher 3';
    const results = await processGameImages(testGame);
    console.log('\n📊 RESULTADOS DO TESTE:');
    console.log(JSON.stringify(results, null, 2));
  } else {
    const gameName = args.join(' ');
    const results = await processGameImages(gameName);
    if (results) {
      console.log('\n📊 RESULTADOS:');
      console.log(JSON.stringify(results, null, 2));
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  processGameImages,
  processAllGames,
  checkImageStatus,
  downloadImage,
  uploadToStrapi,
  associateImageToGame,
};
