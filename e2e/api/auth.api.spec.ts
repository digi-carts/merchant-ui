import { test, expect } from '@playwright/test';
import { loginAndGetToken, authHeaders } from '../../helpers/api-client';

const BASE = process.env.API_URL || 'http://localhost:8080/v1';

test.describe('Auth API', () => {
  test('POST /auth/login — valid credentials returns token', async ({ request }) => {
    const res = await request.post(`${BASE}/auth/login`, {
      data: {
        email: process.env.TEST_EMAIL || 'test@merchant.com',
        password: process.env.TEST_PASSWORD || 'Test@1234',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('token');
  });

  test('POST /auth/login — invalid credentials returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/auth/login`, {
      data: { email: 'nobody@nowhere.invalid', password: 'wrongpass' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /auth/login — missing fields returns 400', async ({ request }) => {
    const res = await request.post(`${BASE}/auth/login`, { data: {} });
    expect([400, 422]).toContain(res.status());
  });

  test('POST /auth/merchant-register — duplicate email returns 409', async ({ request }) => {
    const res = await request.post(`${BASE}/auth/merchant-register`, {
      data: {
        name: 'Test User',
        email: process.env.TEST_EMAIL || 'test@merchant.com',
        phone: '9999999999',
        password: 'Test@1234',
      },
    });
    expect([409, 400]).toContain(res.status());
  });

  test('POST /auth/forgot-password — unknown email returns 404', async ({ request }) => {
    const res = await request.post(`${BASE}/auth/forgot-password`, {
      data: { email: 'nobody@nowhere.invalid' },
    });
    expect([404, 400]).toContain(res.status());
  });

  test('POST /auth/refresh — invalid token returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/auth/refresh`, {
      headers: { Authorization: 'Bearer invalid-token' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('POST /auth/merchant-mgmt/change-password — unauthenticated returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/auth/merchant-mgmt/change-password`, {
      data: { currentPassword: 'old', newPassword: 'new', confirmPassword: 'new' },
    });
    expect([401, 403]).toContain(res.status());
  });
});
