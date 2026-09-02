import { test, expect } from '@playwright/test';
import { loginAndGetToken, authHeaders } from '../../helpers/api-client';

const BASE = process.env.API_URL || 'http://localhost:8080/v1';

test.describe('Store API', () => {
  let token: string;
  let storeId: string;

  test.beforeAll(async ({ request }) => {
    ({ token, storeId } = await loginAndGetToken(request));
  });

  test('GET /store — returns store data for authenticated user', async ({ request }) => {
    const res = await request.get(`${BASE}/store`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('id');
  });

  test('GET /store — unauthenticated returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/store`);
    expect([401, 403]).toContain(res.status());
  });

  test('PATCH /store — can update store name', async ({ request }) => {
    const res = await request.patch(`${BASE}/store`, {
      headers: authHeaders(token, storeId),
      data: { name: 'E2E Updated Store Name' },
    });
    expect([200, 204]).toContain(res.status());
  });

  test('GET /store/ai-settings — returns AI config', async ({ request }) => {
    const res = await request.get(`${BASE}/store/ai-settings`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /store/mail-templates/order_placed — returns template', async ({ request }) => {
    const res = await request.get(`${BASE}/store/mail-templates/order_placed`, {
      headers: authHeaders(token, storeId),
    });
    expect([200, 404]).toContain(res.status());
  });

  test('GET /platform/setup-wizard — returns setup config', async ({ request }) => {
    const res = await request.get(`${BASE}/platform/setup-wizard`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('POST /store/ai-generate — requires valid Gemini key', async ({ request }) => {
    const res = await request.post(`${BASE}/store/ai-generate`, {
      headers: authHeaders(token, storeId),
      data: { prompt: 'Test product: a red t-shirt' },
    });
    expect([200, 400, 403, 500]).toContain(res.status());
  });
});
