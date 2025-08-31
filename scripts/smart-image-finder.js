#!/usr/bin/env node

const axios = require('axios');
const FormData = require('form-data');

const STRAPI_URL = 'http://localhost:1337';

// Imagem genérica para jogos (placeholder profissional)
const createGenericImage = gameName => {
  // PNG de 400x600 pixels com design moderno
  const canvas = require('canvas');
  const { createCanvas } = canvas;

  const width = 400;
  const height = 600;
  const cvs = createCanvas(width, height);
  const ctx = cvs.getContext('2d');

  // Fundo gradiente moderno
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.5, '#16213e');
  gradient.addColorStop(1, '#0f3460');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Borda decorativa
  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Ícone de jogo
  ctx.fillStyle = '#e94560';
  ctx.font = 'bold 80px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🎮', width / 2, height / 2 - 50);

  // Nome do jogo
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';

  // Quebrar nome em linhas se necessário
  const words = gameName.split(' ');
  let line = '';
  let y = height / 2 + 20;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);

    if (metrics.width > width - 40 && line !== '') {
      ctx.fillText(line.trim(), width / 2, y);
      line = words[i] + ' ';
      y += 30;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), width / 2, y);

  // Texto "Imagem Genérica"
  ctx.fillStyle = '#888888';
  ctx.font = '16px Arial';
  ctx.fillText('Imagem Genérica', width / 2, height - 30);

  return cvs.toBuffer('image/png');
};

// Função para buscar imagens reais dos jogos
async function findRealGameImage(gameName) {
  const imageSources = [
    // Google Images (via proxy)
    `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(gameName + ' game cover')}&api_key=demo`,

    // Bing Images
    `https://api.bing.microsoft.com/v7.0/images/search?q=${encodeURIComponent(gameName + ' game cover')}`,

    // DuckDuckGo (via proxy)
    `https://api.duckduckgo.com/?q=${encodeURIComponent(gameName + ' game cover')}&format=json&no_html=1&skip_disambig=1`,

    // Wikipedia (para jogos famosos)
    `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(gameName)}`,

    // Steam (via proxy)
    `https://store.steampowered.com/api/appdetails?appids=${gameName.toLowerCase().replace(/\s+/g, '')}`,

    // IGDB (International Game Database)
    `https://api.igdb.com/v4/games?search=${encodeURIComponent(gameName)}&fields=cover.*,name`,

    // RAWG (RAWG Video Games Database)
    `https://api.rawg.io/api/games?search=${encodeURIComponent(gameName)}&key=demo`,
  ];

  for (const source of imageSources) {
    try {
      console.log(`  🔍 Tentando: ${source.split('?')[0]}...`);

      const response = await axios.get(source, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (response.data) {
        // Tentar extrair URL da imagem baseado na fonte
        let imageUrl = null;

        if (source.includes('serpapi.com')) {
          imageUrl = response.data.images_results?.[0]?.original;
        } else if (source.includes('bing.microsoft.com')) {
          imageUrl = response.data.value?.[0]?.contentUrl;
        } else if (source.includes('wikipedia.org')) {
          imageUrl = response.data.thumbnail?.source;
        } else if (source.includes('steampowered.com')) {
          imageUrl = response.data[Object.keys(response.data)[0]]?.data?.header_image;
        } else if (source.includes('igdb.com')) {
          imageUrl = response.data[0]?.cover?.url?.replace('t_thumb', 't_cover_big');
        } else if (source.includes('rawg.io')) {
          imageUrl = response.data.results?.[0]?.background_image;
        }

        if (imageUrl && imageUrl.startsWith('http')) {
          console.log(`  ✅ Imagem encontrada: ${imageUrl}`);
          return imageUrl;
        }
      }
    } catch (error) {
      console.log(`  ❌ Falhou: ${error.message}`);
    }

    // Aguardar entre tentativas
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return null;
}

// Função para baixar imagem da URL
async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    return Buffer.from(response.data);
  } catch (error) {
    throw new Error(`Erro ao baixar imagem: ${error.message}`);
  }
}

// Função principal para processar um jogo
async function processGameImage(game) {
  try {
    console.log(`🎮 Processando: ${game.name}`);

    // Verificar se já tem imagem
    if (game.cover) {
      console.log(`  ⚠️  Jogo já possui imagem, pulando...`);
      return { success: true, skipped: true };
    }

    // 1. Tentar encontrar imagem real
    console.log(`  🔍 Buscando imagem real...`);
    const realImageUrl = await findRealGameImage(game.name);

    let imageBuffer;
    let imageSource = 'genérica';

    if (realImageUrl) {
      try {
        console.log(`  📥 Baixando imagem real...`);
        imageBuffer = await downloadImage(realImageUrl);
        imageSource = 'real';
      } catch (error) {
        console.log(`  ❌ Falha ao baixar imagem real: ${error.message}`);
        console.log(`  🎨 Criando imagem genérica...`);
        imageBuffer = createGenericImage(game.name);
      }
    } else {
      console.log(`  🎨 Nenhuma imagem real encontrada, criando genérica...`);
      imageBuffer = createGenericImage(game.name);
    }

    // 2. Fazer upload para o Strapi
    console.log(`  📤 Fazendo upload...`);
    const formData = new FormData();
    formData.append('files', imageBuffer, {
      filename: `${game.slug}_cover_${Date.now()}.png`,
      contentType: 'image/png',
    });

    const uploadResponse = await axios({
      method: 'POST',
      url: `${STRAPI_URL}/api/upload`,
      data: formData,
      headers: formData.getHeaders(),
    });

    // 3. Associar imagem ao jogo
    await axios.put(`${STRAPI_URL}/api/games/${game.documentId}`, {
      data: {
        cover: uploadResponse.data[0].id,
      },
    });

    console.log(`  ✅ Concluído! Imagem ${imageSource}: ${uploadResponse.data[0].url}`);
    return { success: true, skipped: false, fileUrl: uploadResponse.data[0].url, source: imageSource };
  } catch (error) {
    console.error(`  ❌ Erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Função para processar todos os jogos
async function processAllGames() {
  try {
    console.log('🚀 Iniciando busca inteligente de imagens...\n');

    let page = 1;
    let hasMore = true;
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalSkipped = 0;
    let totalGeneric = 0;
    let totalReal = 0;

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
        const result = await processGameImage(game);
        totalProcessed++;

        if (result.success) {
          if (result.skipped) {
            totalSkipped++;
          } else {
            totalSuccess++;
            if (result.source === 'real') {
              totalReal++;
            } else {
              totalGeneric++;
            }
          }
        }

        // Aguardar entre jogos para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      page++;

      // Aguardar entre páginas
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Relatório final
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log(`🎮 Total processado: ${totalProcessed}`);
    console.log(`✅ Sucessos: ${totalSuccess}`);
    console.log(`⚠️  Pulados: ${totalSkipped}`);
    console.log(`🖼️  Imagens reais: ${totalReal}`);
    console.log(`🎨 Imagens genéricas: ${totalGeneric}`);

    // Verificar arquivos criados
    const fs = require('fs');
    const uploadsDir = './public/uploads';
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const gameFiles = files.filter(f => f.includes('_cover_'));
      console.log(`📁 Total de arquivos de capa: ${gameFiles.length}`);
    }
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const gameNames = process.argv.slice(2);

  if (gameNames.length === 0) {
    // Processar todos os jogos
    processAllGames();
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
          await processGameImage(game);
        } else {
          console.log(`❌ Jogo "${gameName}" não encontrado`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    })();
  }
}

module.exports = { processGameImage, processAllGames, findRealGameImage };
