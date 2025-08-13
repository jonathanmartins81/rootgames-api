import { config } from 'dotenv';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

// Carregar variáveis de ambiente
config({ path: '.env.test' });

// Mock do Strapi para testes
global.strapi = {
  service: vi.fn(),
  query: vi.fn(),
  entityService: vi.fn(),
  plugin: vi.fn(),
  config: { get: vi.fn() },
} as any;

// Mock do console para evitar logs durante testes
const originalConsole = { ...console };
beforeEach(() => {
  console.log = vi.fn();
  console.error = vi.fn();
  console.warn = vi.fn();
  console.info = vi.fn();
});

afterEach(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
});

// Configurações globais de teste
beforeAll(() => {
  // Configurar timezone para testes
  process.env.TZ = 'UTC';
});

afterAll(() => {
  // Limpeza após todos os testes
});
