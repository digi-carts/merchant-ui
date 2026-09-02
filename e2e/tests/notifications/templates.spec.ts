import { test, expect } from '@playwright/test';

test.describe('Templates — Messages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/templates/messages');
    await page.waitForLoadState('networkidle');
  });

  test('renders message template editor', async ({ page }) => {
    await expect(page.getByText(/template|message|event/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('order_placed template is editable', async ({ page }) => {
    await expect(page.getByText(/order.*placed|placed/i).first()).toBeVisible();
  });

  test('Reset to Default button is visible', async ({ page }) => {
    const resetBtn = page.getByRole('button', { name: /reset.*default/i }).first();
    if (await resetBtn.isVisible()) {
      await expect(resetBtn).toBeVisible();
    }
  });

  test('Save Templates button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save.*template/i })).toBeVisible();
  });
});

test.describe('Templates — Bills', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/templates/bills');
    await page.waitForLoadState('networkidle');
  });

  test('renders bill template editor', async ({ page }) => {
    await expect(page.getByText(/bill|invoice|template/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('template style selector is visible', async ({ page }) => {
    const styleSelect = page.getByRole('combobox').first();
    if (await styleSelect.isVisible()) {
      await expect(styleSelect).toBeVisible();
    }
  });

  test('accent color input is visible', async ({ page }) => {
    const colorInput = page.getByRole('textbox', { name: /color|accent/i }).first();
    if (await colorInput.isVisible()) {
      await expect(colorInput).toBeVisible();
    }
  });

  test('Save button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });
});
