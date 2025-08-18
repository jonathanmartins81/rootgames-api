/**
 * 🎮 RootGames API - Arquivo Principal de Configuração
 *
 * Este arquivo contém as configurações globais da aplicação, incluindo:
 * - Middlewares de segurança
 * - Headers de proteção
 * - Logs de requisições
 * - Verificação de conectividade com banco de dados
 * - Configurações de inicialização
 *
 * @author Jonathan Martins
 * @version 1.0.0
 * @since 2025
 */

export default {
  /**
   * 🔧 Função de Registro - Executada antes da inicialização da aplicação
   *
   * Responsável por:
   * - Configurar middlewares globais
   * - Definir headers de segurança
   * - Configurar logs de requisições
   * - Preparar a aplicação para uso
   *
   * @param strapi - Instância do Strapi
   */
  register({ strapi }: { strapi: any }) {
    // Log de inicialização
    strapi.log.info('🚀 Root Games API - Inicializando...');

    // 🔒 Middleware de Segurança e Logs
    strapi.server.use(async (ctx: any, next: any) => {
      // Headers de Segurança
      ctx.set('X-Content-Type-Options', 'nosniff'); // Previne MIME type sniffing
      ctx.set('X-Frame-Options', 'DENY'); // Previne clickjacking
      ctx.set('X-XSS-Protection', '1; mode=block'); // Proteção XSS
      ctx.set('Referrer-Policy', 'strict-origin-when-cross-origin'); // Política de referrer
      ctx.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()'); // Permissões

      // 📊 Log de Performance e Requisições
      const start = Date.now();
      await next();
      const ms = Date.now() - start;

      // Log estruturado com informações da requisição
      strapi.log.info(`${ctx.method} ${ctx.url} - ${ctx.status} (${ms}ms)`);

      // Log de erro para status codes 4xx e 5xx
      if (ctx.status >= 400) {
        strapi.log.warn(`⚠️ ${ctx.method} ${ctx.url} - ${ctx.status} (${ms}ms)`);
      }
    });
  },

  /**
   * 🚀 Função de Bootstrap - Executada após a inicialização da aplicação
   *
   * Responsável por:
   * - Verificar conectividade com banco de dados
   * - Configurar jobs agendados
   * - Inicializar serviços necessários
   * - Validar configurações críticas
   *
   * @param strapi - Instância do Strapi
   */
  async bootstrap({ strapi }: { strapi: any }) {
    strapi.log.info('✅ Root Games API - Inicializado com sucesso!');

    // 🔍 Verificação de Conectividade com Banco de Dados
    try {
      await strapi.db.connection.raw('SELECT 1');
      strapi.log.info('✅ Conexão com banco de dados estabelecida');
    } catch (error) {
      strapi.log.error('❌ Erro na conexão com banco de dados:', error);
      throw new Error('Falha na conexão com banco de dados');
    }

    // 📅 Configuração de Jobs Agendados (Comentado para futura implementação)
    // strapi.cron.add('0 2 * * *', () => {
    //   strapi.log.info('🔄 Executando limpeza diária...');
    //   // Implementar limpeza de cache, logs antigos, etc.
    // });

    // 🧹 Limpeza de Cache (Opcional)
    try {
      if (strapi.cache && typeof strapi.cache.clear === 'function') {
        await strapi.cache.clear();
        strapi.log.info('🧹 Cache limpo com sucesso');
      } else {
        strapi.log.info('ℹ️ Cache não disponível para limpeza');
      }
    } catch (error) {
      strapi.log.warn('⚠️ Erro ao limpar cache:', error);
    }

    strapi.log.info('🎉 RootGames API pronta para uso!');
  },
};
