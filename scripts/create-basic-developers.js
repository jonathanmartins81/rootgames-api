#!/usr/bin/env node

const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';

// Desenvolvedores reais dos jogos
const BASIC_DEVELOPERS = [
  {
    name: 'CD Projekt Red',
    slug: 'cd-projekt-red',
    description: 'Desenvolvedora polonesa conhecida por The Witcher e Cyberpunk 2077',
    country: 'Polônia',
    website: 'https://en.cdprojektred.com/',
  },
  {
    name: 'Larian Studios',
    slug: 'larian-studios',
    description: "Desenvolvedora belga conhecida por Divinity e Baldur's Gate 3",
    country: 'Bélgica',
    website: 'https://www.larian.com/',
  },
  {
    name: 'Bethesda Game Studios',
    slug: 'bethesda-game-studios',
    description: 'Desenvolvedora americana conhecida por Fallout e The Elder Scrolls',
    country: 'Estados Unidos',
    website: 'https://bethesdagamestudios.com/',
  },
  {
    name: 'id Software',
    slug: 'id-software',
    description: 'Desenvolvedora americana conhecida por DOOM e Quake',
    country: 'Estados Unidos',
    website: 'https://www.idsoftware.com/',
  },
  {
    name: 'ConcernedApe',
    slug: 'concernedape',
    description: 'Desenvolvedor independente de Stardew Valley',
    country: 'Estados Unidos',
    website: 'https://www.stardewvalley.net/',
  },
  {
    name: 'FromSoftware',
    slug: 'fromsoftware',
    description: 'Desenvolvedora japonesa conhecida por Dark Souls e Sekiro',
    country: 'Japão',
    website: 'https://www.fromsoftware.jp/',
  },
  {
    name: 'Supergiant Games',
    slug: 'supergiant-games',
    description: 'Desenvolvedora americana conhecida por Hades e Bastion',
    country: 'Estados Unidos',
    website: 'https://www.supergiantgames.com/',
  },
  {
    name: 'ZA/UM',
    slug: 'za-um',
    description: 'Desenvolvedora estoniana de Disco Elysium',
    country: 'Estônia',
    website: 'https://zaumstudio.com/',
  },
  {
    name: 'Firaxis Games',
    slug: 'firaxis-games',
    description: 'Desenvolvedora americana conhecida por Civilization e XCOM',
    country: 'Estados Unidos',
    website: 'https://www.firaxis.com/',
  },
  {
    name: 'Remedy Entertainment',
    slug: 'remedy-entertainment',
    description: 'Desenvolvedora finlandesa conhecida por Control e Alan Wake',
    country: 'Finlândia',
    website: 'https://www.remedygames.com/',
  },
  {
    name: 'Capcom',
    slug: 'capcom',
    description: 'Desenvolvedora japonesa conhecida por Monster Hunter e Resident Evil',
    country: 'Japão',
    website: 'https://www.capcom.com/',
  },
  {
    name: 'Team Cherry',
    slug: 'team-cherry',
    description: 'Desenvolvedora australiana de Hollow Knight',
    country: 'Austrália',
    website: 'https://teamcherry.com.au/',
  },
  {
    name: 'Overkill Software',
    slug: 'overkill-software',
    description: 'Desenvolvedora sueca conhecida por Payday',
    country: 'Suécia',
    website: 'https://www.overkillsoftware.com/',
  },
  {
    name: 'Dennaton Games',
    slug: 'dennaton-games',
    description: 'Desenvolvedora sueca de Hotline Miami',
    country: 'Suécia',
    website: 'https://dennatongames.com/',
  },
  {
    name: 'BioWare',
    slug: 'bioware',
    description: 'Desenvolvedora canadense conhecida por Dragon Age e Mass Effect',
    country: 'Canadá',
    website: 'https://www.bioware.com/',
  },
  {
    name: 'Unknown Worlds Entertainment',
    slug: 'unknown-worlds-entertainment',
    description: 'Desenvolvedora americana de Subnautica',
    country: 'Estados Unidos',
    website: 'https://unknownworlds.com/',
  },
  {
    name: 'Harebrained Schemes',
    slug: 'harebrained-schemes',
    description: 'Desenvolvedora americana de Shadowrun',
    country: 'Estados Unidos',
    website: 'https://harebrained-schemes.com/',
  },
  {
    name: 'Obsidian Entertainment',
    slug: 'obsidian-entertainment',
    description: 'Desenvolvedora americana conhecida por Pillars of Eternity e The Outer Worlds',
    country: 'Estados Unidos',
    website: 'https://www.obsidian.net/',
  },
  {
    name: 'Motion Twin',
    slug: 'motion-twin',
    description: 'Desenvolvedora francesa de Dead Cells',
    country: 'França',
    website: 'https://motion-twin.com/',
  },
  {
    name: 'Triumph Studios',
    slug: 'triumph-studios',
    description: 'Desenvolvedora holandesa de Age of Wonders',
    country: 'Holanda',
    website: 'https://www.triumphstudios.com/',
  },
  {
    name: 'Subset Games',
    slug: 'subset-games',
    description: 'Desenvolvedora americana de Into the Breach e FTL',
    country: 'Estados Unidos',
    website: 'https://subsetgames.com/',
  },
  {
    name: 'Moon Studios',
    slug: 'moon-studios',
    description: 'Desenvolvedora austríaca de Ori',
    country: 'Áustria',
    website: 'https://www.moon-studios.com/',
  },
  {
    name: '4A Games',
    slug: '4a-games',
    description: 'Desenvolvedora ucraniana de Metro',
    country: 'Ucrânia',
    website: 'https://4a-games.com/',
  },
  {
    name: 'Mobius Digital',
    slug: 'mobius-digital',
    description: 'Desenvolvedora americana de Outer Wilds',
    country: 'Estados Unidos',
    website: 'https://www.mobiusdigitalgames.com/',
  },
  {
    name: 'Spiders',
    slug: 'spiders',
    description: 'Desenvolvedora francesa de GreedFall',
    country: 'França',
    website: 'https://www.spiders-games.com/',
  },
  {
    name: 'Runic Games',
    slug: 'runic-games',
    description: 'Desenvolvedora americana de Torchlight',
    country: 'Estados Unidos',
    website: 'https://www.runicgames.com/',
  },
  {
    name: 'Extremely OK Games',
    slug: 'extremely-ok-games',
    description: 'Desenvolvedora americana de Celeste',
    country: 'Estados Unidos',
    website: 'https://exok.com/',
  },
  {
    name: 'The Indie Stone',
    slug: 'the-indie-stone',
    description: 'Desenvolvedora britânica de Project Zomboid',
    country: 'Reino Unido',
    website: 'https://theindiestone.com/',
  },
  {
    name: 'Eidos-Montréal',
    slug: 'eidos-montreal',
    description: 'Desenvolvedora canadense de Deus Ex',
    country: 'Canadá',
    website: 'https://eidosmontreal.com/',
  },
  {
    name: 'Fatshark',
    slug: 'fatshark',
    description: 'Desenvolvedora sueca de Warhammer: Vermintide',
    country: 'Suécia',
    website: 'https://www.fatsharkgames.com/',
  },
  {
    name: 'Lucas Pope',
    slug: 'lucas-pope',
    description: 'Desenvolvedor independente de Papers, Please',
    country: 'Estados Unidos',
    website: 'https://dukope.com/',
  },
  {
    name: 'Eidos Interactive',
    slug: 'eidos-interactive',
    description: 'Desenvolvedora britânica de THIEF',
    country: 'Reino Unido',
    website: 'https://www.eidos.com/',
  },
  {
    name: 'SCS Software',
    slug: 'scs-software',
    description: 'Desenvolvedora tcheca de Euro Truck Simulator',
    country: 'República Tcheca',
    website: 'https://www.scssoft.com/',
  },
  {
    name: 'Looking Glass Studios',
    slug: 'looking-glass-studios',
    description: 'Desenvolvedora americana de System Shock',
    country: 'Estados Unidos',
    website: 'https://www.lookingglassstudios.com/',
  },
  {
    name: 'Deep Silver',
    slug: 'deep-silver',
    description: 'Publicadora alemã de Dead Island',
    country: 'Alemanha',
    website: 'https://www.deepsilver.com/',
  },
  {
    name: 'Flying Wild Hog',
    slug: 'flying-wild-hog',
    description: 'Desenvolvedora polonesa de Shadow Warrior',
    country: 'Polônia',
    website: 'https://www.flyingwildhog.com/',
  },
  {
    name: 'Capcom',
    slug: 'capcom',
    description: 'Desenvolvedora japonesa de Resident Evil',
    country: 'Japão',
    website: 'https://www.capcom.com/',
  },
  {
    name: '11 bit studios',
    slug: '11-bit-studios',
    description: 'Desenvolvedora polonesa de Frostpunk',
    country: 'Polônia',
    website: 'https://11bitstudios.com/',
  },
  {
    name: 'Warhorse Studios',
    slug: 'warhorse-studios',
    description: 'Desenvolvedora tcheca de Kingdom Come: Deliverance',
    country: 'República Tcheca',
    website: 'https://www.warhorsestudios.cz/',
  },
  {
    name: 'Mega Crit Games',
    slug: 'mega-crit-games',
    description: 'Desenvolvedora americana de Slay the Spire',
    country: 'Estados Unidos',
    website: 'https://www.megacrit.com/',
  },
  {
    name: 'Wube Software',
    slug: 'wube-software',
    description: 'Desenvolvedora tcheca de Factorio',
    country: 'República Tcheca',
    website: 'https://www.factorio.com/',
  },
  {
    name: 'Troika Games',
    slug: 'troika-games',
    description: 'Desenvolvedora americana de Vampire: The Masquerade',
    country: 'Estados Unidos',
    website: 'https://www.troikagames.com/',
  },
  {
    name: 'Croteam',
    slug: 'croteam',
    description: 'Desenvolvedora croata de The Talos Principle',
    country: 'Croácia',
    website: 'https://www.croteam.com/',
  },
  {
    name: 'Relic Entertainment',
    slug: 'relic-entertainment',
    description: 'Desenvolvedora canadense de Age of Empires',
    country: 'Canadá',
    website: 'https://www.relic.com/',
  },
];

async function createBasicDevelopers() {
  try {
    console.log('👨‍💻 Criando desenvolvedores básicos...\n');

    // Verificar se os desenvolvedores já existem
    const existingResponse = await axios.get(`${STRAPI_URL}/api/developers`);
    const existingDevelopers = existingResponse.data.data || [];

    console.log(`📊 Desenvolvedores existentes: ${existingDevelopers.length}`);

    if (existingDevelopers.length > 0) {
      console.log('📋 Desenvolvedores já existentes:');
      existingDevelopers.forEach(dev => {
        console.log(`   - ${dev.name} (${dev.slug})`);
      });
    }

    // Criar desenvolvedores que não existem
    const developersToCreate = BASIC_DEVELOPERS.filter(
      newDev => !existingDevelopers.some(existingDev => existingDev.slug === newDev.slug)
    );

    if (developersToCreate.length === 0) {
      console.log('\n✅ Todos os desenvolvedores básicos já existem!');
      return;
    }

    console.log(`\n🔨 Criando ${developersToCreate.length} novos desenvolvedores...`);

    for (const developer of developersToCreate) {
      try {
        const response = await axios.post(`${STRAPI_URL}/api/developers`, {
          data: {
            name: developer.name,
            slug: developer.slug,
            description: developer.description,
            country: developer.country,
            website: developer.website,
          },
        });

        console.log(`   ✅ Criado: ${developer.name} (${developer.country}) - ID: ${response.data.data.id}`);
      } catch (error) {
        console.error(`   ❌ Erro ao criar ${developer.name}:`, error.response?.data?.error?.message || error.message);
      }
    }

    console.log('\n🏁 Criação de desenvolvedores concluída!');
  } catch (error) {
    console.error('❌ Erro ao criar desenvolvedores:', error.message);
  }
}

// Função para listar todos os desenvolvedores
async function listAllDevelopers() {
  try {
    console.log('📋 Listando todos os desenvolvedores...\n');

    const response = await axios.get(`${STRAPI_URL}/api/developers`);
    const developers = response.data.data || [];

    if (developers.length === 0) {
      console.log('❌ Nenhum desenvolvedor encontrado');
      return;
    }

    console.log(`📊 Total de desenvolvedores: ${developers.length}\n`);

    developers.forEach((dev, index) => {
      console.log(`${index + 1}. ${dev.name}`);
      console.log(`   Slug: ${dev.slug}`);
      console.log(`   ID: ${dev.id}`);
      if (dev.country) {
        console.log(`   País: ${dev.country}`);
      }
      if (dev.description) {
        console.log(`   Descrição: ${dev.description}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('❌ Erro ao listar desenvolvedores:', error.message);
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list') || args.includes('-l')) {
    await listAllDevelopers();
  } else {
    await createBasicDevelopers();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createBasicDevelopers,
  listAllDevelopers,
};
