module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended', '@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // Desabilitar regras problemáticas para scripts
    'no-console': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-undef': 'warn',
    'no-case-declarations': 'warn',
  },
  overrides: [
    {
      // Configuração mais rigorosa para arquivos TypeScript principais
      files: ['src/**/*.ts', 'src/**/*.tsx'],
      rules: {
        'no-console': 'warn',
        '@typescript-eslint/no-var-requires': 'error',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': 'error',
        'no-undef': 'error',
      },
    },
    {
      // Configuração mais permissiva para scripts
      files: ['scripts/**/*.js', '*.js'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'warn',
        'no-undef': 'warn',
        'no-case-declarations': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/', '*.min.js', 'patches/'],
};
