/**
 * Sistema de Otimização SEO para Root Games
 *
 * Funcionalidades:
 * - Geração automática de metadados
 * - Sitemap dinâmico
 * - Otimização de URLs
 * - Meta tags para redes sociais
 * - Schema.org markup
 * - Análise de performance SEO
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class SEOOptimizer {
  constructor() {
    this.baseUrl = process.env.SITE_URL || 'https://rootgames.com.br';
    this.siteName = 'Root Games';
    this.siteDescription = 'A maior plataforma de jogos brasileira - Descubra, compre e jogue os melhores títulos do mercado';
    this.keywords = [
      'jogos', 'games', 'plataforma de jogos', 'loja de jogos',
      'jogos digitais', 'gaming', 'esports', 'console games',
      'PC games', 'mobile games', 'indie games', 'AAA games'
    ];

    this.seoData = {
      title: this.siteName,
      description: this.siteDescription,
      keywords: this.keywords.join(', '),
      author: 'Root Games Team',
      robots: 'index, follow',
      viewport: 'width=device-width, initial-scale=1.0',
      charset: 'UTF-8',
      language: 'pt-BR'
    };
  }

  /**
   * Gerar metadados para uma página específica
   */
  generatePageMetadata(pageData) {
    const {
      title = '',
      description = '',
      keywords = [],
      image = '',
      type = 'website',
      url = ''
    } = pageData;

    const fullTitle = title ? `${title} - ${this.siteName}` : this.siteName;
    const fullDescription = description || this.siteDescription;
    const fullKeywords = [...this.keywords, ...keywords].join(', ');
    const fullUrl = url ? `${this.baseUrl}${url}` : this.baseUrl;
    const fullImage = image ? `${this.baseUrl}${image}` : `${this.baseUrl}/images/root-games-og.jpg`;

    return {
      // Meta tags básicas
      title: fullTitle,
      description: fullDescription,
      keywords: fullKeywords,
      author: this.seoData.author,
      robots: this.seoData.robots,
      viewport: this.seoData.viewport,
      charset: this.seoData.charset,
      language: this.seoData.language,

      // Open Graph (Facebook, LinkedIn)
      'og:title': fullTitle,
      'og:description': fullDescription,
      'og:type': type,
      'og:url': fullUrl,
      'og:image': fullImage,
      'og:site_name': this.siteName,
      'og:locale': 'pt_BR',

      // Twitter Card
      'twitter:card': 'summary_large_image',
      'twitter:title': fullTitle,
      'twitter:description': fullDescription,
      'twitter:image': fullImage,
      'twitter:site': '@rootgamesbr',

      // Schema.org markup
      schema: this.generateSchemaMarkup(pageData)
    };
  }

  /**
   * Gerar Schema.org markup para diferentes tipos de conteúdo
   */
  generateSchemaMarkup(pageData) {
    const { type = 'website', title, description, image, url } = pageData;

    switch (type) {
      case 'game':
        return {
          '@context': 'https://schema.org',
          '@type': 'VideoGame',
          name: title,
          description: description,
          image: image,
          url: url,
          publisher: {
            '@type': 'Organization',
            name: this.siteName,
            url: this.baseUrl
          },
          offers: {
            '@type': 'Offer',
            availability: 'https://schema.org/InStock',
            priceCurrency: 'BRL'
          }
        };

      case 'category':
        return {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: title,
          description: description,
          url: url
        };

      case 'search':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: this.siteName,
          url: this.baseUrl,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${this.baseUrl}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        };

      default:
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: this.siteName,
          description: this.siteDescription,
          url: this.baseUrl,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${this.baseUrl}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        };
    }
  }

  /**
   * Gerar sitemap XML dinâmico
   */
  async generateSitemap() {
    try {
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- Páginas principais -->
  <url>
    <loc>${this.baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>${this.baseUrl}/games</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>${this.baseUrl}/categories</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>${this.baseUrl}/platforms</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>${this.baseUrl}/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <url>
    <loc>${this.baseUrl}/contact</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- Jogos individuais (serão preenchidos dinamicamente) -->
  ${await this.generateGameUrls()}

</urlset>`;

      return sitemap;
    } catch (error) {
      console.error('❌ Erro ao gerar sitemap:', error.message);
      return null;
    }
  }

  /**
   * Gerar URLs dos jogos para o sitemap
   */
  async generateGameUrls() {
    try {
      const response = await axios.get('http://localhost:1337/api/games');
      const games = response.data.data;

      return games.map(game => {
        const gameUrl = game.slug || `game-${game.id}`;
        return `  <url>
    <loc>${this.baseUrl}/games/${gameUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }).join('\n');
    } catch (error) {
      console.error('❌ Erro ao buscar jogos para sitemap:', error.message);
      return '';
    }
  }

  /**
   * Gerar robots.txt
   */
  generateRobotsTxt() {
    return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${this.baseUrl}/sitemap.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /api/
Disallow: /_/

# Allow important pages
Allow: /games/
Allow: /categories/
Allow: /platforms/
Allow: /search

# Crawl delay (opcional)
Crawl-delay: 1`;
  }

  /**
   * Gerar manifest.json para PWA
   */
  generateManifest() {
    return {
      name: this.siteName,
      short_name: 'Root Games',
      description: this.siteDescription,
      start_url: '/',
      display: 'standalone',
      background_color: '#009c3b',
      theme_color: '#009c3b',
      icons: [
        {
          src: '/images/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/images/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    };
  }

  /**
   * Otimizar URLs para SEO
   */
  optimizeUrl(url, title) {
    return url
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  /**
   * Gerar breadcrumbs para navegação
   */
  generateBreadcrumbs(paths) {
    const breadcrumbs = [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: []
      }
    ];

    let currentUrl = '';

    paths.forEach((path, index) => {
      currentUrl += `/${path.url}`;

      breadcrumbs[0].itemListElement.push({
        '@type': 'ListItem',
        position: index + 1,
        name: path.name,
        item: `${this.baseUrl}${currentUrl}`
      });
    });

    return breadcrumbs;
  }

  /**
   * Analisar performance SEO de uma página
   */
  analyzeSEOPerformance(pageData) {
    const score = {
      total: 0,
      maxScore: 100,
      details: []
    };

    // Verificar título
    if (pageData.title && pageData.title.length > 0) {
      score.total += 10;
      score.details.push('✅ Título definido');
    } else {
      score.details.push('❌ Título não definido');
    }

    // Verificar descrição
    if (pageData.description && pageData.description.length > 0) {
      score.total += 10;
      score.details.push('✅ Descrição definida');
    } else {
      score.details.push('❌ Descrição não definida');
    }

    // Verificar palavras-chave
    if (pageData.keywords && pageData.keywords.length > 0) {
      score.total += 10;
      score.details.push('✅ Palavras-chave definidas');
    } else {
      score.details.push('❌ Palavras-chave não definidas');
    }

    // Verificar imagem
    if (pageData.image && pageData.image.length > 0) {
      score.total += 10;
      score.details.push('✅ Imagem definida');
    } else {
      score.details.push('❌ Imagem não definida');
    }

    // Verificar Schema.org
    if (pageData.schema) {
      score.total += 20;
      score.details.push('✅ Schema.org markup presente');
    } else {
      score.details.push('❌ Schema.org markup ausente');
    }

    // Verificar Open Graph
    if (pageData['og:title'] && pageData['og:description']) {
      score.total += 20;
      score.details.push('✅ Open Graph tags presentes');
    } else {
      score.details.push('❌ Open Graph tags ausentes');
    }

    // Verificar Twitter Card
    if (pageData['twitter:title'] && pageData['twitter:description']) {
      score.total += 20;
      score.details.push('✅ Twitter Card tags presentes');
    } else {
      score.details.push('❌ Twitter Card tags ausentes');
    }

    return {
      ...score,
      percentage: Math.round((score.total / score.maxScore) * 100),
      grade: this.getSEOGrade(score.total)
    };
  }

  /**
   * Obter nota SEO baseada na pontuação
   */
  getSEOGrade(score) {
    if (score >= 90) return 'A+ (Excelente)';
    if (score >= 80) return 'A (Muito Bom)';
    if (score >= 70) return 'B+ (Bom)';
    if (score >= 60) return 'B (Regular)';
    if (score >= 50) return 'C (Abaixo da Média)';
    return 'D (Precisa Melhorar)';
  }

  /**
   * Gerar relatório SEO completo
   */
  async generateSEOReport() {
    console.log('📊 RELATÓRIO SEO COMPLETO - ROOT GAMES');
    console.log('========================================');

    try {
      // Gerar sitemap
      const sitemap = await this.generateSitemap();
      if (sitemap) {
        console.log('✅ Sitemap gerado com sucesso');
      }

      // Gerar robots.txt
      const robotsTxt = this.generateRobotsTxt();
      console.log('✅ Robots.txt gerado');

      // Gerar manifest.json
      const manifest = this.generateManifest();
      console.log('✅ Manifest.json gerado');

      // Análise de performance
      const performance = this.analyzeSEOPerformance(this.seoData);

      console.log('\n🎯 PERFORMANCE SEO:');
      console.log(`   Pontuação: ${performance.total}/${performance.maxScore}`);
      console.log(`   Percentual: ${performance.percentage}%`);
      console.log(`   Nota: ${performance.grade}`);

      console.log('\n📋 DETALHES:');
      performance.details.forEach(detail => {
        console.log(`   ${detail}`);
      });

      console.log('\n💡 RECOMENDAÇÕES:');
      if (performance.percentage < 80) {
        console.log('   🔧 Implemente as tags SEO faltantes');
        console.log('   📱 Adicione meta tags para redes sociais');
        console.log('   🏷️ Configure Schema.org markup');
      } else {
        console.log('   🎉 Excelente! Sua página está bem otimizada para SEO');
      }

      return {
        sitemap,
        robotsTxt,
        manifest,
        performance
      };

    } catch (error) {
      console.error('❌ Erro ao gerar relatório SEO:', error.message);
      return null;
    }
  }
}

module.exports = SEOOptimizer;
