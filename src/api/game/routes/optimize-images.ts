export default {
  routes: [
    {
      method: 'POST',
      path: '/games/optimize-images',
      handler: 'game.optimizeExistingImages',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
