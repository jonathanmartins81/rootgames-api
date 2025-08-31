#!/usr/bin/env node

/**
 * 🖼️ Teste Simples de Upload
 *
 * Este script testa o upload usando a API interna do Strapi
 */

const axios = require('axios');

async function testSimpleUpload() {
  try {
    console.log('🖼️  Testando upload simples...');

    // Criar uma imagem de teste simples (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49,
      0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb0,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    // Salvar arquivo temporário
    const fs = require('fs');
    const tempPath = './test-image.png';
    fs.writeFileSync(tempPath, testImageBuffer);

    console.log('📁 Arquivo temporário criado:', tempPath);

    // Verificar se o arquivo foi criado
    if (fs.existsSync(tempPath)) {
      const stats = fs.statSync(tempPath);
      console.log('📊 Tamanho do arquivo:', stats.size, 'bytes');
    }

    // Verificar se a pasta uploads existe
    const uploadsDir = './public/uploads';
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log('📁 Arquivos na pasta uploads:', files);
    } else {
      console.log('❌ Pasta uploads não existe');
    }

    // Limpar arquivo temporário
    fs.unlinkSync(tempPath);
    console.log('🧹 Arquivo temporário removido');
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
testSimpleUpload();
