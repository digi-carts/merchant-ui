import { test, expect } from '@playwright/test';
import { loginAndGetToken, authHeaders } from '../../helpers/api-client';

const BASE = process.env.API_URL || 'http://localhost:8080/v1';

test.describe('Pages (CMS) API', () => {
  let token: string;
  let storeId: string;
  let createdPageId: string;

  test.beforeAll(async ({ request }) => {
    ({ token, storeId } = await loginAndGetToken(request));
  });

  test('GET /pages — returns pages list', async ({ request }) => {
    const res = await request.get(`${BASE}/pages`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('POST /pages — creates a new page', async ({ request }) => {
    const res = await request.post(`${BASE}/pages`, {
      headers: authHeaders(token, storeId),
      data: {
        title: 'E2E Test Page',
        slug: `e2e-test-${Date.now()}`,
        content: '# E2E Test\nThis is a test page.',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    createdPageId = body.id || body.data?.id;
  });

  test('GET /pages/:id — returns page by id', async ({ request }) => {
    test.skip(!createdPageId, 'requires created page');
    const res = await request.get(`${BASE}/pages/${createdPageId}`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('PUT /pages/:id — updates the page', async ({ request }) => {
    test.skip(!createdPageId, 'requires created page');
    const res = await request.put(`${BASE}/pages/${createdPageId}`, {
      headers: authHeaders(token, storeId),
      data: { title: 'E2E Updated Page', content: 'Updated content.' },
    });
    expect([200, 204]).toContain(res.status());
  });

  test('DELETE /pages/:id — deletes the page', async ({ request }) => {
    test.skip(!createdPageId, 'requires created page');
    const res = await request.delete(`${BASE}/pages/${createdPageId}`, {
      headers: authHeaders(token, storeId),
    });
    expect([200, 204]).toContain(res.status());
  });

  test('GET /pages — unauthenticated returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/pages`);
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('Platform / Subscription API', () => {
  let token: string;
  let storeId: string;

  test.beforeAll(async ({ request }) => {
    ({ token, storeId } = await loginAndGetToken(request));
  });

  test('GET /platform/subscriptions — returns subscription plans', async ({ request }) => {
    const res = await request.get(`${BASE}/platform/subscriptions`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /platform/business-levels — returns business levels', async ({ request }) => {
    const res = await request.get(`${BASE}/platform/business-levels`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /platform/subscription-status — returns subscription status', async ({ request }) => {
    const res = await request.get(`${BASE}/platform/subscription-status`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /platform/manage/my-usage — returns usage info', async ({ request }) => {
    const res = await request.get(`${BASE}/platform/manage/my-usage`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /platform/templates — returns storefront templates', async ({ request }) => {
    const res = await request.get(`${BASE}/platform/templates`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /platform/support — returns support tickets', async ({ request }) => {
    const res = await request.get(`${BASE}/platform/support`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('POST /platform/support — creates a support ticket', async ({ request }) => {
    const res = await request.post(`${BASE}/platform/support`, {
      headers: authHeaders(token, storeId),
      data: {
        type: 'general',
        description: 'E2E test ticket — please ignore',
      },
    });
    expect([200, 201]).toContain(res.status());
  });

  test('GET /subscription/status — returns subscription cache', async ({ request }) => {
    const res = await request.get(`${BASE}/subscription/status`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });
});
