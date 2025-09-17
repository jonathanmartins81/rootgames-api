#!/usr/bin/env node

/**
 * 🔄 Script para alterar branch padrão no GitHub
 * Altera de main para master e exclui a branch main
 */

const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'jonathanmartins81';
const REPO_NAME = 'rootgames-api';

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN não encontrado. Configure a variável de ambiente.');
  process.exit(1);
}

// Função para fazer requisição HTTPS
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function changeDefaultBranch() {
  try {
    console.log('🔄 Alterando branch padrão de main para master...');

    // 1. Alterar branch padrão
    const changeBranchOptions = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}`,
      method: 'PATCH',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'RootGames-API-Script',
        'Content-Type': 'application/json'
      }
    };

    const changeBranchData = {
      default_branch: 'master'
    };

    const changeResult = await makeRequest(changeBranchOptions, changeBranchData);

    if (changeResult.status === 200) {
      console.log('✅ Branch padrão alterada para master');
    } else {
      console.error('❌ Erro ao alterar branch padrão:', changeResult.data);
      return;
    }

    // Aguardar um pouco para a mudança ser processada
    console.log('⏳ Aguardando processamento...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Excluir branch main
    console.log('🗑️ Excluindo branch main...');

    const deleteBranchOptions = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/main`,
      method: 'DELETE',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'RootGames-API-Script'
      }
    };

    const deleteResult = await makeRequest(deleteBranchOptions);

    if (deleteResult.status === 204) {
      console.log('✅ Branch main excluída com sucesso');
    } else {
      console.error('❌ Erro ao excluir branch main:', deleteResult.data);
    }

    // 3. Verificar status final
    console.log('🔍 Verificando status final...');

    const statusOptions = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}`,
      method: 'GET',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'RootGames-API-Script'
      }
    };

    const statusResult = await makeRequest(statusOptions);

    if (statusResult.status === 200) {
      console.log('✅ Status final:');
      console.log(`   - Branch padrão: ${statusResult.data.default_branch}`);
      console.log(`   - URL: ${statusResult.data.html_url}`);
    }

    console.log('🎉 Processo concluído com sucesso!');
    console.log('📝 Próximos passos:');
    console.log('   1. Atualizar referências locais: git remote prune origin');
    console.log('   2. Verificar branches: git branch -a');
    console.log('   3. Atualizar webhooks se necessário');

  } catch (error) {
    console.error('❌ Erro durante o processo:', error.message);
    process.exit(1);
  }
}

// Executar script
changeDefaultBranch();
