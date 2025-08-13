import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test('admin panel should be accessible', async ({ page }) => {
    await page.goto('/admin');

    // Aguardar carregamento da página
    await page.waitForLoadState('networkidle');

    // Executar análise de acessibilidade
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    // Verificar se não há violações críticas
    expect(accessibilityScanResults.violations).toEqual([]);

    // Log das violações para debug
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Violações de acessibilidade encontradas:', accessibilityScanResults.violations);
    }
  });

  test('API documentation should be accessible', async ({ page }) => {
    await page.goto('/documentation');

    // Aguardar carregamento da página
    await page.waitForLoadState('networkidle');

    // Executar análise de acessibilidade
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    // Verificar se não há violações críticas
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/admin');

    // Verificar se há pelo menos um h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);

    // Verificar se há pelo menos um h2
    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThan(0);
  });

  test('should have proper alt text for images', async ({ page }) => {
    await page.goto('/admin');

    // Verificar se todas as imagens têm alt text
    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/admin');

    // Verificar se todos os inputs têm labels associados
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"]').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        expect(label).toBeGreaterThan(0);
      }
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/admin');

    // Executar análise específica de contraste
    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

    // Verificar se não há violações de contraste
    const contrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/admin');

    // Verificar se é possível navegar com Tab
    await page.keyboard.press('Tab');

    // Verificar se há elementos focáveis
    const focusableElements = await page
      .locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])')
      .count();
    expect(focusableElements).toBeGreaterThan(0);
  });
});
