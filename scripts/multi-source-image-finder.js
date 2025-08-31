#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const STRAPI_URL = 'http://localhost:1337';

// Configuração das APIs de imagens
const IMAGE_SOURCES = {
  // 1. IGDB (Internet Game Database) - Melhor API do mercado
  igdb: {
    name: 'IGDB',
    baseUrl: 'https://api.igdb.com/v4',
    headers: {
      'Client-ID': process.env.IGDB_CLIENT_ID || 'your_client_id',
      Authorization: `Bearer ${process.env.IGDB_ACCESS_TOKEN || 'your_access_token'}`,
    },
    endpoints: {
      games: '/games',
      covers: '/covers',
      screenshots: '/screenshots',
      artworks: '/artworks',
    },
  },

  // 2. RAWG.io - API gratuita com boa cobertura
  rawg: {
    name: 'RAWG.io',
    baseUrl: 'https://api.rawg.io/api',
    apiKey: process.env.RAWG_API_KEY || 'your_rawg_key',
    endpoints: {
      games: '/games',
      screenshots: '/games/{id}/screenshots',
      movies: '/games/{id}/movies',
    },
  },

  // 3. Steam CDN - Acesso direto às imagens
  steam: {
    name: 'Steam CDN',
    baseUrl: 'https://cdn.akamai.steamstatic.com/steam/apps',
    patterns: {
      header: '/{appId}/header.jpg',
      capsule: '/{appId}/capsule_616x353.jpg',
      screenshot: '/{appId}/ss_{screenshotId}.jpg',
    },
  },

  // 4. GOG.com - Imagens limpas e DRM-free
  gog: {
    name: 'GOG.com',
    baseUrl: 'https://images.gog.com',
    searchUrl: 'https://www.gog.com/games/ajax/filtered?mediaType=game&search=',
  },

  // 5. MobyGames - Histórico e box arts
  mobygames: {
    name: 'MobyGames',
    baseUrl: 'https://www.mobygames.com',
    searchUrl: 'https://www.mobygames.com/search?q=',
  },

  // 6. Giant Bomb - Imagens HD e vídeos
  giantbomb: {
    name: 'Giant Bomb',
    baseUrl: 'https://www.giantbomb.com/api',
    apiKey: process.env.GIANTBOMB_API_KEY || 'your_giantbomb_key',
    endpoints: {
      search: '/search',
      game: '/game',
    },
  },
};

// Função para buscar imagens em múltiplas fontes
async function findGameImages(gameName, platforms = ['pc']) {
  try {
    console.log(`🔍 Buscando imagens para: ${gameName}`);

    const results = {
      gameName,
      sources: {},
      bestMatches: [],
      recommendations: [],
    };

    // 1. Buscar no IGDB (mais confiável)
    try {
      const igdbResults = await searchIGDB(gameName);
      if (igdbResults.length > 0) {
        results.sources.igdb = igdbResults;
        results.bestMatches.push(...igdbResults.slice(0, 3));
        console.log(`   ✅ IGDB: ${igdbResults.length} resultados encontrados`);
      }
    } catch (error) {
      console.log(`   ⚠️  IGDB: ${error.message}`);
    }

    // 2. Buscar no RAWG.io
    try {
      const rawgResults = await searchRAWG(gameName);
      if (rawgResults.length > 0) {
        results.sources.rawg = rawgResults;
        results.bestMatches.push(...rawgResults.slice(0, 2));
        console.log(`   ✅ RAWG: ${rawgResults.length} resultados encontrados`);
      }
    } catch (error) {
      console.log(`   ⚠️  RAWG: ${error.message}`);
    }

    // 3. Buscar no Steam (se for jogo de PC)
    if (platforms.includes('pc')) {
      try {
        const steamResults = await searchSteam(gameName);
        if (steamResults.length > 0) {
          results.sources.steam = steamResults;
          results.bestMatches.push(...steamResults.slice(0, 2));
          console.log(`   ✅ Steam: ${steamResults.length} resultados encontrados`);
        }
      } catch (error) {
        console.log(`   ⚠️  Steam: ${error.message}`);
      }
    }

    // 4. Buscar no GOG
    try {
      const gogResults = await searchGOG(gameName);
      if (gogResults.length > 0) {
        results.sources.gog = gogResults;
        results.bestMatches.push(...gogResults.slice(0, 2));
        console.log(`   ✅ GOG: ${gogResults.length} resultados encontrados`);
      }
    } catch (error) {
      console.log(`   ⚠️  GOG: ${error.message}`);
    }

    // 5. Buscar no MobyGames
    try {
      const mobyResults = await searchMobyGames(gameName);
      if (mobyResults.length > 0) {
        results.sources.mobygames = mobyResults;
        results.bestMatches.push(...mobyResults.slice(0, 2));
        console.log(`   ✅ MobyGames: ${mobyResults.length} resultados encontrados`);
      }
    } catch (error) {
      console.log(`   ⚠️  MobyGames: ${error.message}`);
    }

    // Gerar recomendações
    results.recommendations = generateRecommendations(results);

    console.log(`   🎯 Total de fontes com resultados: ${Object.keys(results.sources).length}`);
    console.log(`   🖼️  Total de imagens encontradas: ${results.bestMatches.length}`);

    return results;
  } catch (error) {
    console.error(`❌ Erro ao buscar imagens para ${gameName}:`, error.message);
    return null;
  }
}

// Função para buscar no IGDB
async function searchIGDB(gameName) {
  try {
    const response = await axios.post(
      `${IMAGE_SOURCES.igdb.baseUrl}${IMAGE_SOURCES.igdb.endpoints.games}`,
      `search "${gameName}"; fields name,cover.*,screenshots.*,artworks.*; limit 10;`,
      { headers: IMAGE_SOURCES.igdb.headers }
    );

    return response.data.map(game => ({
      id: game.id,
      name: game.name,
      source: 'IGDB',
      images: {
        cover: game.cover ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg` : null,
        screenshots: game.screenshots
          ? game.screenshots.map(ss => `https://images.igdb.com/igdb/image/upload/t_screenshot_huge/${ss.image_id}.jpg`)
          : [],
        artworks: game.artworks
          ? game.artworks.map(art => `https://images.igdb.com/igdb/image/upload/t_artwork_big/${art.image_id}.jpg`)
          : [],
      },
      confidence: calculateConfidence(gameName, game.name),
    }));
  } catch (error) {
    throw new Error(`Falha na API IGDB: ${error.message}`);
  }
}

// Função para buscar no RAWG
async function searchRAWG(gameName) {
  try {
    const response = await axios.get(`${IMAGE_SOURCES.rawg.baseUrl}${IMAGE_SOURCES.rawg.endpoints.games}`, {
      params: {
        key: IMAGE_SOURCES.rawg.apiKey,
        search: gameName,
        page_size: 10,
      },
    });

    return response.data.results.map(game => ({
      id: game.id,
      name: game.name,
      source: 'RAWG',
      images: {
        cover: game.background_image,
        screenshots: game.short_screenshots ? game.short_screenshots.map(ss => ss.image) : [],
        artworks: [],
      },
      confidence: calculateConfidence(gameName, game.name),
    }));
  } catch (error) {
    throw new Error(`Falha na API RAWG: ${error.message}`);
  }
}

// Função para buscar no Steam
async function searchSteam(gameName) {
  try {
    // Buscar na Steam Store API
    const response = await axios.get('https://store.steampowered.com/api/storesearch', {
      params: {
        term: gameName,
        l: 'english',
        cc: 'US',
      },
    });

    return response.data.items.map(game => ({
      id: game.id,
      name: game.name,
      source: 'Steam',
      images: {
        cover: game.header_image,
        screenshots: [],
        artworks: [],
      },
      confidence: calculateConfidence(gameName, game.name),
      steamAppId: game.id,
    }));
  } catch (error) {
    throw new Error(`Falha na API Steam: ${error.message}`);
  }
}

// Função para buscar no GOG
async function searchGOG(gameName) {
  try {
    // Buscar na GOG usando web scraping (simulado)
    // Em produção, você pode usar Puppeteer ou similar

    return [
      {
        id: `gog_${Date.now()}`,
        name: gameName,
        source: 'GOG',
        images: {
          cover: null,
          screenshots: [],
          artworks: [],
        },
        confidence: 0.8,
        note: 'GOG - Implementar web scraping para resultados reais',
      },
    ];
  } catch (error) {
    throw new Error(`Falha na busca GOG: ${error.message}`);
  }
}

// Função para buscar no MobyGames
async function searchMobyGames(gameName) {
  try {
    // Buscar no MobyGames (simulado)
    // Em produção, implementar web scraping

    return [
      {
        id: `moby_${Date.now()}`,
        name: gameName,
        source: 'MobyGames',
        images: {
          cover: null,
          screenshots: [],
          artworks: [],
        },
        confidence: 0.7,
        note: 'MobyGames - Implementar web scraping para resultados reais',
      },
    ];
  } catch (error) {
    throw new Error(`Falha na busca MobyGames: ${error.message}`);
  }
}

// Função para calcular confiança na correspondência
function calculateConfidence(searchTerm, resultName) {
  const search = searchTerm.toLowerCase();
  const result = resultName.toLowerCase();

  if (search === result) return 1.0;
  if (result.includes(search) || search.includes(result)) return 0.9;
  if (result.includes(search.split(' ')[0])) return 0.8;
  if (result.includes(search.split(' ').slice(-1)[0])) return 0.7;

  // Calcular similaridade de Levenshtein
  const similarity = 1 - levenshteinDistance(search, result) / Math.max(search.length, result.length);
  return Math.max(0.1, similarity * 0.6);
}

// Função de distância de Levenshtein para similaridade
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Função para gerar recomendações
function generateRecommendations(results) {
  const recommendations = [];

  if (results.bestMatches.length === 0) {
    recommendations.push('Nenhuma imagem encontrada - usar fallback padrão');
    return recommendations;
  }

  // Ordenar por confiança
  const sortedMatches = results.bestMatches.sort((a, b) => b.confidence - a.confidence);

  if (sortedMatches[0].confidence > 0.9) {
    recommendations.push(
      `Usar ${sortedMatches[0].source} como fonte principal (confiança: ${(sortedMatches[0].confidence * 100).toFixed(0)}%)`
    );
  } else if (sortedMatches[0].confidence > 0.7) {
    recommendations.push(
      `Verificar manualmente ${sortedMatches[0].source} (confiança: ${(sortedMatches[0].confidence * 100).toFixed(0)}%)`
    );
  } else {
    recommendations.push('Confiança baixa - verificar manualmente todas as fontes');
  }

  // Recomendações específicas por fonte
  if (results.sources.igdb) {
    recommendations.push('IGDB: Melhor qualidade de imagens, usar como padrão');
  }

  if (results.sources.steam) {
    recommendations.push('Steam: Imagens oficiais, boa para jogos de PC');
  }

  if (results.sources.rawg) {
    recommendations.push('RAWG: Boa cobertura, alternativa gratuita ao IGDB');
  }

  return recommendations;
}

// Função para buscar imagens para todos os jogos
async function findImagesForAllGames() {
  try {
    console.log('🎮 Buscando imagens para todos os jogos...\n');

    // Buscar todos os jogos
    const response = await axios.get(`${STRAPI_URL}/api/games?pagination[pageSize]=100`);
    const games = response.data.data;

    console.log(`📊 Total de jogos: ${games.length}`);

    const results = [];

    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      console.log(`\n[${i + 1}/${games.length}] 🔍 ${game.name}`);

      const gameResults = await findGameImages(game.name);
      if (gameResults) {
        results.push(gameResults);
      }

      // Pausa entre requisições para não sobrecarregar as APIs
      if (i < games.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Salvar resultados
    const outputPath = path.join(__dirname, 'image-search-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

    console.log(`\n🏁 Busca concluída! Resultados salvos em: ${outputPath}`);
    console.log(`📊 Resumo:`);
    console.log(`   🎮 Jogos processados: ${results.length}`);
    console.log(`   🖼️  Total de imagens encontradas: ${results.reduce((sum, r) => sum + r.bestMatches.length, 0)}`);

    return results;
  } catch (error) {
    console.error('❌ Erro ao buscar imagens para todos os jogos:', error.message);
    return null;
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('🔍 Sistema de Busca Multi-Fonte de Imagens de Jogos');
    console.log('\n📋 USO:');
    console.log('   node scripts/multi-source-image-finder.js [opções]');
    console.log('\n🔧 OPÇÕES:');
    console.log('   <nome_do_jogo>     Buscar imagens para jogo específico');
    console.log('   --all              Buscar imagens para todos os jogos');
    console.log('   --test             Testar todas as fontes');
    console.log('\n💡 EXEMPLOS:');
    console.log('   node scripts/multi-source-image-finder.js "Cyberpunk 2077"');
    console.log('   node scripts/multi-source-image-finder.js --all');
    console.log('   node scripts/multi-source-image-finder.js --test');
    return;
  }

  if (args[0] === '--all') {
    await findImagesForAllGames();
  } else if (args[0] === '--test') {
    console.log('🧪 Testando todas as fontes...');
    const testGame = 'The Witcher 3';
    const results = await findGameImages(testGame);
    console.log('\n📊 RESULTADOS DO TESTE:');
    console.log(JSON.stringify(results, null, 2));
  } else {
    const gameName = args.join(' ');
    const results = await findGameImages(gameName);
    if (results) {
      console.log('\n📊 RESULTADOS:');
      console.log(JSON.stringify(results, null, 2));
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  findGameImages,
  findImagesForAllGames,
  searchIGDB,
  searchRAWG,
  searchSteam,
  searchGOG,
  searchMobyGames,
};
