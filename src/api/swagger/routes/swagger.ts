/**
 * 📚 Rotas do Swagger/OpenAPI
 * Endpoints para documentação da API
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/api-docs',
      handler: 'swagger.getDocs',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'GET',
      path: '/api-docs.json',
      handler: 'swagger.getSpecs',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      }
    }
  ]
};
