/**
 * 📚 Controller do Swagger/OpenAPI
 * Lógica para documentação da API
 */

import { factories } from '@strapi/strapi';
import { swaggerUi, specs } from '../swagger.config';

export default factories.createCoreController('api::swagger.swagger', ({ strapi }) => ({
  async getDocs(ctx: any) {
    try {
      const html = swaggerUi.generateHTML(specs, {
        customCss: `
          .swagger-ui .topbar { display: none; }
          .swagger-ui .info .title { color: #2e8b57; }
          .swagger-ui .scheme-container { background: #f8f9fa; }
        `,
        customSiteTitle: '🎮 RootGames API Documentation',
        customfavIcon: '/favicon.png'
      });
      
      ctx.set('Content-Type', 'text/html');
      ctx.body = html;
    } catch (error: any) {
      ctx.throw(500, `Erro ao gerar documentação: ${error.message}`);
    }
  },

  async getSpecs(ctx: any) {
    try {
      ctx.set('Content-Type', 'application/json');
      ctx.body = specs;
    } catch (error: any) {
      ctx.throw(500, `Erro ao gerar especificações: ${error.message}`);
    }
  }
}));
