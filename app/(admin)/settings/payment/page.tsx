'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InfoModal } from '@/components/ui/info-modal';
import { useInfoContent } from '@/lib/use-info-content';
import { Info } from 'lucide-react';

interface PaymentConfig {
  razorpayKeyId: string;
  razorpayKeySecret: string;
  enabled: boolean;
}

interface OrderCharges {
  currency?: string;
  packingCharge?: number;
  deliveryCharge?: number;
  gstEnabled?: boolean;
  gstNumber?: string;
  gstPercent?: number;
}

const empty: PaymentConfig = { razorpayKeyId: '', razorpayKeySecret: '', enabled: false };

function A({ href, children }: Readonly<{ href: string; children: React.ReactNode }>) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">{children}</a>;
}

function Step({ n, children }: Readonly<{ n: number; children: React.ReactNode }>) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 w-5 h-5 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold">{n}</span>
      <span>{children}</span>
    </div>
  );
}

export default function PaymentSettingsPage() {
  const info = useInfoContent();
  const [config, setConfig] = useState<PaymentConfig>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);

  const [charges, setCharges] = useState<OrderCharges>({});
  const [chargesSaving, setChargesSaving] = useState(false);
  const [chargesSaved, setChargesSaved] = useState(false);
  const [chargesError, setChargesError] = useState('');

  const load = useCallback(async () => {
    try {
      const paymentRes = await api.get('/payment/store-config');
      if (paymentRes.data.config) setConfig({ ...empty, ...paymentRes.data.config });
    } catch { setError('Failed to load config'); }
    finally { setLoading(false); }
    api.get('/store').then(storeRes => {
      const b = storeRes.data.store?.branding ?? {};
      setCharges({
        currency: b.currency,
        packingCharge: b.packingCharge,
        deliveryCharge: b.deliveryCharge,
        gstEnabled: !!b.gstEnabled,
        gstNumber: b.gstNumber || '',
        gstPercent: b.gstPercent,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.put('/payment/store-config', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { setError('Failed to save'); }
    finally { setSaving(false); }
  };

  const saveCharges = async () => {
    setChargesSaving(true); setChargesError('');
    try {
      await api.patch('/store', { branding: charges });
      setChargesSaved(true);
      setTimeout(() => setChargesSaved(false), 2500);
    } catch { setChargesError('Failed to save charges.'); }
    finally { setChargesSaving(false); }
  };

  if (loading) return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="h-7 bg-neutral-100 rounded w-48" />
      <div className="h-4 bg-neutral-100 rounded w-full max-w-lg" />
      <div className="rounded-xl border bg-white p-5 space-y-4">
        <div className="h-5 bg-neutral-100 rounded w-36" />
        <div className="space-y-2"><div className="h-4 bg-neutral-100 rounded w-20" /><div className="h-9 bg-neutral-100 rounded" /></div>
        <div className="space-y-2"><div className="h-4 bg-neutral-100 rounded w-20" /><div className="h-9 bg-neutral-100 rounded" /></div>
        <div className="h-9 bg-neutral-100 rounded" />
      </div>
      <div className="rounded-xl border bg-white p-5 space-y-4">
        <div className="h-5 bg-neutral-100 rounded w-36" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><div className="h-4 bg-neutral-100 rounded w-28" /><div className="h-9 bg-neutral-100 rounded" /></div>
          <div className="space-y-2"><div className="h-4 bg-neutral-100 rounded w-28" /><div className="h-9 bg-neutral-100 rounded" /></div>
        </div>
        <div className="h-9 bg-neutral-100 rounded" />
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl font-bold">Payment Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect <strong>your own</strong> Razorpay account to accept online card / UPI payments — sale payments go
          directly to your account. You can set this up <strong>anytime</strong>; your store already accepts
          <strong> Cash on Delivery</strong> without it. Tap the <Info size={12} className="inline" /> for step-by-step help.
        </p>
      </div>

      {infoOpen && (
        <InfoModal title={info.payment?.title ?? 'How to set up Razorpay'} onClose={() => setInfoOpen(false)}>
          {(info.payment?.steps ?? []).map((s, i) => <Step key={i} n={i + 1}>{s}</Step>)}
          {info.payment?.note && <p className="text-xs text-neutral-400 pt-2">{info.payment.note}</p>}
          {info.payment?.youtubeUrl && (
            <div className="border-t pt-3 mt-2">
              <A href={info.payment.youtubeUrl}>▶ Watch tutorial on YouTube</A>
            </div>
          )}
        </InfoModal>
      )}

      <form onSubmit={save}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                Razorpay — Store Account
                <button type="button" onClick={() => setInfoOpen(true)}
                  className="text-neutral-400 hover:text-neutral-600 inline-flex items-center" aria-label="Razorpay setup guide">
                  <Info size={13} />
                </button>
              </CardTitle>
              <Badge variant={config.enabled ? 'default' : 'secondary'}>
                {config.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Key ID</Label>
              <Input placeholder="rzp_live_xxxxxxxxxxxx" value={config.razorpayKeyId}
                onChange={e => setConfig(c => ({ ...c, razorpayKeyId: e.target.value }))} />
              <p className="text-xs text-muted-foreground">From Razorpay Dashboard → Settings → API Keys</p>
            </div>
            <div className="space-y-1">
              <Label>Key Secret</Label>
              <Input type="password" placeholder="••••••••" value={config.razorpayKeySecret}
                onChange={e => setConfig(c => ({ ...c, razorpayKeySecret: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={config.enabled}
                onChange={e => setConfig(c => ({ ...c, enabled: e.target.checked }))} />
              Enable Razorpay for product payments
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={saving} className="w-full">
              {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save'}
            </Button>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader><CardTitle className="text-base">Order Charges</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-neutral-500">Added to the customer&apos;s order total at checkout. Leave as 0 to disable.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Packing Charge ({charges.currency || 'INR'})</Label>
              <Input type="number" min={0} step="0.01" placeholder="0.00"
                value={charges.packingCharge ?? ''}
                onChange={e => setCharges(c => ({ ...c, packingCharge: e.target.value === '' ? 0 : Number.parseFloat(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label>Delivery Charge ({charges.currency || 'INR'})</Label>
              <Input type="number" min={0} step="0.01" placeholder="0.00"
                value={charges.deliveryCharge ?? ''}
                onChange={e => setCharges(c => ({ ...c, deliveryCharge: e.target.value === '' ? 0 : Number.parseFloat(e.target.value) }))} />
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" checked={!!charges.gstEnabled}
                onChange={e => setCharges(c => ({ ...c, gstEnabled: e.target.checked }))}
                className="w-4 h-4 rounded" />
              <span className="font-medium text-sm">Enable GST</span>
            </label>
            {charges.gstEnabled && (
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <Label>GST Number</Label>
                  <Input placeholder="22AAAAA0000A1Z5"
                    value={charges.gstNumber || ''}
                    onChange={e => setCharges(c => ({ ...c, gstNumber: e.target.value.toUpperCase() }))} />
                  <p className="text-xs text-neutral-400">15-digit GSTIN shown on invoices</p>
                </div>
                <div className="space-y-1">
                  <Label>GST Rate</Label>
                  <div className="relative">
                    <Input type="number" min={0} max={100} step="0.01" placeholder="18"
                      value={charges.gstPercent ?? ''}
                      onChange={e => setCharges(c => ({ ...c, gstPercent: e.target.value === '' ? 0 : Number.parseFloat(e.target.value) }))}
                      className="pr-8" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">%</span>
                  </div>
                  <p className="text-xs text-neutral-400">Applied on subtotal at checkout</p>
                </div>
              </div>
            )}
          </div>
          {chargesError && <p className="text-sm text-red-500">{chargesError}</p>}
          {chargesSaved && <p className="text-sm text-green-600">Charges saved!</p>}
          <Button type="button" onClick={saveCharges} disabled={chargesSaving} className="w-full">
            {chargesSaving ? 'Saving…' : 'Save Order Charges'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

