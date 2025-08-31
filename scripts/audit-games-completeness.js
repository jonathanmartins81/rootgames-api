#!/usr/bin/env node

const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';

// Campos obrigatórios e opcionais para verificar
const REQUIRED_FIELDS = ['name', 'slug', 'price'];
const OPTIONAL_FIELDS = ['short_description', 'description', 'release_date', 'rating', 'cover', 'gallery'];
const RELATION_FIELDS = ['categories', 'platforms', 'developers', 'publisher'];

async function auditGamesCompleteness() {
  try {
    console.log('🔍 Iniciando auditoria completa dos jogos...\n');

    // Buscar todos os jogos com todas as relações populadas
    const response = await axios.get(`${STRAPI_URL}/api/games?pagination[pageSize]=100&populate=*`);
    const games = response.data.data;

    console.log(`📊 Total de jogos encontrados: ${games.length}\n`);

    if (games.length === 0) {
      console.log('❌ Nenhum jogo encontrado no banco');
      return;
    }

    // Estatísticas gerais
    let completeGames = 0;
    let incompleteGames = 0;
    let gamesWithImages = 0;
    let gamesWithRelations = 0;

    // Análise detalhada de cada jogo
    const gamesAnalysis = [];

    for (const game of games) {
      const attributes = game.attributes;
      const analysis = {
        id: game.id,
        name: attributes.name,
        slug: attributes.slug,
        missingFields: [],
        missingRelations: [],
        hasCover: false,
        hasGallery: false,
        completeness: 0,
      };

      // Verificar campos obrigatórios
      for (const field of REQUIRED_FIELDS) {
        if (!attributes[field] || attributes[field] === '') {
          analysis.missingFields.push(field);
        }
      }

      // Verificar campos opcionais
      for (const field of OPTIONAL_FIELDS) {
        if (field === 'cover' && attributes.cover?.data) {
          analysis.hasCover = true;
        } else if (field === 'gallery' && attributes.gallery?.data && attributes.gallery.data.length > 0) {
          analysis.hasGallery = true;
        }
      }

      // Verificar relações
      for (const field of RELATION_FIELDS) {
        if (
          !attributes[field]?.data ||
          (Array.isArray(attributes[field].data) && attributes[field].data.length === 0) ||
          (!Array.isArray(attributes[field].data) && !attributes[field].data.id)
        ) {
          analysis.missingRelations.push(field);
        }
      }

      // Calcular completude
      const totalFields = REQUIRED_FIELDS.length + OPTIONAL_FIELDS.length + RELATION_FIELDS.length;
      const filledFields = totalFields - analysis.missingFields.length - analysis.missingRelations.length;
      analysis.completeness = Math.round((filledFields / totalFields) * 100);

      // Classificar jogo
      if (analysis.completeness >= 80) {
        completeGames++;
      } else {
        incompleteGames++;
      }

      if (analysis.hasCover || analysis.hasGallery) {
        gamesWithImages++;
      }

      if (analysis.missingRelations.length === 0) {
        gamesWithRelations++;
      }

      gamesAnalysis.push(analysis);
    }

    // Relatório geral
    console.log('📊 RELATÓRIO GERAL DE COMPLETUDE:');
    console.log(`🎮 Total de jogos: ${games.length}`);
    console.log(`✅ Jogos completos (≥80%): ${completeGames}`);
    console.log(`❌ Jogos incompletos (<80%): ${incompleteGames}`);
    console.log(`🖼️  Jogos com imagens: ${gamesWithImages}`);
    console.log(`🔗 Jogos com todas as relações: ${gamesWithRelations}`);
    console.log(
      `📈 Completude média: ${Math.round(gamesAnalysis.reduce((sum, g) => sum + g.completeness, 0) / games.length)}%`
    );

    // Análise por campo
    console.log('\n🔍 ANÁLISE POR CAMPO:');

    const fieldStats = {};
    [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS, ...RELATION_FIELDS].forEach(field => {
      fieldStats[field] = { filled: 0, missing: 0 };
    });

    gamesAnalysis.forEach(game => {
      game.missingFields.forEach(field => {
        if (fieldStats[field]) fieldStats[field].missing++;
      });
      game.missingRelations.forEach(field => {
        if (fieldStats[field]) fieldStats[field].missing++;
      });
    });

    Object.keys(fieldStats).forEach(field => {
      const filled = games.length - fieldStats[field].missing;
      const percentage = Math.round((filled / games.length) * 100);
      const status = fieldStats[field].missing === 0 ? '✅' : fieldStats[field].missing < 10 ? '⚠️' : '❌';
      console.log(`   ${status} ${field}: ${filled}/${games.length} (${percentage}%)`);
    });

    // Jogos mais incompletos
    console.log('\n❌ TOP 10 JOGOS MAIS INCOMPLETOS:');
    const sortedByCompleteness = gamesAnalysis.sort((a, b) => a.completeness - b.completeness).slice(0, 10);

    sortedByCompleteness.forEach((game, index) => {
      console.log(`   ${index + 1}. ${game.name} (${game.completeness}%)`);
      if (game.missingFields.length > 0) {
        console.log(`      ❌ Campos faltando: ${game.missingFields.join(', ')}`);
      }
      if (game.missingRelations.length > 0) {
        console.log(`      🔗 Relações faltando: ${game.missingRelations.join(', ')}`);
      }
    });

    // Jogos mais completos
    console.log('\n✅ TOP 10 JOGOS MAIS COMPLETOS:');
    const sortedByCompletenessDesc = gamesAnalysis.sort((a, b) => b.completeness - a.completeness).slice(0, 10);

    sortedByCompletenessDesc.forEach((game, index) => {
      console.log(`   ${index + 1}. ${game.name} (${game.completeness}%)`);
      if (game.hasCover) console.log(`      🖼️  Tem capa`);
      if (game.hasGallery) console.log(`      🖼️  Tem galeria`);
    });

    // Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');

    if (incompleteGames > 0) {
      console.log(`   🔧 ${incompleteGames} jogos precisam de atenção`);
      console.log(`   📝 Priorizar preenchimento de campos obrigatórios`);
      console.log(`   🖼️  Adicionar imagens para ${games.length - gamesWithImages} jogos`);
    }

    if (gamesWithRelations < games.length) {
      console.log(`   🔗 ${games.length - gamesWithRelations} jogos precisam de categorias/plataformas`);
    }

    console.log('\n🏁 Auditoria concluída!');
  } catch (error) {
    console.error('❌ Erro durante auditoria:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Dados: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Função para verificar jogo específico
async function auditSpecificGame(gameName) {
  try {
    console.log(`🔍 Auditando jogo específico: ${gameName}`);

    const response = await axios.get(
      `${STRAPI_URL}/api/games?filters[name][$eq]=${encodeURIComponent(gameName)}&populate=*`
    );
    const games = response.data.data;

    if (games.length === 0) {
      console.log(`❌ Jogo "${gameName}" não encontrado`);
      return;
    }

    const game = games[0];
    const attributes = game.attributes;

    console.log(`\n📋 DETALHES DO JOGO: ${game.name}`);
    console.log(`   ID: ${game.id}`);
    console.log(`   Slug: ${attributes.slug}`);
    console.log(`   Preço: ${attributes.price}`);
    console.log(`   Data de lançamento: ${attributes.release_date || 'Não definida'}`);
    console.log(`   Rating: ${attributes.rating || 'Não definido'}`);

    console.log(`\n📝 DESCRIÇÕES:`);
    console.log(`   Descrição curta: ${attributes.short_description ? '✅ Preenchida' : '❌ Faltando'}`);
    console.log(`   Descrição completa: ${attributes.description ? '✅ Preenchida' : '❌ Faltando'}`);

    console.log(`\n🖼️  IMAGENS:`);
    console.log(`   Capa: ${attributes.cover?.data ? '✅ Presente' : '❌ Faltando'}`);
    console.log(
      `   Galeria: ${attributes.gallery?.data && attributes.gallery.data.length > 0 ? `✅ ${attributes.gallery.data.length} imagens` : '❌ Faltando'}`
    );

    console.log(`\n🔗 RELAÇÕES:`);
    console.log(
      `   Categorias: ${attributes.categories?.data ? `✅ ${attributes.categories.data.length} categorias` : '❌ Faltando'}`
    );
    console.log(
      `   Plataformas: ${attributes.platforms?.data ? `✅ ${attributes.platforms.data.length} plataformas` : '❌ Faltando'}`
    );
    console.log(
      `   Desenvolvedores: ${attributes.developers?.data ? `✅ ${attributes.developers.data.length} desenvolvedores` : '❌ Faltando'}`
    );
    console.log(`   Publisher: ${attributes.publisher?.data ? '✅ Presente' : '❌ Faltando'}`);
  } catch (error) {
    console.error('❌ Erro ao auditar jogo específico:', error.message);
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    await auditSpecificGame(args[0]);
  } else {
    await auditGamesCompleteness();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  auditGamesCompleteness,
  auditSpecificGame,
};
