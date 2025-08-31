#!/usr/bin/env node

/**
 * 🔐 Script para configurar permissões públicas no Strapi
 *
 * Este script configura automaticamente as permissões para acesso público
 * às APIs sem necessidade de autenticação
 */

const { Strapi } = require('@strapi/strapi');

async function setupPermissions() {
  try {
    console.log('🚀 Iniciando configuração de permissões...');

    // Inicializar Strapi
    const strapi = await Strapi().load();

    // Obter serviços necessários
    const permissionService = strapi.plugin('users-permissions').service('permission');
    const roleService = strapi.plugin('users-permissions').service('role');

    // Buscar role público
    let publicRole = await roleService.findOne({ name: 'public' });

    if (!publicRole) {
      console.log('📝 Criando role público...');
      publicRole = await roleService.create({
        name: 'public',
        description: 'Role público para acesso sem autenticação',
        type: 'public',
      });
      console.log('✅ Role público criado com sucesso!');
    } else {
      console.log('✅ Role público já existe');
    }

    // Configurar permissões para todas as APIs
    const apis = ['game', 'category', 'developer', 'platform', 'publisher'];

    for (const api of apis) {
      console.log(`🔧 Configurando permissões para ${api}...`);

      // Configurar permissões de leitura
      await permissionService.actionProvider.register({
        section: 'api',
        displayName: `Access ${api}`,
        uid: `api::${api}.${api}`,
        pluginName: 'users-permissions',
      });

      // Adicionar permissões ao role público
      await roleService.addPermissions(publicRole.id, [
        {
          action: `api::${api}.${api}.find`,
          subject: `api::${api}.${api}`,
        },
        {
          action: `api::${api}.${api}.findOne`,
          subject: `api::${api}.${api}`,
        },
      ]);

      console.log(`✅ Permissões para ${api} configuradas`);
    }

    // Configurar permissão especial para populate
    await roleService.addPermissions(publicRole.id, [
      {
        action: 'api::game.game.populate',
        subject: 'api::game.game',
      },
    ]);

    console.log('✅ Permissão para populate configurada');

    console.log('🎉 Todas as permissões foram configuradas com sucesso!');

    // Fechar Strapi
    await strapi.destroy();
  } catch (error) {
    console.error('❌ Erro ao configurar permissões:', error);
    process.exit(1);
  }
}

// Executar script
setupPermissions();
