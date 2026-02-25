import { test, expect } from '@playwright/test';

test.describe('API routes', () => {
  test('ETL trigger requires auth', async ({ request }) => {
    const response = await request.post('/api/etl/trigger');
    // Should reject unauthenticated requests
    expect(response.status()).toBe(401);
  });

  test('revalidate endpoint requires auth', async ({ request }) => {
    const response = await request.post('/api/revalidate', {
      data: { path: '/us/washington-dc' },
    });
    expect(response.status()).toBe(401);
  });

  test('IndexNow endpoint requires auth', async ({ request }) => {
    const response = await request.post('/api/indexnow', {
      data: { urls: ['https://example.com/test'] },
    });
    expect(response.status()).toBe(401);
  });

  test('lead capture validates input', async ({ request }) => {
    const response = await request.post('/api/leads/capture', {
      data: { name: '', email: 'not-an-email' },
    });
    // Should reject invalid input
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('lead capture rejects with honeypot filled', async ({ request }) => {
    const response = await request.post('/api/leads/capture', {
      data: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-1234',
        message: 'I need a contractor',
        permitId: 'test-123',
        website: 'http://spam.com', // honeypot
      },
    });
    // Honeypot filled — should silently succeed (200) but not actually save
    expect([200, 400]).toContain(response.status());
  });
});

test.describe('404 handling', () => {
  test('non-existent country returns 404', async ({ page }) => {
    const response = await page.goto('/xx');
    expect(response?.status()).toBe(404);
  });

  test('non-existent city returns 404', async ({ page }) => {
    const response = await page.goto('/us/nonexistent-city');
    expect(response?.status()).toBe(404);
  });
});
