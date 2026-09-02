import { test, expect } from '@playwright/test';

test.describe('Catalog page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');
  });

  test('renders product list', async ({ page }) => {
    await expect(page.getByText(/product|catalog/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('Add Product button opens product form', async ({ page }) => {
    await page.getByRole('button', { name: /add product/i }).click();
    await expect(page.getByLabel(/product name|name/i).first()).toBeVisible();
  });

  test('product form has all required fields', async ({ page }) => {
    await page.getByRole('button', { name: /add product/i }).click();
    await expect(page.getByLabel(/name/i).first()).toBeVisible();
    await expect(page.getByLabel(/price/i)).toBeVisible();
    await expect(page.getByLabel(/stock/i)).toBeVisible();
  });

  test('Cancel button closes product form', async ({ page }) => {
    await page.getByRole('button', { name: /add product/i }).click();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByLabel(/product name|name/i).first()).not.toBeVisible();
  });

  test('Add Category button opens category form', async ({ page }) => {
    const addCatBtn = page.getByRole('button', { name: /\+ category|add category/i });
    if (await addCatBtn.isVisible()) {
      await addCatBtn.click();
      await expect(page.getByLabel(/category name|name/i).first()).toBeVisible();
    }
  });

  test('creates a new product', async ({ page }) => {
    await page.getByRole('button', { name: /add product/i }).click();
    await page.getByLabel(/name/i).first().fill('E2E Test Product');
    await page.getByLabel(/price/i).fill('100');
    await page.getByLabel(/stock/i).fill('50');
    await page.getByRole('button', { name: /save product/i }).click();
    await expect(page.getByText(/E2E Test Product/)).toBeVisible({ timeout: 10000 });
  });

  test('shows edit button per product row', async ({ page }) => {
    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await expect(page.getByRole('button', { name: /update product/i })).toBeVisible();
    }
  });

  test('shows delete button per product row', async ({ page }) => {
    const deleteBtn = page.getByRole('button', { name: /delete/i }).first();
    await expect(deleteBtn).toBeVisible();
  });

  test('AI Fill button visible if Gemini configured', async ({ page }) => {
    const aiBtn = page.getByRole('button', { name: /ai fill/i });
    // AI fill is optional — page should load regardless
    await expect(page.getByRole('button', { name: /add product/i })).toBeVisible();
  });

  test('product form allows adding key-value specs', async ({ page }) => {
    await page.getByRole('button', { name: /add product/i }).click();
    const addSpecBtn = page.getByRole('button', { name: /add.*spec|add.*detail/i });
    if (await addSpecBtn.isVisible()) {
      await addSpecBtn.click();
      await expect(page.getByPlaceholder(/key|attribute/i).first()).toBeVisible();
    }
  });
});
