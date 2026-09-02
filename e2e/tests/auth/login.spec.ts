import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders login form', async ({ page }) => {
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/email.*required|required/i).first()).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('wrong@test.com');
    await page.getByLabel('Password').fill('wrongpass');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid|incorrect|unauthorized/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('navigates to forgot password page', async ({ page }) => {
    await page.getByRole('link', { name: /forgot password/i }).click();
    await expect(page).toHaveURL('/forgot-password');
  });

  test('navigates to register page', async ({ page }) => {
    await page.getByRole('link', { name: /create account|register|sign up/i }).click();
    await expect(page).toHaveURL('/register');
  });

  test('successful login redirects to dashboard or setup', async ({ page }) => {
    await page.getByLabel('Email').fill(process.env.TEST_EMAIL || 'test@merchant.com');
    await page.getByLabel('Password').fill(process.env.TEST_PASSWORD || 'Test@1234');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|setup)/, { timeout: 15000 });
  });
});
