'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PackageOpen } from 'lucide-react';

interface Product { id: string; name: string; stock: number; price: number; images: string[]; category?: { name: string } }

const CATALOG_SERVICE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');

function stockBadge(stock: number) {
  if (stock === 0) return <Badge variant="destructive" className="text-xs">Out of stock</Badge>;
  if (stock <= 5) return <Badge className="text-xs bg-orange-500 text-white">Low — {stock} left</Badge>;
  if (stock <= 20) return <Badge variant="secondary" className="text-xs">{stock} in stock</Badge>;
  return <Badge variant="outline" className="text-xs text-green-600 border-green-300">{stock} in stock</Badge>;
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'out' | 'low' | 'ok'>('all');
  const [saving, setSaving] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const r = await api.get('/catalog/products?limit=200');
    setProducts(r.data.products || []);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.category?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ? true :
      filter === 'out' ? p.stock === 0 :
      filter === 'low' ? p.stock > 0 && p.stock <= 5 :
      p.stock > 5;
    return matchSearch && matchFilter;
  });

  const updateStock = async (id: string) => {
    const val = editStock[id];
    if (val === undefined) return;
    const delta = parseInt(val, 10);
    if (isNaN(delta)) return;
    const current = products.find(p => p.id === id)?.stock ?? 0;
    const stock = current + delta;      // add entered count to existing stock
    if (stock < 0) return;              // never allow negative resulting stock
    setSaving(id);
    try {
      await api.patch(`/catalog/products/${id}`, { stock });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock } : p));
      setEditStock(prev => { const n = { ...prev }; delete n[id]; return n; });
    } finally { setSaving(null); }
  };

  const outCount = products.filter(p => p.stock === 0).length;
  const lowCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <PackageOpen size={22} className="text-neutral-400" />
        <h1 className="text-2xl font-bold">Stock</h1>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap mb-5">
        <div className="bg-neutral-100 rounded-xl px-4 py-2 text-center min-w-[80px]">
          <p className="text-xl font-bold">{products.length}</p>
          <p className="text-xs text-neutral-500">Total</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-center min-w-[80px]">
          <p className="text-xl font-bold text-red-600">{outCount}</p>
          <p className="text-xs text-red-400">Out of stock</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 text-center min-w-[80px]">
          <p className="text-xl font-bold text-orange-500">{lowCount}</p>
          <p className="text-xs text-orange-400">Low stock (≤5)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Input placeholder="Search product or category…" value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-sm w-56" />
        <div className="flex gap-1">
          {([['all','All'],['out','Out of stock'],['low','Low (≤5)'],['ok','OK']] as const).map(([val, label]) => (
            <button key={val} type="button" onClick={() => setFilter(val)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === val ? 'bg-black text-white' : 'border border-neutral-200 text-neutral-600 hover:border-black'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Product</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Category</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Status</th>
              <th className="text-right px-4 py-3 font-medium text-neutral-500">Stock</th>
              <th className="text-right px-4 py-3 font-medium text-neutral-500">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">No products found.</td></tr>
            )}
            {filtered.map(p => (
              <tr key={p.id} className={p.stock === 0 ? 'bg-red-50/30' : p.stock <= 5 ? 'bg-orange-50/30' : ''}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.images?.[0]
                      ? <img src={p.images[0].startsWith('http') ? p.images[0] : `${CATALOG_SERVICE}${p.images[0]}`} alt="" className="w-9 h-9 rounded-lg object-cover border shrink-0" />
                      : <div className="w-9 h-9 rounded-lg bg-neutral-100 border shrink-0 flex items-center justify-center text-neutral-300 text-lg">📦</div>}
                    <span className="font-medium truncate max-w-[200px]">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-neutral-500">{p.category?.name || '—'}</td>
                <td className="px-4 py-3">{stockBadge(p.stock)}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">{p.stock}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <input type="number"
                      value={editStock[p.id] ?? ''}
                      onChange={e => setEditStock(prev => ({ ...prev, [p.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && updateStock(p.id)}
                      placeholder="+ qty"
                      title="Quantity to add to current stock (use a negative number to reduce)"
                      className="w-20 h-7 border rounded px-2 text-sm text-right font-mono focus:outline-none focus:ring-1 focus:ring-black" />
                    <button type="button" onClick={() => updateStock(p.id)}
                      disabled={!editStock[p.id] || saving === p.id}
                      className="h-7 px-3 text-xs rounded bg-black text-white hover:bg-neutral-800 disabled:opacity-40">
                      {saving === p.id ? '…' : 'Add'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
