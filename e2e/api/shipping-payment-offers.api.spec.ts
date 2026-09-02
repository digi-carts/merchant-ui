import { test, expect } from '@playwright/test';
import { loginAndGetToken, authHeaders } from '../../helpers/api-client';

const BASE = process.env.API_URL || 'http://localhost:8080/v1';

test.describe('Shipping API', () => {
  let token: string;
  let storeId: string;

  test.beforeAll(async ({ request }) => {
    ({ token, storeId } = await loginAndGetToken(request));
  });

  test('GET /shipping/providers — returns provider list', async ({ request }) => {
    const res = await request.get(`${BASE}/shipping/providers`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data || body)).toBeTruthy();
  });

  test('GET /shipping/fallbacks — returns fallback pincode list', async ({ request }) => {
    const res = await request.get(`${BASE}/shipping/fallbacks`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('POST /shipping/config — saves shipping configuration', async ({ request }) => {
    const res = await request.post(`${BASE}/shipping/config`, {
      headers: authHeaders(token, storeId),
      data: { pickupPincode: '400001', defaultWeight: 500 },
    });
    expect([200, 201, 204]).toContain(res.status());
  });

  test('POST /shipping/fallbacks — adds a fallback pincode', async ({ request }) => {
    const res = await request.post(`${BASE}/shipping/fallbacks`, {
      headers: authHeaders(token, storeId),
      data: { pincode: '999999', charge: 50, label: 'E2E Test' },
    });
    expect([200, 201]).toContain(res.status());
  });

  test('GET /shipping/providers — unauthenticated returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/shipping/providers`);
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('Payment API', () => {
  let token: string;
  let storeId: string;

  test.beforeAll(async ({ request }) => {
    ({ token, storeId } = await loginAndGetToken(request));
  });

  test('GET /payment/store-config — returns payment config', async ({ request }) => {
    const res = await request.get(`${BASE}/payment/store-config`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('PUT /payment/store-config — unauthenticated returns 401', async ({ request }) => {
    const res = await request.put(`${BASE}/payment/store-config`, {
      data: { keyId: 'test', keySecret: 'test' },
    });
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('Offers / Discounts API', () => {
  let token: string;
  let storeId: string;
  let createdOfferId: string;

  test.beforeAll(async ({ request }) => {
    ({ token, storeId } = await loginAndGetToken(request));
  });

  test('GET /offers/store — returns discount list', async ({ request }) => {
    const res = await request.get(`${BASE}/offers/store`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('POST /offers/store — creates a discount', async ({ request }) => {
    const code = `E2E${Date.now()}`;
    const res = await request.post(`${BASE}/offers/store`, {
      headers: authHeaders(token, storeId),
      data: {
        code,
        type: 'PERCENT',
        value: 10,
        minOrder: 0,
        maxUses: 100,
        scope: 'CART',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    createdOfferId = body.id || body.data?.id;
  });

  test('PATCH /offers/store/:id — toggles offer active state', async ({ request }) => {
    test.skip(!createdOfferId, 'requires created offer');
    const res = await request.patch(`${BASE}/offers/store/${createdOfferId}`, {
      headers: authHeaders(token, storeId),
      data: { active: false },
    });
    expect([200, 204]).toContain(res.status());
  });

  test('DELETE /offers/store/:id — deletes the offer', async ({ request }) => {
    test.skip(!createdOfferId, 'requires created offer');
    const res = await request.delete(`${BASE}/offers/store/${createdOfferId}`, {
      headers: authHeaders(token, storeId),
    });
    expect([200, 204]).toContain(res.status());
  });

  test('POST /offers/validate — validates a coupon code', async ({ request }) => {
    const res = await request.post(`${BASE}/offers/validate`, {
      headers: authHeaders(token, storeId),
      data: { code: 'NONEXISTENT', orderTotal: 100, scope: 'CART' },
    });
    expect([200, 400, 404]).toContain(res.status());
  });
});
