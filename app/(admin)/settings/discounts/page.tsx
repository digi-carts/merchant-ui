'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Tag } from 'lucide-react';

type OfferType = 'FLAT' | 'PERCENT';

interface Offer {
  id: string;
  code: string;
  type: OfferType | string;
  value: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  description: string | null;
  minOrderAmt: number;
  active: boolean;
  createdAt: string;
}

const emptyForm = {
  code: '',
  type: 'PERCENT' as OfferType,
  value: 10,
  maxUses: '' as number | '',
  minOrderAmt: 0 as number,
  expiresAt: '',
  description: '',
};

export default function DiscountsPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [currency, setCurrency] = useState('INR');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const loadOffers = useCallback(async () => {
    const oRes = await api.get('/offers/store');
    setOffers((oRes.data.offers ?? []) as Offer[]);
  }, []);

  useEffect(() => {
    api.get('/store').then(sRes => {
      if (sRes?.data?.store?.currency) setCurrency(sRes.data.store.currency);
    }).catch(() => {});
    loadOffers().catch(() => setError('Failed to load discounts')).finally(() => setLoading(false));
  }, [loadOffers]);

  const fieldErrors = {
    code: !form.code.trim() ? 'Code is required' : !/^[A-Za-z0-9_-]+$/.test(form.code.trim()) ? 'Letters, numbers, - and _ only' : '',
    value: form.value <= 0 ? 'Must be greater than 0' : (form.type === 'PERCENT' && form.value > 100 ? 'Percent cannot exceed 100' : ''),
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fieldErrors.code || fieldErrors.value) return;
    setSaving(true); setError('');
    try {
      await api.post('/offers/store', {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: form.value,
        maxUses: form.maxUses === '' ? null : Number(form.maxUses),
        minOrderAmt: form.minOrderAmt || 0,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        description: form.description.trim() || null,
      });
      setForm(emptyForm);
      await loadOffers();
      flash('Discount created');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create discount (code may already exist)');
    } finally { setSaving(false); }
  };

  const toggleActive = async (o: Offer) => {
    try { await api.patch(`/offers/store/${o.id}`, { active: !o.active }); await loadOffers(); }
    catch { setError('Failed to update discount'); }
  };

  const remove = async (o: Offer) => {
    if (!confirm(`Delete discount "${o.code}"?`)) return;
    try { await api.delete(`/offers/store/${o.id}`); await loadOffers(); flash('Discount deleted'); }
    catch { setError('Failed to delete discount'); }
  };

  const formatValue = (o: Offer) => o.type === 'PERCENT' ? `${o.value}%` : `${currency} ${o.value}`;
  const formatDate = (s: string | null) => s ? new Date(s).toLocaleDateString() : '—';

  if (loading) return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="h-8 bg-neutral-100 rounded w-40" />
      <div className="rounded-xl border bg-white p-5 space-y-4">
        <div className="h-5 bg-neutral-100 rounded w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {['sk1','sk2','sk3','sk4'].map(k => <div key={k} className="h-9 bg-neutral-100 rounded" />)}
        </div>
        <div className="h-9 bg-neutral-100 rounded w-40" />
      </div>
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="h-10 bg-neutral-50 border-b" />
        {['r1','r2','r3'].map(k => <div key={k} className="h-12 border-b last:border-b-0 bg-white" />)}
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2">
        <Tag size={20} className="text-neutral-400" />
        <h1 className="text-2xl font-bold">Discounts</h1>
      </div>
      <p className="text-sm text-neutral-500">Create coupon codes customers can apply at checkout.</p>

      {/* Create */}
      <Card>
        <CardHeader><CardTitle className="text-base">New Discount Coupon</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={create} className="space-y-3" noValidate>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-start">
              <div className="space-y-1">
                <Label>Code</Label>
                <Input value={form.code} placeholder="SAVE10"
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className={fieldErrors.code ? 'border-red-400' : 'font-mono'} />
                {fieldErrors.code && <p className="text-xs text-red-500">{fieldErrors.code}</p>}
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as OfferType })}
                  className="w-full h-9 border rounded-md px-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FLAT">Flat amount ({currency})</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>{form.type === 'PERCENT' ? 'Percent off' : `Amount off (${currency})`}</Label>
                <Input type="number" min={0} step="0.01" value={form.value}
                  onChange={e => setForm({ ...form, value: Number(e.target.value) })}
                  className={fieldErrors.value ? 'border-red-400' : ''} />
                {fieldErrors.value && <p className="text-xs text-red-500">{fieldErrors.value}</p>}
              </div>
              <div className="space-y-1">
                <Label>Min order ({currency})</Label>
                <Input type="number" min={0} step="0.01" value={form.minOrderAmt}
                  onChange={e => setForm({ ...form, minOrderAmt: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label>Usage limit <span className="text-neutral-400 text-xs font-normal">(optional)</span></Label>
                <Input type="number" min={1} value={form.maxUses}
                  placeholder="Unlimited"
                  onChange={e => setForm({ ...form, maxUses: e.target.value === '' ? '' : Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label>Expiry date <span className="text-neutral-400 text-xs font-normal">(optional)</span></Label>
                <Input type="date" value={form.expiresAt}
                  onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Description <span className="text-neutral-400 text-xs font-normal">(optional)</span></Label>
                <Input value={form.description} placeholder="Shown to customers"
                  onChange={e => setForm({ ...form, description: e.target.value })} maxLength={300} />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {msg && <p className="text-sm text-green-600">{msg}</p>}
            <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Discount'}</Button>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Code</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Discount</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Min order</th>
              <th className="text-center px-4 py-3 font-medium text-neutral-500">Uses</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Expires</th>
              <th className="text-center px-4 py-3 font-medium text-neutral-500">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {offers.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">No discounts yet.</td></tr>}
            {offers.map(o => (
              <tr key={o.id} className="hover:bg-neutral-50/50">
                <td className="px-4 py-2 font-mono font-semibold">{o.code}</td>
                <td className="px-4 py-2">{formatValue(o)}</td>
                <td className="px-4 py-2 text-neutral-500">{o.minOrderAmt > 0 ? `${currency} ${o.minOrderAmt}` : '—'}</td>
                <td className="px-4 py-2 text-center font-mono text-xs">
                  {o.usedCount}{o.maxUses ? ` / ${o.maxUses}` : ' / ∞'}
                </td>
                <td className="px-4 py-2 text-neutral-500">{formatDate(o.expiresAt)}</td>
                <td className="px-4 py-2 text-center">
                  <button type="button" onClick={() => toggleActive(o)}
                    className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors ${o.active ? 'bg-black' : 'bg-neutral-200'}`}
                    role="switch" aria-checked={o.active} aria-label={`Toggle ${o.code}`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${o.active ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </td>
                <td className="px-4 py-2 text-right">
                  <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => remove(o)}><Trash2 size={12} /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
