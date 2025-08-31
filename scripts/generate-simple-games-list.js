#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');

const STRAPI_URL = 'http://localhost:1337';
const OUTPUT_FILE = './public/jogos-simples.md';

async function generateSimpleGamesList() {
  try {
    console.log('🎮 Gerando lista simples de nomes dos jogos...');

    let allGames = [];
    let page = 1;
    let hasMore = true;

    // Buscar todos os jogos paginados
    while (hasMore) {
      console.log(`📄 Buscando página ${page}...`);

      const response = await axios.get(`${STRAPI_URL}/api/games`, {
        params: {
          'pagination[page]': page,
          'pagination[pageSize]': 100,
        },
      });

      if (response.data.data && response.data.data.length > 0) {
        allGames = allGames.concat(response.data.data);
        page++;

        // Aguardar entre requisições
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Total de jogos encontrados: ${allGames.length}`);

    // Criar conteúdo Markdown simples
    let markdownContent = `# 🎮 Lista de Jogos - RootGames API

## 📊 Total de Jogos: ${allGames.length}

## 🎯 Nomes dos Jogos

`;

    // Adicionar cada jogo como item de lista
    allGames.forEach((game, index) => {
      const gameName = game.name || 'Nome não disponível';
      markdownContent += `${index + 1}. **${gameName}**\n`;
    });

    // Adicionar rodapé
    markdownContent += `

---

## 📝 Notas
- Lista simples contendo apenas os nomes dos jogos
- Total: ${allGames.length} jogos
- Gerado em: ${new Date().toLocaleString('pt-BR')}

## 🔄 Como Atualizar
Para atualizar esta lista, execute:
\`\`\`bash
node scripts/generate-simple-games-list.js
\`\`\`
`;

    // Salvar arquivo
    fs.writeFileSync(OUTPUT_FILE, markdownContent, 'utf8');

    console.log(`✅ Lista simples salva em: ${OUTPUT_FILE}`);
    console.log(`📊 Total de jogos processados: ${allGames.length}`);

    // Mostrar alguns exemplos
    console.log('\n📋 Exemplos de jogos:');
    allGames.slice(0, 5).forEach((game, index) => {
      console.log(`${index + 1}. ${game.name}`);
    });
  } catch (error) {
    console.error('❌ Erro ao gerar lista simples:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  generateSimpleGamesList();
}

module.exports = { generateSimpleGamesList };
