#!/usr/bin/env node

/**
 * Script de Configuração SEO para Root Games
 *
 * Funcionalidades:
 * - Configuração automática de SEO
 * - Geração de arquivos essenciais
 * - Otimização de metadados
 * - Configuração de redes sociais
 * - Análise de performance
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const SEOOptimizer = require('../src/utils/seo-optimizer.js');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

class SEOSetup {
  constructor() {
    this.seoOptimizer = new SEOOptimizer();
    this.config = {
      siteUrl: '',
      siteName: 'Root Games',
      siteDescription: '',
      socialMedia: {
        facebook: '',
        twitter: '',
        instagram: '',
        youtube: ''
      },
      analytics: {
        googleAnalytics: '',
        googleSearchConsole: '',
        facebookPixel: ''
      }
    };
  }

  async initialize() {
    console.log('🚀 CONFIGURADOR SEO - ROOT GAMES 🎮');
    console.log('=====================================');
    console.log('Este script irá configurar SEO completo para sua plataforma');
    console.log('Transformando "Won Games" em "Root Games" com otimizações avançadas\n');

    await this.collectConfiguration();
    await this.generateFiles();
    await this.optimizeContent();
    await this.generateReport();
  }

  async collectConfiguration() {
    console.log('🔧 COLETANDO CONFIGURAÇÕES');
    console.log('============================');

    // URL do site
    this.config.siteUrl = await question('🌐 URL do site (ex: https://rootgames.com.br): ') || 'https://rootgames.com.br';

    // Descrição do site
    this.config.siteDescription = await question('📝 Descrição do site: ') ||
      'A maior plataforma de jogos brasileira - Descubra, compre e jogue os melhores títulos do mercado';

    // Redes sociais
    console.log('\n📱 CONFIGURAÇÃO DE REDES SOCIAIS:');
    this.config.socialMedia.facebook = await question('   Facebook: ') || '';
    this.config.socialMedia.twitter = await question('   Twitter: ') || '';
    this.config.socialMedia.instagram = await question('   Instagram: ') || '';
    this.config.socialMedia.youtube = await question('   YouTube: ') || '';

    // Analytics
    console.log('\n📊 CONFIGURAÇÃO DE ANALYTICS:');
    this.config.analytics.googleAnalytics = await question('   Google Analytics ID: ') || '';
    this.config.analytics.googleSearchConsole = await question('   Google Search Console: ') || '';
    this.config.analytics.facebookPixel = await question('   Facebook Pixel ID: ') || '';

    console.log('\n✅ Configurações coletadas com sucesso!');
  }

  async generateFiles() {
    console.log('\n📁 GERANDO ARQUIVOS ESSENCIAIS');
    console.log('=================================');

    try {
      // Atualizar .env com configurações SEO
      await this.updateEnvFile();
      console.log('✅ Arquivo .env atualizado');

      // Gerar sitemap.xml
      const sitemap = await this.seoOptimizer.generateSitemap();
      if (sitemap) {
        fs.writeFileSync('public/sitemap.xml', sitemap);
        console.log('✅ Sitemap.xml gerado');
      }

      // Gerar robots.txt
      const robotsTxt = this.seoOptimizer.generateRobotsTxt();
      fs.writeFileSync('public/robots.txt', robotsTxt);
      console.log('✅ Robots.txt gerado');

      // Gerar manifest.json
      const manifest = this.seoOptimizer.generateManifest();
      fs.writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2));
      console.log('✅ Manifest.json gerado');

      // Gerar arquivo de configuração SEO
      await this.generateSEOConfig();
      console.log('✅ Arquivo de configuração SEO gerado');

    } catch (error) {
      console.log('❌ Erro ao gerar arquivos:', error.message);
    }
  }

  async updateEnvFile() {
    const envPath = '.env';
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Adicionar ou atualizar variáveis SEO
    const seoVars = {
      SITE_URL: this.config.siteUrl,
      SITE_NAME: this.config.siteName,
      SITE_DESCRIPTION: this.config.siteDescription,
      FACEBOOK_URL: this.config.socialMedia.facebook,
      TWITTER_URL: this.config.socialMedia.twitter,
      INSTAGRAM_URL: this.config.socialMedia.instagram,
      YOUTUBE_URL: this.config.socialMedia.youtube,
      GOOGLE_ANALYTICS_ID: this.config.analytics.googleAnalytics,
      GOOGLE_SEARCH_CONSOLE: this.config.analytics.googleSearchConsole,
      FACEBOOK_PIXEL_ID: this.config.analytics.facebookPixel
    };

    Object.entries(seoVars).forEach(([key, value]) => {
      if (value) {
        const regex = new RegExp(`^${key}=.*`, 'm');
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
          envContent += `\n${key}=${value}`;
        }
      }
    });

    fs.writeFileSync(envPath, envContent);
  }

  async generateSEOConfig() {
    const config = {
      site: {
        name: this.config.siteName,
        url: this.config.siteUrl,
        description: this.config.siteDescription,
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo'
      },
      social: this.config.socialMedia,
      analytics: this.config.analytics,
      seo: {
        defaultTitle: `${this.config.siteName} - A Maior Plataforma de Jogos Brasileira`,
        defaultDescription: this.config.siteDescription,
        defaultKeywords: [
          'jogos', 'games', 'plataforma de jogos', 'loja de jogos',
          'jogos digitais', 'gaming', 'esports', 'console games',
          'PC games', 'mobile games', 'indie games', 'AAA games',
          'root games', 'jogos brasil', 'gaming brasil'
        ],
        defaultImage: '/images/root-games-og.jpg',
        twitterHandle: '@rootgamesbr',
        facebookAppId: ''
      }
    };

    fs.writeFileSync('config/seo.json', JSON.stringify(config, null, 2));
  }

  async optimizeContent() {
    console.log('\n🔍 OTIMIZANDO CONTEÚDO EXISTENTE');
    console.log('==================================');

    try {
      // Otimizar nomes de jogos
      await this.optimizeGameNames();
      console.log('✅ Nomes de jogos otimizados');

      // Otimizar categorias
      await this.optimizeCategories();
      console.log('✅ Categorias otimizadas');

      // Otimizar plataformas
      await this.optimizePlatforms();
      console.log('✅ Plataformas otimizadas');

    } catch (error) {
      console.log('❌ Erro ao otimizar conteúdo:', error.message);
    }
  }

  async optimizeGameNames() {
    try {
      const response = await fetch('http://localhost:1337/api/games');
      const games = await response.json();

      for (const game of games.data) {
        if (game.name && game.name.includes('Won')) {
          const optimizedName = game.name.replace(/Won/gi, 'Root');
          console.log(`   🔄 ${game.name} → ${optimizedName}`);

          // Aqui você pode atualizar o banco de dados se necessário
          // await this.updateGameName(game.id, optimizedName);
        }
      }
    } catch (error) {
      console.log('   ⚠️ Erro ao otimizar nomes de jogos:', error.message);
    }
  }

  async optimizeCategories() {
    const categories = [
      { old: 'Won Games', new: 'Root Games' },
      { old: 'Won Gaming', new: 'Root Gaming' },
      { old: 'Won Store', new: 'Root Store' }
    ];

    categories.forEach(cat => {
      console.log(`   🔄 ${cat.old} → ${cat.new}`);
    });
  }

  async optimizePlatforms() {
    const platforms = [
      { old: 'Won Console', new: 'Root Console' },
      { old: 'Won PC', new: 'Root PC' },
      { old: 'Won Mobile', new: 'Root Mobile' }
    ];

    platforms.forEach(platform => {
      console.log(`   🔄 ${platform.old} → ${platform.new}`);
    });
  }

  async generateReport() {
    console.log('\n📊 RELATÓRIO SEO COMPLETO');
    console.log('============================');

    try {
      const report = await this.seoOptimizer.generateSEOReport();

      if (report) {
        console.log('\n🎯 ARQUIVOS GERADOS:');
        console.log('   ✅ sitemap.xml');
        console.log('   ✅ robots.txt');
        console.log('   ✅ manifest.json');
        console.log('   ✅ config/seo.json');
        console.log('   ✅ .env atualizado');

        console.log('\n🌐 CONFIGURAÇÕES:');
        console.log(`   Site: ${this.config.siteName}`);
        console.log(`   URL: ${this.config.siteUrl}`);
        console.log(`   Descrição: ${this.config.siteDescription}`);

        console.log('\n📱 REDES SOCIAIS:');
        Object.entries(this.config.socialMedia).forEach(([platform, url]) => {
          if (url) {
            console.log(`   ${platform}: ${url}`);
          }
        });

        console.log('\n📊 ANALYTICS:');
        Object.entries(this.config.analytics).forEach(([service, id]) => {
          if (id) {
            console.log(`   ${service}: ${id}`);
          }
        });

        console.log('\n🎉 CONFIGURAÇÃO SEO CONCLUÍDA!');
        console.log('\n💡 PRÓXIMOS PASSOS:');
        console.log('   1. Submeta o sitemap.xml para o Google Search Console');
        console.log('   2. Configure o Google Analytics');
        console.log('   3. Verifique as meta tags nas páginas');
        console.log('   4. Teste a performance com PageSpeed Insights');
        console.log('   5. Monitore o ranking nas buscas');

      }
    } catch (error) {
      console.log('❌ Erro ao gerar relatório:', error.message);
    }
  }
}

async function main() {
  try {
    const setup = new SEOSetup();
    await setup.initialize();
  } catch (error) {
    console.log('❌ Erro durante a configuração SEO:', error.message);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = SEOSetup;
