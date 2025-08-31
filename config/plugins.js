module.exports = () => ({
  // Plugins configuration
  // CKEditor removido - usando richtext nativo do Strapi

  // Configuração do plugin de upload
  upload: {
    config: {
      provider: '@strapi/provider-upload-local',
      providerOptions: {
        sizeLimit: 100000,
        baseUrl: '/uploads',
        uploadPath: 'public/uploads',
      },
    },
  },

  // Configuração do plugin users-permissions
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '30d',
      },
      // Configurar permissões públicas
      public: {
        enabled: true,
        defaultRole: 'public',
      },
    },
  },
});
