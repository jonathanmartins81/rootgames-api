module.exports = [
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  // Middleware SEO personalizado (temporariamente comentado)
  // {
  //   name: 'global::seo-middleware',
  //   config: {
  //     enableOpenGraph: true,
  //     enableTwitterCard: true,
  //     enableSchemaOrg: true,
  //     enableBreadcrumbs: true
  //   }
  // }
];
