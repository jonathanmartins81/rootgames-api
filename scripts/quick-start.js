#!/usr/bin/env node

/**
 * 🚀 Script de Inicialização Rápida do Strapi
 *
 * Este script inicia o Strapi e configura permissões básicas
 */

const { Strapi } = require('@strapi/strapi');

async function quickStart() {
  try {
    console.log('🚀 Iniciando Strapi...');

    // Inicializar Strapi
    const strapi = await Strapi().load();

    console.log('✅ Strapi iniciado com sucesso!');
    console.log('🌐 Servidor rodando em: http://localhost:1337');
    console.log('🔐 Admin panel em: http://localhost:1337/admin');

    // Manter o processo rodando
    process.on('SIGINT', async () => {
      console.log('\n🛑 Encerrando Strapi...');
      await strapi.destroy();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar Strapi:', error);
    process.exit(1);
  }
}

// Executar script
quickStart();
