#!/usr/bin/env node

/**
 * Script para corrigir a gallery do Heroes of Might and Magic 3
 *
 * Funcionalidades:
 * - Baixar screenshots do RAWG.io
 * - Fazer upload para o Strapi
 * - Associar à gallery do game
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_BASE = 'http://localhost:1337/api';
const UPLOADS_DIR = path.join(process.cwd(), 'public/uploads');

// Headers para simular navegador
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
};

class HeroesGalleryFixer {
  constructor() {
    this.gameId = 5; // Heroes of Might and Magic 3: Complete
    this.gameName = 'Heroes of Might and Magic 3';
    this.screenshots = [
      'https://media.rawg.io/media/screenshots/4df/4dfa22614f3a1f0a432e0e315b30fbc0.jpg',
      'https://media.rawg.io/media/screenshots/126/1266122055562edeb3c203dfed01b18b.jpg',
      'https://media.rawg.io/media/screenshots/0d3/0d38a4d29fb1a0ada900e5e7b4ed3664.jpg',
      'https://media.rawg.io/media/screenshots/f53/f533227a3faf487341ab4f9ae4bf1452.jpg',
      'https://media.rawg.io/media/screenshots/4df/4dfa22614f3a1f0a432e0e315b30fbc0.jpg' // Duplicar o primeiro para ter 5 imagens
    ];
  }

  async fixGallery() {
    console.log('🎮 CORRIGINDO GALLERY DO HEROES OF MIGHT AND MAGIC 3');
    console.log('====================================================');

    try {
      // Verificar se o diretório de uploads existe
      this.ensureUploadsDir();

      // Baixar screenshots
      console.log('\n📥 Baixando screenshots...');
      const downloadedFiles = await this.downloadScreenshots();

      if (downloadedFiles.length === 0) {
        console.log('❌ Nenhum screenshot foi baixado com sucesso');
        return;
      }

      console.log(`✅ ${downloadedFiles.length} screenshots baixados`);

      // Fazer upload para o Strapi
      console.log('\n⬆️ Fazendo upload para o Strapi...');
      const uploadedImages = await this.uploadToStrapi(downloadedFiles);

      if (uploadedImages.length === 0) {
        console.log('❌ Nenhum upload foi realizado com sucesso');
        return;
      }

      console.log(`✅ ${uploadedImages.length} imagens enviadas para o Strapi`);

      // Atualizar o game com as imagens da gallery
      console.log('\n🔗 Associando imagens ao game...');
      await this.updateGameGallery(uploadedImages);

      console.log('\n🎉 Gallery corrigida com sucesso!');

      // Verificar resultado final
      await this.verifyResult();

    } catch (error) {
      console.log('❌ Erro durante a correção:', error.message);
    }
  }

  ensureUploadsDir() {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      console.log('📁 Diretório de uploads criado');
    }
  }

  async downloadScreenshots() {
    const downloadedFiles = [];

    for (let i = 0; i < this.screenshots.length; i++) {
      const screenshotUrl = this.screenshots[i];
      const filename = `heroes_of_might_and_magic_3_gallery_real_${i + 1}.jpg`;

      try {
        console.log(`  📥 Baixando screenshot ${i + 1}/${this.screenshots.length}...`);

        const response = await axios.get(screenshotUrl, {
          responseType: 'arraybuffer',
          headers: BROWSER_HEADERS,
          timeout: 15000
        });

        const filePath = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(filePath, response.data);

        downloadedFiles.push(filePath);
        console.log(`    ✅ ${filename}`);

        // Aguardar entre downloads
        await this.sleep(500);

      } catch (error) {
        console.log(`    ❌ Erro ao baixar ${filename}:`, error.message);
      }
    }

    return downloadedFiles;
  }

  async uploadToStrapi(filePaths) {
    const uploadedImages = [];

    for (const filePath of filePaths) {
      try {
        const formData = new FormData();
        formData.append('files', fs.createReadStream(filePath));
        formData.append('refId', this.gameId);
        formData.append('ref', 'api::game.game');
        formData.append('field', 'gallery');

        const response = await axios.post(
          `${API_BASE}/upload`,
          formData,
          {
            headers: {
              'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
            },
          }
        );

        if (response.data && response.data.length > 0) {
          uploadedImages.push(response.data[0]);
          console.log(`  ✅ Upload: ${response.data[0].name}`);
        }

        // Aguardar entre uploads
        await this.sleep(1000);

      } catch (error) {
        console.log(`  ❌ Erro no upload:`, error.message);
      }
    }

    return uploadedImages;
  }

  async updateGameGallery(uploadedImages) {
    try {
      // Preparar dados para atualização
      const galleryIds = uploadedImages.map(img => img.id);

      const updateData = {
        data: {
          gallery: galleryIds
        }
      };

      const response = await axios.put(
        `${API_BASE}/games/${this.gameId}`,
        updateData
      );

      if (response.data) {
        console.log('✅ Game atualizado com sucesso');
        console.log(`   Gallery IDs: ${galleryIds.join(', ')}`);
      }

    } catch (error) {
      console.log('❌ Erro ao atualizar game:', error.message);
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', error.response.data);
      }
    }
  }

  async verifyResult() {
    try {
      console.log('\n🔍 Verificando resultado...');

      const response = await axios.get(`${API_BASE}/games/${this.gameId}?populate=*`);
      const game = response.data.data;

      const hasCover = game.attributes.cover && game.attributes.cover.data;
      const hasGallery = game.attributes.gallery && game.attributes.gallery.data && game.attributes.gallery.data.length > 0;

      console.log(`\n📊 STATUS FINAL:`);
      console.log(`   Game: ${game.attributes.name}`);
      console.log(`   Cover: ${hasCover ? '✅' : '❌'}`);
      console.log(`   Gallery: ${hasGallery ? `✅ (${game.attributes.gallery.data.length} imagens)` : '❌'}`);

      if (hasCover && hasGallery) {
        console.log('\n🎉 SUCESSO! Game agora tem cover e gallery completos!');
      } else {
        console.log('\n⚠️ Ainda há problemas com as imagens');
      }

    } catch (error) {
      console.log('❌ Erro ao verificar resultado:', error.message);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  try {
    const fixer = new HeroesGalleryFixer();
    await fixer.fixGallery();
  } catch (error) {
    console.log('❌ Erro no script:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = HeroesGalleryFixer;
