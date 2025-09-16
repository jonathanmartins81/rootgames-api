const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Configurações
const STRAPI_URL = 'http://localhost:1337';
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

// Função para criar imagem de capa personalizada
async function createGameCover(gameName, gameSlug) {
  try {
    // Criar canvas
    const width = 400;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Cor de fundo (verde da bandeira brasileira)
    ctx.fillStyle = '#009c3b';
    ctx.fillRect(0, 0, width, height);

    // Gradiente para dar profundidade
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#009c3b');
    gradient.addColorStop(1, '#006400');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Borda decorativa
    ctx.strokeStyle = '#ffdf00';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    // Círculo decorativo (como a bandeira brasileira)
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 80, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffdf00';
    ctx.fill();

    // Texto do título do jogo
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';

    // Quebrar o título em linhas se necessário
    const words = gameName.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);

      if (metrics.width > width - 40) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine.trim());

    // Desenhar as linhas de texto
    const lineHeight = 30;
    const startY = height / 2 + 120;

    lines.forEach((line, index) => {
      const y = startY + (index * lineHeight);
      ctx.fillText(line, width / 2, y);
    });

    // Adicionar "GAME" na parte inferior
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#ffdf00';
    ctx.fillText('GAME', width / 2, height - 60);

    // Salvar a imagem
    const filename = `${gameSlug}_cover.png`;
    const filePath = path.join(UPLOADS_DIR, filename);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filePath, buffer);

    console.log(`✅ Imagem criada: ${filename}`);
    return filePath;

  } catch (error) {
    console.log(`❌ Erro ao criar imagem para ${gameName}:`, error.message);
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

// Função principal
async function createAndUploadGameCovers() {
  try {
    console.log('🎮 Iniciando criação e upload de capas dos jogos...\n');

    // Buscar todos os jogos
    const gamesResponse = await axios.get(`${STRAPI_URL}/api/games?pagination[pageSize]=100`);
    const games = gamesResponse.data.data;

    console.log(`📊 Encontrados ${games.length} jogos para processar\n`);

    for (const game of games) {
      const gameId = game.id;
      const gameName = game.attributes.name;
      const gameSlug = game.attributes.slug;

      console.log(`🎯 Processando: ${gameName}`);

      // Criar imagem de capa personalizada
      const imagePath = await createGameCover(gameName, gameSlug);

      if (imagePath) {
        // Fazer upload para o Strapi
        const uploadedFile = await uploadToStrapi(imagePath, gameId, 'cover');

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
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log('---');
    }

    console.log('\n🎉 Processo concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar o script
createAndUploadGameCovers();
