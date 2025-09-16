/**
 * game router
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreRouter("api::game.game", {
  config: {
    find: {
      auth: false,
    },
    findOne: {
      auth: false,
    },
  },
  only: ["find", "findOne"],
  except: [],
});
