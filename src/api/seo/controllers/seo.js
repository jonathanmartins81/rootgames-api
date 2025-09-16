/**
 * Controlador SEO para Root Games
 *
 * Funcionalidades:
 * - Gerenciamento de metadados dinâmicos
 * - Geração de sitemap em tempo real
 * - Análise de performance SEO
 * - Configuração de meta tags
 */

const SEOOptimizer = require('../../../utils/seo-optimizer.js');

module.exports = {
  /**
   * Obter configurações SEO atuais
   */
  async getConfig(ctx) {
    try {
      const seoOptimizer = new SEOOptimizer();

      const config = {
        site: {
          name: process.env.SITE_NAME || 'Root Games',
          url: process.env.SITE_URL || 'https://rootgames.com.br',
          description: process.env.SITE_DESCRIPTION || 'A maior plataforma de jogos brasileira',
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo'
        },
        social: {
          facebook: process.env.FACEBOOK_URL || '',
          twitter: process.env.TWITTER_URL || '',
          instagram: process.env.INSTAGRAM_URL || '',
          youtube: process.env.YOUTUBE_URL || ''
        },
        analytics: {
          googleAnalytics: process.env.GOOGLE_ANALYTICS_ID || '',
          googleSearchConsole: process.env.GOOGLE_SEARCH_CONSOLE || '',
          facebookPixel: process.env.FACEBOOK_PIXEL_ID || ''
        },
        seo: {
          defaultTitle: `${process.env.SITE_NAME || 'Root Games'} - A Maior Plataforma de Jogos Brasileira`,
          defaultDescription: process.env.SITE_DESCRIPTION || 'A maior plataforma de jogos brasileira - Descubra, compre e jogue os melhores títulos do mercado',
          defaultKeywords: [
            'jogos', 'games', 'plataforma de jogos', 'loja de jogos',
            'jogos digitais', 'gaming', 'esports', 'console games',
            'PC games', 'mobile games', 'indie games', 'AAA games',
            'root games', 'jogos brasil', 'gaming brasil'
          ],
          defaultImage: '/images/root-games-og.jpg',
          twitterHandle: '@rootgamesbr'
        }
      };

      ctx.body = {
        success: true,
        data: config
      };

    } catch (error) {
      ctx.throw(500, `Erro ao obter configurações SEO: ${error.message}`);
    }
  },

  /**
   * Atualizar configurações SEO
   */
  async updateConfig(ctx) {
    try {
      const { site, social, analytics, seo } = ctx.request.body;

      // Validar dados de entrada
      if (!site || !site.name || !site.url) {
        ctx.throw(400, 'Dados de site são obrigatórios');
      }

      // Atualizar variáveis de ambiente
      await updateEnvironmentVariables({
        SITE_NAME: site.name,
        SITE_URL: site.url,
        SITE_DESCRIPTION: site.description,
        FACEBOOK_URL: social?.facebook,
        TWITTER_URL: social?.twitter,
        INSTAGRAM_URL: social?.instagram,
        YOUTUBE_URL: social?.youtube,
        GOOGLE_ANALYTICS_ID: analytics?.googleAnalytics,
        GOOGLE_SEARCH_CONSOLE: analytics?.googleSearchConsole,
        FACEBOOK_PIXEL_ID: analytics?.facebookPixel
      });

      // Gerar novos arquivos SEO
      const seoOptimizer = new SEOOptimizer();

      // Atualizar sitemap
      const sitemap = await seoOptimizer.generateSitemap();
      if (sitemap) {
        const fs = require('fs');
        fs.writeFileSync('public/sitemap.xml', sitemap);
      }

      // Atualizar robots.txt
      const robotsTxt = seoOptimizer.generateRobotsTxt();
      const fs = require('fs');
      fs.writeFileSync('public/robots.txt', robotsTxt);

      // Atualizar manifest.json
      const manifest = seoOptimizer.generateManifest();
      fs.writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2));

      ctx.body = {
        success: true,
        message: 'Configurações SEO atualizadas com sucesso',
        data: {
          site,
          social,
          analytics,
          seo
        }
      };

    } catch (error) {
      ctx.throw(500, `Erro ao atualizar configurações SEO: ${error.message}`);
    }
  },

  /**
   * Gerar sitemap em tempo real
   */
  async generateSitemap(ctx) {
    try {
      const seoOptimizer = new SEOOptimizer();
      const sitemap = await seoOptimizer.generateSitemap();

      if (sitemap) {
        ctx.type = 'application/xml';
        ctx.body = sitemap;
      } else {
        ctx.throw(500, 'Erro ao gerar sitemap');
      }

    } catch (error) {
      ctx.throw(500, `Erro ao gerar sitemap: ${error.message}`);
    }
  },

  /**
   * Obter robots.txt
   */
  async getRobotsTxt(ctx) {
    try {
      const seoOptimizer = new SEOOptimizer();
      const robotsTxt = seoOptimizer.generateRobotsTxt();

      ctx.type = 'text/plain';
      ctx.body = robotsTxt;

    } catch (error) {
      ctx.throw(500, `Erro ao gerar robots.txt: ${error.message}`);
    }
  },

  /**
   * Obter manifest.json
   */
  async getManifest(ctx) {
    try {
      const seoOptimizer = new SEOOptimizer();
      const manifest = seoOptimizer.generateManifest();

      ctx.type = 'application/json';
      ctx.body = manifest;

    } catch (error) {
      ctx.throw(500, `Erro ao gerar manifest.json: ${error.message}`);
    }
  },

  /**
   * Analisar performance SEO de uma URL
   */
  async analyzeURL(ctx) {
    try {
      const { url } = ctx.query;

      if (!url) {
        ctx.throw(400, 'URL é obrigatória');
      }

      const seoOptimizer = new SEOOptimizer();

      // Simular dados de página para análise
      const pageData = {
        type: determinePageTypeFromURL(url),
        url: url,
        title: generateTitleFromURL(url),
        description: generateDescriptionFromURL(url),
        keywords: generateKeywordsFromURL(url),
        image: generateImageFromURL(url)
      };

      const metadata = seoOptimizer.generatePageMetadata(pageData);
      const performance = seoOptimizer.analyzeSEOPerformance(metadata);

      ctx.body = {
        success: true,
        data: {
          url,
          metadata,
          performance,
          recommendations: generateSEORecommendations(performance)
        }
      };

    } catch (error) {
      ctx.throw(500, `Erro ao analisar URL: ${error.message}`);
    }
  },

  /**
   * Obter metadados para uma página específica
   */
  async getPageMetadata(ctx) {
    try {
      const { type, title, description, keywords, image, url } = ctx.query;

      const seoOptimizer = new SEOOptimizer();

      const pageData = {
        type: type || 'website',
        title: title || '',
        description: description || '',
        keywords: keywords ? keywords.split(',') : [],
        image: image || '',
        url: url || ''
      };

      const metadata = seoOptimizer.generatePageMetadata(pageData);

      ctx.body = {
        success: true,
        data: metadata
      };

    } catch (error) {
      ctx.throw(500, `Erro ao gerar metadados: ${error.message}`);
    }
  },

  /**
   * Gerar relatório SEO completo
   */
  async generateReport(ctx) {
    try {
      const seoOptimizer = new SEOOptimizer();
      const report = await seoOptimizer.generateSEOReport();

      ctx.body = {
        success: true,
        data: report
      };

    } catch (error) {
      ctx.throw(500, `Erro ao gerar relatório SEO: ${error.message}`);
    }
  },

  /**
   * Otimizar conteúdo existente
   */
  async optimizeContent(ctx) {
    try {
      const { content, type } = ctx.request.body;

      if (!content) {
        ctx.throw(400, 'Conteúdo é obrigatório');
      }

      // Substituir "Won Games" por "Root Games"
      let optimizedContent = content.replace(/Won Games/gi, 'Root Games');
      optimizedContent = optimizedContent.replace(/won games/gi, 'Root Games');
      optimizedContent = optimizedContent.replace(/WON GAMES/gi, 'ROOT GAMES');

      // Otimizar URLs
      if (type === 'url') {
        optimizedContent = seoOptimizer.optimizeUrl(optimizedContent, '');
      }

      ctx.body = {
        success: true,
        data: {
          original: content,
          optimized: optimizedContent,
          changes: {
            wonToRoot: (content.match(/Won Games/gi) || []).length,
            urlOptimized: type === 'url'
          }
        }
      };

    } catch (error) {
      ctx.throw(500, `Erro ao otimizar conteúdo: ${error.message}`);
    }
  }
};

/**
 * Funções auxiliares
 */

async function updateEnvironmentVariables(vars) {
  const fs = require('fs');
  const envPath = '.env';

  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  Object.entries(vars).forEach(([key, value]) => {
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

function determinePageTypeFromURL(url) {
  if (url.includes('/games/')) return 'game';
  if (url.includes('/categories/')) return 'category';
  if (url.includes('/platforms/')) return 'platform';
  if (url.includes('/search')) return 'search';
  if (url === '/' || url === '') return 'home';
  return 'website';
}

function generateTitleFromURL(url) {
  const type = determinePageTypeFromURL(url);
  switch (type) {
    case 'home': return 'Root Games - A Maior Plataforma de Jogos Brasileira';
    case 'game': return 'Jogo - Root Games';
    case 'category': return 'Categoria - Root Games';
    case 'platform': return 'Plataforma - Root Games';
    case 'search': return 'Buscar Jogos - Root Games';
    default: return 'Root Games';
  }
}

function generateDescriptionFromURL(url) {
  const type = determinePageTypeFromURL(url);
  switch (type) {
    case 'home': return 'Descubra, compre e jogue os melhores títulos do mercado na maior plataforma de jogos brasileira.';
    case 'game': return 'Confira detalhes, preços e avaliações deste jogo na Root Games.';
    case 'category': return 'Explore jogos desta categoria na Root Games.';
    case 'platform': return 'Jogos para esta plataforma na Root Games.';
    case 'search': return 'Encontre os melhores jogos na Root Games.';
    default: return 'A maior plataforma de jogos brasileira.';
  }
}

function generateKeywordsFromURL(url) {
  const baseKeywords = ['jogos', 'games', 'root games', 'plataforma de jogos'];
  const type = determinePageTypeFromURL(url);

  switch (type) {
    case 'game': return [...baseKeywords, 'comprar jogo', 'preço jogo'];
    case 'category': return [...baseKeywords, 'categoria jogos'];
    case 'platform': return [...baseKeywords, 'jogos plataforma'];
    case 'search': return [...baseKeywords, 'buscar jogos'];
    default: return baseKeywords;
  }
}

function generateImageFromURL(url) {
  const type = determinePageTypeFromURL(url);
  switch (type) {
    case 'home': return '/images/root-games-home-og.jpg';
    case 'game': return '/images/root-games-game-default.jpg';
    default: return '/images/root-games-og.jpg';
  }
}

function generateSEORecommendations(performance) {
  const recommendations = [];

  if (performance.percentage < 80) {
    recommendations.push('Implemente as tags SEO faltantes');
    recommendations.push('Adicione meta tags para redes sociais');
    recommendations.push('Configure Schema.org markup');
  }

  if (performance.percentage < 60) {
    recommendations.push('Revise completamente a estratégia SEO');
    recommendations.push('Considere consultoria especializada');
  }

  if (performance.percentage >= 80) {
    recommendations.push('Excelente! Mantenha as práticas atuais');
    recommendations.push('Considere implementar SEO técnico avançado');
  }

  return recommendations;
}
