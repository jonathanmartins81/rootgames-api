import { FullConfig } from '@playwright/test';

async function globalTeardown(_config: FullConfig) {
  // Limpeza após todos os testes E2E
  console.log('🧹 Limpeza global dos testes E2E concluída');
}

export default globalTeardown;
