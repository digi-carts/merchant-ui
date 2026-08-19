import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({ baseURL: API_BASE });

function readState() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('auth-store-v3');
    return raw ? (JSON.parse(raw)?.state ?? {}) : {};
  } catch { return {}; }
}

api.interceptors.request.use((config) => {
  const state = readState();
  if (state.accessToken) config.headers.Authorization = `Bearer ${state.accessToken}`;
  if (state.storeId) config.headers['x-store-id'] = state.storeId;
  return config;
});

function applyTokens(accessToken: string, refreshToken: string) {
  try {
    const raw = localStorage.getItem('auth-store-v3');
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.state.accessToken = accessToken;
      parsed.state.refreshToken = refreshToken;
      localStorage.setItem('auth-store-v3', JSON.stringify(parsed));
    }
  } catch { /* ignore */ }
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { refreshToken } = readState();
        if (!refreshToken) throw new Error('no refresh token');
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        applyTokens(data.accessToken, data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('auth-store-v3');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) window.location.href = '/login';
      }
    }

    // 403 can mean a stale JWT whose role hasn't been re-issued yet — silently refresh and retry once
    if (error.response?.status === 403 && !original._retry403) {
      original._retry403 = true;
      try {
        const { refreshToken } = readState();
        if (!refreshToken) throw new Error('no refresh token');
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        applyTokens(data.accessToken, data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshErr) {
        // refresh failed — the DB role may be wrong; log and redirect to login
        console.error('[api] 403 persisted after refresh retry:', refreshErr);
      }
    }

    throw error;
  }
);
