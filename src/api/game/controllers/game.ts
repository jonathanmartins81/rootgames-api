/**
 * game controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::game.game', ({ strapi }) => ({
  async populate(ctx) {
    try {
      const { limit = 10, order = 'desc:trending' } = ctx.query;

      await strapi.service('api::game.game').populate({ limit, order });

      ctx.send('Finished populating games!');
    } catch {
      ctx.internalServerError('Error populating games');
    }
  },

  async optimizeExistingImages(ctx) {
    try {
      await strapi.service('api::game.game').optimizeExistingImages();
      ctx.send('Image optimization completed successfully!');
    } catch {
      ctx.internalServerError('Error optimizing images');
    }
  },
}));
