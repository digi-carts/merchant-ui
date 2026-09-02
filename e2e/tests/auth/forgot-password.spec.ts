import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Forgot Password page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
  });

  test('renders step 1 — email input', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send.*code|reset/i })).toBeVisible();
  });

  test('shows validation on empty email submit', async ({ page }) => {
    await page.getByRole('button', { name: /send.*code|reset/i }).click();
    await expect(page.getByText(/required|valid email/i).first()).toBeVisible();
  });

  test('shows error for unknown email', async ({ page }) => {
    await page.getByLabel(/email/i).fill('nobody@nowhere.invalid');
    await page.getByRole('button', { name: /send.*code|reset/i }).click();
    await expect(page.getByText(/not found|invalid|error/i).first()).toBeVisible({ timeout: 10000 });
  });
});
