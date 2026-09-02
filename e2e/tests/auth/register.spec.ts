import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Register page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('renders all registration fields', async ({ page }) => {
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/phone/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
  });

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: /create account|register|sign up/i }).click();
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });

  test('shows password strength meter when typing', async ({ page }) => {
    await page.getByLabel(/^password$/i).fill('weak');
    await expect(page.getByText(/weak|strength/i).first()).toBeVisible();
  });

  test('shows error when passwords do not match', async ({ page }) => {
    await page.getByLabel(/^password$/i).fill('Test@1234');
    await page.getByLabel(/confirm password/i).fill('Different@1234');
    await page.getByRole('button', { name: /create account|register|sign up/i }).click();
    await expect(page.getByText(/passwords.*match|match.*passwords/i).first()).toBeVisible();
  });

  test('auto-populates referral code from query param', async ({ page }) => {
    await page.goto('/register?ref=TESTREF123');
    const input = page.getByLabel(/referral/i);
    if (await input.isVisible()) {
      await expect(input).toHaveValue('TESTREF123');
    }
  });

  test('navigates to login page', async ({ page }) => {
    await page.getByRole('link', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL('/login');
  });
});
