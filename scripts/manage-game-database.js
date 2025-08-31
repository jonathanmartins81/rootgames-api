#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3001';
const BACKUP_DIR = './backups/game-images';
const BACKUP_FILE = path.join(BACKUP_DIR, `game-images-${new Date().toISOString().split('T')[0]}.json`);

// Função para criar backup do banco de dados
async function createBackup() {
  try {
    console.log('💾 Criando backup do banco de dados...');

    // Criar diretório de backup se não existir
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Buscar dados atuais
    const response = await axios.get(`${API_URL}/api/games-list`);

    if (response.data.success) {
      const backupData = {
        timestamp: new Date().toISOString(),
        totalGames: response.data.total,
        games: response.data.games,
      };

      fs.writeFileSync(BACKUP_FILE, JSON.stringify(backupData, null, 2));
      console.log(`✅ Backup criado: ${BACKUP_FILE}`);
      return backupData;
    } else {
      throw new Error('Falha ao buscar dados para backup');
    }
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error.message);
    return null;
  }
}

// Função para restaurar backup
async function restoreBackup(backupFile) {
  try {
    console.log(`🔄 Restaurando backup: ${backupFile}`);

    if (!fs.existsSync(backupFile)) {
      throw new Error('Arquivo de backup não encontrado');
    }

    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    console.log(`📊 Backup contém ${backupData.totalGames} jogos`);

    // Aqui você implementaria a lógica de restauração
    // Por enquanto, apenas mostra os dados
    console.log('📋 Jogos no backup:');
    backupData.games.slice(0, 5).forEach((game, index) => {
      console.log(`  ${index + 1}. ${game.name} (${game.source})`);
    });

    return backupData;
  } catch (error) {
    console.error('❌ Erro ao restaurar backup:', error.message);
    return null;
  }
}

// Função para listar backups disponíveis
function listBackups() {
  try {
    console.log('📁 Backups disponíveis:');

    if (!fs.existsSync(BACKUP_DIR)) {
      console.log('  Nenhum backup encontrado');
      return [];
    }

    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.json'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.log('  Nenhum arquivo de backup encontrado');
      return [];
    }

    files.forEach((file, index) => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024).toFixed(1);
      console.log(`  ${index + 1}. ${file} (${size}KB)`);
    });

    return files;
  } catch (error) {
    console.error('❌ Erro ao listar backups:', error.message);
    return [];
  }
}

// Função para adicionar jogo ao banco
async function addGame(name, cover, gallery = [], source = 'Manual') {
  try {
    console.log(`➕ Adicionando jogo: ${name}`);

    const gameData = {
      name,
      cover,
      gallery,
      source,
    };

    const response = await axios.post(`${API_URL}/api/game-images`, gameData);

    if (response.data.success) {
      console.log(`✅ Jogo "${name}" adicionado com sucesso!`);
      return response.data.game;
    } else {
      throw new Error('Falha ao adicionar jogo');
    }
  } catch (error) {
    console.error(`❌ Erro ao adicionar jogo: ${error.message}`);
    return null;
  }
}

// Função para atualizar jogo existente
async function updateGame(name, updates) {
  try {
    console.log(`🔄 Atualizando jogo: ${name}`);

    const response = await axios.put(`${API_URL}/api/game-images/${encodeURIComponent(name)}`, updates);

    if (response.data.success) {
      console.log(`✅ Jogo "${name}" atualizado com sucesso!`);
      return response.data.game;
    } else {
      throw new Error('Falha ao atualizar jogo');
    }
  } catch (error) {
    console.error(`❌ Erro ao atualizar jogo: ${error.message}`);
    return null;
  }
}

// Função para buscar jogo
async function searchGame(query) {
  try {
    console.log(`🔍 Buscando jogos com: "${query}"`);

    const response = await axios.get(`${API_URL}/api/game-images/search`, {
      params: { query },
    });

    if (response.data.success) {
      console.log(`✅ Encontrados ${response.data.total} jogos:`);
      response.data.results.forEach((game, index) => {
        console.log(`  ${index + 1}. ${game.name} (${game.source})`);
      });
      return response.data.results;
    } else {
      throw new Error('Falha na busca');
    }
  } catch (error) {
    console.error(`❌ Erro na busca: ${error.message}`);
    return [];
  }
}

// Função para mostrar estatísticas
async function showStats() {
  try {
    console.log('📊 Estatísticas do banco de dados:');

    const response = await axios.get(`${API_URL}/health`);

    if (response.data.status === 'OK') {
      console.log(`  🎮 Total de jogos: ${response.data.totalGames}`);
      console.log(`  ⏰ Uptime: ${(response.data.uptime / 60).toFixed(1)} minutos`);
      console.log(`  🚀 Versão: ${response.data.version}`);
      console.log(`  ✨ Funcionalidades: ${response.data.features.join(', ')}`);
    } else {
      throw new Error('API não está respondendo');
    }
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error.message);
  }
}

// Função para mostrar ajuda
function showHelp() {
  console.log(`
🎮 Gerenciador de Banco de Dados de Imagens de Jogos

📋 Comandos disponíveis:

  backup                    - Criar backup do banco atual
  restore <arquivo>         - Restaurar backup específico
  list-backups             - Listar backups disponíveis
  add <nome> <capa>        - Adicionar novo jogo
  update <nome> <campo> <valor> - Atualizar jogo existente
  search <termo>           - Buscar jogos
  stats                    - Mostrar estatísticas
  help                     - Mostrar esta ajuda

📝 Exemplos:
  node scripts/manage-game-database.js backup
  node scripts/manage-game-database.js search witcher
  node scripts/manage-game-database.js add "Novo Jogo" "https://exemplo.com/capa.jpg"
  node scripts/manage-game-database.js update "Fallout 4" cover "https://nova-capa.jpg"
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
    switch (command) {
      case 'backup':
        await createBackup();
        break;

      case 'restore':
        if (args[1]) {
          await restoreBackup(args[1]);
        } else {
          console.log('❌ Especifique o arquivo de backup');
        }
        break;

      case 'list-backups':
        listBackups();
        break;

      case 'add':
        if (args.length >= 3) {
          const name = args[1];
          const cover = args[2];
          const gallery = args[3] ? args[3].split(',') : [];
          await addGame(name, cover, gallery);
        } else {
          console.log('❌ Uso: add <nome> <capa> [galeria]');
        }
        break;

      case 'update':
        if (args.length >= 4) {
          const name = args[1];
          const field = args[2];
          const value = args[3];
          const updates = { [field]: value };
          await updateGame(name, updates);
        } else {
          console.log('❌ Uso: update <nome> <campo> <valor>');
        }
        break;

      case 'search':
        if (args[1]) {
          await searchGame(args[1]);
        } else {
          console.log('❌ Especifique o termo de busca');
        }
        break;

      case 'stats':
        await showStats();
        break;

      case 'help':
        showHelp();
        break;

      default:
        console.log(`❌ Comando desconhecido: ${command}`);
        showHelp();
        break;
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
  addGame,
  updateGame,
  searchGame,
  showStats,
};
