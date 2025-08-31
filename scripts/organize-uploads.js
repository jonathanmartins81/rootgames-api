#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const UPLOADS_DIR = '/home/jonathan/Workspace/Development/rootgames/rootgames-api/public/uploads';
const STRAPI_URL = 'http://localhost:1337';

// Função para organizar a pasta de uploads
function organizeUploads() {
  console.log('🗂️ Organizando pasta de uploads...\n');

  try {
    const items = fs.readdirSync(UPLOADS_DIR);
    let totalFiles = 0;
    let totalDirs = 0;
    let organizedCount = 0;

    // Separar arquivos e diretórios
    const files = [];
    const directories = [];

    for (const item of items) {
      if (item === '.' || item === '..') continue;

      const itemPath = path.join(UPLOADS_DIR, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        directories.push(item);
        totalDirs++;
      } else {
        files.push(item);
        totalFiles++;
      }
    }

    console.log(`📊 Estatísticas da pasta uploads:`);
    console.log(`   📁 Diretórios: ${totalDirs}`);
    console.log(`   📄 Arquivos: ${totalFiles}`);
    console.log(`   📂 Total de itens: ${items.length - 2}\n`);

    // Mostrar diretórios organizados
    console.log('📁 Diretórios organizados por jogo:');
    directories.forEach((dir, index) => {
      const dirPath = path.join(UPLOADS_DIR, dir);
      const dirContents = fs.readdirSync(dirPath);
      const imageCount = dirContents.filter(
        item => item.endsWith('.jpg') || item.endsWith('.png') || item.endsWith('.jpeg')
      ).length;

      console.log(`   ${index + 1}. ${dir} (${imageCount} imagens)`);
    });

    // Mostrar arquivos soltos
    if (files.length > 0) {
      console.log('\n📄 Arquivos soltos (não organizados):');
      files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
      });
    }

    console.log('\n✅ Organização concluída!');
  } catch (error) {
    console.error('❌ Erro ao organizar uploads:', error.message);
  }
}

// Função para verificar dados do Strapi
async function checkStrapiData() {
  console.log('\n🔍 Verificando dados do Strapi...\n');

  try {
    // Verificar se o Strapi está rodando
    const healthResponse = await axios.get(`${STRAPI_URL}/_health`);
    console.log('✅ Strapi está rodando');

    // Buscar jogos
    const gamesResponse = await axios.get(`${STRAPI_URL}/api/games?pagination[pageSize]=100`);
    const games = gamesResponse.data.data;

    console.log(`📊 Total de jogos no Strapi: ${games.length}\n`);

    // Verificar estrutura dos dados
    if (games.length > 0) {
      const sampleGame = games[0];
      console.log('📋 Estrutura de dados de um jogo:');
      console.log(`   ID: ${sampleGame.id}`);
      console.log(`   Document ID: ${sampleGame.documentId}`);
      console.log(`   Nome: ${sampleGame.name}`);
      console.log(`   Slug: ${sampleGame.slug}`);
      console.log(`   Preço: $${sampleGame.price}`);
      console.log(`   Data de lançamento: ${sampleGame.release_date}`);
      console.log(`   Rating: ${sampleGame.rating}`);
    }

    // Verificar status das imagens
    console.log(`\n📸 Status das imagens:`);
    console.log(`   🎮 Total de jogos no Strapi: ${games.length}`);

    // Mostrar alguns jogos
    console.log('\n🎮 Exemplos de jogos no Strapi:');
    games.slice(0, 5).forEach((game, index) => {
      console.log(`   ${index + 1}. ${game.name} (ID: ${game.id})`);
    });

    if (games.length > 5) {
      console.log(`   ... e mais ${games.length - 5} jogos`);
    }
  } catch (error) {
    console.error('❌ Erro ao verificar Strapi:', error.message);
  }
}

// Função para verificar correspondência entre uploads e Strapi
async function checkCorrespondence() {
  console.log('\n🔗 Verificando correspondência entre uploads e Strapi...\n');

  try {
    // Buscar jogos do Strapi
    const gamesResponse = await axios.get(`${STRAPI_URL}/api/games?pagination[pageSize]=100`);
    const strapiGames = gamesResponse.data.data;

    // Listar diretórios de uploads
    const uploadDirs = fs.readdirSync(UPLOADS_DIR).filter(item => {
      if (item === '.' || item === '..') return false;
      const itemPath = path.join(UPLOADS_DIR, item);
      return fs.statSync(itemPath).isDirectory();
    });

    console.log(`📊 Comparação:`);
    console.log(`   🎮 Jogos no Strapi: ${strapiGames.length}`);
    console.log(`   📁 Diretórios de uploads: ${uploadDirs.length}\n`);

    // Verificar jogos que têm imagens baixadas
    let gamesWithUploads = 0;
    const gamesWithoutUploads = [];

    for (const game of strapiGames) {
      const gameName = game.name;
      const normalizedName = gameName
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');

      const hasUploadDir = uploadDirs.some(
        dir => dir.toLowerCase().includes(normalizedName) || normalizedName.includes(dir.toLowerCase())
      );

      if (hasUploadDir) {
        gamesWithUploads++;
      } else {
        gamesWithoutUploads.push(gameName);
      }
    }

    console.log(`✅ Jogos com imagens baixadas: ${gamesWithUploads}`);
    console.log(`❌ Jogos sem imagens baixadas: ${gamesWithoutUploads.length}`);

    if (gamesWithoutUploads.length > 0) {
      console.log('\n📝 Jogos sem imagens baixadas:');
      gamesWithoutUploads.slice(0, 10).forEach((game, index) => {
        console.log(`   ${index + 1}. ${game}`);
      });

      if (gamesWithoutUploads.length > 10) {
        console.log(`   ... e mais ${gamesWithoutUploads.length - 10} jogos`);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar correspondência:', error.message);
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando verificação e organização...\n');

  // Organizar uploads
  organizeUploads();

  // Verificar dados do Strapi
  await checkStrapiData();

  // Verificar correspondência
  await checkCorrespondence();

  console.log('\n✨ Verificação concluída!');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { organizeUploads, checkStrapiData, checkCorrespondence };
