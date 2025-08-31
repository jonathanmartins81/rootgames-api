#!/usr/bin/env node

const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';

// Plataformas básicas para jogos
const BASIC_PLATFORMS = [
  {
    name: 'PC',
    slug: 'pc',
    description: 'Computador pessoal (Windows, Linux, macOS)',
    icon: '💻',
  },
  {
    name: 'Windows',
    slug: 'windows',
    description: 'Sistema operacional Microsoft Windows',
    icon: '🪟',
  },
  {
    name: 'Linux',
    slug: 'linux',
    description: 'Sistema operacional Linux',
    icon: '🐧',
  },
  {
    name: 'macOS',
    slug: 'macos',
    description: 'Sistema operacional Apple macOS',
    icon: '🍎',
  },
  {
    name: 'Steam',
    slug: 'steam',
    description: 'Plataforma de distribuição digital Steam',
    icon: '🎮',
  },
  {
    name: 'GOG',
    slug: 'gog',
    description: 'Good Old Games - Plataforma de jogos DRM-free',
    icon: '🎯',
  },
  {
    name: 'Epic Games',
    slug: 'epic-games',
    description: 'Epic Games Store',
    icon: '⚡',
  },
  {
    name: 'Origin',
    slug: 'origin',
    description: 'Plataforma da Electronic Arts',
    icon: '🟠',
  },
  {
    name: 'Uplay',
    slug: 'uplay',
    description: 'Plataforma da Ubisoft',
    icon: '🔵',
  },
  {
    name: 'Battle.net',
    slug: 'battle-net',
    description: 'Plataforma da Blizzard Entertainment',
    icon: '⚔️',
  },
];

async function createBasicPlatforms() {
  try {
    console.log('💻 Criando plataformas básicas...\n');

    // Verificar se as plataformas já existem
    const existingResponse = await axios.get(`${STRAPI_URL}/api/platforms`);
    const existingPlatforms = existingResponse.data.data || [];

    console.log(`📊 Plataformas existentes: ${existingPlatforms.length}`);

    if (existingPlatforms.length > 0) {
      console.log('📋 Plataformas já existentes:');
      existingPlatforms.forEach(plat => {
        console.log(`   - ${plat.name} (${plat.slug})`);
      });
    }

    // Criar plataformas que não existem
    const platformsToCreate = BASIC_PLATFORMS.filter(
      newPlat => !existingPlatforms.some(existingPlat => existingPlat.slug === newPlat.slug)
    );

    if (platformsToCreate.length === 0) {
      console.log('\n✅ Todas as plataformas básicas já existem!');
      return;
    }

    console.log(`\n🔨 Criando ${platformsToCreate.length} novas plataformas...`);

    for (const platform of platformsToCreate) {
      try {
        const response = await axios.post(`${STRAPI_URL}/api/platforms`, {
          data: {
            name: platform.name,
            slug: platform.slug,
            description: platform.description,
          },
        });

        console.log(`   ✅ Criada: ${platform.icon} ${platform.name} (ID: ${response.data.data.id})`);
      } catch (error) {
        console.error(`   ❌ Erro ao criar ${platform.name}:`, error.response?.data?.error?.message || error.message);
      }
    }

    console.log('\n🏁 Criação de plataformas concluída!');
  } catch (error) {
    console.error('❌ Erro ao criar plataformas:', error.message);
  }
}

// Função para listar todas as plataformas
async function listAllPlatforms() {
  try {
    console.log('📋 Listando todas as plataformas...\n');

    const response = await axios.get(`${STRAPI_URL}/api/platforms`);
    const platforms = response.data.data || [];

    if (platforms.length === 0) {
      console.log('❌ Nenhuma plataforma encontrada');
      return;
    }

    console.log(`📊 Total de plataformas: ${platforms.length}\n`);

    platforms.forEach((plat, index) => {
      console.log(`${index + 1}. ${plat.name}`);
      console.log(`   Slug: ${plat.slug}`);
      console.log(`   ID: ${plat.id}`);
      if (plat.description) {
        console.log(`   Descrição: ${plat.description}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('❌ Erro ao listar plataformas:', error.message);
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list') || args.includes('-l')) {
    await listAllPlatforms();
  } else {
    await createBasicPlatforms();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createBasicPlatforms,
  listAllPlatforms,
};
