/**
 * game router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::game.game', {
  config: {
    find: {
      policies: [],
      middlewares: [],
    },
    findOne: {
      policies: [],
      middlewares: [],
    },
    create: {
      policies: [],
      middlewares: [],
    },
    update: {
      policies: [],
      middlewares: [],
    },
    delete: {
      policies: [],
      middlewares: [],
    },
  },
  only: ['find', 'findOne', 'create', 'update', 'delete'],
  except: [],
});

// Rotas customizadas
export const customRoutes = {
  routes: [
    {
      method: 'GET',
      path: '/games/populate',
      handler: 'game.populate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/games/optimize-images',
      handler: 'game.optimizeExistingImages',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/games/category/:categorySlug',
      handler: 'game.findByCategory',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/games/platform/:platformSlug',
      handler: 'game.findByPlatform',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/games/average-price',
      handler: 'game.getAveragePrice',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/games/stats',
      handler: 'game.getStats',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
