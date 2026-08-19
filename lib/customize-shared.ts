import { api } from '@/lib/api';

const STORE_SERVICE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');

export async function loadBranding(): Promise<Record<string, unknown>> {
  const r = await api.get('/store');
  return r.data.store?.branding || {};
}

export async function saveBranding(patch: object): Promise<void> {
  const r = await api.get('/store');
  const existing = r.data.store?.branding || {};
  await api.patch('/store', { branding: { ...existing, ...patch } });
}

export async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${STORE_SERVICE}/api/store/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token ?? ''}` },
    body: fd,
  });
  return (await res.json()).url as string;
}

export function parseIds(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === 'string') { try { return JSON.parse(val || '[]') as string[]; } catch { return []; } }
  return [];
}
