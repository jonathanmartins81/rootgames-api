#!/usr/bin/env node

const axios = require('axios');
const FormData = require('form-data');

const STRAPI_URL = 'http://localhost:1337';

// Imagem PNG simples
const createSimpleImage = () => {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49,
    0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb0,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
};

async function uploadImageForGame(game) {
  try {
    console.log(`🎮 Processando: ${game.name}`);

    // Verificar se já tem imagem
    if (game.cover) {
      console.log(`  ⏭️  Já possui imagem, pulando...`);
      return { success: true, skipped: true };
    }

    // Criar imagem de teste
    const imageBuffer = createSimpleImage();

    // Fazer upload para o Strapi
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

    // Associar imagem ao jogo
    await axios.put(`${STRAPI_URL}/api/games/${game.documentId}`, {
      data: {
        cover: uploadResponse.data[0].id,
      },
    });

    console.log(`  ✅ Upload concluído! Arquivo: ${uploadResponse.data[0].url}`);
    return { success: true, skipped: false, fileUrl: uploadResponse.data[0].url };
  } catch (error) {
    console.error(`  ❌ Erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function uploadAllGames() {
  try {
    console.log('🚀 Iniciando upload de imagens para todos os jogos...');

    // Buscar todos os jogos
    let page = 1;
    let hasMore = true;
    let totalProcessed = 0;
    let totalUploaded = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    while (hasMore) {
      console.log(`\n📄 Processando página ${page}...`);

      const gamesResponse = await axios.get(`${STRAPI_URL}/api/games`, {
        params: {
          'pagination[page]': page,
          'pagination[pageSize]': 25,
          populate: 'cover',
        },
      });

      const games = gamesResponse.data.data;
      const meta = gamesResponse.data.meta;

      console.log(`📊 Encontrados ${games.length} jogos nesta página`);

      for (const game of games) {
        const result = await uploadImageForGame(game);
        totalProcessed++;

        if (result.success) {
          if (result.skipped) {
            totalSkipped++;
          } else {
            totalUploaded++;
          }
        } else {
          totalErrors++;
        }

        // Aguardar entre uploads para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Verificar se há mais páginas
      hasMore = page < meta.pagination.pageCount;
      page++;
    }

    console.log(`\n🎉 Processamento concluído!`);
    console.log(`📊 Estatísticas:`);
    console.log(`   Total processado: ${totalProcessed}`);
    console.log(`   Uploads realizados: ${totalUploaded}`);
    console.log(`   Pulados (já tinham imagem): ${totalSkipped}`);
    console.log(`   Erros: ${totalErrors}`);

    // Verificar arquivos na pasta
    const files = require('fs').readdirSync('./public/uploads');
    const gameFiles = files.filter(f => f.includes('_cover_'));
    console.log(`📁 Total de arquivos de capa: ${gameFiles.length}`);
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  uploadAllGames();
}

module.exports = { uploadAllGames, uploadImageForGame };
