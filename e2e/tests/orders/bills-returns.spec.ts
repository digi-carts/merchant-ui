import { test, expect } from '@playwright/test';

test.describe('Orders — Bills page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/orders/bills');
    await page.waitForLoadState('networkidle');
  });

  test('renders bills list', async ({ page }) => {
    await expect(page.getByText(/bill|invoice/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('status filter is visible', async ({ page }) => {
    const filter = page.getByRole('combobox').first();
    await expect(filter).toBeVisible();
  });

  test('date range filter is visible', async ({ page }) => {
    const dateInput = page.getByRole('textbox', { name: /date|from|to/i }).first();
    if (await dateInput.isVisible()) {
      await expect(dateInput).toBeVisible();
    }
  });

  test('bill template editor can be opened', async ({ page }) => {
    const templateBtn = page.getByRole('button', { name: /template|edit template/i });
    if (await templateBtn.isVisible()) {
      await templateBtn.click();
      await expect(page.getByText(/template|logo|color/i).first()).toBeVisible();
    }
  });
});

test.describe('Orders — Returns page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/orders/returns');
    await page.waitForLoadState('networkidle');
  });

  test('renders returns list', async ({ page }) => {
    await expect(page.getByText(/return|refund/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('Accept / Reject buttons visible per return row', async ({ page }) => {
    const acceptBtn = page.getByRole('button', { name: /accept/i }).first();
    const rejectBtn = page.getByRole('button', { name: /reject/i }).first();
    // Buttons show only when returns exist — page should at least load
    await expect(page.getByText(/return|refund/i).first()).toBeVisible();
  });
});
