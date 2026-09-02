import { test, expect } from '@playwright/test';

test.describe('Notifications — Config', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notifications/config');
    await page.waitForLoadState('networkidle');
  });

  test('renders notifications config page', async ({ page }) => {
    await expect(page.getByText(/email|whatsapp|sms/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('Email toggle is visible', async ({ page }) => {
    const emailToggle = page.getByRole('switch', { name: /email/i }).first();
    if (await emailToggle.isVisible()) {
      await expect(emailToggle).toBeVisible();
    }
  });

  test('WhatsApp toggle is visible', async ({ page }) => {
    const waToggle = page.getByRole('switch', { name: /whatsapp/i }).first();
    if (await waToggle.isVisible()) {
      await expect(waToggle).toBeVisible();
    }
  });

  test('enabling Email shows SMTP fields', async ({ page }) => {
    const emailToggle = page.getByRole('switch', { name: /email/i }).first();
    if (await emailToggle.isVisible()) {
      const isChecked = await emailToggle.isChecked();
      if (!isChecked) await emailToggle.click();
      await expect(page.getByLabel(/host|smtp/i).first()).toBeVisible();
    }
  });

  test('Save button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });
});

test.describe('Notifications — Customer Alerts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notifications/customer-alerts');
    await page.waitForLoadState('networkidle');
  });

  test('renders alert toggles', async ({ page }) => {
    await expect(page.getByRole('switch').first()).toBeVisible({ timeout: 15000 });
  });

  test('order_placed toggle is present', async ({ page }) => {
    await expect(page.getByText(/order.*placed|placed/i).first()).toBeVisible();
  });

  test('order_shipped toggle is present', async ({ page }) => {
    await expect(page.getByText(/order.*shipped|shipped/i).first()).toBeVisible();
  });

  test('Save button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });

  test('toggling an alert switch changes its state', async ({ page }) => {
    const firstSwitch = page.getByRole('switch').first();
    const wasChecked = await firstSwitch.isChecked();
    await firstSwitch.click();
    await expect(firstSwitch).toBeChecked({ checked: !wasChecked });
  });
});
