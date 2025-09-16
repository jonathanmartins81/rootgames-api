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

    console.log(`✅ Cover criada: ${filename}`);
    return filePath;

  } catch (error) {
    console.log(`❌ Erro ao criar cover para ${gameName}:`, error.message);
    return null;
  }
}

// Função para criar imagens de gallery
async function createGalleryImages(gameName, gameSlug, count = 5) {
  try {
    const images = [];

    for (let i = 1; i <= count; i++) {
      // Criar canvas para cada imagem da gallery
      const width = 800;
      const height = 450;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Cor de fundo diferente para cada imagem
      const colors = ['#1e3a8a', '#7c3aed', '#dc2626', '#059669', '#d97706'];
      ctx.fillStyle = colors[(i - 1) % colors.length];
      ctx.fillRect(0, 0, width, height);

      // Gradiente
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, colors[(i - 1) % colors.length]);
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Borda decorativa
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, width - 4, height - 4);

      // Número da imagem
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${i}`, width / 2, height / 2);

      // Nome do jogo
      ctx.font = 'bold 24px Arial';
      ctx.fillText(gameName, width / 2, height - 50);

      // Salvar a imagem
      const filename = `${gameSlug}_gallery_${i}.png`;
      const filePath = path.join(UPLOADS_DIR, filename);

      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(filePath, buffer);

      images.push(filePath);
      console.log(`✅ Gallery ${i} criada: ${filename}`);
    }

    return images;

  } catch (error) {
    console.log(`❌ Erro ao criar gallery para ${gameName}:`, error.message);
    return [];
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

// Função para fazer upload múltiplo para gallery
async function uploadGalleryToStrapi(filePaths, gameId) {
  try {
    const FormData = require('form-data');
    const formData = new FormData();

    // Adicionar múltiplos arquivos
    filePaths.forEach(filePath => {
      formData.append('files', fs.createReadStream(filePath));
    });

    formData.append('refId', gameId);
    formData.append('ref', 'api::game.game');
    formData.append('field', 'gallery');

    const response = await axios.post(`${STRAPI_URL}/api/upload`, formData, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
      },
    });

    console.log(`✅ Gallery upload realizado: ${response.data.length} imagens`);
    return response.data;
  } catch (error) {
    console.log(`❌ Erro no upload da gallery:`, error.message);
    return [];
  }
}

// Função principal
async function createCompleteGameImages() {
  try {
    console.log('🎮 Iniciando criação completa de imagens para os jogos...\n');

    // Buscar todos os jogos
    const gamesResponse = await axios.get(`${STRAPI_URL}/api/games?pagination[pageSize]=100`);
    const games = gamesResponse.data.data;

    console.log(`📊 Encontrados ${games.length} jogos para processar\n`);

    for (const game of games) {
      const gameId = game.id;
      const gameName = game.attributes.name;
      const gameSlug = game.attributes.slug;

      console.log(`🎯 Processando: ${gameName}`);

      // Criar cover
      const coverPath = await createGameCover(gameName, gameSlug);

      if (coverPath) {
        // Fazer upload da cover
        const uploadedCover = await uploadToStrapi(coverPath, gameId, 'cover');

        if (uploadedCover) {
          console.log(`✅ Cover enviada com sucesso!`);
        }
      }

      // Criar gallery (5 imagens)
      const galleryPaths = await createGalleryImages(gameName, gameSlug, 5);

      if (galleryPaths.length > 0) {
        // Fazer upload da gallery
        const uploadedGallery = await uploadGalleryToStrapi(galleryPaths, gameId);

        if (uploadedGallery.length > 0) {
          console.log(`✅ Gallery enviada com sucesso!`);
        }
      }

      console.log('---');

      // Aguardar um pouco para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 Processo concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar o script
createCompleteGameImages();
