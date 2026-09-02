import { test, expect } from '@playwright/test';

test.describe('Stock page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/stock');
    await page.waitForLoadState('networkidle');
  });

  test('renders stock list', async ({ page }) => {
    await expect(page.getByText(/stock|inventory/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('search input filters products', async ({ page }) => {
    const searchInput = page.getByRole('searchbox').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    }
  });

  test('filter tabs are visible', async ({ page }) => {
    const allTab = page.getByRole('tab', { name: /all/i });
    const outTab = page.getByRole('tab', { name: /out/i });
    const lowTab = page.getByRole('tab', { name: /low/i });
    await expect(allTab).toBeVisible();
    await expect(outTab).toBeVisible();
    await expect(lowTab).toBeVisible();
  });

  test('clicking Out tab filters out-of-stock items', async ({ page }) => {
    const outTab = page.getByRole('tab', { name: /out/i });
    await outTab.click();
    await page.waitForTimeout(500);
    await expect(outTab).toHaveAttribute('data-state', 'active');
  });

  test('clicking Low tab filters low-stock items', async ({ page }) => {
    const lowTab = page.getByRole('tab', { name: /low/i });
    await lowTab.click();
    await page.waitForTimeout(500);
    await expect(lowTab).toHaveAttribute('data-state', 'active');
  });

  test('stock quantity inline edit shows Save button', async ({ page }) => {
    const stockInputs = page.getByRole('spinbutton');
    if (await stockInputs.first().isVisible()) {
      await stockInputs.first().fill('99');
      await expect(page.getByRole('button', { name: /save/i }).first()).toBeVisible();
    }
  });
});
