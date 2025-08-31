#!/usr/bin/env node

const axios = require('axios');
const FormData = require('form-data');

const STRAPI_URL = 'http://localhost:1337';

// Imagem PNG simples (1x1 pixel transparente)
const createSimpleImage = () => {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49,
    0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb0,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
};

async function uploadImageForGame(gameName) {
  try {
    console.log(`🎮 Fazendo upload da imagem para: ${gameName}`);

    // 1. Buscar o jogo pelo nome
    const gamesResponse = await axios.get(`${STRAPI_URL}/api/games`, {
      params: {
        'filters[name][$containsi]': gameName,
      },
    });

    if (gamesResponse.data.data.length === 0) {
      console.log(`❌ Jogo "${gameName}" não encontrado`);
      return;
    }

    const game = gamesResponse.data.data[0];
    console.log(`✅ Jogo encontrado: ${game.name} (ID: ${game.id})`);

    // 2. Verificar se já tem imagem
    if (game.cover) {
      console.log(`⚠️  Jogo já possui imagem`);
      return;
    }

    // 3. Criar imagem de teste
    console.log(`🎨 Criando imagem de teste...`);
    const imageBuffer = createSimpleImage();

    // 4. Fazer upload para o Strapi
    console.log(`📤 Fazendo upload da imagem...`);
    const formData = new FormData();
    formData.append('files', imageBuffer, {
      filename: `${game.slug}_cover.png`,
      contentType: 'image/png',
    });

    const uploadResponse = await axios({
      method: 'POST',
      url: `${STRAPI_URL}/api/upload`,
      data: formData,
      headers: formData.getHeaders(),
    });

    console.log(`✅ Upload realizado! ID: ${uploadResponse.data[0].id}`);
    console.log(`📁 Arquivo salvo: ${uploadResponse.data[0].url}`);

    // 5. Associar imagem ao jogo
    await axios.put(`${STRAPI_URL}/api/games/${game.documentId}`, {
      data: {
        cover: uploadResponse.data[0].id,
      },
    });

    console.log(`🎉 Imagem associada ao jogo "${game.name}"!`);

    // 6. Verificar se foi salvo
    const files = require('fs').readdirSync('./public/uploads');
    const newFiles = files.filter(f => f.includes(game.slug));
    console.log(`📁 Arquivos do jogo: ${newFiles}`);
  } catch (error) {
    console.error(`❌ Erro no upload para "${gameName}":`, {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const gameNames = process.argv.slice(2);

  if (gameNames.length === 0) {
    console.log(`
🎮 Uso: node scripts/upload-simple.js "Nome do Jogo 1" "Nome do Jogo 2"

Exemplos:
  node scripts/upload-simple.js "The Witcher 3: Wild Hunt"
  node scripts/upload-simple.js "Hollow Knight" "No Man's Sky"
    `);
    process.exit(1);
  }

  (async () => {
    for (const gameName of gameNames) {
      await uploadImageForGame(gameName);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  })();
}

module.exports = { uploadImageForGame };
