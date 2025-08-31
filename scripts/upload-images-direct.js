#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const STRAPI_URL = 'http://localhost:1337';
const UPLOADS_DIR = '/home/jonathan/Workspace/Development/rootgames/rootgames-api/public/uploads';

// Função para fazer upload de imagem para o Strapi
async function uploadImageToStrapi(imagePath) {
  try {
    const formData = new FormData();
    formData.append('files', fs.createReadStream(imagePath));

    const response = await axios.post(`${STRAPI_URL}/api/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });

    if (response.data && response.data.length > 0) {
      return response.data[0];
    }

    throw new Error('Resposta inválida do Strapi');
  } catch (error) {
    throw new Error(`Erro no upload: ${error.message}`);
  }
}

// Função para atualizar jogo com imagem
async function updateGameWithImage(gameId, imageData, imageType) {
  try {
    const updateData = {};

    if (imageType === 'cover') {
      updateData.cover = imageData;
    } else if (imageType === 'gallery') {
      updateData.gallery = [imageData];
    }

    const response = await axios.put(`${STRAPI_URL}/api/games/${gameId}`, updateData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    return response.data;
  } catch (error) {
    throw new Error(`Erro ao atualizar jogo: ${error.message}`);
  }
}

// Função para buscar jogos no Strapi
async function getStrapiGames() {
  try {
    const response = await axios.get(`${STRAPI_URL}/api/games?pagination[pageSize]=100`);
    return response.data.data;
  } catch (error) {
    throw new Error(`Erro ao buscar jogos no Strapi: ${error.message}`);
  }
}

// Função para encontrar diretório correspondente ao jogo
function findGameDirectory(gameName, uploadDirs) {
  const normalizedGameName = gameName
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_');

  return uploadDirs.find(dir => {
    const normalizedDir = dir.toLowerCase();
    return (
      normalizedDir.includes(normalizedGameName) ||
      normalizedGameName.includes(normalizedDir) ||
      normalizedDir.includes(normalizedGameName.replace(/_/g, ''))
    );
  });
}

// Função para processar um jogo
async function processGame(game, uploadDirs) {
  console.log(`🎮 Processando: ${game.name}`);

  try {
    // Encontrar diretório correspondente
    const gameDir = findGameDirectory(game.name, uploadDirs);

    if (!gameDir) {
      console.log(`  ⚠️ Nenhum diretório encontrado para: ${game.name}`);
      return { success: false, reason: 'Diretório não encontrado' };
    }

    const gameDirPath = path.join(UPLOADS_DIR, gameDir);
    const dirContents = fs.readdirSync(gameDirPath);

    // Filtrar apenas imagens
    const images = dirContents.filter(item => item.endsWith('.jpg') || item.endsWith('.png') || item.endsWith('.jpeg'));

    if (images.length === 0) {
      console.log(`  ⚠️ Nenhuma imagem encontrada em: ${gameDir}`);
      return { success: false, reason: 'Nenhuma imagem encontrada' };
    }

    console.log(`  📁 Diretório: ${gameDir}`);
    console.log(`  📸 Imagens encontradas: ${images.length}`);

    let uploadedCount = 0;
    let coverUploaded = false;

    // Processar cada imagem
    for (const image of images) {
      const imagePath = path.join(gameDirPath, image);
      const imageName = path.parse(image).name;

      try {
        // Determinar tipo de imagem
        let imageType = 'gallery';
        if (
          imageName.toLowerCase().includes('cover') ||
          imageName.toLowerCase().includes('capa') ||
          imageName.toLowerCase().includes('header') ||
          imageName.toLowerCase().includes('main')
        ) {
          imageType = 'cover';
        }

        // Fazer upload para o Strapi
        console.log(`    📤 Fazendo upload de: ${image} (${imageType})`);
        const uploadedImage = await uploadImageToStrapi(imagePath, game.name);

        // Atualizar jogo no Strapi
        await updateGameWithImage(game.id, uploadedImage, imageType);

        console.log(`    ✅ Upload concluído: ${image}`);
        uploadedCount++;

        if (imageType === 'cover') {
          coverUploaded = true;
        }

        // Aguardar entre uploads para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.log(`    ❌ Erro no upload de ${image}: ${error.message}`);
      }
    }

    if (uploadedCount > 0) {
      console.log(`  ✅ Total de imagens enviadas: ${uploadedCount}`);
      return {
        success: true,
        uploadedCount,
        hasCover: coverUploaded,
      };
    } else {
      console.log(`  ❌ Nenhuma imagem foi enviada`);
      return { success: false, reason: 'Nenhuma imagem foi enviada' };
    }
  } catch (error) {
    console.log(`  ❌ Erro ao processar jogo: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

// Função principal
async function uploadImagesDirect() {
  console.log('🚀 Iniciando upload direto de imagens para o Strapi...\n');

  try {
    // Verificar se o Strapi está rodando
    await axios.get(`${STRAPI_URL}/_health`);
    console.log('✅ Strapi está rodando\n');

    // Buscar jogos no Strapi
    console.log('📊 Buscando jogos no Strapi...');
    const strapiGames = await getStrapiGames();
    console.log(`✅ ${strapiGames.length} jogos encontrados no Strapi\n`);

    // Listar diretórios de uploads
    console.log('📁 Verificando diretórios de imagens...');
    const uploadDirs = fs.readdirSync(UPLOADS_DIR).filter(item => {
      if (item === '.' || item === '..') return false;
      const itemPath = path.join(UPLOADS_DIR, item);
      return fs.statSync(itemPath).isDirectory();
    });
    console.log(`✅ ${uploadDirs.length} diretórios de imagens encontrados\n`);

    // Processar cada jogo
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalImages = 0;
    let gamesWithCover = 0;

    console.log('🔄 Processando jogos...\n');

    for (const game of strapiGames) {
      const result = await processGame(game, uploadDirs);
      totalProcessed++;

      if (result.success) {
        totalSuccess++;
        totalImages += result.uploadedCount;
        if (result.hasCover) {
          gamesWithCover++;
        }
      }

      console.log(''); // Linha em branco entre jogos

      // Aguardar entre jogos para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Relatório final
    console.log('📊 RELATÓRIO FINAL:');
    console.log(`🎮 Total de jogos processados: ${totalProcessed}`);
    console.log(`✅ Jogos com sucesso: ${totalSuccess}`);
    console.log(`📸 Total de imagens enviadas: ${totalImages}`);
    console.log(`🖼️ Jogos com capa: ${gamesWithCover}`);
    console.log(`❌ Jogos com falha: ${totalProcessed - totalSuccess}`);

    if (totalSuccess > 0) {
      console.log(`\n🎉 Upload direto concluído com sucesso!`);
      console.log(`📊 Taxa de sucesso: ${((totalSuccess / totalProcessed) * 100).toFixed(1)}%`);
    } else {
      console.log(`\n⚠️ Nenhuma imagem foi enviada`);
    }
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  uploadImagesDirect().catch(console.error);
}

module.exports = { uploadImagesDirect };
