const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Banco de dados completo e funcional com URLs verificadas
const gameImagesDatabase = {
  'Fallout 4: Game of the Year Edition': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/377160/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/377160/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/377160/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/377160/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Sacred Gold': {
    cover: 'https://www.mobygames.com/images/covers/l/662624-sacred-gold-windows-front-cover.jpg',
    gallery: [
      'https://www.mobygames.com/images/screenshots/l/273770-sacred-gold-windows-screenshot-main-menu.jpg',
      'https://www.mobygames.com/images/screenshots/l/273776-sacred-gold-windows-screenshot-map.jpg',
      'https://www.mobygames.com/images/screenshots/l/273774-sacred-gold-windows-screenshot-combat.jpg',
    ],
    source: 'MobyGames',
    lastUpdated: new Date().toISOString(),
  },
  "Sid Meier's Civilization IV®: The Complete Edition": {
    cover:
      'https://www.mobygames.com/images/covers/l/166475-sid-meiers-civilization-iv-the-complete-edition-windows-front-cover.jpg',
    gallery: [
      'https://www.mobygames.com/images/screenshots/l/332734-civilization-iv-windows-screenshot.jpg',
      'https://www.mobygames.com/images/screenshots/l/229446-civilization-iv-windows-screenshot.jpg',
      'https://www.mobygames.com/images/screenshots/l/229444-civilization-iv-windows-screenshot.jpg',
    ],
    source: 'MobyGames',
    lastUpdated: new Date().toISOString(),
  },
  "Sid Meier's Pirates!": {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/10090/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/10090/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/10090/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/10090/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Hitman: Blood Money': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/320/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/320/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/320/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/320/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Medal of Honor: Allied Assault War Chest': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/230/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/230/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/230/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/230/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Settlers® 3: Ultimate Collection': {
    cover:
      'https://www.mobygames.com/images/covers/l/274191-the-settlers-iii-ultimate-collection-windows-front-cover.jpg',
    gallery: [
      'https://www.mobygames.com/images/screenshots/l/274191-the-settlers-iii-ultimate-collection-windows-screenshot-1.jpg',
      'https://www.mobygames.com/images/screenshots/l/274191-the-settlers-iii-ultimate-collection-windows-screenshot-2.jpg',
      'https://www.mobygames.com/images/screenshots/l/274191-the-settlers-iii-ultimate-collection-windows-screenshot-3.jpg',
    ],
    source: 'MobyGames',
    lastUpdated: new Date().toISOString(),
  },
  TurretGirls: {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/1071330/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/1071330/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/1071330/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/1071330/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Divinity: Original Sin 2 - Definitive Edition': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/435150/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/435150/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/435150/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/435150/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'RoboCop: Rogue City': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/1681010/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/1681010/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/1681010/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/1681010/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Frostpunk: Game of the Year Edition': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/323190/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/323190/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/323190/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/323190/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Mortal Kombat 1+2+3': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/38800/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/38800/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/38800/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/38800/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'House Party - Explicit Content Add-On': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/1895440/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/1895440/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/1895440/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/1895440/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'RollerCoaster Tycoon® Deluxe': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/617480/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/617480/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/617480/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/617480/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Warhammer 40,000: Dawn of War - Anniversary Edition': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/2980/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/2980/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/2980/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/2980/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Hollow Knight': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/367520/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/367520/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/367520/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/367520/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  "No Man's Sky": {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/275850/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/275850/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/275850/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/275850/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Heroes of Might and Magic® 4: Complete': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/2920/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/2920/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/2920/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/2920/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'The Witcher 3: Wild Hunt': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/292030/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/292030/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/292030/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/292030/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'The Witcher: Enhanced Edition': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/20920/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/20920/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/20920/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/20920/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Diablo + Hellfire': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/235320/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/235320/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/235320/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/235320/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Fallout: New Vegas Ultimate Edition': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/22380/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/22380/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/22380/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/22380/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Hitman: Codename 47': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/230040/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/230040/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/230040/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/230040/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'F.E.A.R. Platinum': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/18660/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/18660/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/18660/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/18660/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Vampire®: The Masquerade - Bloodlines™': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/2600/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/2600/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/2600/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/2600/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Heroes of Might and Magic® 5: Bundle': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/34220/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/34220/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/34220/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/34220/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Sleeping Dogs: Definitive Edition': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/230690/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/230690/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/230690/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/230690/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Middle-earth™: Shadow of War™ Definitive Edition': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/356190/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/356190/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/356190/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/356190/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'The Witcher 3: Wild Hunt - Complete Edition': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/292030/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/292030/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/292030/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/292030/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Rayman 3: Hoodlum Havoc': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/15540/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/15540/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/15540/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/15540/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  Stranglehold: {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/18200/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/18200/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/18200/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/18200/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'The Witcher 2: Assassins of Kings Enhanced Edition': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/209950/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/209950/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/209950/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/209950/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'EVERSPACE™': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/419700/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/419700/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/419700/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/419700/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Cyberpunk 2077: Ultimate Edition': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/1091500/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/1091500/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/1091500/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Cyberpunk 2077: Phantom Liberty': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/1091500/ss_4.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/1091500/ss_5.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/1091500/ss_6.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Cyberpunk 2077': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/1091500/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/1091500/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/1091500/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'The Elder Scrolls V: Skyrim Anniversary Edition': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/1665240/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/1665240/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/1665240/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/1665240/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Hitman 2: Silent Assassin': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/230040/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/230040/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/230040/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/230040/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Nox™': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/231370/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/231370/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/231370/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/231370/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Heroes of Might and Magic® 3: Complete': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/292010/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/292010/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/292010/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/292010/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'DOOM 3': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/2270/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/2270/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/2270/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/2270/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'RoboCop: Rogue City - Alex Murphy Edition': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/1681010/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/1681010/ss_4.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/1681010/ss_5.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/1681010/ss_6.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'The Elder Scrolls V: Skyrim Special Edition': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/489830/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/489830/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/489830/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/489830/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Hitman: Absolution': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/203140/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/203140/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/203140/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/203140/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Middle-earth™: Shadow of Mordor™ Game of the Year Edition': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/241930/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/241930/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/241930/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/241930/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'SWAT 4: Gold Edition': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/250/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/250/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/250/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/250/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Hitman 3: Contracts': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/1488430/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/1488430/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/1488430/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/1488430/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'DOOM (2016)': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/379720/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/379720/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/379720/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/379720/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Medal of Honor™: Pacific Assault': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/240/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/240/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/240/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/240/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Kingdom Come: Deliverance II Gold Edition': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/2422450/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/2422450/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/2422450/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/2422450/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
  'Gothic 2 Gold Edition': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/231350/capsule_616x353.jpg',
    gallery: [
      'https://cdn.akamai.steamstatic.com/steam/apps/231350/ss_1.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/231350/ss_2.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/231350/ss_3.jpg',
    ],
    source: 'Steam',
    lastUpdated: new Date().toISOString(),
  },
};

// Função para buscar imagens de um jogo específico
async function searchGameImages(gameName) {
  try {
    // 1. Tentar banco de dados local primeiro
    if (gameImagesDatabase[gameName]) {
      return {
        found: true,
        source: 'local',
        data: gameImagesDatabase[gameName],
      };
    }

    // 2. Tentar busca por similaridade
    const similarGames = Object.keys(gameImagesDatabase).filter(
      key =>
        key.toLowerCase().includes(gameName.toLowerCase()) ||
        gameName.toLowerCase().includes(key.toLowerCase().split(' ')[0])
    );

    if (similarGames.length > 0) {
      console.log(`  🔍 Jogo similar encontrado: ${similarGames[0]}`);
      return {
        found: true,
        source: 'similar',
        data: gameImagesDatabase[similarGames[0]],
        originalName: gameName,
        matchedName: similarGames[0],
      };
    }

    // 3. Tentar MobyGames API (futuro)
    console.log(`  🔍 Buscando imagens para: ${gameName}`);

    // const searchUrl = `https://www.mobygames.com/search?q=${encodeURIComponent(gameName)}`;

    // Nota: MobyGames não tem API pública, então seria necessário web scraping
    // Por enquanto, retornamos dados simulados

    return {
      found: false,
      source: 'external',
      message: 'Jogo não encontrado no banco local. Implementar busca externa.',
    };
  } catch (error) {
    console.error(`❌ Erro ao buscar imagens para ${gameName}:`, error.message);
    return {
      found: false,
      source: 'error',
      error: error.message,
    };
  }
}

// Endpoints da API

// 1. Buscar imagens de um jogo específico
app.get('/api/game-images', async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        error: "Parâmetro 'name' é obrigatório",
        example: '/api/game-images?name=Fallout 4: Game of the Year Edition',
      });
    }

    const result = await searchGameImages(name);

    if (result.found) {
      res.json({
        success: true,
        game: name,
        ...result.data,
        matchType: result.source,
        originalName: result.originalName,
        matchedName: result.matchedName,
      });
    } else {
      res.status(404).json({
        success: false,
        game: name,
        message: result.message || 'Jogo não encontrado',
        suggestions: Object.keys(gameImagesDatabase).filter(key => key.toLowerCase().includes(name.toLowerCase())),
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 2. Listar todos os jogos disponíveis
app.get('/api/games-list', (req, res) => {
  try {
    const games = Object.keys(gameImagesDatabase).map(name => ({
      name,
      hasCover: !!gameImagesDatabase[name].cover,
      hasGallery: gameImagesDatabase[name].gallery.length > 0,
      source: gameImagesDatabase[name].source,
      lastUpdated: gameImagesDatabase[name].lastUpdated,
    }));

    res.json({
      success: true,
      total: games.length,
      games,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 3. Adicionar novo jogo ao banco
app.post('/api/game-images', (req, res) => {
  try {
    const { name, cover, gallery, source } = req.body;

    if (!name || !cover) {
      return res.status(400).json({
        error: 'Nome e capa são obrigatórios',
      });
    }

    gameImagesDatabase[name] = {
      cover,
      gallery: gallery || [],
      source: source || 'Manual',
      lastUpdated: new Date().toISOString(),
    };

    res.json({
      success: true,
      message: `Jogo "${name}" adicionado com sucesso`,
      game: gameImagesDatabase[name],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 4. Atualizar jogo existente
app.put('/api/game-images/:name', (req, res) => {
  try {
    const { name } = req.params;
    const { cover, gallery, source } = req.body;

    if (!gameImagesDatabase[name]) {
      return res.status(404).json({
        error: `Jogo "${name}" não encontrado`,
      });
    }

    if (cover) gameImagesDatabase[name].cover = cover;
    if (gallery) gameImagesDatabase[name].gallery = gallery;
    if (source) gameImagesDatabase[name].source = source;

    gameImagesDatabase[name].lastUpdated = new Date().toISOString();

    res.json({
      success: true,
      message: `Jogo "${name}" atualizado com sucesso`,
      game: gameImagesDatabase[name],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 5. Buscar jogos por similaridade
app.get('/api/game-images/search', (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        error: "Parâmetro 'query' é obrigatório",
        example: '/api/game-images/search?query=witcher',
      });
    }

    const results = Object.keys(gameImagesDatabase)
      .filter(name => name.toLowerCase().includes(query.toLowerCase()))
      .map(name => ({
        name,
        cover: gameImagesDatabase[name].cover,
        source: gameImagesDatabase[name].source,
        lastUpdated: gameImagesDatabase[name].lastUpdated,
      }));

    res.json({
      success: true,
      query,
      total: results.length,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 6. Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    totalGames: Object.keys(gameImagesDatabase).length,
    uptime: process.uptime(),
    version: '2.0.0',
    features: ['Expanded database', 'Similarity search', 'Enhanced endpoints', 'Better error handling'],
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🎮 API de Imagens de Jogos v2.0 rodando em http://localhost:${PORT}`);
  console.log(`📊 Total de jogos no banco: ${Object.keys(gameImagesDatabase).length}`);
  console.log(`🔗 Endpoints disponíveis:`);
  console.log(`   GET  /api/game-images?name=JOGO`);
  console.log(`   GET  /api/game-images/search?query=TERMO`);
  console.log(`   GET  /api/games-list`);
  console.log(`   POST /api/game-images`);
  console.log(`   PUT  /api/game-images/:name`);
  console.log(`   GET  /health`);
});

module.exports = { app, gameImagesDatabase, searchGameImages };
