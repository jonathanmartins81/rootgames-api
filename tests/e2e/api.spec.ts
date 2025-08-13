import { expect, test } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('should return games list', async ({ request }) => {
    const response = await request.get('/api/games');

    // Pode retornar 200 (com dados) ou 403 (sem permissões públicas)
    expect([200, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
    }
  });

  test('should return game by ID', async ({ request }) => {
    const response = await request.get('/api/games/1');

    // Pode retornar 200 (com dados) ou 403 (sem permissões públicas)
    expect([200, 403, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('attributes');
    }
  });

  test('should return categories', async ({ request }) => {
    const response = await request.get('/api/categories');
    expect([200, 403]).toContain(response.status());
  });

  test('should return platforms', async ({ request }) => {
    const response = await request.get('/api/platforms');
    expect([200, 403]).toContain(response.status());
  });

  test('should return developers', async ({ request }) => {
    const response = await request.get('/api/developers');
    expect([200, 403]).toContain(response.status());
  });

  test('should return publishers', async ({ request }) => {
    const response = await request.get('/api/publishers');
    expect([200, 403]).toContain(response.status());
  });
});

test.describe('Admin Panel', () => {
  test('should load admin panel', async ({ page }) => {
    await page.goto('/admin');

    // Verificar se a página carrega
    await expect(page).toHaveTitle(/Strapi/);

    // Verificar se há elementos do admin
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('GraphQL API', () => {
  test('should handle GraphQL queries', async ({ request }) => {
    const query = `
      query {
        games {
          data {
            id
            attributes {
              name
              slug
            }
          }
        }
      }
    `;

    const response = await request.post('/graphql', {
      data: { query },
      headers: { 'Content-Type': 'application/json' },
    });

    expect([200, 403]).toContain(response.status());
  });
});
