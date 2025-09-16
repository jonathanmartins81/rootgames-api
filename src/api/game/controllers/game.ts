/**
 * game controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::game.game",
  ({ strapi }) => ({
    async populate(ctx) {
      const options = {
        limit: 48,
        order: "desc:trending",
        ...ctx.query,
      };

      await strapi.service("api::game.game").populate(options);

      ctx.send("Finished populating games!");
    },

    // Novo método para buscar imagens reais
    async fetchRealImages(ctx) {
      try {
        const { gameId } = ctx.params;
        const result = await strapi
          .service("api::game.game")
          .fetchRealImages(gameId);
        ctx.send(result);
      } catch (error) {
        ctx.throw(500, error.message);
      }
    },

    // Novo método para baixar imagens de um jogo específico
    async downloadGameImages(ctx) {
      try {
        const { gameId } = ctx.params;
        const result = await strapi
          .service("api::game.game")
          .downloadGameImages(gameId);
        ctx.send(result);
      } catch (error) {
        ctx.throw(500, error.message);
      }
    },

    // Novo método para baixar imagens de todos os jogos
    async downloadAllGameImages(ctx) {
      try {
        const result = await strapi
          .service("api::game.game")
          .downloadAllGameImages();
        ctx.send(result);
      } catch (error) {
        ctx.throw(500, error.message);
      }
    },

    // Novo método para buscar imagens de múltiplas fontes
    async searchGameImages(ctx) {
      try {
        const { gameName } = ctx.query;
        if (!gameName) {
          ctx.throw(400, "gameName parameter is required");
        }

        const result = await strapi
          .service("api::game.game")
          .searchGameImages(gameName);
        ctx.send(result);
      } catch (error) {
        ctx.throw(500, error.message);
      }
    },

    // Novo método para listar fontes de imagens disponíveis
    async getImageSources(ctx) {
      try {
        const sources = await strapi
          .service("api::game.game")
          .getImageSources();
        ctx.send(sources);
      } catch (error) {
        ctx.throw(500, error.message);
      }
    },

    // Novo método para verificar status das APIs externas
    async checkAPIStatus(ctx) {
      try {
        const status = await strapi.service("api::game.game").checkAPIStatus();
        ctx.send(status);
      } catch (error) {
        ctx.throw(500, error.message);
      }
    },

    // Novo método para buscar imagens com múltiplas fontes
    async searchGameImagesAdvanced(ctx) {
      try {
        const { gameName } = ctx.query;
        if (!gameName) {
          ctx.throw(400, "gameName parameter is required");
        }

        const result = await strapi
          .service("api::game.game")
          .searchGameImagesAdvanced(gameName);
        ctx.send(result);
      } catch (error) {
        ctx.throw(500, error.message);
      }
    },

    // Novo método para estatísticas do cache
    async getCacheStats(ctx) {
      try {
        const stats = await strapi.service("api::game.game").getCacheStats();
        ctx.send(stats);
      } catch (error) {
        ctx.throw(500, error.message);
      }
    },

    // Novo método para limpar cache
    async clearCache(ctx) {
      try {
        const result = await strapi.service("api::game.game").clearCache();
        ctx.send(result);
      } catch (error) {
        ctx.throw(500, error.message);
      }
    },
  })
);
