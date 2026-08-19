'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorInput } from '@/components/ui/color-input';
import { FileText, Upload, Loader2 } from 'lucide-react';

interface BillTemplate {
  name?: string;
  logoUrl?: string | null;
  header?: string | null;
  footer?: string | null;
  showGst?: boolean;
  showLogo?: boolean;
  accentColor?: string;
}

const DEFAULT_TPL: BillTemplate = {
  name: 'Default',
  logoUrl: '',
  header: '',
  footer: '',
  showGst: true,
  showLogo: true,
  accentColor: '#171717',
};

function BillPreview({ tpl }: Readonly<{ tpl: BillTemplate }>) {
  const accent = tpl.accentColor || '#171717';
  return (
    <div className="border rounded-xl bg-white p-5 text-xs font-mono shadow-sm space-y-3 text-neutral-800">
      <div className="flex items-start justify-between border-b pb-3" style={{ borderColor: accent }}>
        <div className="flex items-center gap-2">
          {tpl.showLogo && tpl.logoUrl && (
            <img src={tpl.logoUrl} alt="logo" className="h-8 w-auto object-contain" />
          )}
          <div>
            <div className="font-bold text-sm" style={{ color: accent }}>{tpl.name || 'My Store'}</div>
            <div className="text-neutral-400 text-[10px]">invoice@store.com</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-sm" style={{ color: accent }}>INVOICE</div>
          <div className="text-neutral-400 text-[10px]">#INV-00001</div>
          <div className="text-neutral-400 text-[10px]">Jan 1, 2025</div>
        </div>
      </div>
      {tpl.header && <p className="text-[10px] text-neutral-500 italic">{tpl.header}</p>}
      <table className="w-full text-[10px]">
        <thead>
          <tr style={{ color: accent }}>
            <th className="text-left font-semibold py-1">Item</th>
            <th className="text-right font-semibold py-1">Qty</th>
            <th className="text-right font-semibold py-1">Price</th>
            <th className="text-right font-semibold py-1">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          <tr><td className="py-1">Sample Product</td><td className="text-right">2</td><td className="text-right">₹250</td><td className="text-right">₹500</td></tr>
          <tr><td className="py-1">Another Item</td><td className="text-right">1</td><td className="text-right">₹100</td><td className="text-right">₹100</td></tr>
        </tbody>
      </table>
      <div className="border-t pt-2 space-y-0.5 text-[10px]">
        <div className="flex justify-between"><span>Subtotal</span><span>₹600</span></div>
        {tpl.showGst && <div className="flex justify-between text-neutral-500"><span>GST (18%)</span><span>₹108</span></div>}
        <div className="flex justify-between font-bold text-sm pt-1 border-t" style={{ color: accent }}>
          <span>Total</span><span>{tpl.showGst ? '₹708' : '₹600'}</span>
        </div>
      </div>
      {tpl.footer && <p className="text-[10px] text-neutral-400 border-t pt-2 italic">{tpl.footer}</p>}
    </div>
  );
}

export default function BillTemplatesPage() {
  const [tpl, setTpl] = useState<BillTemplate>(DEFAULT_TPL);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/billing/templates/my').then(r => {
      if (r.data.template) setTpl({ ...DEFAULT_TPL, ...r.data.template });
    }).catch(() => {});
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/store/upload', fd);
      setTpl(t => ({ ...t, logoUrl: data.url }));
    } catch {
      setUploadError('Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/billing/templates/my', tpl);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const saveLabel = saved ? 'Saved ✓' : 'Save Template';

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bill Templates</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Set store branding used when generating invoices from Orders. Changes apply to new PDF downloads and prints.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText size={16} /> Invoice layout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Template Name</Label>
              <Input value={tpl.name ?? ''} onChange={e => setTpl(t => ({ ...t, name: e.target.value }))} placeholder="My Store Bill" />
            </div>
            <div className="space-y-1">
              <Label>Logo</Label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 size={14} className="animate-spin mr-1" /> : <Upload size={14} className="mr-1" />}
                  {uploading ? 'Uploading…' : 'Upload Logo'}
                </Button>
                {tpl.logoUrl && (
                  <img src={tpl.logoUrl} alt="logo preview" className="h-8 w-auto object-contain border rounded" />
                )}
              </div>
              {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
            </div>
            <div className="space-y-1">
              <Label>Header Text</Label>
              <textarea rows={2} value={tpl.header ?? ''} onChange={e => setTpl(t => ({ ...t, header: e.target.value || null }))}
                placeholder="e.g. Thank you for shopping with us!"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black resize-none dark:bg-neutral-800 dark:border-neutral-700" />
            </div>
            <div className="space-y-1">
              <Label>Footer Text</Label>
              <textarea rows={2} value={tpl.footer ?? ''} onChange={e => setTpl(t => ({ ...t, footer: e.target.value || null }))}
                placeholder="e.g. For queries: support@yourstore.com"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black resize-none dark:bg-neutral-800 dark:border-neutral-700" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={tpl.showGst ?? true} onChange={e => setTpl(t => ({ ...t, showGst: e.target.checked }))} className="accent-black" />{' '}
                Show GST line
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={tpl.showLogo ?? true} onChange={e => setTpl(t => ({ ...t, showLogo: e.target.checked }))} className="accent-black" />{' '}
                Show Logo
              </label>
            </div>
            <div className="space-y-1">
              <Label>Accent Color</Label>
              <ColorInput
                value={tpl.accentColor ?? '#171717'}
                onChange={v => setTpl(t => ({ ...t, accentColor: v }))}
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button disabled={saving} onClick={save}>
                {saving ? 'Saving…' : saveLabel}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Preview</p>
          <BillPreview tpl={tpl} />
        </div>
      </div>
    </div>
  );
}
