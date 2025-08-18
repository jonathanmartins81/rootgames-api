import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
      globals: {
        // Strapi globals
        strapi: 'readonly',
        // Node.js globals
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
        global: 'readonly',
        // Browser globals
        document: 'readonly',
        window: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        FormData: 'readonly',
        fetch: 'readonly',
        // Vitest globals
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    plugins: { '@typescript-eslint': typescript, prettier: prettier },
    rules: {
      ...typescript.configs.recommended.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-undef': 'error',
    },
  },
  {
    files: ['**/*.config.{js,ts}', 'config/**/*.{js,ts}', '.strapi/**/*.{js,ts}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  { files: ['src/admin/**/*.{js,ts,tsx}'], rules: { 'no-undef': 'off', '@typescript-eslint/no-unused-vars': 'warn' } },
  {
    files: ['tests/**/*.{js,ts,tsx}'],
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  { files: ['src/utils/**/*.{js,ts}'], rules: { 'no-console': 'warn', '@typescript-eslint/no-explicit-any': 'warn' } },
  { files: ['src/api/**/*.{js,ts}'], rules: { 'no-console': 'warn', '@typescript-eslint/no-explicit-any': 'warn' } },
  {
    files: ['types/generated/**/*.d.ts'],
    rules: { '@typescript-eslint/no-unused-vars': 'off', '@typescript-eslint/ban-types': 'off' },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.cache/**',
      '.tmp/**',
      'coverage/**',
      'logs/**',
      '*.log',
      'backups/**',
      '.strapi/client/**',
    ],
  },
];
