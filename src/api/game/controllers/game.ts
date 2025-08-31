/**
 * game controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::game.game', ({ strapi }) => ({
  async populate(ctx) {
    const options = {
      limit: 48,
      order: 'desc:trending',
      ...ctx.query,
    };

    await strapi.service('api::game.game').populate(options);

    ctx.send('Finished populating games!');
  },

  async populateSpecific(ctx) {
    try {
      await strapi.service('api::game.game').populateSpecific();
      ctx.send('Finished populating specific games from the target list!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      ctx.badRequest('Error populating specific games: ' + errorMessage);
    }
  },
}));
