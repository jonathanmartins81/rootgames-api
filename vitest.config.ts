import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}', 'tests/unit/**/*.{test,spec}.{js,ts}', '**/__tests__/**/*.{js,ts}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.cache/**',
      '.tmp/**',
      'coverage/**',
      'src/admin/**',
      'types/**',
      'tests/e2e/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '.cache/**',
        '.tmp/**',
        'coverage/**',
        'src/admin/**',
        'types/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/setup.{js,ts}',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    reporters: ['verbose', 'html'],
    outputFile: {
      html: './coverage/index.html',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@api': resolve(__dirname, './src/api'),
      '@config': resolve(__dirname, './config'),
      '@database': resolve(__dirname, './database'),
      '@docs': resolve(__dirname, './docs'),
      '@scripts': resolve(__dirname, './scripts'),
      '@types': resolve(__dirname, './types'),
      '@utils': resolve(__dirname, './src/utils'),
      '@services': resolve(__dirname, './src/services'),
      '@middlewares': resolve(__dirname, './src/middlewares'),
      '@extensions': resolve(__dirname, './src/extensions'),
    },
  },
});
