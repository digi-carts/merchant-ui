'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Tag, Trash2, X } from 'lucide-react';

type OfferType = 'FLAT' | 'PERCENT' | 'ONE_TIME' | 'REFERRAL' | 'CUSTOM';

interface Discount {
  id: string;
  code: string;
  type: OfferType;
  value: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  description: string | null;
  minOrderAmt: number;
  storeId: string | null;
  active: boolean;
}

const TYPE_LABELS: Record<OfferType, string> = {
  FLAT: 'Flat', PERCENT: 'Percent', ONE_TIME: 'One-time', REFERRAL: 'Referral', CUSTOM: 'Custom',
};
const TYPE_COLORS: Record<OfferType, string> = {
  FLAT: 'bg-blue-100 text-blue-700',
  PERCENT: 'bg-purple-100 text-purple-700',
  ONE_TIME: 'bg-orange-100 text-orange-700',
  REFERRAL: 'bg-green-100 text-green-700',
  CUSTOM: 'bg-neutral-100 text-neutral-700',
};

const emptyForm = {
  code: '', type: 'FLAT' as OfferType, value: 0,
  maxUses: '', expiresAt: '', description: '', minOrderAmt: 0,
};

function discountLabel(d: Discount) {
  return d.type === 'PERCENT' ? `${d.value}% off` : `− ${d.value}`;
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    api.get('/offers/store')
      .then(r => setDiscounts(r.data.offers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const create = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post('/offers/store', {
        ...form,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        description: form.description || null,
      });
      setForm(emptyForm); setShowForm(false);
      load(); flash('Discount created');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Code already exists');
    } finally { setSaving(false); }
  };

  const toggle = async (d: Discount) => {
    await api.patch(`/offers/store/${d.id}`, { active: !d.active }).catch(() => {});
    load();
  };

  const remove = async (d: Discount) => {
    if (!confirm(`Delete discount "${d.code}"?`)) return;
    await api.delete(`/offers/store/${d.id}`).catch(() => {});
    load();
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Discounts</h1>
          <p className="text-neutral-500 text-sm">Create coupon codes your customers can use at checkout.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(v => !v)} variant={showForm ? 'outline' : 'default'}>
          {showForm ? <><X size={14} className="mr-1" />Cancel</> : <><Plus size={14} className="mr-1" />New Discount</>}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 max-w-2xl">
          <CardHeader><CardTitle className="text-base">New Discount</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={create} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Code <span className="text-neutral-400 text-xs">(auto-uppercased)</span></Label>
                  <Input placeholder="SAVE20" value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as OfferType })}
                    className="h-9 w-full rounded-md border border-neutral-200 px-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
                    <option value="FLAT">Flat amount off</option>
                    <option value="PERCENT">Percentage off</option>
                    <option value="ONE_TIME">One-time use</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>{form.type === 'PERCENT' ? 'Discount %' : 'Discount Amount'}</Label>
                  <Input type="number" min={0} step="0.01" value={form.value}
                    onChange={e => setForm({ ...form, value: +e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label>Max Uses <span className="text-neutral-400 text-xs">(blank = unlimited)</span></Label>
                  <Input type="number" min={1} placeholder="∞" value={form.maxUses}
                    onChange={e => setForm({ ...form, maxUses: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Expires At <span className="text-neutral-400 text-xs">(optional)</span></Label>
                  <Input type="datetime-local" value={form.expiresAt}
                    onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Min Order Amount <span className="text-neutral-400 text-xs">(0 = no min)</span></Label>
                  <Input type="number" min={0} step="0.01" value={form.minOrderAmt}
                    onChange={e => setForm({ ...form, minOrderAmt: +e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description <span className="text-neutral-400 text-xs">(shown to customer)</span></Label>
                <Input placeholder="Get 20% off your order" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Discount'}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {msg && <p className="text-sm text-green-600 mb-3">{msg}</p>}

      <div className="rounded-xl border bg-white overflow-x-auto max-w-3xl">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Code</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Type</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Discount</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Uses</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Expires</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">Loading…</td></tr>
            )}
            {!loading && discounts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <Tag size={28} className="mx-auto mb-2 text-neutral-300" />
                  <p className="text-neutral-400 text-sm">No discount codes yet. Create one above.</p>
                </td>
              </tr>
            )}
            {discounts.map(d => (
              <tr key={d.id} className={`hover:bg-neutral-50/50 ${!d.storeId ? 'opacity-60' : ''}`}>
                <td className="px-4 py-2 font-mono font-semibold">
                  {d.code}
                  {!d.storeId && <span className="ml-1.5 text-xs text-neutral-400 font-sans">(global)</span>}
                </td>
                <td className="px-4 py-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[d.type]}`}>
                    {TYPE_LABELS[d.type]}
                  </span>
                </td>
                <td className="px-4 py-2 font-medium">
                  {discountLabel(d)}
                  {d.description && <p className="text-xs text-neutral-400 truncate max-w-[120px]">{d.description}</p>}
                </td>
                <td className="px-4 py-2 text-neutral-500">
                  {d.usedCount}{d.maxUses !== null ? ` / ${d.maxUses}` : ''}
                </td>
                <td className="px-4 py-2 text-xs text-neutral-500">
                  {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-2">
                  {d.storeId ? (
                    <button type="button" onClick={() => toggle(d)}
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${d.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                      {d.active ? 'Active' : 'Inactive'}
                    </button>
                  ) : (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${d.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                      {d.active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {d.storeId && (
                    <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => remove(d)}>
                      <Trash2 size={12} />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
