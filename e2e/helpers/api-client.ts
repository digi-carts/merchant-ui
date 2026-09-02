import { APIRequestContext } from '@playwright/test';

const BASE = process.env.API_URL || 'http://localhost:8080/v1';

export async function loginAndGetToken(request: APIRequestContext) {
  const res = await request.post(`${BASE}/auth/login`, {
    data: {
      email: process.env.TEST_EMAIL || 'test@merchant.com',
      password: process.env.TEST_PASSWORD || 'Test@1234',
    },
  });
  const body = await res.json();
  return { token: body.data?.token || body.token, storeId: body.data?.storeId || body.storeId };
}

export function authHeaders(token: string, storeId?: string) {
  return {
    Authorization: `Bearer ${token}`,
    ...(storeId ? { 'x-store-id': storeId } : {}),
  };
}
