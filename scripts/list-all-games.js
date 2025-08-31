#!/usr/bin/env node

const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';

// Lista alvo de jogos
const TARGET_GAMES = [
  'Cyberpunk 2077',
  'The Witcher 3: Wild Hunt',
  'Divinity: Original Sin 2',
  'Fallout 4: Game of the Year Edition',
  'DOOM Eternal',
  'Stardew Valley',
  'Dark Souls III',
  'Hades',
  'Disco Elysium',
  "Sid Meier's Civilization VI",
  "Baldur's Gate 3",
  'Control Ultimate Edition',
  'Monster Hunter: World',
  'Hollow Knight',
  'Payday 2',
  'Hotline Miami',
  'Dragon Age: Origins',
  'Subnautica',
  "No Man's Sky",
  'Shadowrun Trilogy',
  'Pillars of Eternity',
  'Dead Cells',
  'The Long Dark',
  'Frostpunk',
  'Age of Wonders III',
  'Into the Breach',
  'Ori and the Will of the Wisps',
  'Metro Exodus',
  'Outer Wilds',
  'GreedFall',
  'Kingdom Come: Deliverance',
  'Torchlight II',
  'Celeste',
  'Project Zomboid',
  'Slay the Spire',
  'Deus Ex: Mankind Divided',
  'Warhammer: Vermintide 2',
  'Papers, Please',
  'THIEF Gold Edition',
  'The Outer Worlds',
  'Euro Truck Simulator 2',
  'Factorio',
  'Frostpunk: Game of the Year Edition',
  'Pillars of Eternity II: Deadfire',
  'System Shock: Enhanced Edition',
  'Vampire: The Masquerade - Bloodlines',
  'Dead Island Definitive Edition',
  'Age of Empires II: Definitive Edition',
  'Divinity: Original Sin - Enhanced Edition',
  'The Talos Principle',
  'Shadow Warrior 2',
  'Jurassic Park: The Game',
  'Resident Evil 2',
];

async function listAllGames() {
  try {
    console.log('📊 Listando todos os jogos no banco...\n');

    const response = await axios.get(`${STRAPI_URL}/api/games?pagination[pageSize]=100`);
    const games = response.data.data;

    console.log(`🎮 Total de jogos no banco: ${games.length}\n`);

    if (games.length > 0) {
      console.log('📋 Jogos no banco:');
      games.forEach((game, index) => {
        console.log(`   ${index + 1}. ${game.name} (ID: ${game.id})`);
      });
    }

    // Comparar com a lista alvo
    console.log('\n🎯 COMPARAÇÃO COM LISTA ALVO:');
    console.log(`📋 Total na lista alvo: ${TARGET_GAMES.length}`);

    const existingGameNames = games.map(g => g.name);
    const missingGames = TARGET_GAMES.filter(game => !existingGameNames.includes(game));
    const existingGames = TARGET_GAMES.filter(game => existingGameNames.includes(game));

    console.log(`✅ Jogos existentes: ${existingGames.length}`);
    console.log(`❌ Jogos faltando: ${missingGames.length}`);

    if (missingGames.length > 0) {
      console.log('\n❌ JOGOS FALTANDO:');
      missingGames.forEach((game, index) => {
        console.log(`   ${index + 1}. ${game}`);
      });
    }

    if (existingGames.length > 0) {
      console.log('\n✅ JOGOS EXISTENTES:');
      existingGames.forEach((game, index) => {
        console.log(`   ${index + 1}. ${game}`);
      });
    }

    console.log(`\n📈 COBERTURA: ${((existingGames.length / TARGET_GAMES.length) * 100).toFixed(1)}%`);
  } catch (error) {
    console.error('❌ Erro ao listar jogos:', error.message);
  }
}

if (require.main === module) {
  listAllGames().catch(console.error);
}

module.exports = { listAllGames };
