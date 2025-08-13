import { expect, test } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('admin panel should match visual baseline', async ({ page }) => {
    await page.goto('/admin');

    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');

    // Capturar screenshot para comparação visual
    await expect(page).toHaveScreenshot('admin-panel.png', { fullPage: true, animations: 'disabled' });
  });

  test('admin login page should match visual baseline', async ({ page }) => {
    await page.goto('/admin/auth/login');

    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');

    // Capturar screenshot para comparação visual
    await expect(page).toHaveScreenshot('admin-login.png', { fullPage: true, animations: 'disabled' });
  });

  test('admin dashboard should match visual baseline', async ({ page }) => {
    await page.goto('/admin');

    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');

    // Capturar screenshot do dashboard
    await expect(page).toHaveScreenshot('admin-dashboard.png', { fullPage: false, animations: 'disabled' });
  });

  test('content manager should match visual baseline', async ({ page }) => {
    await page.goto('/admin/content-manager');

    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');

    // Capturar screenshot do content manager
    await expect(page).toHaveScreenshot('content-manager.png', { fullPage: true, animations: 'disabled' });
  });

  test('mobile view should match visual baseline', async ({ page }) => {
    // Configurar viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/admin');

    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');

    // Capturar screenshot mobile
    await expect(page).toHaveScreenshot('admin-mobile.png', { fullPage: true, animations: 'disabled' });
  });

  test('tablet view should match visual baseline', async ({ page }) => {
    // Configurar viewport tablet
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/admin');

    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');

    // Capturar screenshot tablet
    await expect(page).toHaveScreenshot('admin-tablet.png', { fullPage: true, animations: 'disabled' });
  });

  test('dark mode should match visual baseline', async ({ page }) => {
    await page.goto('/admin');

    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');

    // Simular modo escuro (se disponível)
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    // Aguardar transição
    await page.waitForTimeout(1000);

    // Capturar screenshot modo escuro
    await expect(page).toHaveScreenshot('admin-dark-mode.png', { fullPage: true, animations: 'disabled' });
  });

  test('form elements should match visual baseline', async ({ page }) => {
    await page.goto('/admin/content-manager/collectionType/api::game.game');

    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');

    // Capturar screenshot dos formulários
    await expect(page).toHaveScreenshot('form-elements.png', { fullPage: true, animations: 'disabled' });
  });
});
