'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SizeScale } from '@/components/ui/size-scale';
import { X } from 'lucide-react';
import { loadBranding, saveBranding, parseIds } from '@/lib/customize-shared';

type DisplayStyle = 'cards' | 'circle' | 'rectangle';

const STYLE_OPTIONS: { value: DisplayStyle; label: string }[] = [
  { value: 'cards', label: 'Cards (album frame)' },
  { value: 'circle', label: 'Circle (round image + name)' },
  { value: 'rectangle', label: 'Rectangle (tall image + name)' },
];

interface Product { id: string; name: string; images: string[] }

interface Config {
  showNewArrivals: boolean;
  newArrivalsStyle: DisplayStyle;
  newArrivalsAlign: string;
  newArrivalsDescription: string;
  newArrivalsSize: string;
  newArrivalIds: string[];
}

const defaults: Config = {
  showNewArrivals: false,
  newArrivalsStyle: 'cards',
  newArrivalsAlign: 'left',
  newArrivalsDescription: '',
  newArrivalsSize: '3',
  newArrivalIds: [],
};

export default function NewArrivalsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState<Config>(defaults);
  const [products, setProducts] = useState<Product[]>([]);
  const [dropdownValue, setDropdownValue] = useState('');

  const load = useCallback(async () => {
    const [b, productsRes] = await Promise.all([loadBranding(), api.get('/catalog/products?limit=100')]);
    setConfig({
      showNewArrivals: (b.showNewArrivals as boolean) || false,
      newArrivalsStyle: (b.newArrivalsStyle as DisplayStyle) || 'cards',
      newArrivalsAlign: (b.newArrivalsAlign as string) || 'left',
      newArrivalsDescription: (b.newArrivalsDescription as string) || '',
      newArrivalsSize: (b.newArrivalsSize as string) || '3',
      newArrivalIds: parseIds(b.newArrivalIds),
    });
    setProducts(productsRes.data.products || []);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const selectedProducts = config.newArrivalIds.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
  const unselected = products.filter(p => !config.newArrivalIds.includes(p.id));

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
      <h1 className="text-2xl font-bold">Home — New Arrivals</h1>
      <form onSubmit={save} className="space-y-5">

        <div className="flex items-center gap-3">
          <input type="checkbox" id="showNA" checked={config.showNewArrivals}
            onChange={e => setConfig(c => ({ ...c, showNewArrivals: e.target.checked }))}
            className="accent-black w-4 h-4" />
          <label htmlFor="showNA" className="text-sm font-medium cursor-pointer">Show this section on homepage</label>
        </div>

        {config.showNewArrivals && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Display Style</Label>
                <Select value={config.newArrivalsStyle} onValueChange={v => v && setConfig(c => ({ ...c, newArrivalsStyle: v as DisplayStyle }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{STYLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Heading Align</Label>
                <Select value={config.newArrivalsAlign} onValueChange={v => v && setConfig(c => ({ ...c, newArrivalsAlign: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SizeScale value={config.newArrivalsSize} onChange={v => setConfig(c => ({ ...c, newArrivalsSize: v }))} />
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Section Description <span className="text-neutral-400">(optional)</span></Label>
                <span className={`text-xs ${config.newArrivalsDescription.length > 120 ? 'text-red-500 font-medium' : 'text-neutral-400'}`}>
                  {config.newArrivalsDescription.length}/120
                </span>
              </div>
              <Textarea placeholder="Our latest additions…" rows={2} value={config.newArrivalsDescription} maxLength={120}
                onChange={e => setConfig(c => ({ ...c, newArrivalsDescription: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Products <span className="text-neutral-400">(leave empty to auto-show latest 8)</span></Label>
              <div className="flex gap-2">
                <select value={dropdownValue} onChange={e => setDropdownValue(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-neutral-200 px-3 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
                  <option value="">Select a product…</option>
                  {unselected.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <Button type="button" size="sm" disabled={!dropdownValue}
                  onClick={() => {
                    if (!dropdownValue) return;
                    setConfig(c => ({ ...c, newArrivalIds: [...c.newArrivalIds, dropdownValue] }));
                    setDropdownValue('');
                  }}>
                  Add
                </Button>
              </div>
              {selectedProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 p-2 bg-neutral-50 border rounded-lg text-xs">
                  <span className="text-neutral-400 w-4 shrink-0">{i + 1}.</span>
                  {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-7 h-7 object-cover rounded shrink-0" /> : <div className="w-7 h-7 bg-neutral-200 rounded shrink-0" />}
                  <span className="flex-1 truncate font-medium">{p.name}</span>
                  <button type="button" onClick={() => setConfig(c => ({ ...c, newArrivalIds: c.newArrivalIds.filter(id => id !== p.id) }))}
                    className="text-neutral-400 hover:text-red-500 shrink-0"><X size={13} /></button>
                </div>
              ))}
            </div>
          </>
        )}

        {success && <p className="text-sm text-green-600">✓ Saved!</p>}
        <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Save'}</Button>
      </form>
    </div>
  );
}
