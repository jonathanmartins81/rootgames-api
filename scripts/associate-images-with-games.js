const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configurações
const STRAPI_URL = 'http://localhost:1337';
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

// Função para buscar jogos
async function getGames() {
  try {
    const response = await axios.get(`${STRAPI_URL}/api/games?pagination[pageSize]=100`);
    return response.data.data;
  } catch (error) {
    console.log('❌ Erro ao buscar jogos:', error.message);
    return [];
  }
}

// Função para buscar arquivos de upload
async function getUploadFiles() {
  try {
    const response = await axios.get(`${STRAPI_URL}/api/upload/files`);
    return response.data;
  } catch (error) {
    console.log('❌ Erro ao buscar arquivos de upload:', error.message);
    return [];
  }
}

// Função para associar imagem ao jogo
async function associateImageWithGame(gameId, imageId) {
  try {
    const response = await axios.put(`${STRAPI_URL}/api/games/${gameId}`, {
      data: {
        cover: imageId
      }
    });
    return response.data;
  } catch (error) {
    console.log(`❌ Erro ao associar imagem ao jogo ${gameId}:`, error.message);
    return null;
  }
}

// Função principal
async function associateImagesWithGames() {
  try {
    console.log('🎮 Iniciando associação de imagens aos jogos...\n');

    // Buscar jogos e arquivos de upload
    const games = await getGames();
    const uploadFiles = await getUploadFiles();

    console.log(`📊 Encontrados ${games.length} jogos`);
    console.log(`🖼️ Encontrados ${uploadFiles.length} arquivos de upload\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const game of games) {
      const gameId = game.id;
      const gameName = game.attributes.name;
      const gameSlug = game.attributes.slug;

      console.log(`🎯 Processando: ${gameName}`);

      // Buscar arquivo de upload correspondente
      const matchingFile = uploadFiles.find(file =>
        file.name.includes(gameSlug) && file.name.includes('cover')
      );

      if (matchingFile) {
        console.log(`✅ Imagem encontrada: ${matchingFile.name}`);

        // Associar imagem ao jogo
        const result = await associateImageWithGame(gameId, matchingFile.id);

        if (result) {
          console.log(`✅ Imagem associada com sucesso!`);
          successCount++;
        } else {
          console.log(`❌ Falha ao associar imagem`);
          errorCount++;
        }
      } else {
        console.log(`⚠️ Nenhuma imagem encontrada para: ${gameSlug}`);
        errorCount++;
      }

      console.log('---');

      // Aguardar um pouco para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n🎉 Processo concluído!');
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar o script
associateImagesWithGames();
