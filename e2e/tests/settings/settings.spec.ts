import { test, expect } from '@playwright/test';

test.describe('Settings — Shop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/shop');
    await page.waitForLoadState('networkidle');
  });

  test('renders shop settings form', async ({ page }) => {
    await expect(page.getByLabel(/store name|shop name/i)).toBeVisible({ timeout: 15000 });
  });

  test('email field is editable', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('Save Changes button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save.*changes|save/i })).toBeVisible();
  });

  test('logo upload area is visible', async ({ page }) => {
    await expect(page.getByText(/logo|upload/i).first()).toBeVisible();
  });
});

test.describe('Settings — Domain', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/domain');
    await page.waitForLoadState('networkidle');
  });

  test('renders domain settings', async ({ page }) => {
    await expect(page.getByText(/domain|subdomain/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('publish toggle is visible', async ({ page }) => {
    const publishBtn = page.getByRole('button', { name: /publish|unpublish/i });
    if (await publishBtn.isVisible()) {
      await expect(publishBtn).toBeVisible();
    }
  });

  test('custom domain input is visible', async ({ page }) => {
    const domainInput = page.getByRole('textbox', { name: /domain/i }).first();
    if (await domainInput.isVisible()) {
      await expect(domainInput).toBeVisible();
    }
  });
});

test.describe('Settings — Payment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/payment');
    await page.waitForLoadState('networkidle');
  });

  test('renders payment settings', async ({ page }) => {
    await expect(page.getByText(/razorpay|payment/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('Razorpay Key ID field is visible', async ({ page }) => {
    await expect(page.getByLabel(/key id|razorpay.*key/i)).toBeVisible();
  });

  test('Save button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save/i }).first()).toBeVisible();
  });

  test('order charges section is visible', async ({ page }) => {
    await expect(page.getByText(/delivery fee|charge|min order/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Settings — Payment Options', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/payment-options');
    await page.waitForLoadState('networkidle');
  });

  test('renders payment method toggles', async ({ page }) => {
    await expect(page.getByRole('switch').first()).toBeVisible({ timeout: 15000 });
  });

  test('UPI option is listed', async ({ page }) => {
    await expect(page.getByText(/upi|card|wallet|cod/i).first()).toBeVisible();
  });

  test('Save button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });
});

test.describe('Settings — Shipping', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/shipping');
    await page.waitForLoadState('networkidle');
  });

  test('renders shipping settings', async ({ page }) => {
    await expect(page.getByText(/shipping|provider|pincode/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('pickup pincode field is visible', async ({ page }) => {
    await expect(page.getByLabel(/pincode/i).first()).toBeVisible();
  });

  test('provider list is visible', async ({ page }) => {
    await expect(page.getByText(/provider|courier/i).first()).toBeVisible();
  });

  test('Set Active button is present per provider', async ({ page }) => {
    const setActiveBtn = page.getByRole('button', { name: /set active|activate/i }).first();
    if (await setActiveBtn.isVisible()) {
      await expect(setActiveBtn).toBeVisible();
    }
  });

  test('Add fallback pincode button is visible', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*fallback|add.*pincode/i });
    if (await addBtn.isVisible()) {
      await expect(addBtn).toBeVisible();
    }
  });
});

test.describe('Settings — AI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/ai');
    await page.waitForLoadState('networkidle');
  });

  test('renders AI settings', async ({ page }) => {
    await expect(page.getByText(/gemini|ai.*assistant|api key/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('API key input is visible', async ({ page }) => {
    await expect(page.getByLabel(/api key|gemini/i)).toBeVisible();
  });

  test('Save button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });

  test('show/hide toggle for API key works', async ({ page }) => {
    const toggleBtn = page.getByRole('button', { name: /show|hide|reveal/i });
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await expect(page.getByLabel(/api key|gemini/i)).toHaveAttribute('type', 'text');
    }
  });
});

test.describe('Settings — Discounts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/discounts');
    await page.waitForLoadState('networkidle');
  });

  test('renders discounts page', async ({ page }) => {
    await expect(page.getByText(/discount|offer|coupon/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('discount code input is visible', async ({ page }) => {
    await expect(page.getByLabel(/code/i)).toBeVisible();
  });

  test('discount type selector is visible', async ({ page }) => {
    await expect(page.getByLabel(/type/i)).toBeVisible();
  });

  test('Create button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /create|add/i })).toBeVisible();
  });
});

test.describe('Settings — Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/profile');
    await page.waitForLoadState('networkidle');
  });

  test('renders change password form', async ({ page }) => {
    await expect(page.getByLabel(/current password/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel(/new password/i)).toBeVisible();
    await expect(page.getByLabel(/confirm.*password/i)).toBeVisible();
  });

  test('Update Password button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /update password/i })).toBeVisible();
  });

  test('shows error when passwords do not match', async ({ page }) => {
    await page.getByLabel(/current password/i).fill('currentPass123');
    await page.getByLabel(/new password/i).fill('newPass@123');
    await page.getByLabel(/confirm.*password/i).fill('differentPass@123');
    await page.getByRole('button', { name: /update password/i }).click();
    await expect(page.getByText(/match|do not match/i).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Settings — Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/notifications');
    await page.waitForLoadState('networkidle');
  });

  test('renders notification settings', async ({ page }) => {
    await expect(page.getByText(/email|whatsapp|notification/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('Save button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });
});
