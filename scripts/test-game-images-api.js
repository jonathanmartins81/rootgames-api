#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://localhost:3001';

// Configurações de teste
const TEST_CONFIG = {
  timeout: 10000,
  retries: 3,
  delayBetweenTests: 1000,
};

// Função para aguardar
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para fazer requisição com retry
async function makeRequestWithRetry(method, url, data = null, retries = TEST_CONFIG.retries) {
  for (let i = 0; i < retries; i++) {
    try {
      const config = {
        method,
        url,
        timeout: TEST_CONFIG.timeout,
        ...(data && { data }),
      };

      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      if (i === retries - 1) {
        return {
          success: false,
          error: error.message,
          status: error.response?.status,
        };
      }

      console.log(`  ⚠️  Tentativa ${i + 1} falhou, tentando novamente...`);
      await delay(1000);
    }
  }
}

// Teste 1: Health Check
async function testHealthCheck() {
  console.log('🧪 Teste 1: Health Check');

  const result = await makeRequestWithRetry('GET', `${API_URL}/health`);

  if (result.success) {
    console.log('  ✅ Health check passou');
    console.log(`  📊 Status: ${result.data.status}`);
    console.log(`  🎮 Total de jogos: ${result.data.totalGames}`);
    console.log(`  🚀 Versão: ${result.data.version}`);
    return true;
  } else {
    console.log('  ❌ Health check falhou');
    console.log(`  🔴 Erro: ${result.error}`);
    return false;
  }
}

// Teste 2: Lista de Jogos
async function testGamesList() {
  console.log('🧪 Teste 2: Lista de Jogos');

  const result = await makeRequestWithRetry('GET', `${API_URL}/api/games-list`);

  if (result.success) {
    console.log('  ✅ Lista de jogos passou');
    console.log(`  📊 Total de jogos: ${result.data.total}`);
    console.log(`  🎯 Primeiros jogos:`);
    result.data.games.slice(0, 3).forEach((game, index) => {
      console.log(`    ${index + 1}. ${game.name} (${game.source})`);
    });
    return true;
  } else {
    console.log('  ❌ Lista de jogos falhou');
    console.log(`  🔴 Erro: ${result.error}`);
    return false;
  }
}

// Teste 3: Busca de Imagens por Nome Exato
async function testExactNameSearch() {
  console.log('🧪 Teste 3: Busca por Nome Exato');

  const testGame = 'Fallout 4: Game of the Year Edition';
  const result = await makeRequestWithRetry('GET', `${API_URL}/api/game-images`, null, {
    params: { name: testGame },
  });

  if (result.success) {
    console.log('  ✅ Busca por nome exato passou');
    console.log(`  🎮 Jogo encontrado: ${result.data.game}`);
    console.log(`  🖼️  Tem capa: ${!!result.data.cover}`);
    console.log(`  🖼️  Tem galeria: ${result.data.gallery?.length || 0} imagens`);
    return true;
  } else {
    console.log('  ❌ Busca por nome exato falhou');
    console.log(`  🔴 Erro: ${result.error}`);
    return false;
  }
}

// Teste 4: Busca por Similaridade
async function testSimilaritySearch() {
  console.log('🧪 Teste 4: Busca por Similaridade');

  const testQuery = 'witcher';
  const result = await makeRequestWithRetry('GET', `${API_URL}/api/game-images/search`, null, {
    params: { query: testQuery },
  });

  if (result.success) {
    console.log('  ✅ Busca por similaridade passou');
    console.log(`  🔍 Query: "${testQuery}"`);
    console.log(`  📊 Resultados encontrados: ${result.data.total}`);
    console.log(`  🎯 Jogos encontrados:`);
    result.data.results.forEach((game, index) => {
      console.log(`    ${index + 1}. ${game.name}`);
    });
    return true;
  } else {
    console.log('  ❌ Busca por similaridade falhou');
    console.log(`  🔴 Erro: ${result.error}`);
    return false;
  }
}

// Teste 5: Busca de Jogo Inexistente
async function testNonExistentGame() {
  console.log('🧪 Teste 5: Busca de Jogo Inexistente');

  const testGame = 'Jogo Que Não Existe 12345';
  const result = await makeRequestWithRetry('GET', `${API_URL}/api/game-images`, null, {
    params: { name: testGame },
  });

  if (!result.success && result.status === 404) {
    console.log('  ✅ Busca de jogo inexistente passou (404 esperado)');
    console.log(`  📝 Mensagem: ${result.data?.message || 'N/A'}`);
    return true;
  } else {
    console.log('  ❌ Busca de jogo inexistente falhou');
    console.log(`  🔴 Status inesperado: ${result.status}`);
    return false;
  }
}

// Teste 6: Adicionar Novo Jogo
async function testAddNewGame() {
  console.log('🧪 Teste 6: Adicionar Novo Jogo');

  const testGame = {
    name: 'Jogo de Teste API',
    cover: 'https://via.placeholder.com/400x600/FF0000/FFFFFF?text=Test+Game',
    gallery: [
      'https://via.placeholder.com/800x600/00FF00/FFFFFF?text=Screenshot+1',
      'https://via.placeholder.com/800x600/0000FF/FFFFFF?text=Screenshot+2',
    ],
    source: 'Teste',
  };

  const result = await makeRequestWithRetry('POST', `${API_URL}/api/game-images`, testGame);

  if (result.success) {
    console.log('  ✅ Adicionar novo jogo passou');
    console.log(`  🎮 Jogo adicionado: ${result.data.game.name}`);
    console.log(`  🖼️  Capa: ${result.data.game.cover}`);
    console.log(`  🖼️  Galeria: ${result.data.game.gallery.length} imagens`);
    return true;
  } else {
    console.log('  ❌ Adicionar novo jogo falhou');
    console.log(`  🔴 Erro: ${result.error}`);
    return false;
  }
}

// Teste 7: Atualizar Jogo Existente
async function testUpdateGame() {
  console.log('🧪 Teste 7: Atualizar Jogo Existente');

  const testGame = 'Jogo de Teste API';
  const updates = {
    cover: 'https://via.placeholder.com/400x600/00FF00/FFFFFF?text=Updated+Game',
    source: 'Teste Atualizado',
  };

  const result = await makeRequestWithRetry(
    'PUT',
    `${API_URL}/api/game-images/${encodeURIComponent(testGame)}`,
    updates
  );

  if (result.success) {
    console.log('  ✅ Atualizar jogo passou');
    console.log(`  🎮 Jogo atualizado: ${result.data.game.name}`);
    console.log(`  🖼️  Nova capa: ${result.data.game.cover}`);
    console.log(`  📝 Nova fonte: ${result.data.game.source}`);
    return true;
  } else {
    console.log('  ❌ Atualizar jogo falhou');
    console.log(`  🔴 Erro: ${result.error}`);
    return false;
  }
}

// Teste 8: Validação de Parâmetros
async function testParameterValidation() {
  console.log('🧪 Teste 8: Validação de Parâmetros');

  // Teste sem parâmetro name
  const result1 = await makeRequestWithRetry('GET', `${API_URL}/api/game-images`);

  if (!result1.success && result1.status === 400) {
    console.log('  ✅ Validação de parâmetros passou (400 esperado para requisição sem name)');
  } else {
    console.log('  ❌ Validação de parâmetros falhou');
    console.log(`  🔴 Status inesperado: ${result1.status}`);
    return false;
  }

  // Teste sem parâmetro query
  const result2 = await makeRequestWithRetry('GET', `${API_URL}/api/game-images/search`);

  if (!result2.success && result2.status === 400) {
    console.log('  ✅ Validação de parâmetros passou (400 esperado para requisição sem query)');
    return true;
  } else {
    console.log('  ❌ Validação de parâmetros falhou');
    console.log(`  🔴 Status inesperado: ${result2.status}`);
    return false;
  }
}

// Teste 9: Performance dos Endpoints
async function testEndpointPerformance() {
  console.log('🧪 Teste 9: Performance dos Endpoints');

  const endpoints = [
    '/health',
    '/api/games-list',
    '/api/game-images?name=Fallout 4: Game of the Year Edition',
    '/api/game-images/search?query=witcher',
  ];

  const results = [];

  for (const endpoint of endpoints) {
    const startTime = Date.now();
    const result = await makeRequestWithRetry('GET', `${API_URL}${endpoint}`);
    const responseTime = Date.now() - startTime;

    results.push({
      endpoint,
      success: result.success,
      responseTime,
    });

    console.log(`  📊 ${endpoint}: ${responseTime}ms ${result.success ? '✅' : '❌'}`);

    await delay(500); // Aguardar entre testes
  }

  const successfulTests = results.filter(r => r.success);
  const averageResponseTime = successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length;

  console.log(`  📈 Performance média: ${averageResponseTime.toFixed(0)}ms`);
  console.log(`  ✅ Testes bem-sucedidos: ${successfulTests.length}/${results.length}`);

  return successfulTests.length === results.length;
}

// Teste 10: Limpeza (remover jogo de teste)
async function testCleanup() {
  console.log('🧪 Teste 10: Limpeza');

  // Por enquanto, apenas logamos a limpeza
  // Em uma implementação real, você removeria o jogo de teste
  console.log('  🧹 Jogo de teste mantido para inspeção manual');
  console.log('  📝 Use o script de gerenciamento para remover se necessário');

  return true;
}

// Função principal de teste
async function runAllTests() {
  console.log('🚀 Iniciando Testes da API de Imagens de Jogos\n');

  const tests = [
    testHealthCheck,
    testGamesList,
    testExactNameSearch,
    testSimilaritySearch,
    testNonExistentGame,
    testAddNewGame,
    testUpdateGame,
    testParameterValidation,
    testEndpointPerformance,
    testCleanup,
  ];

  const results = [];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n📋 Executando ${test.name}...`);

    try {
      const result = await test();
      results.push({ test: test.name, success: result });

      if (result) {
        console.log(`  🎉 ${test.name} passou!`);
      } else {
        console.log(`  💥 ${test.name} falhou!`);
      }
    } catch (error) {
      console.log(`  💥 ${test.name} falhou com erro: ${error.message}`);
      results.push({ test: test.name, success: false, error: error.message });
    }

    // Aguardar entre testes
    if (i < tests.length - 1) {
      await delay(TEST_CONFIG.delayBetweenTests);
    }
  }

  // Relatório final
  console.log('\n📊 RELATÓRIO FINAL DOS TESTES:');
  console.log('================================');

  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log(`✅ Testes passaram: ${passedTests}/${totalTests} (${successRate}%)`);

  if (passedTests === totalTests) {
    console.log('🎉 TODOS OS TESTES PASSARAM! API está funcionando perfeitamente.');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique os logs acima.');

    const failedTests = results.filter(r => !r.success);
    console.log('\n❌ Testes que falharam:');
    failedTests.forEach(test => {
      console.log(`  - ${test.test}${test.error ? `: ${test.error}` : ''}`);
    });
  }

  return passedTests === totalTests;
}

// Função para executar teste específico
async function runSpecificTest(testName) {
  const testMap = {
    health: testHealthCheck,
    'games-list': testGamesList,
    'exact-search': testExactNameSearch,
    'similarity-search': testSimilaritySearch,
    'non-existent': testNonExistentGame,
    'add-game': testAddNewGame,
    'update-game': testUpdateGame,
    validation: testParameterValidation,
    performance: testEndpointPerformance,
    cleanup: testCleanup,
  };

  const test = testMap[testName];

  if (!test) {
    console.log(`❌ Teste "${testName}" não encontrado`);
    console.log('📋 Testes disponíveis:');
    Object.keys(testMap).forEach(key => console.log(`  - ${key}`));
    return false;
  }

  console.log(`🧪 Executando teste específico: ${testName}`);
  return await test();
}

// Função para mostrar ajuda
function showHelp() {
  console.log(`
🧪 Testes da API de Imagens de Jogos

📋 Comandos disponíveis:

  all                        - Executar todos os testes
  <nome-do-teste>           - Executar teste específico
  help                       - Mostrar esta ajuda

📝 Testes disponíveis:
  health                     - Health check da API
  games-list                 - Lista de jogos
  exact-search               - Busca por nome exato
  similarity-search          - Busca por similaridade
  non-existent               - Busca de jogo inexistente
  add-game                   - Adicionar novo jogo
  update-game                - Atualizar jogo existente
  validation                 - Validação de parâmetros
  performance                - Performance dos endpoints
  cleanup                    - Limpeza dos testes

📝 Exemplos:
  node scripts/test-game-images-api.js all
  node scripts/test-game-images-api.js health
  node scripts/test-game-images-api.js performance
`);
}

// Função principal
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];

  try {
    if (command === 'all') {
      await runAllTests();
    } else if (command === 'help') {
      showHelp();
    } else {
      await runSpecificTest(command);
    }
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  runAllTests,
  runSpecificTest,
  testHealthCheck,
  testGamesList,
  testExactNameSearch,
  testSimilaritySearch,
  testNonExistentGame,
  testAddNewGame,
  testUpdateGame,
  testParameterValidation,
  testEndpointPerformance,
  testCleanup,
};
