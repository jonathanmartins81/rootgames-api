#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');

const STRAPI_URL = 'http://localhost:1337';
const OUTPUT_FILE = './public/lista-jogos.md';

async function generateGamesList() {
  try {
    console.log('🎮 Gerando lista completa de jogos...');

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
          populate: 'cover',
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

    // Criar conteúdo Markdown
    let markdownContent = `# 🎮 Lista Completa de Jogos - RootGames API

## 📊 Estatísticas
- **Total de Jogos:** ${allGames.length}
- **Data de Geração:** ${new Date().toLocaleString('pt-BR')}
- **Última Atualização:** ${new Date().toLocaleString('pt-BR')}

## 🎯 Lista de Jogos

| ID | Document ID | Nome do Jogo | Tem Imagem |
|----|-------------|--------------|------------|
`;

    // Adicionar cada jogo à tabela
    allGames.forEach(game => {
      const hasImage = game.cover ? '✅' : '❌';
      const gameName = game.name || 'Nome não disponível';

      markdownContent += `| ${game.id || 'N/A'} | ${game.documentId || 'N/A'} | ${gameName} | ${hasImage} |\n`;
    });

    // Adicionar rodapé
    markdownContent += `

---

## 📝 Notas
- **ID:** Identificador numérico do jogo
- **Document ID:** Identificador único do documento no Strapi
- **Nome do Jogo:** Nome oficial do jogo
- **Tem Imagem:** Indica se o jogo possui imagem de capa

## 🔄 Como Atualizar
Para atualizar esta lista, execute:
\`\`\`bash
node scripts/generate-games-list.js
\`\`\`

## 📁 Arquivo Gerado
Este arquivo foi gerado automaticamente pelo script \`generate-games-list.js\`
`;

    // Salvar arquivo
    fs.writeFileSync(OUTPUT_FILE, markdownContent, 'utf8');

    console.log(`✅ Lista de jogos salva em: ${OUTPUT_FILE}`);
    console.log(`📊 Total de jogos processados: ${allGames.length}`);

    // Mostrar alguns exemplos
    console.log('\n📋 Exemplos de jogos:');
    allGames.slice(0, 5).forEach((game, index) => {
      console.log(`${index + 1}. ${game.name} (ID: ${game.id}, DocID: ${game.documentId})`);
    });
  } catch (error) {
    console.error('❌ Erro ao gerar lista:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  generateGamesList();
}

module.exports = { generateGamesList };
