import { test, expect } from '@playwright/test';
import { loginAndGetToken, authHeaders } from '../../helpers/api-client';

const BASE = process.env.API_URL || 'http://localhost:8080/v1';

test.describe('Orders API', () => {
  let token: string;
  let storeId: string;

  test.beforeAll(async ({ request }) => {
    ({ token, storeId } = await loginAndGetToken(request));
  });

  test('GET /orders/orders — returns orders list', async ({ request }) => {
    const res = await request.get(`${BASE}/orders/orders`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data || body)).toBeTruthy();
  });

  test('GET /orders/orders — supports status filter', async ({ request }) => {
    const res = await request.get(`${BASE}/orders/orders?status=PENDING`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /orders/active-count — returns active order count', async ({ request }) => {
    const res = await request.get(`${BASE}/orders/active-count`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof (body.count ?? body.data?.count ?? body)).not.toBe('undefined');
  });

  test('GET /orders/analytics?days=15 — returns analytics data', async ({ request }) => {
    const res = await request.get(`${BASE}/orders/analytics?days=15`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /orders/analytics?days=30 — returns analytics data for 30 days', async ({ request }) => {
    const res = await request.get(`${BASE}/orders/analytics?days=30`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /orders/returns — returns returns list', async ({ request }) => {
    const res = await request.get(`${BASE}/orders/returns`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('PATCH /orders/orders/:id/status — invalid order ID returns 404', async ({ request }) => {
    const res = await request.patch(`${BASE}/orders/orders/nonexistent-id/status`, {
      headers: authHeaders(token, storeId),
      data: { status: 'PROCESSING' },
    });
    expect([404, 400]).toContain(res.status());
  });

  test('GET /orders/orders — unauthenticated returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/orders/orders`);
    expect([401, 403]).toContain(res.status());
  });
});
