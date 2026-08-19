'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';

interface ReturnItem { id: string; productName: string; qty: number; priceAtOrder: number }
interface ReturnRec {
  id: string; orderId: string; status: string; reason: string; comment?: string | null;
  adminComment?: string | null; refundMethod: string; refundStatus: string; refundAmount: number;
  createdAt: string; items: ReturnItem[];
  order?: { id: string; total: number; paymentMethod: string; status: string } | null;
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  REQUESTED: 'secondary', APPROVED: 'default', PICKED_UP: 'default',
  REFUNDED: 'default', COMPLETED: 'default', REJECTED: 'destructive',
};
// Valid next transitions (mirrors the order-service state machine)
const NEXT: Record<string, { status: string; label: string }[]> = {
  REQUESTED: [{ status: 'APPROVED', label: 'Approve' }, { status: 'REJECTED', label: 'Reject' }],
  APPROVED: [{ status: 'PICKED_UP', label: 'Mark picked up' }, { status: 'REJECTED', label: 'Reject' }],
  PICKED_UP: [{ status: 'REFUNDED', label: 'Mark refunded' }],
  REFUNDED: [{ status: 'COMPLETED', label: 'Complete' }],
  REJECTED: [], COMPLETED: [],
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRec[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [currency, setCurrency] = useState('INR');

  const load = useCallback(async () => {
    try {
      const [rRes, sRes] = await Promise.all([
        api.get('/orders/returns'),
        api.get('/store').catch(() => null),
      ]);
      setReturns((rRes.data.returns ?? []) as ReturnRec[]);
      if (sRes?.data?.store?.currency) setCurrency(sRes.data.store.currency);
    } catch { setError('Failed to load returns'); }
  }, []);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const advance = async (r: ReturnRec, status: string) => {
    if ((status === 'REJECTED') && !confirm('Reject this return request?')) return;
    setBusy(r.id); setError('');
    try {
      await api.patch(`/orders/returns/${r.id}/status`, { status });
      await load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update');
    } finally { setBusy(null); }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2">
        <RotateCcw size={20} className="text-neutral-400" />
        <h1 className="text-2xl font-bold">Returns</h1>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}

      {returns.length === 0 ? (
        <div className="border rounded-xl bg-white p-10 text-center text-neutral-400 text-sm">No return requests yet.</div>
      ) : (
        <div className="space-y-3">
          {returns.map(r => (
            <div key={r.id} className="border rounded-xl bg-white p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-mono text-xs text-neutral-400">Order #{r.orderId.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-neutral-400">{new Date(r.createdAt).toLocaleDateString()} · {r.reason}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={STATUS_VARIANT[r.status] ?? 'secondary'}>{r.status}</Badge>
                  <span className="text-xs text-neutral-500">Refund: {currency} {r.refundAmount} · {r.refundMethod === 'COD_MANUAL' ? 'COD (manual)' : 'Online'} · {r.refundStatus}</span>
                </div>
              </div>

              <div className="border-t pt-2 space-y-1">
                {r.items.map(it => (
                  <div key={it.id} className="flex justify-between text-sm text-neutral-600">
                    <span>{it.productName} × {it.qty}</span>
                    <span>{currency} {(it.priceAtOrder * it.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {r.comment && <p className="text-sm text-neutral-500 mt-2"><span className="text-neutral-400">Customer:</span> {r.comment}</p>}

              {(NEXT[r.status] ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                  {(NEXT[r.status] ?? []).map(t => (
                    <Button key={t.status} size="sm"
                      variant={t.status === 'REJECTED' ? 'destructive' : 'default'}
                      disabled={busy === r.id}
                      onClick={() => advance(r, t.status)}>
                      {t.label}
                    </Button>
                  ))}
                  {r.status === 'PICKED_UP' && r.refundMethod !== 'COD_MANUAL' && (
                    <span className="text-xs text-neutral-400 self-center">Online refund will be flagged — issue it in Razorpay.</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
