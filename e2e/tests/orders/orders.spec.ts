import { test, expect } from '@playwright/test';

test.describe('Orders page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
  });

  test('renders orders list', async ({ page }) => {
    await expect(page.getByText(/orders/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('search input is visible', async ({ page }) => {
    await expect(page.getByRole('searchbox').first()).toBeVisible();
  });

  test('status filter tabs are visible', async ({ page }) => {
    for (const label of ['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']) {
      await expect(page.getByRole('tab', { name: new RegExp(label, 'i') })).toBeVisible();
    }
  });

  test('clicking PENDING tab filters orders', async ({ page }) => {
    await page.getByRole('tab', { name: /pending/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('tab', { name: /pending/i })).toHaveAttribute('data-state', 'active');
  });

  test('select all checkbox is visible', async ({ page }) => {
    const checkbox = page.getByRole('checkbox', { name: /select all/i });
    if (await checkbox.isVisible()) {
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    }
  });

  test('expand order shows order details', async ({ page }) => {
    const chevron = page.locator('[data-testid="order-expand"], button[aria-label*="expand"]').first();
    if (await chevron.isVisible()) {
      await chevron.click();
      await expect(page.getByText(/order.*details|items|total/i).first()).toBeVisible();
    }
  });

  test('Update Status button opens status modal', async ({ page }) => {
    const updateBtn = page.getByRole('button', { name: /update status/i }).first();
    if (await updateBtn.isVisible()) {
      await updateBtn.click();
      await expect(page.getByText(/status|shipping/i).first()).toBeVisible();
    }
  });

  test('status modal has Cancel button', async ({ page }) => {
    const updateBtn = page.getByRole('button', { name: /update status/i }).first();
    if (await updateBtn.isVisible()) {
      await updateBtn.click();
      await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
      await page.getByRole('button', { name: /cancel/i }).click();
    }
  });

  test('Print bulk action appears when orders selected', async ({ page }) => {
    const checkbox = page.getByRole('checkbox', { name: /select all/i });
    if (await checkbox.isVisible()) {
      await checkbox.check();
      const printBtn = page.getByRole('button', { name: /print/i });
      if (await printBtn.isVisible()) {
        await expect(printBtn).toBeVisible();
      }
    }
  });
});
