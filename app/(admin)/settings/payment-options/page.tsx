'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface DirectPayDetails {
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
}

interface PaymentMethods {
  cod: { enabled: boolean };
  razorpay: { enabled: boolean };
  directPay: { enabled: boolean } & DirectPayDetails;
}

const defaultMethods: PaymentMethods = {
  cod: { enabled: true },
  razorpay: { enabled: false },
  directPay: { enabled: false, accountName: '', bankName: '', accountNumber: '', ifsc: '', upiId: '' },
};

export default function PaymentOptionsPage() {
  const [methods, setMethods] = useState<PaymentMethods>(defaultMethods);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/store');
      const b = res.data.store?.branding ?? {};
      setMethods({ ...defaultMethods, ...(b.paymentMethods ?? {}) });
    } catch {
      setError('Failed to load payment options.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setError('');
    try {
      await api.patch('/store', { branding: { paymentMethods: methods } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const setEnabled = (method: keyof PaymentMethods, enabled: boolean) =>
    setMethods(m => ({ ...m, [method]: { ...m[method], enabled } }));

  const setDirectPay = (field: keyof DirectPayDetails, value: string) =>
    setMethods(m => ({ ...m, directPay: { ...m.directPay, [field]: value } }));

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const enabledCount = [methods.cod.enabled, methods.razorpay.enabled, methods.directPay.enabled].filter(Boolean).length;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl font-bold">Payment Options</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose which payment methods customers can use at checkout.
          {enabledCount === 0 && (
            <span className="text-amber-600 font-medium"> Enable at least one method so customers can complete orders.</span>
          )}
        </p>
      </div>

      {/* Cash on Delivery */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Cash on Delivery</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Customer pays in cash when the order is delivered. No setup required.
              </CardDescription>
            </div>
            <Badge variant={methods.cod.enabled ? 'default' : 'secondary'}>
              {methods.cod.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded"
              checked={methods.cod.enabled}
              onChange={e => setEnabled('cod', e.target.checked)}
            />
            Allow Cash on Delivery at checkout
          </label>
        </CardContent>
      </Card>

      {/* Razorpay */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Razorpay</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Accept card, UPI, netbanking and wallets via Razorpay. Requires API keys configured in{' '}
                <Link href="/settings/payment" className="underline text-blue-600 inline-flex items-center gap-0.5">
                  Payment Settings <ExternalLink size={10} />
                </Link>.
              </CardDescription>
            </div>
            <Badge variant={methods.razorpay.enabled ? 'default' : 'secondary'}>
              {methods.razorpay.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded"
              checked={methods.razorpay.enabled}
              onChange={e => setEnabled('razorpay', e.target.checked)}
            />
            Allow Razorpay online payments at checkout
          </label>
          {methods.razorpay.enabled && (
            <p className="text-xs text-muted-foreground mt-2">
              Make sure your Razorpay Key ID and Secret are saved in{' '}
              <Link href="/settings/payment" className="underline text-blue-600">Payment Settings</Link>.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Direct Pay */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Direct Pay (Bank Transfer)</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Customer transfers payment directly to your bank account. You confirm the payment manually.
              </CardDescription>
            </div>
            <Badge variant={methods.directPay.enabled ? 'default' : 'secondary'}>
              {methods.directPay.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded"
              checked={methods.directPay.enabled}
              onChange={e => setEnabled('directPay', e.target.checked)}
            />
            Allow Direct Bank Transfer at checkout
          </label>

          {methods.directPay.enabled && (
            <div className="space-y-4 border rounded-lg p-4">
              <p className="text-xs text-muted-foreground">
                These details are shown to customers after they place an order. Fill in at least account number and IFSC.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Account Holder Name</Label>
                  <Input
                    placeholder="John's Store"
                    value={methods.directPay.accountName}
                    onChange={e => setDirectPay('accountName', e.target.value)}
                    onBlur={e => { if (!e.target.value.trim()) setError('Account holder name is required.'); else setError(''); }}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Bank Name</Label>
                  <Input
                    placeholder="State Bank of India"
                    value={methods.directPay.bankName}
                    onChange={e => setDirectPay('bankName', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Account Number</Label>
                  <Input
                    placeholder="1234567890"
                    value={methods.directPay.accountNumber}
                    onChange={e => setDirectPay('accountNumber', e.target.value.replace(/\D/g, ''))}
                    onBlur={e => { if (!e.target.value.trim()) setError('Account number is required.'); else setError(''); }}
                  />
                </div>
                <div className="space-y-1">
                  <Label>IFSC Code</Label>
                  <Input
                    placeholder="SBIN0001234"
                    value={methods.directPay.ifsc}
                    onChange={e => setDirectPay('ifsc', e.target.value.toUpperCase())}
                    onBlur={e => { if (!e.target.value.trim()) setError('IFSC code is required.'); else setError(''); }}
                  />
                  <p className="text-xs text-neutral-400">11-character code on your cheque book</p>
                </div>
              </div>
              <div className="space-y-1">
                <Label>UPI ID <span className="text-neutral-400 font-normal">(optional)</span></Label>
                <Input
                  placeholder="yourstore@upi"
                  value={methods.directPay.upiId}
                  onChange={e => setDirectPay('upiId', e.target.value)}
                />
                <p className="text-xs text-neutral-400">Customers can also scan/pay via UPI</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={save} disabled={saving} className="w-full">
        {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Payment Options'}
      </Button>
    </div>
  );
}
