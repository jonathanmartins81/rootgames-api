#!/usr/bin/env node

const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';

// Categorias básicas para jogos
const BASIC_CATEGORIES = [
  {
    name: 'RPG',
    slug: 'rpg',
    description: 'Role-Playing Games - Jogos de interpretação de personagem',
  },
  {
    name: 'Ação',
    slug: 'acao',
    description: 'Jogos de ação e aventura',
  },
  {
    name: 'Estratégia',
    slug: 'estrategia',
    description: 'Jogos de estratégia e tática',
  },
  {
    name: 'Simulação',
    slug: 'simulacao',
    description: 'Jogos de simulação e gerenciamento',
  },
  {
    name: 'Esporte',
    slug: 'esporte',
    description: 'Jogos de esportes e competição',
  },
  {
    name: 'Corrida',
    slug: 'corrida',
    description: 'Jogos de corrida e veículos',
  },
  {
    name: 'Luta',
    slug: 'luta',
    description: 'Jogos de luta e combate',
  },
  {
    name: 'Tiro',
    slug: 'tiro',
    description: 'Jogos de tiro em primeira e terceira pessoa',
  },
  {
    name: 'Puzzle',
    slug: 'puzzle',
    description: 'Jogos de quebra-cabeça e lógica',
  },
  {
    name: 'Indie',
    slug: 'indie',
    description: 'Jogos independentes e experimentais',
  },
  {
    name: 'Horror',
    slug: 'horror',
    description: 'Jogos de terror e suspense',
  },
  {
    name: 'Fantasia',
    slug: 'fantasia',
    description: 'Jogos de fantasia e magia',
  },
  {
    name: 'Sci-Fi',
    slug: 'sci-fi',
    description: 'Jogos de ficção científica',
  },
  {
    name: 'Histórico',
    slug: 'historico',
    description: 'Jogos baseados em eventos históricos',
  },
  {
    name: 'Multiplayer',
    slug: 'multiplayer',
    description: 'Jogos com foco em multijogador',
  },
];

async function createBasicCategories() {
  try {
    console.log('🏷️  Criando categorias básicas...\n');

    // Verificar se as categorias já existem
    const existingResponse = await axios.get(`${STRAPI_URL}/api/categories`);
    const existingCategories = existingResponse.data.data || [];

    console.log(`📊 Categorias existentes: ${existingCategories.length}`);

    if (existingCategories.length > 0) {
      console.log('📋 Categorias já existentes:');
      existingCategories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.slug})`);
      });
    }

    // Criar categorias que não existem
    const categoriesToCreate = BASIC_CATEGORIES.filter(
      newCat => !existingCategories.some(existingCat => existingCat.slug === newCat.slug)
    );

    if (categoriesToCreate.length === 0) {
      console.log('\n✅ Todas as categorias básicas já existem!');
      return;
    }

    console.log(`\n🔨 Criando ${categoriesToCreate.length} novas categorias...`);

    for (const category of categoriesToCreate) {
      try {
        const response = await axios.post(`${STRAPI_URL}/api/categories`, {
          data: {
            name: category.name,
            slug: category.slug,
            description: category.description,
          },
        });

        console.log(`   ✅ Criada: ${category.name} (ID: ${response.data.data.id})`);
      } catch (error) {
        console.error(`   ❌ Erro ao criar ${category.name}:`, error.response?.data?.error?.message || error.message);
      }
    }

    console.log('\n🏁 Criação de categorias concluída!');
  } catch (error) {
    console.error('❌ Erro ao criar categorias:', error.message);
  }
}

// Função para listar todas as categorias
async function listAllCategories() {
  try {
    console.log('📋 Listando todas as categorias...\n');

    const response = await axios.get(`${STRAPI_URL}/api/categories`);
    const categories = response.data.data || [];

    if (categories.length === 0) {
      console.log('❌ Nenhuma categoria encontrada');
      return;
    }

    console.log(`📊 Total de categorias: ${categories.length}\n`);

    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name}`);
      console.log(`   Slug: ${cat.slug}`);
      console.log(`   ID: ${cat.id}`);
      if (cat.description) {
        console.log(`   Descrição: ${cat.description}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('❌ Erro ao listar categorias:', error.message);
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list') || args.includes('-l')) {
    await listAllCategories();
  } else {
    await createBasicCategories();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createBasicCategories,
  listAllCategories,
};
