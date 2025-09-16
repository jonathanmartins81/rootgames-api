/**
 * Middleware SEO para Strapi
 *
 * Funcionalidades:
 * - Aplicação automática de metadados SEO
 * - Meta tags para redes sociais
 * - Schema.org markup
 * - Otimização de URLs
 * - Breadcrumbs automáticos
 */

const SEOOptimizer = require('../../utils/seo-optimizer.js');

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    try {
      // Aplicar metadados SEO antes de processar a requisição
      await applySEOMetadata(ctx, strapi);

      // Continuar com o processamento normal
      await next();

      // Aplicar otimizações SEO na resposta
      await optimizeSEOResponse(ctx, strapi);

    } catch (error) {
      console.error('❌ Erro no middleware SEO:', error.message);
      await next();
    }
  };
};

/**
 * Aplicar metadados SEO na requisição
 */
async function applySEOMetadata(ctx, strapi) {
  try {
    // Determinar o tipo de página baseado na URL
    const pageType = determinePageType(ctx.url);

    // Gerar metadados apropriados
    const seoOptimizer = new SEOOptimizer();
    const metadata = seoOptimizer.generatePageMetadata({
      type: pageType,
      url: ctx.url,
      title: generatePageTitle(ctx, pageType),
      description: generatePageDescription(ctx, pageType),
      keywords: generatePageKeywords(ctx, pageType),
      image: generatePageImage(ctx, pageType)
    });

    // Armazenar metadados no contexto para uso posterior
    ctx.seoMetadata = metadata;

  } catch (error) {
    console.error('❌ Erro ao aplicar metadados SEO:', error.message);
  }
}

/**
 * Otimizar resposta SEO
 */
async function optimizeSEOResponse(ctx, strapi) {
  try {
    if (ctx.seoMetadata && ctx.body) {
      // Aplicar metadados na resposta HTML
      if (typeof ctx.body === 'string' && ctx.body.includes('<head>')) {
        ctx.body = injectSEOMetadata(ctx.body, ctx.seoMetadata);
      }

      // Aplicar metadados na resposta JSON
      if (ctx.body && typeof ctx.body === 'object') {
        ctx.body = injectSEOInJSON(ctx.body, ctx.seoMetadata);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao otimizar resposta SEO:', error.message);
  }
}

/**
 * Determinar o tipo de página baseado na URL
 */
function determinePageType(url) {
  if (url.includes('/games/') && !url.includes('/api/')) {
    return 'game';
  } else if (url.includes('/categories/')) {
    return 'category';
  } else if (url.includes('/platforms/')) {
    return 'platform';
  } else if (url.includes('/search')) {
    return 'search';
  } else if (url === '/' || url === '') {
    return 'home';
  }
  return 'website';
}

/**
 * Gerar título da página
 */
function generatePageTitle(ctx, pageType) {
  switch (pageType) {
    case 'home':
      return 'Root Games - A Maior Plataforma de Jogos Brasileira';
    case 'game':
      return ctx.params?.gameName || 'Jogo';
    case 'category':
      return ctx.params?.categoryName || 'Categoria';
    case 'platform':
      return ctx.params?.platformName || 'Plataforma';
    case 'search':
      return 'Buscar Jogos';
    default:
      return 'Root Games';
  }
}

/**
 * Gerar descrição da página
 */
function generatePageDescription(ctx, pageType) {
  switch (pageType) {
    case 'home':
      return 'Descubra, compre e jogue os melhores títulos do mercado na maior plataforma de jogos brasileira. Milhares de jogos para PC, console e mobile.';
    case 'game':
      return `Confira detalhes, preços e avaliações de ${ctx.params?.gameName || 'este jogo'} na Root Games.`;
    case 'category':
      return `Explore jogos da categoria ${ctx.params?.categoryName || 'selecionada'} na Root Games.`;
    case 'platform':
      return `Jogos para ${ctx.params?.platformName || 'esta plataforma'} na Root Games.`;
    case 'search':
      return 'Encontre os melhores jogos na Root Games. Busque por nome, categoria, plataforma ou preço.';
    default:
      return 'A maior plataforma de jogos brasileira - Descubra, compre e jogue os melhores títulos do mercado';
  }
}

/**
 * Gerar palavras-chave da página
 */
function generatePageKeywords(ctx, pageType) {
  const baseKeywords = ['jogos', 'games', 'root games', 'plataforma de jogos'];

  switch (pageType) {
    case 'game':
      return [...baseKeywords, ctx.params?.gameName || '', 'comprar jogo', 'preço jogo'];
    case 'category':
      return [...baseKeywords, ctx.params?.categoryName || '', 'categoria jogos'];
    case 'platform':
      return [...baseKeywords, ctx.params?.platformName || '', 'jogos plataforma'];
    case 'search':
      return [...baseKeywords, 'buscar jogos', 'encontrar jogos'];
    default:
      return baseKeywords;
  }
}

/**
 * Gerar imagem da página
 */
function generatePageImage(ctx, pageType) {
  switch (pageType) {
    case 'game':
      return ctx.params?.gameImage || '/images/root-games-game-default.jpg';
    case 'home':
      return '/images/root-games-home-og.jpg';
    default:
      return '/images/root-games-og.jpg';
  }
}

/**
 * Injetar metadados SEO em resposta HTML
 */
function injectSEOMetadata(html, metadata) {
  let modifiedHtml = html;

  // Injetar meta tags no <head>
  const metaTags = generateMetaTags(metadata);
  const headEndIndex = html.indexOf('</head>');

  if (headEndIndex !== -1) {
    modifiedHtml = html.slice(0, headEndIndex) + metaTags + html.slice(headEndIndex);
  }

  return modifiedHtml;
}

/**
 * Gerar meta tags HTML
 */
function generateMetaTags(metadata) {
  const tags = [];

  // Meta tags básicas
  if (metadata.title) {
    tags.push(`<title>${metadata.title}</title>`);
  }

  if (metadata.description) {
    tags.push(`<meta name="description" content="${metadata.description}">`);
  }

  if (metadata.keywords) {
    tags.push(`<meta name="keywords" content="${metadata.keywords}">`);
  }

  if (metadata.author) {
    tags.push(`<meta name="author" content="${metadata.author}">`);
  }

  if (metadata.robots) {
    tags.push(`<meta name="robots" content="${metadata.robots}">`);
  }

  if (metadata.viewport) {
    tags.push(`<meta name="viewport" content="${metadata.viewport}">`);
  }

  if (metadata.charset) {
    tags.push(`<meta charset="${metadata.charset}">`);
  }

  if (metadata.language) {
    tags.push(`<html lang="${metadata.language}">`);
  }

  // Open Graph tags
  if (metadata['og:title']) {
    tags.push(`<meta property="og:title" content="${metadata['og:title']}">`);
  }

  if (metadata['og:description']) {
    tags.push(`<meta property="og:description" content="${metadata['og:description']}">`);
  }

  if (metadata['og:type']) {
    tags.push(`<meta property="og:type" content="${metadata['og:type']}">`);
  }

  if (metadata['og:url']) {
    tags.push(`<meta property="og:url" content="${metadata['og:url']}">`);
  }

  if (metadata['og:image']) {
    tags.push(`<meta property="og:image" content="${metadata['og:image']}">`);
  }

  if (metadata['og:site_name']) {
    tags.push(`<meta property="og:site_name" content="${metadata['og:site_name']}">`);
  }

  if (metadata['og:locale']) {
    tags.push(`<meta property="og:locale" content="${metadata['og:locale']}">`);
  }

  // Twitter Card tags
  if (metadata['twitter:card']) {
    tags.push(`<meta name="twitter:card" content="${metadata['twitter:card']}">`);
  }

  if (metadata['twitter:title']) {
    tags.push(`<meta name="twitter:title" content="${metadata['twitter:title']}">`);
  }

  if (metadata['twitter:description']) {
    tags.push(`<meta name="twitter:description" content="${metadata['twitter:description']}">`);
  }

  if (metadata['twitter:image']) {
    tags.push(`<meta name="twitter:image" content="${metadata['twitter:image']}">`);
  }

  if (metadata['twitter:site']) {
    tags.push(`<meta name="twitter:site" content="${metadata['twitter:site']}">`);
  }

  // Schema.org markup
  if (metadata.schema) {
    tags.push(`<script type="application/ld+json">${JSON.stringify(metadata.schema)}</script>`);
  }

  return tags.join('\n  ');
}

/**
 * Injetar metadados SEO em resposta JSON
 */
function injectSEOInJSON(response, metadata) {
  if (response && typeof response === 'object') {
    return {
      ...response,
      _seo: {
        title: metadata.title,
        description: metadata.description,
        keywords: metadata.keywords,
        openGraph: {
          title: metadata['og:title'],
          description: metadata['og:description'],
          type: metadata['og:type'],
          url: metadata['og:url'],
          image: metadata['og:image']
        },
        twitter: {
          card: metadata['twitter:card'],
          title: metadata['twitter:title'],
          description: metadata['twitter:description'],
          image: metadata['twitter:image']
        },
        schema: metadata.schema
      }
    };
  }

  return response;
}

/**
 * Configuração do middleware
 */
module.exports.config = {
  name: 'seo-middleware',
  config: {
    // Configurações específicas do middleware
    enableOpenGraph: true,
    enableTwitterCard: true,
    enableSchemaOrg: true,
    enableBreadcrumbs: true
  }
};
