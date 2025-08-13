export default {
  // Executar em arquivos TypeScript/JavaScript
  '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],

  // Executar em arquivos de configuração
  '*.{json,yml,yaml,md}': ['prettier --write'],

  // Executar em arquivos de configuração específicos
  '*.config.{js,ts}': ['eslint --fix', 'prettier --write'],

  // Executar em arquivos de documentação
  'docs/**/*.{md,mdx}': ['prettier --write'],
};
