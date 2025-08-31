export default () => ({
  register({ strapi }: any) {
    // Garantir que o plugin de upload seja carregado
    if (strapi.plugin('upload')) {
      strapi.log.info('✅ Plugin de upload carregado com sucesso');
    } else {
      strapi.log.warn('⚠️ Plugin de upload não encontrado');
    }
  },

  bootstrap({ strapi }: any) {
    // Verificar se o serviço de upload está disponível
    try {
      const uploadService = strapi.plugin('upload').service('upload');
      if (uploadService) {
        strapi.log.info('✅ Serviço de upload disponível');
      }
    } catch (error) {
      strapi.log.error('❌ Erro ao acessar serviço de upload:', error);
    }
  },
});
