const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configurações
const STRAPI_URL = 'http://localhost:1337';
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

// Função para baixar imagem
async function downloadImage(url, filename) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, response.data);
    console.log(`✅ Imagem baixada: ${filename}`);
    return filePath;
  } catch (error) {
    console.log(`❌ Erro ao baixar ${filename}:`, error.message);
    return null;
  }
}

// Função para fazer upload para o Strapi
async function uploadToStrapi(filePath, gameId, field = 'cover') {
  try {
    const FormData = require('form-data');
    const formData = new FormData();

    formData.append('files', fs.createReadStream(filePath));
    formData.append('refId', gameId);
    formData.append('ref', 'api::game.game');
    formData.append('field', field);

    const response = await axios.post(`${STRAPI_URL}/api/upload`, formData, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
      },
    });

    console.log(`✅ Upload realizado para ${field}: ${response.data[0].name}`);
    return response.data[0];
  } catch (error) {
    console.log(`❌ Erro no upload para ${field}:`, error.message);
    return null;
  }
}

// Função para buscar imagens na internet
async function searchGameImage(gameName) {
  try {
    // Usar DuckDuckGo Instant Answer API para buscar imagens
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(gameName + ' game cover')}&format=json&no_html=1&skip_disambig=1`;

    const response = await axios.get(searchUrl);
    const data = response.data;

    if (data.Image && data.Image !== '') {
      return `https://duckduckgo.com${data.Image}`;
    }

    // Fallback: usar uma imagem placeholder baseada no nome do jogo
    const searchTerm = encodeURIComponent(gameName + ' game cover');
    return `https://via.placeholder.com/400x600/0066cc/ffffff?text=${encodeURIComponent(gameName)}`;

  } catch (error) {
    console.log(`❌ Erro ao buscar imagem para ${gameName}:`, error.message);
    // Retornar imagem placeholder como fallback
    return `https://via.placeholder.com/400x600/0066cc/ffffff?text=${encodeURIComponent(gameName)}`;
  }
}

// Função principal
async function downloadAndUploadGameImages() {
  try {
    console.log('🎮 Iniciando download e upload de imagens dos jogos...\n');

    // Buscar todos os jogos
    const gamesResponse = await axios.get(`${STRAPI_URL}/api/games?pagination[pageSize]=100`);
    const games = gamesResponse.data.data;

    console.log(`📊 Encontrados ${games.length} jogos para processar\n`);

    for (const game of games) {
      const gameId = game.id;
      const gameName = game.attributes.name;
      const gameSlug = game.attributes.slug;

      console.log(`🎯 Processando: ${gameName}`);

      // Buscar imagem na internet
      const imageUrl = await searchGameImage(gameName);

      if (imageUrl) {
        // Gerar nome do arquivo
        const ext = imageUrl.includes('placeholder') ? 'jpg' : 'jpg';
        const filename = `${gameSlug}_cover.${ext}`;

        // Baixar imagem
        const downloadedPath = await downloadImage(imageUrl, filename);

        if (downloadedPath) {
          // Fazer upload para o Strapi
          const uploadedFile = await uploadToStrapi(downloadedPath, gameId, 'cover');

          if (uploadedFile) {
            // Atualizar o jogo com a referência da imagem
            try {
              await axios.put(`${STRAPI_URL}/api/games/${gameId}`, {
                data: {
                  cover: uploadedFile.id
                }
              });
              console.log(`✅ Jogo atualizado com imagem: ${gameName}`);
            } catch (updateError) {
              console.log(`⚠️ Erro ao atualizar jogo ${gameName}:`, updateError.message);
            }
          }

          // Aguardar um pouco para não sobrecarregar a API
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log('---');
    }

    console.log('\n🎉 Processo concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar o script
downloadAndUploadGameImages();
