import { Page, expect } from '@playwright/test';

export class TestUtils {
  static async waitForPageLoad(page: Page) {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Aguardar animações
  }

  static async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  }

  static async checkAccessibility(page: Page) {
    const { AxeBuilder } = await import('@axe-core/playwright');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('Violações de acessibilidade:', accessibilityScanResults.violations);
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  }

  static async loginAsAdmin(page: Page, email: string, password: string) {
    await page.goto('/admin/auth/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  }

  static async createTestGame(page: Page, gameData: any) {
    await page.goto('/admin/content-manager/collectionType/api::game.game');
    await page.click('button[data-testid="add-entry"]');

    // Preencher dados do jogo
    await page.fill('input[name="name"]', gameData.name);
    await page.fill('input[name="slug"]', gameData.slug);
    await page.fill('input[name="price"]', gameData.price.toString());

    // Salvar
    await page.click('button[data-testid="save-button"]');
    await page.waitForSelector('[data-testid="success-notification"]');
  }

  static async deleteTestGame(page: Page, gameId: string) {
    await page.goto(`/admin/content-manager/collectionType/api::game.game/${gameId}`);
    await page.click('button[data-testid="delete-button"]');
    await page.click('button[data-testid="confirm-delete"]');
    await page.waitForSelector('[data-testid="success-notification"]');
  }

  static async checkAPIResponse(url: string, expectedStatus: number[] = [200, 403]) {
    const response = await fetch(url);
    expect(expectedStatus).toContain(response.status);
    return response;
  }

  static async checkGraphQLQuery(query: string, expectedStatus: number[] = [200, 403]) {
    const response = await fetch('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    expect(expectedStatus).toContain(response.status);
    return response;
  }
}
