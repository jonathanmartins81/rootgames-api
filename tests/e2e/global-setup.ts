import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Aguardar o servidor estar pronto
  await page.goto('http://localhost:1337');

  // Verificar se o Strapi está rodando
  await page.waitForSelector('body', { timeout: 30000 });

  // Verificar se a API está respondendo
  const response = await page.request.get('http://localhost:1337/api/games');
  if (response.status() !== 200 && response.status() !== 403) {
    throw new Error(`API não está respondendo corretamente. Status: ${response.status()}`);
  }

  await browser.close();
}

export default globalSetup;
