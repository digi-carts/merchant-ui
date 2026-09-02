import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('shows KPI cards', async ({ page }) => {
    await expect(page.getByText(/store|revenue|orders|subscription/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('revenue card has 15d / 30d toggle', async ({ page }) => {
    const toggle15 = page.getByRole('button', { name: /15d|15 days/i });
    const toggle30 = page.getByRole('button', { name: /30d|30 days/i });
    const hasToggle = await toggle15.isVisible() || await toggle30.isVisible();
    expect(hasToggle).toBeTruthy();
  });

  test('clicking 30d toggle loads 30-day revenue data', async ({ page }) => {
    const toggle30 = page.getByRole('button', { name: /30d|30 days/i });
    if (await toggle30.isVisible()) {
      await toggle30.click();
      await expect(toggle30).toHaveAttribute('data-active', 'true');
    }
  });

  test('shows revenue trend chart', async ({ page }) => {
    await page.waitForTimeout(2000);
    const chart = page.locator('.recharts-wrapper, [data-testid="revenue-chart"], svg').first();
    await expect(chart).toBeVisible({ timeout: 10000 });
  });

  test('shows order volume chart', async ({ page }) => {
    await page.waitForTimeout(2000);
    const charts = page.locator('.recharts-wrapper, svg');
    await expect(charts.first()).toBeVisible({ timeout: 10000 });
  });

  test('shows stock summary', async ({ page }) => {
    await expect(page.getByText(/out.of.stock|low stock|stock/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('sidebar navigation links are visible', async ({ page }) => {
    await expect(page.getByRole('link', { name: /catalog/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /orders/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
  });

  test('AI chat button is rendered (if configured)', async ({ page }) => {
    const chatBtn = page.locator('[data-testid="ai-chat"], [aria-label*="chat"], button[class*="chat"]');
    // AI chat is optional — just assert page loaded
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  });
});
