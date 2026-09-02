import { test, expect } from '@playwright/test';
import { loginAndGetToken, authHeaders } from '../../helpers/api-client';

const BASE = process.env.API_URL || 'http://localhost:8080/v1';

test.describe('Notifications API', () => {
  let token: string;
  let storeId: string;

  test.beforeAll(async ({ request }) => {
    ({ token, storeId } = await loginAndGetToken(request));
  });

  test('GET /notifications/config — returns notification config', async ({ request }) => {
    const res = await request.get(`${BASE}/notifications/config`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /notifications/alert-config — returns alert configuration', async ({ request }) => {
    const res = await request.get(`${BASE}/notifications/alert-config`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('PUT /notifications/config — updates notification config', async ({ request }) => {
    const getRes = await request.get(`${BASE}/notifications/config`, {
      headers: authHeaders(token, storeId),
    });
    const current = await getRes.json();
    const res = await request.put(`${BASE}/notifications/config`, {
      headers: authHeaders(token, storeId),
      data: current.data || current,
    });
    expect([200, 204]).toContain(res.status());
  });

  test('PUT /notifications/alert-config — updates alert config', async ({ request }) => {
    const getRes = await request.get(`${BASE}/notifications/alert-config`, {
      headers: authHeaders(token, storeId),
    });
    const current = await getRes.json();
    const res = await request.put(`${BASE}/notifications/alert-config`, {
      headers: authHeaders(token, storeId),
      data: current.data || current,
    });
    expect([200, 204]).toContain(res.status());
  });

  test('GET /notifications/config — unauthenticated returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/notifications/config`);
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('Billing API', () => {
  let token: string;
  let storeId: string;

  test.beforeAll(async ({ request }) => {
    ({ token, storeId } = await loginAndGetToken(request));
  });

  test('GET /billing/templates/my — returns bill template', async ({ request }) => {
    const res = await request.get(`${BASE}/billing/templates/my`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('PUT /billing/templates/my — updates bill template', async ({ request }) => {
    const getRes = await request.get(`${BASE}/billing/templates/my`, {
      headers: authHeaders(token, storeId),
    });
    const current = await getRes.json();
    const res = await request.put(`${BASE}/billing/templates/my`, {
      headers: authHeaders(token, storeId),
      data: current.data || current,
    });
    expect([200, 204]).toContain(res.status());
  });

  test('GET /billing/bills — returns bills list', async ({ request }) => {
    const res = await request.get(`${BASE}/billing/bills`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /billing/bills — supports status filter', async ({ request }) => {
    const res = await request.get(`${BASE}/billing/bills?status=PAID`, {
      headers: authHeaders(token, storeId),
    });
    expect(res.status()).toBe(200);
  });
});
