#!/usr/bin/env node

const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';

async function checkGamesCompleteness() {
  try {
    console.log('🔍 Verificando completude dos jogos...\n');

    // Buscar todos os jogos
    const response = await axios.get(`${STRAPI_URL}/api/games?pagination[pageSize]=100`);
    const games = response.data.data;

    console.log(`📊 Total de jogos: ${games.length}\n`);

    if (games.length === 0) {
      console.log('❌ Nenhum jogo encontrado');
      return;
    }

    // Verificar campos básicos
    let gamesWithName = 0;
    let gamesWithSlug = 0;
    let gamesWithPrice = 0;
    let gamesWithShortDescription = 0;
    let gamesWithDescription = 0;
    let gamesWithReleaseDate = 0;
    let gamesWithRating = 0;

    // Verificar imagens (precisamos buscar com populate)
    let gamesWithCover = 0;
    let gamesWithGallery = 0;

    // Verificar relações (precisamos buscar com populate)
    let gamesWithCategories = 0;
    let gamesWithPlatforms = 0;
    let gamesWithDevelopers = 0;
    let gamesWithPublisher = 0;

    for (const game of games) {
      // Campos básicos
      if (game.name) gamesWithName++;
      if (game.slug) gamesWithSlug++;
      if (game.price !== undefined && game.price !== null) gamesWithPrice++;
      if (game.short_description) gamesWithShortDescription++;
      if (game.description) gamesWithDescription++;
      if (game.release_date) gamesWithReleaseDate++;
      if (game.rating) gamesWithRating++;
    }

    // Buscar jogos com imagens e relações populadas
    try {
      const populatedResponse = await axios.get(`${STRAPI_URL}/api/games?pagination[pageSize]=100&populate=*`);
      const populatedGames = populatedResponse.data.data;

      for (const game of populatedGames) {
        // Imagens
        if (game.cover?.data) gamesWithCover++;
        if (game.gallery?.data && game.gallery.data.length > 0) gamesWithGallery++;

        // Relações
        if (game.categories?.data && game.categories.data.length > 0) gamesWithCategories++;
        if (game.platforms?.data && game.platforms.data.length > 0) gamesWithPlatforms++;
        if (game.developers?.data && game.developers.data.length > 0) gamesWithDevelopers++;
        if (game.publisher?.data) gamesWithPublisher++;
      }
    } catch (error) {
      console.log('⚠️  Não foi possível verificar imagens e relações');
    }

    // Relatório
    console.log('📋 CAMPOS BÁSICOS:');
    console.log(`   ✅ Nome: ${gamesWithName}/${games.length} (${Math.round((gamesWithName / games.length) * 100)}%)`);
    console.log(`   ✅ Slug: ${gamesWithSlug}/${games.length} (${Math.round((gamesWithSlug / games.length) * 100)}%)`);
    console.log(
      `   ✅ Preço: ${gamesWithPrice}/${games.length} (${Math.round((gamesWithPrice / games.length) * 100)}%)`
    );
    console.log(
      `   ✅ Descrição curta: ${gamesWithShortDescription}/${games.length} (${Math.round((gamesWithShortDescription / games.length) * 100)}%)`
    );
    console.log(
      `   ✅ Descrição completa: ${gamesWithDescription}/${games.length} (${Math.round((gamesWithDescription / games.length) * 100)}%)`
    );
    console.log(
      `   ✅ Data de lançamento: ${gamesWithReleaseDate}/${games.length} (${Math.round((gamesWithReleaseDate / games.length) * 100)}%)`
    );
    console.log(
      `   ✅ Rating: ${gamesWithRating}/${games.length} (${Math.round((gamesWithRating / games.length) * 100)}%)`
    );

    console.log('\n🖼️  IMAGENS:');
    console.log(
      `   ✅ Capa: ${gamesWithCover}/${games.length} (${Math.round((gamesWithCover / games.length) * 100)}%)`
    );
    console.log(
      `   ✅ Galeria: ${gamesWithGallery}/${games.length} (${Math.round((gamesWithGallery / games.length) * 100)}%)`
    );

    console.log('\n🔗 RELAÇÕES:');
    console.log(
      `   ✅ Categorias: ${gamesWithCategories}/${games.length} (${Math.round((gamesWithCategories / games.length) * 100)}%)`
    );
    console.log(
      `   ✅ Plataformas: ${gamesWithPlatforms}/${games.length} (${Math.round((gamesWithPlatforms / games.length) * 100)}%)`
    );
    console.log(
      `   ✅ Desenvolvedores: ${gamesWithDevelopers}/${games.length} (${Math.round((gamesWithDevelopers / games.length) * 100)}%)`
    );
    console.log(
      `   ✅ Publisher: ${gamesWithPublisher}/${games.length} (${Math.round((gamesWithPublisher / games.length) * 100)}%)`
    );

    // Calcular completude geral
    const totalFields = 12; // 7 básicos + 2 imagens + 3 relações
    const avgCompleteness = Math.round(
      ((gamesWithName +
        gamesWithSlug +
        gamesWithPrice +
        gamesWithShortDescription +
        gamesWithDescription +
        gamesWithReleaseDate +
        gamesWithRating +
        gamesWithCover +
        gamesWithGallery +
        gamesWithCategories +
        gamesWithPlatforms +
        gamesWithDevelopers) /
        (games.length * totalFields)) *
        100
    );

    console.log(`\n📈 COMPLETUDE GERAL: ${avgCompleteness}%`);

    // Análise dos campos
    console.log('\n🔍 ANÁLISE DETALHADA:');

    // Verificar campos que estão faltando
    if (gamesWithPrice < games.length) {
      console.log(`   ⚠️  ${games.length - gamesWithPrice} jogos têm preço 0 ou não definido`);
    }

    if (gamesWithShortDescription < games.length) {
      console.log(`   ⚠️  ${games.length - gamesWithShortDescription} jogos têm descrição curta genérica`);
    }

    if (gamesWithDescription < games.length) {
      console.log(`   ⚠️  ${games.length - gamesWithDescription} jogos têm descrição genérica`);
    }

    if (gamesWithReleaseDate < games.length) {
      console.log(`   ⚠️  ${games.length - gamesWithReleaseDate} jogos têm data de lançamento padrão`);
    }

    if (gamesWithRating < games.length) {
      console.log(`   ⚠️  ${games.length - gamesWithRating} jogos têm rating padrão (BR0)`);
    }

    // Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');

    if (gamesWithCover < games.length) {
      console.log(`   🖼️  Adicionar capas para ${games.length - gamesWithCover} jogos`);
    }

    if (gamesWithCategories < games.length) {
      console.log(`   🏷️  Adicionar categorias para ${games.length - gamesWithCategories} jogos`);
    }

    if (gamesWithPlatforms < games.length) {
      console.log(`   💻 Adicionar plataformas para ${games.length - gamesWithPlatforms} jogos`);
    }

    if (gamesWithDevelopers < games.length) {
      console.log(`   👨‍💻 Adicionar desenvolvedores para ${games.length - gamesWithDevelopers} jogos`);
    }

    if (gamesWithPrice < games.length) {
      console.log(`   💰 Definir preços reais para ${games.length - gamesWithPrice} jogos`);
    }

    if (gamesWithShortDescription < games.length) {
      console.log(`   📝 Melhorar descrições curtas para ${games.length - gamesWithShortDescription} jogos`);
    }

    console.log('\n🏁 Verificação concluída!');
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
  }
}

// Verificar jogo específico
async function checkSpecificGame(gameName) {
  try {
    console.log(`🔍 Verificando jogo: ${gameName}`);

    const response = await axios.get(`${STRAPI_URL}/api/games?filters[name][$eq]=${encodeURIComponent(gameName)}`);
    const games = response.data.data;

    if (games.length === 0) {
      console.log(`❌ Jogo "${gameName}" não encontrado`);
      return;
    }

    const game = games[0];

    console.log(`\n📋 DETALHES:`);
    console.log(`   ID: ${game.id}`);
    console.log(`   Document ID: ${game.documentId}`);
    console.log(`   Nome: ${game.name || '❌ Faltando'}`);
    console.log(`   Slug: ${game.slug || '❌ Faltando'}`);
    console.log(`   Preço: ${game.price !== undefined ? game.price : '❌ Faltando'}`);
    console.log(`   Descrição curta: ${game.short_description || '❌ Faltando'}`);
    console.log(`   Descrição completa: ${game.description || '❌ Faltando'}`);
    console.log(`   Data de lançamento: ${game.release_date || '❌ Faltando'}`);
    console.log(`   Rating: ${game.rating || '❌ Faltando'}`);
    console.log(`   Criado em: ${game.createdAt}`);
    console.log(`   Atualizado em: ${game.updatedAt}`);
    console.log(`   Publicado em: ${game.publishedAt}`);
    console.log(`   Locale: ${game.locale}`);

    // Verificar se tem imagens
    try {
      const populatedResponse = await axios.get(`${STRAPI_URL}/api/games/${game.id}?populate=*`);
      const populatedGame = populatedResponse.data.data;

      console.log(`\n🖼️  IMAGENS:`);
      console.log(`   Capa: ${populatedGame.cover?.data ? '✅ Presente' : '❌ Faltando'}`);
      console.log(
        `   Galeria: ${populatedGame.gallery?.data && populatedGame.gallery.data.length > 0 ? `✅ ${populatedGame.gallery.data.length} imagens` : '❌ Faltando'}`
      );

      console.log(`\n🔗 RELAÇÕES:`);
      console.log(
        `   Categorias: ${populatedGame.categories?.data ? `✅ ${populatedGame.categories.data.length} categorias` : '❌ Faltando'}`
      );
      console.log(
        `   Plataformas: ${populatedGame.platforms?.data ? `✅ ${populatedGame.platforms.data.length} plataformas` : '❌ Faltando'}`
      );
      console.log(
        `   Desenvolvedores: ${populatedGame.developers?.data ? `✅ ${populatedGame.developers.data.length} desenvolvedores` : '❌ Faltando'}`
      );
      console.log(`   Publisher: ${populatedGame.publisher?.data ? '✅ Presente' : '❌ Faltando'}`);
    } catch (error) {
      console.log('⚠️  Não foi possível verificar imagens e relações');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar jogo:', error.message);
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    await checkSpecificGame(args[0]);
  } else {
    await checkGamesCompleteness();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkGamesCompleteness,
  checkSpecificGame,
};
