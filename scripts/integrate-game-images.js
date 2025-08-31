#!/usr/bin/env node

const axios = require('axios');
const FormData = require('form-data');

const STRAPI_URL = 'http://localhost:1337';
const IMAGES_API_URL = 'http://localhost:3001';

// Função para baixar imagem da URL
async function downloadImage(url) {
  try {
    console.log(`  📥 Baixando imagem de: ${url}`);

    // Verificar se a URL é válida
    if (!url || !url.startsWith('http')) {
      throw new Error('URL inválida');
    }

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    console.log(`  ✅ Imagem baixada com sucesso! Tamanho: ${(response.data.length / 1024).toFixed(1)}KB`);
    return Buffer.from(response.data);
  } catch (error) {
    throw new Error(`Erro ao baixar imagem: ${error.message}`);
  }
}

// Função para fazer upload da imagem para o Strapi
async function uploadImageToStrapi(imageBuffer, filename, contentType = 'image/jpeg') {
  try {
    console.log(`  📤 Fazendo upload para Strapi...`);

    const formData = new FormData();
    formData.append('files', imageBuffer, {
      filename,
      contentType,
    });

    const uploadResponse = await axios({
      method: 'POST',
      url: `${STRAPI_URL}/api/upload`,
      data: formData,
      headers: formData.getHeaders(),
    });

    console.log(`  ✅ Upload realizado! ID: ${uploadResponse.data[0].id}`);
    return uploadResponse.data[0];
  } catch (error) {
    throw new Error(`Erro no upload: ${error.message}`);
  }
}

// Função para associar imagem ao jogo no Strapi
async function associateImageWithGame(gameDocumentId, imageId, imageType = 'cover') {
  try {
    console.log(`  🔗 Associando ${imageType} ao jogo...`);

    const updateData = {};
    updateData[imageType] = imageId;

    await axios.put(`${STRAPI_URL}/api/games/${gameDocumentId}`, {
      data: updateData,
    });

    console.log(`  ✅ ${imageType} associado com sucesso!`);
    return true;
  } catch (error) {
    throw new Error(`Erro ao associar ${imageType}: ${error.message}`);
  }
}

// Função para verificar se a URL da imagem é válida
async function validateImageUrl(url) {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
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

// Função principal para processar um jogo
async function processGameWithImages(game) {
  try {
    console.log(`🎮 Processando: ${game.name}`);

    // Verificar se já tem imagem
    if (game.cover) {
      console.log(`  ⚠️  Jogo já possui imagem, pulando...`);
      return { success: true, skipped: true };
    }

    // 1. Buscar imagens na API
    console.log(`  🔍 Buscando imagens na API...`);
    let imagesResponse;
    try {
      imagesResponse = await axios.get(`${IMAGES_API_URL}/api/game-images`, {
        params: { name: game.name },
        timeout: 10000,
      });
    } catch (error) {
      console.log(`  ❌ Erro ao buscar imagens: ${error.message}`);
      return { success: false, error: `Erro na API: ${error.message}` };
    }

    if (!imagesResponse.data || !imagesResponse.data.success) {
      console.log(`  ❌ Imagens não encontradas para: ${game.name}`);
      return { success: false, error: 'Imagens não encontradas' };
    }

    const gameImages = imagesResponse.data;
    console.log(`  ✅ Imagens encontradas! Fonte: ${gameImages.source}`);

    if (gameImages.matchType === 'similar') {
      console.log(`  🔍 Usando jogo similar: ${gameImages.matchedName}`);
    }

    // 2. Baixar imagem de capa
    let coverImage = null;
    if (gameImages.cover) {
      try {
        // Validar URL antes de baixar
        const isValidUrl = await validateImageUrl(gameImages.cover);
        if (!isValidUrl) {
          console.log(`  ⚠️  URL da capa inválida, pulando...`);
        } else {
          const coverBuffer = await downloadImage(gameImages.cover);
          coverImage = await uploadImageToStrapi(
            coverBuffer,
            `${game.slug || game.name.replace(/[^a-zA-Z0-9]/g, '_')}_cover_real.png`,
            'image/png'
          );

          // 3. Associar capa ao jogo
          await associateImageWithGame(game.documentId, coverImage.id, 'cover');

          console.log(`  🎉 Capa real associada ao jogo!`);
        }
      } catch (error) {
        console.log(`  ❌ Erro na capa: ${error.message}`);
        console.log(`  🎨 Continuando com galeria...`);
      }
    }

    // 4. Processar galeria (opcional)
    const galleryImages = [];
    if (gameImages.gallery && gameImages.gallery.length > 0) {
      console.log(`  🖼️  Processando galeria (${gameImages.gallery.length} imagens)...`);

      for (let i = 0; i < Math.min(gameImages.gallery.length, 3); i++) {
        try {
          // Validar URL antes de baixar
          const isValidUrl = await validateImageUrl(gameImages.gallery[i]);
          if (!isValidUrl) {
            console.log(`  ⚠️  URL da galeria ${i + 1} inválida, pulando...`);
            continue;
          }

          const galleryBuffer = await downloadImage(gameImages.gallery[i]);
          const galleryImage = await uploadImageToStrapi(
            galleryBuffer,
            `${game.slug || game.name.replace(/[^a-zA-Z0-9]/g, '_')}_gallery_${i + 1}.png`,
            'image/png'
          );

          galleryImages.push(galleryImage);
          console.log(`  ✅ Imagem ${i + 1} da galeria processada`);

          // Aguardar entre downloads para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.log(`  ❌ Erro na imagem ${i + 1} da galeria: ${error.message}`);
        }
      }
    }

    return {
      success: true,
      skipped: false,
      coverImage: coverImage?.url,
      galleryImages: galleryImages.map(img => img.url),
      source: gameImages.source,
      matchType: gameImages.matchType,
      matchedName: gameImages.matchedName,
    };
  } catch (error) {
    console.error(`  ❌ Erro geral: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Função para processar todos os jogos
async function processAllGamesWithImages() {
  try {
    console.log('🚀 Iniciando integração com API de imagens...\n');

    let page = 1;
    let hasMore = true;
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalSkipped = 0;
    let totalWithRealImages = 0;
    let totalWithSimilarImages = 0;

    while (hasMore) {
      console.log(`📄 Processando página ${page}...`);

      const gamesResponse = await axios.get(`${STRAPI_URL}/api/games`, {
        params: {
          'pagination[page]': page,
          'pagination[pageSize]': 10,
          populate: 'cover',
        },
      });

      if (gamesResponse.data.data.length === 0) {
        hasMore = false;
        break;
      }

      for (const game of gamesResponse.data.data) {
        const result = await processGameWithImages(game);
        totalProcessed++;

        if (result.success) {
          if (result.skipped) {
            totalSkipped++;
          } else {
            totalSuccess++;
            if (result.coverImage) {
              totalWithRealImages++;
              if (result.matchType === 'similar') {
                totalWithSimilarImages++;
              }
            }
          }
        }

        // Aguardar entre jogos para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      page++;

      // Aguardar entre páginas
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Relatório final
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log(`🎮 Total processado: ${totalProcessed}`);
    console.log(`✅ Sucessos: ${totalSuccess}`);
    console.log(`⚠️  Pulados: ${totalSkipped}`);
    console.log(`🖼️  Com imagens reais: ${totalWithRealImages}`);
    console.log(`🔍 Com imagens similares: ${totalWithSimilarImages}`);
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Função para processar um jogo específico
async function processGameImage(game) {
  return await processGameWithImages(game);
}

// Executar se chamado diretamente
if (require.main === module) {
  const gameNames = process.argv.slice(2);

  if (gameNames.length === 0) {
    // Processar todos os jogos
    processAllGamesWithImages();
  } else {
    // Processar jogos específicos
    (async () => {
      for (const gameName of gameNames) {
        const gamesResponse = await axios.get(`${STRAPI_URL}/api/games`, {
          params: {
            'filters[name][$containsi]': gameName,
            populate: 'cover',
          },
        });

        if (gamesResponse.data.data.length > 0) {
          const game = gamesResponse.data.data[0];
          await processGameWithImages(game);
        } else {
          console.log(`❌ Jogo "${gameName}" não encontrado`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    })();
  }
}

module.exports = { processGameImage, processAllGamesWithImages, processGameWithImages };
