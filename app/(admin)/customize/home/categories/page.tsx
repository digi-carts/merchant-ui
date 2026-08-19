'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SizeScale } from '@/components/ui/size-scale';
import { X } from 'lucide-react';
import { loadBranding, saveBranding, uploadFile } from '@/lib/customize-shared';

type DisplayStyle = 'cards' | 'circle' | 'rectangle';

const STYLE_OPTIONS: { value: DisplayStyle; label: string }[] = [
  { value: 'cards', label: 'Cards (album frame)' },
  { value: 'circle', label: 'Circle (round image + name)' },
  { value: 'rectangle', label: 'Rectangle (tall image + name)' },
];

interface Category { id: string; name: string }

interface Config {
  showCategories: boolean;
  categoriesStyle: DisplayStyle;
  categoriesAlign: string;
  categoriesDescription: string;
  categoriesSize: string;
  categoryImages: Record<string, string>;
}

const defaults: Config = {
  showCategories: false,
  categoriesStyle: 'cards',
  categoriesAlign: 'left',
  categoriesDescription: '',
  categoriesSize: '3',
  categoryImages: {},
};

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState<Config>(defaults);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [b, catsRes] = await Promise.all([loadBranding(), api.get('/catalog/categories')]);
    setConfig({
      showCategories: (b.showCategories as boolean) || false,
      categoriesStyle: (b.categoriesStyle as DisplayStyle) || 'cards',
      categoriesAlign: (b.categoriesAlign as string) || 'left',
      categoriesDescription: (b.categoriesDescription as string) || '',
      categoriesSize: (b.categoriesSize as string) || '3',
      categoryImages: (b.categoryImages as Record<string, string>) || {},
    });
    setCategories(catsRes.data.categories || []);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const handleCategoryImage = async (catId: string, file: File) => {
    setUploading(catId);
    try {
      const url = await uploadFile(file);
      setConfig(c => ({ ...c, categoryImages: { ...c.categoryImages, [catId]: url } }));
    } finally { setUploading(null); }
  };

  const save = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveBranding(config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally { setSaving(false); }
  };

  if (loading) return <p className="text-neutral-400">Loading…</p>;

  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-bold">Home — Shop by Category</h1>
      <form onSubmit={save} className="space-y-5">

        <div className="flex items-center gap-3">
          <input type="checkbox" id="showCats" checked={config.showCategories}
            onChange={e => setConfig(c => ({ ...c, showCategories: e.target.checked }))}
            className="accent-black w-4 h-4" />
          <label htmlFor="showCats" className="text-sm font-medium cursor-pointer">Show this section on homepage</label>
        </div>

        {config.showCategories && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Display Style</Label>
                <Select value={config.categoriesStyle} onValueChange={v => v && setConfig(c => ({ ...c, categoriesStyle: v as DisplayStyle }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{STYLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Heading Align</Label>
                <Select value={config.categoriesAlign} onValueChange={v => v && setConfig(c => ({ ...c, categoriesAlign: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SizeScale value={config.categoriesSize} onChange={v => setConfig(c => ({ ...c, categoriesSize: v }))} />
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Section Description <span className="text-neutral-400">(optional)</span></Label>
                <span className={`text-xs ${config.categoriesDescription.length > 120 ? 'text-red-500 font-medium' : 'text-neutral-400'}`}>
                  {config.categoriesDescription.length}/120
                </span>
              </div>
              <Textarea placeholder="Browse our collections…" rows={2} value={config.categoriesDescription} maxLength={120}
                onChange={e => setConfig(c => ({ ...c, categoriesDescription: e.target.value }))} />
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Category Images</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {categories.length === 0
                  ? <p className="text-xs text-neutral-400">No categories yet.</p>
                  : categories.map(cat => {
                    const img = config.categoryImages[cat.id] || '';
                    const isUp = uploading === cat.id;
                    let btnLabel = 'Upload';
                    if (isUp) { btnLabel = 'Uploading…'; } else if (img) { btnLabel = 'Change'; }
                    return (
                      <div key={cat.id} className="flex items-center gap-3 p-2 border rounded-lg bg-neutral-50">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-200 shrink-0 flex items-center justify-center">
                          {img
                            ? <img src={img} alt={cat.name} className="w-full h-full object-cover" />
                            : <span className="text-lg font-bold text-neutral-400">{cat.name.charAt(0).toUpperCase()}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{cat.name}</p>
                          <p className="text-xs text-neutral-400">{img ? 'Image set' : 'No image — auto-pick'}</p>
                        </div>
                        <label className={`text-xs px-2 py-1 rounded border cursor-pointer transition-colors ${isUp ? 'opacity-50 pointer-events-none' : 'hover:border-black'}`}>
                          {btnLabel}
                          <input type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleCategoryImage(cat.id, f); }} />
                        </label>
                        {img && (
                          <button type="button" onClick={() => setConfig(c => { const n = { ...c.categoryImages }; delete n[cat.id]; return { ...c, categoryImages: n }; })}
                            className="text-neutral-300 hover:text-red-500"><X size={14} /></button>
                        )}
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          </>
        )}

        {success && <p className="text-sm text-green-600">✓ Saved!</p>}
        <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Save'}</Button>
      </form>
    </div>
  );
}
