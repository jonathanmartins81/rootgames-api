#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const STRAPI_URL = 'http://localhost:1337';

// Configuração de pastas
const TEMP_DIR = path.join(__dirname, '../temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Banco de dados de App IDs do Steam para jogos conhecidos
const STEAM_APP_IDS = {
  'Stardew Valley': '413150',
  'Dark Souls III': '374320',
  Hades: '1145360',
  'Disco Elysium': '632470',
  "Sid Meier's Civilization VI": '289070',
  "Baldur's Gate 3": '1086940',
  'Control Ultimate Edition': '870780',
  'Monster Hunter: World': '582010',
  'Hollow Knight': '367520',
  'Payday 2': '218620',
  'Hotline Miami': '219150',
  'Dragon Age: Origins': '17450',
  Subnautica: '264710',
  'Shadowrun Trilogy': '234650',
  'Pillars of Eternity': '291650',
  'Dead Cells': '588650',
  'Age of Wonders III': '226840',
  'Into the Breach': '590380',
  'Ori and the Will of the Wisps': '1057090',
  'Metro Exodus': '412020',
  'Outer Wilds': '753640',
  GreedFall: '606880',
  'Torchlight II': '200710',
  Celeste: '504230',
  'Project Zomboid': '108600',
  'Deus Ex: Mankind Divided': '337000',
  'Warhammer: Vermintide 2': '552500',
  'Papers, Please': '354060',
  'The Outer Worlds': '578650',
  'Divinity: Original Sin 2': '435150',
  'Fallout 4: Game of the Year Edition': '377160',
  'DOOM Eternal': '782330',
  "No Man's Sky": '275850',
  'The Long Dark': '305620',
  Frostpunk: '323190',
  'Kingdom Come: Deliverance': '379430',
  'Slay the Spire': '646570',
  'THIEF Gold Edition': '211600',
  'Euro Truck Simulator 2': '227300',
  'System Shock: Enhanced Edition': '410710',
  'Dead Island Definitive Edition': '383180',
  'Shadow Warrior 2': '324800',
  'Resident Evil 2': '883710',
  'Frostpunk: Game of the Year Edition': '323190',
  'Divinity: Original Sin - Enhanced Edition': '373420',
  Factorio: '427520',
  'Pillars of Eternity II: Deadfire': '560130',
  'Age of Empires II: Definitive Edition': '813780',
  'Jurassic Park: The Game': '201870',
  'Cyberpunk 2077': '1091500',
  'The Witcher 3: Wild Hunt': '292030',
  'Vampire: The Masquerade - Bloodlines': '2600',
  'The Talos Principle': '257510',
};

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

    // Usar FormData para upload
    const FormData = require('form-data');
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

    const updateData = {};

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

// Função para buscar imagens do Steam
async function getSteamImages(gameName) {
  try {
    const appId = STEAM_APP_IDS[gameName];
    if (!appId) {
      console.log(`   ⚠️  App ID do Steam não encontrado para: ${gameName}`);
      return null;
    }

    console.log(`   🔍 Buscando imagens do Steam para: ${gameName} (App ID: ${appId})`);

    // Buscar detalhes do jogo na Steam
    const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}`);

    if (!response.data[appId] || !response.data[appId].success) {
      console.log(`   ❌ Jogo não encontrado na Steam: ${gameName}`);
      return null;
    }

    const gameData = response.data[appId].data;

    const images = {
      cover: gameData.header_image,
      screenshots: [],
      artworks: [],
    };

    // Buscar screenshots
    if (gameData.screenshots) {
      images.screenshots = gameData.screenshots.slice(0, 5).map(ss => ss.full);
    }

    // Buscar artworks (se disponível)
    if (gameData.background) {
      images.artworks.push(gameData.background);
    }

    console.log(`   ✅ Steam: ${images.screenshots.length} screenshots, ${images.artworks.length} artworks`);
    return images;
  } catch (error) {
    console.log(`   ❌ Erro ao buscar imagens do Steam: ${error.message}`);
    return null;
  }
}

// Função para processar um jogo específico
async function processGameImages(gameName, gameId) {
  try {
    console.log(`🎮 Processando imagens para: ${gameName}`);

    // Buscar imagens do Steam
    const steamImages = await getSteamImages(gameName);

    if (!steamImages) {
      console.log(`   ⚠️  Nenhuma imagem encontrada para ${gameName}`);
      return null;
    }

    const results = {
      gameName,
      gameId,
      source: 'Steam Store',
      images: {
        cover: null,
        gallery: [],
      },
    };

    // Processar capa
    if (steamImages.cover) {
      console.log(`   🖼️  Processando capa...`);

      const coverFilename = `${gameName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_cover.jpg`;
      const downloadedCover = await downloadImage(steamImages.cover, coverFilename);

      if (downloadedCover) {
        const uploadedCover = await uploadToStrapi(downloadedCover, gameName, 'cover');

        if (uploadedCover && gameId) {
          await associateImageToGame(gameId, uploadedCover, 'cover');
          results.images.cover = uploadedCover;
        }
      }
    }

    // Processar screenshots (máximo 5)
    if (steamImages.screenshots && steamImages.screenshots.length > 0) {
      console.log(`   📸 Processando screenshots...`);

      const screenshotsToProcess = steamImages.screenshots.slice(0, 5);

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
    if (steamImages.artworks && steamImages.artworks.length > 0) {
      console.log(`   🎨 Processando artworks...`);

      for (let i = 0; i < steamImages.artworks.length; i++) {
        const artworkUrl = steamImages.artworks[i];
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
    console.log('🚀 Iniciando download de imagens do Steam para todos os jogos...\n');

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
    console.log('\n🏁 DOWNLOAD CONCLUÍDO!');
    console.log(`📊 RESUMO:`);
    console.log(`   🎮 Total de jogos: ${games.length}`);
    console.log(`   ✅ Processados com sucesso: ${successCount}`);
    console.log(`   ❌ Falhas: ${games.length - successCount}`);
    console.log(
      `   🖼️  Total de imagens baixadas: ${results.reduce((sum, r) => sum + r.images.gallery.length + (r.images.cover ? 1 : 0), 0)}`
    );

    // Salvar resultados
    const outputPath = path.join(__dirname, 'steam-download-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Resultados salvos em: ${outputPath}`);

    return results;
  } catch (error) {
    console.error('❌ Erro ao processar todos os jogos:', error.message);
    return null;
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('🚀 Steam Image Downloader para Strapi');
    console.log('\n📋 USO:');
    console.log('   node scripts/steam-image-downloader.js [opções]');
    console.log('\n🔧 OPÇÕES:');
    console.log('   <nome_do_jogo>     Processar imagens para jogo específico');
    console.log('   --all              Processar imagens para todos os jogos');
    console.log('   --test             Testar com jogo específico');
    console.log('\n💡 EXEMPLOS:');
    console.log('   node scripts/steam-image-downloader.js "Cyberpunk 2077"');
    console.log('   node scripts/steam-image-downloader.js --all');
    console.log('   node scripts/steam-image-downloader.js --test');
    return;
  }

  if (args[0] === '--all') {
    await processAllGames();
  } else if (args[0] === '--test') {
    console.log('🧪 Testando download do Steam...');
    const testGame = 'The Witcher 3: Wild Hunt';
    const results = await processGameImages(testGame, 53);
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
  getSteamImages,
  downloadImage,
  uploadToStrapi,
  associateImageToGame,
};
