import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate as merchant', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.TEST_EMAIL || 'test@merchant.com');
  await page.getByLabel('Password').fill(process.env.TEST_PASSWORD || 'Test@1234');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/(dashboard|setup)/, { timeout: 15000 });
  await page.context().storageState({ path: authFile });
});
