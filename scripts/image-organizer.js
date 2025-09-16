
#!/usr/bin/env node

/**
 * Script de organização e limpeza de imagens para RootGames API
 *
 * Funcionalidades:
 * - Organização automática em pastas
 * - Detecção e remoção de duplicatas
 * - Otimização de espaço em disco
 * - Relatórios de organização
 * - Backup automático
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOADS_DIR = path.join(process.cwd(), 'public/uploads');
const BACKUP_DIR = path.join(process.cwd(), 'backups/images');

class ImageOrganizer {
  constructor() {
    this.stats = {
      totalFiles: 0,
      organizedFiles: 0,
      duplicatesRemoved: 0,
      spaceSaved: 0,
      backupCreated: false
    };
  }

  async initialize() {
    console.log('🗂️ ORGANIZADOR DE IMAGENS ROOTGAMES 🎮');
    console.log('=========================================');

    this.ensureDirectories();
    await this.analyzeCurrentState();

    console.log('\n📊 ESTADO ATUAL:');
    console.log(`   📁 Total de arquivos: ${this.stats.totalFiles}`);
    console.log(`   💾 Tamanho total: ${this.formatBytes(this.calculateTotalSize())}`);
    console.log(`   🔄 Duplicatas estimadas: ${this.estimateDuplicates()}`);
  }

  ensureDirectories() {
    const dirs = [
      UPLOADS_DIR,
      BACKUP_DIR,
      path.join(UPLOADS_DIR, 'covers'),
      path.join(UPLOADS_DIR, 'galleries'),
      path.join(UPLOADS_DIR, 'thumbnails'),
      path.join(UPLOADS_DIR, 'others')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async analyzeCurrentState() {
    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      this.stats.totalFiles = files.length;
    } catch (error) {
      console.log('❌ Erro ao analisar estado atual:', error.message);
    }
  }

  calculateTotalSize() {
    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      let totalSize = 0;

      files.forEach(file => {
        const filePath = path.join(UPLOADS_DIR, file);
        if (fs.statSync(filePath).isFile()) {
          totalSize += fs.statSync(filePath).size;
        }
      });

      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  estimateDuplicates() {
    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      const fileGroups = {};

      files.forEach(file => {
        const baseName = this.getBaseFileName(file);
        if (!fileGroups[baseName]) {
          fileGroups[baseName] = 0;
        }
        fileGroups[baseName]++;
      });

      return Object.values(fileGroups).reduce((sum, count) => {
        return sum + Math.max(0, count - 1);
      }, 0);
    } catch (error) {
      return 0;
    }
  }

  getBaseFileName(filename) {
    return filename
      .replace(/_\w{8,}\./g, '.')
      .replace(/\.(png|jpg|jpeg|gif|webp)$/i, '');
  }

  async showMenu() {
    while (true) {
      console.log('\n🎯 MENU DE ORGANIZAÇÃO:');
      console.log('=========================');
      console.log('1. 📁 Organizar imagens em pastas');
      console.log('2. 🧹 Remover duplicatas');
      console.log('3. 💾 Criar backup');
      console.log('4. 🔍 Analisar uso de disco');
      console.log('5. 📊 Relatório de organização');
      console.log('6. 🗑️ Limpeza completa');
      console.log('0. ❌ Sair');

      const choice = await this.question('\n🔑 Escolha uma opção: ');

      switch (choice) {
        case '1':
          await this.organizeImages();
          break;
        case '2':
          await this.removeDuplicates();
          break;
        case '3':
          await this.createBackup();
          break;
        case '4':
          await this.analyzeDiskUsage();
          break;
        case '5':
          await this.generateOrganizationReport();
          break;
        case '6':
          await this.fullCleanup();
          break;
        case '0':
          console.log('👋 Até logo!');
          return;
        default:
          console.log('❌ Opção inválida!');
      }

      await this.analyzeCurrentState();
    }
  }

  async organizeImages() {
    console.log('\n📁 ORGANIZANDO IMAGENS EM PASTAS');
    console.log('==================================');

    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      let organizedCount = 0;

      for (const file of files) {
        const filePath = path.join(UPLOADS_DIR, file);

        if (fs.statSync(filePath).isDirectory()) continue;

        const destination = this.getDestinationFolder(file);
        if (destination) {
          const destPath = path.join(UPLOADS_DIR, destination, file);

          // Mover arquivo para pasta apropriada
          fs.renameSync(filePath, destPath);
          organizedCount++;

          if (organizedCount % 50 === 0) {
            console.log(`   📦 Organizados: ${organizedCount} arquivos`);
          }
        }
      }

      this.stats.organizedFiles = organizedCount;
      console.log(`✅ Organização concluída! ${organizedCount} arquivos organizados`);

    } catch (error) {
      console.log('❌ Erro na organização:', error.message);
    }
  }

  getDestinationFolder(filename) {
    const lowerName = filename.toLowerCase();

    if (lowerName.includes('cover')) {
      return 'covers';
    } else if (lowerName.includes('gallery') || lowerName.includes('screenshot')) {
      return 'galleries';
    } else if (lowerName.includes('thumb') || lowerName.includes('small') || lowerName.includes('medium')) {
      return 'thumbnails';
    } else {
      return 'others';
    }
  }

  async removeDuplicates() {
    console.log('\n🧹 REMOVENDO DUPLICATAS');
    console.log('=========================');

    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      const fileGroups = {};
      let removedCount = 0;
      let spaceSaved = 0;

      // Agrupar arquivos similares
      for (const file of files) {
        const filePath = path.join(UPLOADS_DIR, file);
        if (fs.statSync(filePath).isDirectory()) continue;

        const baseName = this.getBaseFileName(file);
        if (!fileGroups[baseName]) {
          fileGroups[baseName] = [];
        }
        fileGroups[baseName].push({
          name: file,
          path: filePath,
          size: fs.statSync(filePath).size,
          mtime: fs.statSync(filePath).mtime
        });
      }

      // Remover duplicatas (manter o mais recente e maior)
      Object.entries(fileGroups).forEach(([baseName, fileList]) => {
        if (fileList.length > 1) {
          // Ordenar por data de modificação e tamanho
          fileList.sort((a, b) => {
            if (a.mtime.getTime() !== b.mtime.getTime()) {
              return b.mtime.getTime() - a.mtime.getTime();
            }
            return b.size - a.size;
          });

          // Manter o primeiro (mais recente/maior) e remover os outros
          for (let i = 1; i < fileList.length; i++) {
            const file = fileList[i];
            spaceSaved += file.size;
            fs.unlinkSync(file.path);
            removedCount++;

            if (removedCount % 10 === 0) {
              console.log(`   🗑️ Removidos: ${removedCount} arquivos`);
            }
          }
        }
      });

      this.stats.duplicatesRemoved = removedCount;
      this.stats.spaceSaved = spaceSaved;

      console.log(`✅ Limpeza concluída! ${removedCount} duplicatas removidas`);
      console.log(`💾 Espaço economizado: ${this.formatBytes(spaceSaved)}`);

    } catch (error) {
      console.log('❌ Erro na remoção de duplicatas:', error.message);
    }
  }

  async createBackup() {
    console.log('\n💾 CRIANDO BACKUP DAS IMAGENS');
    console.log('================================');

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(BACKUP_DIR, `images-backup-${timestamp}`);

      if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
      }

      const files = fs.readdirSync(UPLOADS_DIR);
      let copiedCount = 0;

      for (const file of files) {
        const sourcePath = path.join(UPLOADS_DIR, file);
        const destPath = path.join(backupPath, file);

        if (fs.statSync(sourcePath).isFile()) {
          fs.copyFileSync(sourcePath, destPath);
          copiedCount++;

          if (copiedCount % 100 === 0) {
            console.log(`   📋 Copiados: ${copiedCount} arquivos`);
          }
        }
      }

      this.stats.backupCreated = true;
      console.log(`✅ Backup criado em: ${backupPath}`);
      console.log(`📊 Total de arquivos: ${copiedCount}`);

    } catch (error) {
      console.log('❌ Erro na criação do backup:', error.message);
    }
  }

  async analyzeDiskUsage() {
    console.log('\n🔍 ANÁLISE DE USO DE DISCO');
    console.log('============================');

    try {
      const folders = ['covers', 'galleries', 'thumbnails', 'others'];
      const analysis = {};

      for (const folder of folders) {
        const folderPath = path.join(UPLOADS_DIR, folder);
        if (fs.existsSync(folderPath)) {
          const files = fs.readdirSync(folderPath);
          let totalSize = 0;
          let fileCount = 0;

          files.forEach(file => {
            const filePath = path.join(folderPath, file);
            if (fs.statSync(filePath).isFile()) {
              totalSize += fs.statSync(filePath).size;
              fileCount++;
            }
          });

          analysis[folder] = {
            count: fileCount,
            size: totalSize,
            percentage: 0
          };
        }
      }

      const totalSize = Object.values(analysis).reduce((sum, data) => sum + data.size, 0);

      // Calcular porcentagens
      Object.keys(analysis).forEach(folder => {
        analysis[folder].percentage = totalSize > 0 ?
          ((analysis[folder].size / totalSize) * 100).toFixed(1) : 0;
      });

      console.log('📊 DISTRIBUIÇÃO POR PASTAS:');
      Object.entries(analysis).forEach(([folder, data]) => {
        console.log(`   📁 ${folder}:`);
        console.log(`      Arquivos: ${data.count}`);
        console.log(`      Tamanho: ${this.formatBytes(data.size)}`);
        console.log(`      Percentual: ${data.percentage}%`);
      });

      console.log(`\n💾 TOTAL: ${this.formatBytes(totalSize)}`);

    } catch (error) {
      console.log('❌ Erro na análise:', error.message);
    }
  }

  async generateOrganizationReport() {
    console.log('\n📊 RELATÓRIO DE ORGANIZAÇÃO');
    console.log('=============================');

    await this.analyzeCurrentState();

    console.log('\n📈 ESTATÍSTICAS:');
    console.log(`   📁 Total de arquivos: ${this.stats.totalFiles}`);
    console.log(`   🗂️ Arquivos organizados: ${this.stats.organizedFiles}`);
    console.log(`   🧹 Duplicatas removidas: ${this.stats.duplicatesRemoved}`);
    console.log(`   💾 Espaço economizado: ${this.formatBytes(this.stats.spaceSaved)}`);
    console.log(`   💾 Backup criado: ${this.stats.backupCreated ? 'Sim' : 'Não'}`);

    // Verificar organização
    const folders = ['covers', 'galleries', 'thumbnails', 'others'];
    console.log('\n📂 ESTRUTURA DE PASTAS:');

    folders.forEach(folder => {
      const folderPath = path.join(UPLOADS_DIR, folder);
      if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath);
        const size = this.calculateFolderSize(folderPath);
        console.log(`   📁 ${folder}: ${files.length} arquivos (${this.formatBytes(size)})`);
      }
    });

    // Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    if (this.stats.duplicatesRemoved === 0) {
      console.log('   🧹 Execute remoção de duplicatas para economizar espaço');
    }
    if (!this.stats.backupCreated) {
      console.log('   💾 Crie um backup antes de fazer limpezas');
    }
    if (this.stats.organizedFiles === 0) {
      console.log('   📁 Organize as imagens em pastas para melhor gestão');
    }
  }

  async fullCleanup() {
    console.log('\n🗑️ LIMPEZA COMPLETA DO SISTEMA');
    console.log('=================================');

    const confirm = await this.question('⚠️ Esta operação é irreversível! Confirma? (sim/não): ');

    if (confirm.toLowerCase() !== 'sim') {
      console.log('❌ Operação cancelada');
      return;
    }

    try {
      console.log('🔄 Executando limpeza completa...');

      // 1. Criar backup
      await this.createBackup();

      // 2. Remover duplicatas
      await this.removeDuplicates();

      // 3. Organizar imagens
      await this.organizeImages();

      // 4. Limpar arquivos temporários
      await this.cleanTemporaryFiles();

      console.log('✅ Limpeza completa concluída!');

    } catch (error) {
      console.log('❌ Erro na limpeza completa:', error.message);
    }
  }

  async cleanTemporaryFiles() {
    console.log('🧹 Limpando arquivos temporários...');

    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      let removedCount = 0;

      files.forEach(file => {
        if (file.includes('temp') || file.includes('tmp') || file.endsWith('.tmp')) {
          const filePath = path.join(UPLOADS_DIR, file);
          fs.unlinkSync(filePath);
          removedCount++;
        }
      });

      if (removedCount > 0) {
        console.log(`   🗑️ ${removedCount} arquivos temporários removidos`);
      }

    } catch (error) {
      console.log('❌ Erro na limpeza de temporários:', error.message);
    }
  }

  calculateFolderSize(folderPath) {
    try {
      const files = fs.readdirSync(folderPath);
      let totalSize = 0;

      files.forEach(file => {
        const filePath = path.join(folderPath, file);
        if (fs.statSync(filePath).isFile()) {
          totalSize += fs.statSync(filePath).size;
        }
      });

      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  question(query) {
    return new Promise((resolve) => {
      const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(query, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }
}

async function main() {
  try {
    const organizer = new ImageOrganizer();
    await organizer.initialize();
    await organizer.showMenu();
  } catch (error) {
    console.log('❌ Erro no organizador:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ImageOrganizer;
