/**
 * 🧪 Setup dos Testes
 * Configuração global para todos os testes
 */

import { jest } from "@jest/globals";

// Configurar timeout global
jest.setTimeout(30000);

// Mock do console para reduzir output nos testes
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = "test";
process.env.DATABASE_CLIENT = "postgres";
process.env.DATABASE_HOST = "localhost";
process.env.DATABASE_PORT = "5432";
process.env.DATABASE_NAME = "rootgames_test";
process.env.DATABASE_USERNAME = "rootgames";
process.env.DATABASE_PASSWORD = "rootgames123";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.API_TOKEN_SALT = "test-api-token-salt";
process.env.ADMIN_JWT_SECRET = "test-admin-jwt-secret";
process.env.TRANSFER_TOKEN_SALT = "test-transfer-token-salt";

// Cleanup após cada teste
afterEach(() => {
  jest.clearAllMocks();
});

// Cleanup global
afterAll(() => {
  // Restaurar console original
  global.console = originalConsole;
});
