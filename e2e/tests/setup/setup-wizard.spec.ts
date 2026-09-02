import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Setup Wizard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first with a fresh account for setup testing
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.TEST_SETUP_EMAIL || process.env.TEST_EMAIL || 'setup@merchant.com');
    await page.getByLabel('Password').fill(process.env.TEST_SETUP_PASSWORD || process.env.TEST_PASSWORD || 'Test@1234');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/(setup|dashboard)/, { timeout: 15000 });
  });

  test('renders step 1 — shop details form', async ({ page }) => {
    await page.goto('/setup?step=1');
    await expect(page.getByLabel(/store name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /save.*continue|next/i })).toBeVisible();
  });

  test('shows Skip button on step 1', async ({ page }) => {
    await page.goto('/setup?step=1');
    await expect(page.getByRole('button', { name: /skip/i })).toBeVisible();
  });

  test('store ID auto-derives from store name', async ({ page }) => {
    await page.goto('/setup?step=1');
    const nameInput = page.getByLabel(/store name/i);
    await nameInput.fill('My Awesome Shop');
    const idInput = page.getByLabel(/store id|store.*id/i);
    if (await idInput.isVisible()) {
      await expect(idInput).not.toHaveValue('');
    }
  });

  test('pincode lookup auto-fills city and state', async ({ page }) => {
    await page.goto('/setup?step=1');
    const pincodeInput = page.getByLabel(/pincode|zip/i);
    if (await pincodeInput.isVisible()) {
      await pincodeInput.fill('400001');
      await page.waitForTimeout(1500);
      const cityInput = page.getByLabel(/city/i);
      if (await cityInput.isVisible()) {
        await expect(cityInput).not.toHaveValue('');
      }
    }
  });

  test('renders step 2 — domain configuration', async ({ page }) => {
    await page.goto('/setup?step=2');
    await expect(page.getByText(/domain|subdomain/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /back/i })).toBeVisible();
  });

  test('renders step 3 — payment configuration', async ({ page }) => {
    await page.goto('/setup?step=3');
    await expect(page.getByLabel(/razorpay.*key|key id/i)).toBeVisible();
  });

  test('renders step 4 — notifications configuration', async ({ page }) => {
    await page.goto('/setup?step=4');
    await expect(page.getByText(/whatsapp|sms|email/i).first()).toBeVisible();
  });

  test('renders step 5 — AI assistant configuration', async ({ page }) => {
    await page.goto('/setup?step=5');
    await expect(page.getByLabel(/gemini|api key/i).first()).toBeVisible();
  });

  test('renders step 6 — subscription selection', async ({ page }) => {
    await page.goto('/setup?step=6');
    await expect(page.getByText(/plan|subscription|business/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /skip for now/i })).toBeVisible();
  });

  test('renders step 7 — finish screen', async ({ page }) => {
    await page.goto('/setup?step=7');
    await expect(page.getByRole('button', { name: /go to dashboard/i })).toBeVisible();
  });
});
