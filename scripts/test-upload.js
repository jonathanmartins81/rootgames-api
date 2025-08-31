#!/usr/bin/env node

/**
 * 🖼️ Script para Testar Upload de Imagem
 *
 * Este script testa o upload de uma imagem para o Strapi
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const STRAPI_URL = 'http://localhost:1337';

async function testUpload() {
  try {
    console.log('🖼️  Testando upload de imagem...');

    // Criar uma imagem de teste simples (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49,
      0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb0,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    // Criar FormData
    const formData = new FormData();
    formData.append('files', testImageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png',
    });

    console.log('📤 Fazendo upload da imagem de teste...');

    // Fazer upload
    const response = await axios({
      method: 'POST',
      url: `${STRAPI_URL}/api/upload`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('✅ Upload realizado com sucesso!');
    console.log('📊 Resposta:', JSON.stringify(response.data, null, 2));

    // Verificar se a pasta de uploads foi criada
    const uploadsDir = './public/uploads';
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log('📁 Arquivos na pasta uploads:', files);
    } else {
      console.log('❌ Pasta uploads não existe');
    }
  } catch (error) {
    console.error('❌ Erro no teste de upload:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
  }
}

// Executar teste
testUpload();
