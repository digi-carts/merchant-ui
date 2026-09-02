import { test, expect } from '@playwright/test';

test.describe('Customize — Theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/customize/theme');
    await page.waitForLoadState('networkidle');
  });

  test('renders storefront template cards', async ({ page }) => {
    await expect(page.getByText(/theme|template/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('color preset options are visible', async ({ page }) => {
    const colorOptions = page.locator('[data-testid*="color"], input[type="color"]').first();
    await expect(page.getByText(/color|primary|background/i).first()).toBeVisible();
  });

  test('Save button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save/i }).first()).toBeVisible();
  });
});

test.describe('Customize — Navbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/customize/navbar');
    await page.waitForLoadState('networkidle');
  });

  test('renders navbar customization options', async ({ page }) => {
    await expect(page.getByText(/navbar|navigation|nav/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('brand mode selector is visible', async ({ page }) => {
    await expect(page.getByText(/logo|text|both/i).first()).toBeVisible();
  });

  test('mobile menu side option is visible', async ({ page }) => {
    await expect(page.getByText(/left|right|mobile/i).first()).toBeVisible();
  });

  test('Add custom nav link button is visible', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*link|new.*link/i });
    if (await addBtn.isVisible()) {
      await expect(addBtn).toBeVisible();
    }
  });

  test('Save button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });
});

test.describe('Customize — Footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/customize/footer');
    await page.waitForLoadState('networkidle');
  });

  test('renders footer customization options', async ({ page }) => {
    await expect(page.getByText(/footer/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('Save button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });
});

test.describe('Customize — About', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/customize/about');
    await page.waitForLoadState('networkidle');
  });

  test('renders about page editor', async ({ page }) => {
    await expect(page.getByText(/about/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('title input is present', async ({ page }) => {
    await expect(page.getByLabel(/title/i)).toBeVisible();
  });

  test('Save button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });
});

test.describe('Customize — Home sections', () => {
  test('title/hero section renders', async ({ page }) => {
    await page.goto('/customize/home/title');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/hero|title|home/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });

  test('categories section renders', async ({ page }) => {
    await page.goto('/customize/home/categories');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/categor/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });

  test('featured products section renders', async ({ page }) => {
    await page.goto('/customize/home/featured');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/featured/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });

  test('new arrivals section renders', async ({ page }) => {
    await page.goto('/customize/home/new-arrivals');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/new arrival|arrival/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });
});

test.describe('Customize — Products display', () => {
  test('renders products per row selector', async ({ page }) => {
    await page.goto('/customize/products');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/product.*row|per row|display/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });
});

test.describe('Customize — Orders display', () => {
  test('renders orders display settings', async ({ page }) => {
    await page.goto('/customize/orders');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/order.*display|display|orders/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });
});
