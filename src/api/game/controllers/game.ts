/**
 * 🎮 Game Controller - Controlador para Entidade de Jogos
 *
 * Este controlador estende o controlador padrão do Strapi com funcionalidades
 * específicas para o catálogo de jogos, incluindo:
 * - População de dados da API GOG
 * - Otimização de imagens
 * - Busca por categorias e plataformas
 * - Cálculo de estatísticas
 * - Métricas de preços
 *
 * @author Jonathan Martins
 * @version 1.0.0
 * @since 2025
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::game.game', ({ strapi }) => ({
  /**
   * 📥 Popular Jogos - Importa jogos da API GOG
   *
   * Endpoint: POST /api/games/populate
   *
   * @param ctx - Contexto da requisição
   * @param ctx.query.limit - Limite de jogos a importar (padrão: 10)
   * @param ctx.query.order - Ordem de importação (padrão: desc:trending)
   */
  async populate(ctx: any) {
    try {
      const { limit = 10, order = 'desc:trending' } = ctx.query;

      strapi.log.info(`🔄 Iniciando população de jogos: ${limit} jogos, ordem: ${order}`);

      await strapi.service('api::game.game').populate({ limit, order });

      ctx.send({
        success: true,
        message: 'Jogos populados com sucesso!',
        data: {
          limit,
          order,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      strapi.log.error('❌ Erro ao popular jogos:', error);
      ctx.internalServerError({
        success: false,
        message: 'Erro ao popular jogos',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  },

  /**
   * 🖼️ Otimizar Imagens - Otimiza todas as imagens existentes
   *
   * Endpoint: POST /api/games/optimize-images
   *
   * @param ctx - Contexto da requisição
   */
  async optimizeExistingImages(ctx: any) {
    try {
      strapi.log.info('🔄 Iniciando otimização de imagens...');

      await strapi.service('api::game.game').optimizeExistingImages();

      ctx.send({
        success: true,
        message: 'Otimização de imagens concluída com sucesso!',
        data: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      strapi.log.error('❌ Erro ao otimizar imagens:', error);
      ctx.internalServerError({
        success: false,
        message: 'Erro ao otimizar imagens',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  },

  /**
   * 🏷️ Buscar Jogos por Categoria
   *
   * Endpoint: GET /api/games/category/:categorySlug
   *
   * @param ctx - Contexto da requisição
   * @param ctx.params.categorySlug - Slug da categoria
   * @param ctx.query.page - Página (padrão: 1)
   * @param ctx.query.pageSize - Tamanho da página (padrão: 25)
   */
  async findByCategory(ctx: any) {
    try {
      const { categorySlug } = ctx.params;
      const page = parseInt(ctx.query.page as string) || 1;
      const pageSize = parseInt(ctx.query.pageSize as string) || 25;

      strapi.log.info(`🔍 Buscando jogos da categoria: ${categorySlug}, página: ${page}`);

      const games = await strapi.db.query('api::game.game').findMany({
        where: {
          categories: {
            slug: categorySlug,
          },
        },
        populate: {
          cover: true,
          categories: true,
          platforms: true,
          developers: true,
          publisher: true,
        },
        orderBy: { createdAt: 'desc' },
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });

      // Contar total de jogos na categoria
      const total = await strapi.db.query('api::game.game').count({
        where: {
          categories: {
            slug: categorySlug,
          },
        },
      });

      ctx.send({
        success: true,
        data: games,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          category: categorySlug,
        },
      });
    } catch (error) {
      strapi.log.error('❌ Erro ao buscar jogos por categoria:', error);
      ctx.internalServerError({
        success: false,
        message: 'Erro ao buscar jogos por categoria',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  },

  /**
   * 🎯 Buscar Jogos por Plataforma
   *
   * Endpoint: GET /api/games/platform/:platformSlug
   *
   * @param ctx - Contexto da requisição
   * @param ctx.params.platformSlug - Slug da plataforma
   * @param ctx.query.page - Página (padrão: 1)
   * @param ctx.query.pageSize - Tamanho da página (padrão: 25)
   */
  async findByPlatform(ctx: any) {
    try {
      const { platformSlug } = ctx.params;
      const page = parseInt(ctx.query.page as string) || 1;
      const pageSize = parseInt(ctx.query.pageSize as string) || 25;

      strapi.log.info(`🔍 Buscando jogos da plataforma: ${platformSlug}, página: ${page}`);

      const games = await strapi.db.query('api::game.game').findMany({
        where: {
          platforms: {
            slug: platformSlug,
          },
        },
        populate: {
          cover: true,
          categories: true,
          platforms: true,
          developers: true,
          publisher: true,
        },
        orderBy: { createdAt: 'desc' },
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });

      // Contar total de jogos na plataforma
      const total = await strapi.db.query('api::game.game').count({
        where: {
          platforms: {
            slug: platformSlug,
          },
        },
      });

      ctx.send({
        success: true,
        data: games,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          platform: platformSlug,
        },
      });
    } catch (error) {
      strapi.log.error('❌ Erro ao buscar jogos por plataforma:', error);
      ctx.internalServerError({
        success: false,
        message: 'Erro ao buscar jogos por plataforma',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  },

  /**
   * 💰 Calcular Preço Médio - Calcula o preço médio de todos os jogos
   *
   * Endpoint: GET /api/games/average-price
   *
   * @param ctx - Contexto da requisição
   */
  async getAveragePrice(ctx: any) {
    try {
      strapi.log.info('💰 Calculando preço médio dos jogos...');

      const result = await strapi.db.query('api::game.game').findMany({
        select: ['price'],
        where: {
          price: {
            $notNull: true,
          },
        },
      });

      if (result.length === 0) {
        ctx.send({
          success: true,
          data: { averagePrice: 0, totalGames: 0 },
        });
        return;
      }

      const totalPrice = result.reduce((sum: number, game: any) => sum + parseFloat(game.price), 0);
      const averagePrice = (totalPrice / result.length).toFixed(2);

      ctx.send({
        success: true,
        data: {
          averagePrice: parseFloat(averagePrice),
          totalGames: result.length,
          totalPrice: totalPrice.toFixed(2),
        },
      });
    } catch (error) {
      strapi.log.error('❌ Erro ao calcular preço médio:', error);
      ctx.internalServerError({
        success: false,
        message: 'Erro ao calcular preço médio',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  },

  /**
   * 📊 Obter Estatísticas - Retorna estatísticas gerais do catálogo
   *
   * Endpoint: GET /api/games/stats
   *
   * @param ctx - Contexto da requisição
   */
  async getStats(ctx: any) {
    try {
      strapi.log.info('📊 Obtendo estatísticas do catálogo...');

      const [totalGames, totalCategories, totalPlatforms, totalDevelopers, totalPublishers] = await Promise.all([
        strapi.db.query('api::game.game').count(),
        strapi.db.query('api::category.category').count(),
        strapi.db.query('api::platform.platform').count(),
        strapi.db.query('api::developer.developer').count(),
        strapi.db.query('api::publisher.publisher').count(),
      ]);

      ctx.send({
        success: true,
        data: {
          stats: {
            totalGames,
            totalCategories,
            totalPlatforms,
            totalDevelopers,
            totalPublishers,
          },
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      strapi.log.error('❌ Erro ao obter estatísticas:', error);
      ctx.internalServerError({
        success: false,
        message: 'Erro ao obter estatísticas',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  },
}));
