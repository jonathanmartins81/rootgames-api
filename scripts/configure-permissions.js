#!/usr/bin/env node

/**
 * 🔐 Script para Configurar Permissões via API do Strapi
 *
 * Este script configura permissões públicas via API REST
 */

const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';
const ADMIN_TOKEN = process.env.STRAPI_ADMIN_TOKEN || '';

async function configurePermissions() {
  try {
    console.log('🚀 Iniciando configuração de permissões...');

    if (!ADMIN_TOKEN) {
      console.log('⚠️  STRAPI_ADMIN_TOKEN não configurado');
      console.log('📝 Para configurar permissões, você precisa:');
      console.log('1. Acessar http://localhost:1337/admin');
      console.log('2. Criar uma conta de administrador');
      console.log('3. Ir em Settings > API Tokens');
      console.log('4. Criar um token com permissões de admin');
      console.log('5. Exportar: export STRAPI_ADMIN_TOKEN=seu_token');
      return;
    }

    console.log('🔑 Token de admin configurado, configurando permissões...');

    // Configurar permissões para todas as APIs
    const apis = ['game', 'category', 'developer', 'platform', 'publisher'];

    for (const api of apis) {
      console.log(`🔧 Configurando permissões para ${api}...`);

      try {
        // Configurar permissões de leitura
        await axios.post(
          `${STRAPI_URL}/admin/users-permissions/roles/1/permissions`,
          {
            'api::game.game': {
              controllers: {
                game: {
                  find: { enabled: true, policy: '' },
                  findOne: { enabled: true, policy: '' },
                  populate: { enabled: true, policy: '' },
                },
              },
            },
          },
          {
            headers: {
              Authorization: `Bearer ${ADMIN_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log(`✅ Permissões para ${api} configuradas`);
      } catch (error) {
        console.log(`⚠️  Erro ao configurar ${api}:`, error.response?.data || error.message);
      }
    }

    console.log('🎉 Configuração de permissões concluída!');
    console.log('🌐 Teste as APIs:');
    console.log('  curl -X GET "http://localhost:1337/api/games"');
    console.log('  curl -X POST http://localhost:1337/api/games/populate');
  } catch (error) {
    console.error('❌ Erro ao configurar permissões:', error.message);
  }
}

// Executar script
configurePermissions();
