'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const STORE_SERVICE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');

interface IconConfig {
  faviconUrl: string;
  pwaIconUrl: string;
  storeName: string;
  tabTitle: string;
}

function uploaderLabel(uploading: boolean, current: string): string {
  if (uploading) return 'Uploading…';
  if (current) return 'Change';
  return 'Upload';
}

function IconUploader({ label, hint, current, onUpload, uploading }: Readonly<{
  label: string;
  hint: string;
  current: string;
  onUpload: (file: File) => void;
  uploading: boolean;
}>) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-neutral-400">{hint}</p>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl border bg-neutral-50 flex items-center justify-center overflow-hidden shrink-0">
          {current
            ? <img src={current} alt={label} className="w-full h-full object-contain" />
            : <span className="text-2xl">🖼️</span>}
        </div>
        <div className="space-y-1">
          <input ref={ref} type="file" accept="image/png,image/jpeg,image/svg+xml,image/x-icon,image/webp"
            className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
          <Button type="button" variant="outline" size="sm" disabled={uploading}
            onClick={() => ref.current?.click()}>
            {uploaderLabel(uploading, current)}
          </Button>
          {current && (
            <p className="text-xs text-neutral-400 truncate max-w-[200px]">
              {current.split('/').pop()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IconsPage() {
  const [config, setConfig] = useState<IconConfig>({ faviconUrl: '', pwaIconUrl: '', storeName: '', tabTitle: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const r = await api.get('/store');
    const b = r.data.store?.branding || {};
    const storeName = r.data.store?.name || '';
    setConfig({
      faviconUrl: b.faviconUrl || '',
      pwaIconUrl: b.pwaIconUrl || '',
      storeName,
      tabTitle: b.tabTitle || storeName,
    });
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${STORE_SERVICE}/api/store/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}` },
      body: fd,
    });
    return (await res.json()).url as string;
  };

  const handleUpload = async (field: 'faviconUrl' | 'pwaIconUrl', file: File) => {
    setUploading(field);
    try {
      const url = await uploadFile(file);
      setConfig(c => ({ ...c, [field]: url }));
    } finally { setUploading(null); }
  };

  const save = async () => {
    setSaving(true); setError('');
    try {
      const storeRes = await api.get('/store');
      const existing = storeRes.data.store?.branding || {};
      await api.patch('/store', {
        branding: { ...existing, faviconUrl: config.faviconUrl, pwaIconUrl: config.pwaIconUrl, tabTitle: config.tabTitle },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { setError('Failed to save'); }
    finally { setSaving(false); }
  };

  const tabDisplay = config.tabTitle || config.storeName || 'Your Store';

  let saveLabel = 'Save';
  if (saved) saveLabel = '✓ Saved';
  else if (saving) saveLabel = 'Saving…';

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl font-bold">Address bar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set the icon and title shown in the browser tab / address bar for your store.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Icon &amp; Title</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <IconUploader
            label="Icon"
            hint="Shown in browser tabs and the address bar. PNG, ICO, or SVG — recommended 32×32px or 64×64px."
            current={config.faviconUrl}
            onUpload={f => handleUpload('faviconUrl', f)}
            uploading={uploading === 'faviconUrl'}
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Title <span className="text-neutral-400 text-xs">(shown in browser tab)</span></Label>
              <span className={`text-xs ${config.tabTitle.length > 60 ? 'text-red-500 font-medium' : 'text-neutral-400'}`}>
                {config.tabTitle.length}/60
              </span>
            </div>
            <Input
              value={config.tabTitle}
              placeholder={config.storeName || 'Your Store'}
              maxLength={60}
              onChange={e => setConfig(c => ({ ...c, tabTitle: e.target.value }))}
            />
            <p className="text-xs text-neutral-400">Defaults to your store name if left blank.</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={save} disabled={saving} className="w-full">{saveLabel}</Button>
        </CardContent>
      </Card>

      <Card className="border-neutral-100 bg-neutral-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 bg-white border rounded-lg px-3 py-2 text-sm">
            {config.faviconUrl
              ? <img src={config.faviconUrl} alt="favicon" className="w-4 h-4 object-contain shrink-0" />
              : <span className="text-xs shrink-0">🌐</span>}
            <span className="text-neutral-700 truncate">{tabDisplay} — Home</span>
          </div>
          <p className="text-xs text-neutral-400 mt-2">This is how your tab will look in the browser.</p>
        </CardContent>
      </Card>
    </div>
  );
}
