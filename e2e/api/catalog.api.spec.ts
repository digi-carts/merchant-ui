import { test, expect } from '@playwright/test';
import { loginAndGetToken, authHeaders } from '../../helpers/api-client';

const BASE = process.env.API_URL || 'http://localhost:8080/v1';

test.describe('Catalog API', () => {
  let token: string;
  let storeId: string;
  let createdProductId: string;
  let createdCategoryId: string;

  test.beforeAll(async ({ request }) => {
    ({ token, storeId } = await loginAndGetToken(request));
  });

  test('GET /catalog/products — returns product list', async ({ request }) => {
    const res = await request.get(`${BASE}/catalog/products`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data || body)).toBeTruthy();
  });

  test('GET /catalog/categories — returns category list', async ({ request }) => {
    const res = await request.get(`${BASE}/catalog/categories`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('POST /catalog/categories — creates a category', async ({ request }) => {
    const res = await request.post(`${BASE}/catalog/categories`, {
      headers: authHeaders(token, storeId),
      data: { name: 'E2E Test Category' },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    createdCategoryId = body.id || body.data?.id;
  });

  test('POST /catalog/products — creates a product', async ({ request }) => {
    const res = await request.post(`${BASE}/catalog/products`, {
      headers: authHeaders(token, storeId),
      data: {
        name: 'E2E Test Product',
        price: 100,
        stock: 50,
        description: 'Created by E2E test',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    createdProductId = body.id || body.data?.id;
  });

  test('PATCH /catalog/products/:id — updates the product', async ({ request }) => {
    test.skip(!createdProductId, 'requires created product');
    const res = await request.patch(`${BASE}/catalog/products/${createdProductId}`, {
      headers: authHeaders(token, storeId),
      data: { name: 'E2E Updated Product', price: 150 },
    });
    expect([200, 204]).toContain(res.status());
  });

  test('GET /catalog/products/stock-summary — returns stock summary', async ({ request }) => {
    const res = await request.get(`${BASE}/catalog/products/stock-summary`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('DELETE /catalog/products/:id — deletes the product', async ({ request }) => {
    test.skip(!createdProductId, 'requires created product');
    const res = await request.delete(`${BASE}/catalog/products/${createdProductId}`, {
      headers: authHeaders(token, storeId),
    });
    expect([200, 204]).toContain(res.status());
  });

  test('DELETE /catalog/categories/:id — deletes the category', async ({ request }) => {
    test.skip(!createdCategoryId, 'requires created category');
    const res = await request.delete(`${BASE}/catalog/categories/${createdCategoryId}`, {
      headers: authHeaders(token, storeId),
    });
    expect([200, 204]).toContain(res.status());
  });

  test('GET /catalog/products — unauthenticated returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/catalog/products`);
    expect([401, 403]).toContain(res.status());
  });
});
