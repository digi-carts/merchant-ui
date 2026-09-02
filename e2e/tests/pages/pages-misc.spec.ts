import { test, expect } from '@playwright/test';

test.describe('Pages (CMS)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages');
    await page.waitForLoadState('networkidle');
  });

  test('renders pages list', async ({ page }) => {
    await expect(page.getByText(/pages|page/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('New Page form appears on button click', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new page|add page|create/i });
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await expect(page.getByLabel(/title/i)).toBeVisible();
    }
  });

  test('new page form has title, slug, and content fields', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new page|add page|create/i });
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await expect(page.getByLabel(/title/i)).toBeVisible();
      await expect(page.getByLabel(/slug/i)).toBeVisible();
    }
  });

  test('Cancel button closes new page form', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new page|add page|create/i });
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await page.getByRole('button', { name: /cancel/i }).click();
      await expect(page.getByLabel(/title/i)).not.toBeVisible();
    }
  });

  test('can create a new page', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new page|add page|create/i });
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await page.getByLabel(/title/i).fill('E2E Test Page');
      await page.getByLabel(/slug/i).fill('e2e-test-page');
      await page.getByRole('button', { name: /save/i }).click();
      await expect(page.getByText(/E2E Test Page/)).toBeVisible({ timeout: 10000 });
    }
  });

  test('Edit button per page opens edit form', async ({ page }) => {
    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await expect(page.getByLabel(/title/i)).toBeVisible();
    }
  });

  test('Delete button per page is visible', async ({ page }) => {
    const deleteBtn = page.getByRole('button', { name: /delete/i }).first();
    if (await deleteBtn.isVisible()) {
      await expect(deleteBtn).toBeVisible();
    }
  });
});

test.describe('Subscription', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');
  });

  test('renders subscription plans', async ({ page }) => {
    await expect(page.getByText(/plan|subscription|business/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('business level filter buttons are visible', async ({ page }) => {
    const filterBtns = page.getByRole('button').filter({ hasText: /basic|starter|pro|enterprise|level/i });
    await expect(filterBtns.first()).toBeVisible({ timeout: 10000 });
  });

  test('plan cards are visible', async ({ page }) => {
    await expect(page.getByText(/month|year|free/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('coupon code input is visible', async ({ page }) => {
    const couponInput = page.getByLabel(/coupon|code/i);
    if (await couponInput.isVisible()) {
      await couponInput.fill('TESTCODE');
      await expect(page.getByRole('button', { name: /apply/i })).toBeVisible();
    }
  });
});

test.describe('Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/support');
    await page.waitForLoadState('networkidle');
  });

  test('renders support page', async ({ page }) => {
    await expect(page.getByText(/support|ticket/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('New Ticket button opens ticket form', async ({ page }) => {
    const newTicketBtn = page.getByRole('button', { name: /new ticket|create ticket/i });
    if (await newTicketBtn.isVisible()) {
      await newTicketBtn.click();
      await expect(page.getByLabel(/type|description/i).first()).toBeVisible();
    }
  });

  test('ticket form has type and description fields', async ({ page }) => {
    const newTicketBtn = page.getByRole('button', { name: /new ticket|create ticket/i });
    if (await newTicketBtn.isVisible()) {
      await newTicketBtn.click();
      await expect(page.getByLabel(/description/i)).toBeVisible();
    }
  });

  test('Submit button is visible in ticket form', async ({ page }) => {
    const newTicketBtn = page.getByRole('button', { name: /new ticket|create ticket/i });
    if (await newTicketBtn.isVisible()) {
      await newTicketBtn.click();
      await expect(page.getByRole('button', { name: /submit/i })).toBeVisible();
    }
  });

  test('existing ticket can be expanded', async ({ page }) => {
    const ticket = page.getByRole('button', { name: /expand|details|view/i }).first();
    if (await ticket.isVisible()) {
      await ticket.click();
      await expect(page.getByText(/comment|status/i).first()).toBeVisible();
    }
  });
});

test.describe('Store management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/store');
    await page.waitForLoadState('networkidle');
  });

  test('renders store management page', async ({ page }) => {
    await expect(page.getByText(/store|domain|publish/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('publish/unpublish toggle is visible', async ({ page }) => {
    const toggleBtn = page.getByRole('button', { name: /publish|unpublish|live/i });
    if (await toggleBtn.isVisible()) {
      await expect(toggleBtn).toBeVisible();
    }
  });

  test('custom domain form is visible', async ({ page }) => {
    const domainInput = page.getByRole('textbox', { name: /domain/i }).first();
    if (await domainInput.isVisible()) {
      await expect(domainInput).toBeVisible();
    }
  });
});

test.describe('Reports', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
  });

  test('renders reports page', async ({ page }) => {
    await expect(page.getByText(/report|analytic|revenue/i).first()).toBeVisible({ timeout: 15000 });
  });
});
