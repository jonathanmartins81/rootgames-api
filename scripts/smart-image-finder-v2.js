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

// Função para buscar imagens reais dos jogos (fontes gratuitas)
async function findRealGameImage(gameName) {
  console.log(`  🔍 Buscando imagem real para: "${gameName}"`);

  // 1. Tentar Wikipedia (fonte gratuita e confiável)
  try {
    console.log(`    📚 Tentando Wikipedia...`);
    const wikiResponse = await axios.get(
      `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(gameName)}`,
      {
        timeout: 5000,
      }
    );

    if (wikiResponse.data.thumbnail?.source) {
      console.log(`    ✅ Imagem encontrada na Wikipedia!`);
      return wikiResponse.data.thumbnail.source;
    }
  } catch (error) {
    console.log(`    ❌ Wikipedia falhou: ${error.message}`);
  }

  // 2. Tentar Wikipedia com nome simplificado
  try {
    const simpleName = gameName.split(':')[0].split('-')[0].trim();
    if (simpleName !== gameName) {
      console.log(`    📚 Tentando Wikipedia com nome simplificado: "${simpleName}"`);
      const wikiResponse = await axios.get(
        `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(simpleName)}`,
        {
          timeout: 5000,
        }
      );

      if (wikiResponse.data.thumbnail?.source) {
        console.log(`    ✅ Imagem encontrada na Wikipedia (nome simplificado)!`);
        return wikiResponse.data.thumbnail.source;
      }
    }
  } catch (error) {
    console.log(`    ❌ Wikipedia (nome simplificado) falhou: ${error.message}`);
  }

  // 3. Tentar DuckDuckGo (fonte gratuita)
  try {
    console.log(`    🦆 Tentando DuckDuckGo...`);
    const ddgResponse = await axios.get(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(gameName + ' game cover')}&format=json&no_html=1&skip_disambig=1`,
      {
        timeout: 5000,
      }
    );

    if (ddgResponse.data.Image) {
      console.log(`    ✅ Imagem encontrada no DuckDuckGo!`);
      return ddgResponse.data.Image;
    }
  } catch (error) {
    console.log(`    ❌ DuckDuckGo falhou: ${error.message}`);
  }

  // 4. Tentar Steam (fonte gratuita, mas pode falhar)
  try {
    console.log(`    🎮 Tentando Steam...`);
    const steamId = gameName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const steamResponse = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${steamId}`, {
      timeout: 5000,
    });

    if (steamResponse.data[steamId]?.data?.header_image) {
      console.log(`    ✅ Imagem encontrada na Steam!`);
      return steamResponse.data[steamId].data.header_image;
    }
  } catch (error) {
    console.log(`    ❌ Steam falhou: ${error.message}`);
  }

  // 5. Tentar URLs conhecidas de jogos populares
  const knownGameImages = {
    'cyberpunk 2077': 'https://upload.wikimedia.org/wikipedia/en/9/9f/Cyberpunk_2077_box_art.jpg',
    'the witcher 3': 'https://upload.wikimedia.org/wikipedia/en/0/0c/The_Witcher_3_cover_art.jpg',
    'red dead redemption 2': 'https://upload.wikimedia.org/wikipedia/en/4/44/Red_Dead_Redemption_II.jpg',
    'god of war': 'https://upload.wikimedia.org/wikipedia/en/a/a7/God_of_War_4_cover.jpg',
    'spider-man': 'https://upload.wikimedia.org/wikipedia/en/e/e1/Spider-Man_PS4_cover.jpg',
    "assassin's creed": 'https://upload.wikimedia.org/wikipedia/en/8/83/Assassin%27s_Creed_Valhalla_cover.jpg',
    'call of duty': 'https://upload.wikimedia.org/wikipedia/en/4/44/Call_of_Duty_Modern_Warfare_II.jpg',
    fifa: 'https://upload.wikimedia.org/wikipedia/en/8/82/FIFA_23_cover_art.jpg',
    minecraft: 'https://upload.wikimedia.org/wikipedia/en/5/51/Minecraft_cover.png',
    fortnite: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Fortnite_cover_art.jpg',
  };

  const normalizedName = gameName.toLowerCase();
  for (const [knownName, imageUrl] of Object.entries(knownGameImages)) {
    if (normalizedName.includes(knownName) || knownName.includes(normalizedName.split(' ')[0])) {
      console.log(`    🎯 Imagem conhecida encontrada para: "${knownName}"`);
      return imageUrl;
    }
  }

  console.log(`    ❌ Nenhuma imagem real encontrada`);
  return null;
}

// Função para baixar imagem da URL
async function downloadImage(url) {
  try {
    console.log(`    📥 Baixando imagem de: ${url}`);
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    console.log(`    ✅ Imagem baixada com sucesso! Tamanho: ${(response.data.length / 1024).toFixed(1)}KB`);
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
    const realImageUrl = await findRealGameImage(game.name);

    let imageBuffer;
    let imageSource = 'genérica';

    if (realImageUrl) {
      try {
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
    console.log('🚀 Iniciando busca inteligente de imagens (v2)...\n');

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
          'pagination[pageSize]': 5, // Reduzido para melhor controle
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

        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    })();
  }
}

module.exports = { processGameImage, processAllGames, findRealGameImage };
