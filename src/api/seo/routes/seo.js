/**
 * Rotas SEO para Root Games
 *
 * Endpoints:
 * - GET /api/seo/config - Obter configurações SEO
 * - PUT /api/seo/config - Atualizar configurações SEO
 * - GET /api/seo/sitemap - Gerar sitemap XML
 * - GET /api/seo/robots - Obter robots.txt
 * - GET /api/seo/manifest - Obter manifest.json
 * - GET /api/seo/analyze - Analisar performance SEO de URL
 * - GET /api/seo/metadata - Gerar metadados para página
 * - GET /api/seo/report - Gerar relatório SEO completo
 * - POST /api/seo/optimize - Otimizar conteúdo
 */

module.exports = {
  routes: [
    // Configurações SEO
    {
      method: 'GET',
      path: '/seo/config',
      handler: 'seo.getConfig',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'PUT',
      path: '/seo/config',
      handler: 'seo.updateConfig',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      }
    },

    // Arquivos SEO estáticos
    {
      method: 'GET',
      path: '/seo/sitemap',
      handler: 'seo.generateSitemap',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'GET',
      path: '/seo/robots',
      handler: 'seo.getRobotsTxt',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'GET',
      path: '/seo/manifest',
      handler: 'seo.getManifest',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      }
    },

    // Análise e otimização
    {
      method: 'GET',
      path: '/seo/analyze',
      handler: 'seo.analyzeURL',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'GET',
      path: '/seo/metadata',
      handler: 'seo.getPageMetadata',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'GET',
      path: '/seo/report',
      handler: 'seo.generateReport',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST',
      path: '/seo/optimize',
      handler: 'seo.optimizeContent',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      }
    }
  ]
};
