import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('renders hero section and city cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    // City cards should be present for all 6 cities
    await expect(page.getByText('Washington, D.C.')).toBeVisible();
    await expect(page.getByText('New York City')).toBeVisible();
    await expect(page.getByText('Chicago')).toBeVisible();
    await expect(page.getByText('London')).toBeVisible();
    await expect(page.getByText('Sydney')).toBeVisible();
    await expect(page.getByText('Toronto')).toBeVisible();
  });

  test('has correct page title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toContain('Civic');
  });

  test('contains structured data JSON-LD', async ({ page }) => {
    await page.goto('/');
    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd.first()).toBeAttached();
  });
});

test.describe('Country pages', () => {
  test('US country page lists cities', async ({ page }) => {
    await page.goto('/us');
    await expect(page.locator('h1')).toContainText('United States');
    await expect(page.getByText('Washington, D.C.')).toBeVisible();
    await expect(page.getByText('New York City')).toBeVisible();
    await expect(page.getByText('Chicago')).toBeVisible();
  });

  test('UK country page lists London', async ({ page }) => {
    await page.goto('/uk');
    await expect(page.locator('h1')).toContainText('United Kingdom');
    await expect(page.getByText('London')).toBeVisible();
  });
});

test.describe('City pages', () => {
  test('DC city page renders heading and neighborhoods section', async ({ page }) => {
    await page.goto('/us/washington-dc');
    await expect(page.locator('h1')).toContainText('Washington, D.C.');
    await expect(page.getByText('Neighborhoods')).toBeVisible();
  });

  test('city page has breadcrumbs', async ({ page }) => {
    await page.goto('/us/new-york-city');
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByText('United States')).toBeVisible();
  });

  test('city page has stats section', async ({ page }) => {
    await page.goto('/us/chicago');
    await expect(page.getByText('Total Permits')).toBeVisible();
    await expect(page.getByText('Neighborhoods')).toBeVisible();
  });
});

test.describe('Navigation flow', () => {
  test('can navigate from homepage to city to country', async ({ page }) => {
    await page.goto('/');

    // Click on a city link
    await page.getByRole('link', { name: /Washington/i }).first().click();
    await expect(page).toHaveURL(/\/us\/washington-dc/);
    await expect(page.locator('h1')).toContainText('Washington, D.C.');

    // Click breadcrumb to go to country
    await page.getByRole('link', { name: 'United States' }).first().click();
    await expect(page).toHaveURL(/\/us/);
    await expect(page.locator('h1')).toContainText('United States');
  });
});
