'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoModal } from '@/components/ui/info-modal';
import { Bell, ShoppingCart, Truck, CheckCircle2, XCircle, RotateCcw, Info, Store } from 'lucide-react';

interface ChannelFlags { sms: boolean; whatsapp: boolean; email: boolean }

interface AlertConfig {
  orderPlaced?: ChannelFlags;
  orderShipped?: ChannelFlags;
  orderDelivered?: ChannelFlags;
  orderCancelled?: ChannelFlags;
  orderRefunded?: ChannelFlags;
  orderPlacedMerchant?: ChannelFlags;
}

const DEFAULT_FLAGS: ChannelFlags = { sms: false, whatsapp: true, email: true };
const OFF_FLAGS: ChannelFlags = { sms: false, whatsapp: false, email: false };

function toFlags(v: ChannelFlags | boolean | undefined, def: ChannelFlags): ChannelFlags {
  if (!v) return OFF_FLAGS;
  if (typeof v === 'boolean') return v ? def : OFF_FLAGS;
  return v;
}

const EVENTS: {
  key: keyof AlertConfig;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  desc: string;
  merchantEvent?: boolean;
  infoTitle: string;
  infoSteps: string[];
}[] = [
  {
    key: 'orderPlaced', icon: ShoppingCart,
    label: 'Order Placed', desc: 'Sent to customer when they successfully place an order.',
    infoTitle: 'Order Placed notification',
    infoSteps: [
      'Triggered immediately after checkout completes.',
      'Sent via enabled channels (SMS / WhatsApp / Email).',
      'Includes: order ID, item list, total, and estimated delivery.',
      'Customer must have provided an email or phone at checkout.',
    ],
  },
  {
    key: 'orderShipped', icon: Truck,
    label: 'Order Shipped', desc: 'Sent to customer when you mark an order as shipped.',
    infoTitle: 'Order Shipped notification',
    infoSteps: [
      'Triggered when order status changes to "Shipped" from the Orders page.',
      'Includes: order ID, tracking info (if provided), and estimated arrival.',
      'Configure channels in Notifications → Config before enabling.',
    ],
  },
  {
    key: 'orderDelivered', icon: CheckCircle2,
    label: 'Order Delivered', desc: 'Sent to customer when you mark an order as delivered.',
    infoTitle: 'Order Delivered notification',
    infoSteps: [
      'Triggered when order status changes to "Delivered" from the Orders page.',
      'A confirmation message is sent thanking the customer.',
      'Good opportunity to ask for a review or repeat purchase.',
    ],
  },
  {
    key: 'orderCancelled', icon: XCircle,
    label: 'Order Cancelled', desc: 'Sent to customer when an order is cancelled.',
    infoTitle: 'Order Cancelled notification',
    infoSteps: [
      'Triggered when order status changes to "Cancelled".',
      'Includes: order ID, reason (if provided), and refund info.',
      'Helps avoid confusion and reduces customer support queries.',
    ],
  },
  {
    key: 'orderRefunded', icon: RotateCcw,
    label: 'Order Refunded', desc: 'Sent to customer when a refund is issued.',
    infoTitle: 'Order Refunded notification',
    infoSteps: [
      'Triggered after you process a refund from the Orders page.',
      'Includes: refund amount and expected credit timeline.',
      'Requires your payment gateway (Razorpay) to support refunds.',
    ],
  },
  {
    key: 'orderPlacedMerchant', icon: Store,
    label: 'Order Placed (Merchant)', desc: 'Notifies you (the merchant) when a new order arrives.',
    merchantEvent: true,
    infoTitle: 'Order Placed — Merchant notification',
    infoSteps: [
      'Triggered when any customer places an order on your store.',
      'Sent to your registered contact channels (not the customer).',
      'Useful for staying on top of new orders without checking the dashboard.',
      'Configure your merchant contact in Shop Settings.',
    ],
  },
];

const CHANNELS: { key: keyof ChannelFlags; label: string; color: string }[] = [
  { key: 'sms', label: 'SMS', color: 'bg-blue-500' },
  { key: 'whatsapp', label: 'WhatsApp', color: 'bg-green-500' },
  { key: 'email', label: 'Email', color: 'bg-black' },
];

function ChannelToggle({ enabled, color, label, onToggle }: Readonly<{
  enabled: boolean; color: string; label: string; onToggle: () => void;
}>) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button type="button" aria-label={`Toggle ${label}`} onClick={onToggle}
        className={`relative w-9 h-5 rounded-full transition-colors ${enabled ? color : 'bg-neutral-300'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-4' : ''}`} />
      </button>
      <span className="text-[10px] text-neutral-400 font-medium">{label}</span>
    </div>
  );
}

export default function CustomerAlertsPage() {
  const [cfg, setCfg] = useState<AlertConfig>({
    orderPlaced: DEFAULT_FLAGS,
    orderShipped: DEFAULT_FLAGS,
    orderDelivered: DEFAULT_FLAGS,
    orderCancelled: DEFAULT_FLAGS,
    orderRefunded: OFF_FLAGS,
    orderPlacedMerchant: OFF_FLAGS,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [infoKey, setInfoKey] = useState<string | null>(null);

  useEffect(() => {
    api.get('/notifications/alert-config').then(r => {
      if (r.data.config) {
        const raw = r.data.config;
        setCfg({
          orderPlaced: toFlags(raw.orderPlaced, DEFAULT_FLAGS),
          orderShipped: toFlags(raw.orderShipped, DEFAULT_FLAGS),
          orderDelivered: toFlags(raw.orderDelivered, DEFAULT_FLAGS),
          orderCancelled: toFlags(raw.orderCancelled, DEFAULT_FLAGS),
          orderRefunded: toFlags(raw.orderRefunded, OFF_FLAGS),
          orderPlacedMerchant: toFlags(raw.orderPlacedMerchant, OFF_FLAGS),
        });
      }
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      await api.put('/notifications/alert-config', cfg);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError('Failed to save.'); }
    finally { setSaving(false); }
  };

  const toggleChannel = (eventKey: keyof AlertConfig, channel: keyof ChannelFlags) => {
    setCfg(c => {
      const cur = c[eventKey] ?? OFF_FLAGS;
      return { ...c, [eventKey]: { ...cur, [channel]: !cur[channel] } };
    });
  };

  const activeInfo = EVENTS.find(e => e.key === infoKey);

  return (
    <div className="w-full space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <Bell size={22} className="text-neutral-400" />
        <div>
          <h1 className="text-2xl font-bold">Customer Alerts</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Choose which events trigger a notification and on which channels. Configure channels in{' '}
            <a href="/notifications/config" className="underline">Notification Config</a>.
          </p>
        </div>
      </div>

      {activeInfo && (
        <InfoModal title={activeInfo.infoTitle} onClose={() => setInfoKey(null)}>
          <div className="space-y-2">
            {activeInfo.infoSteps.map((step, i) => (
              <div key={step} className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </div>
        </InfoModal>
      )}

      {/* Channel header legend */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-neutral-400">Channels:</span>
        {CHANNELS.map(c => (
          <span key={c.key} className={`text-xs font-medium px-2 py-0.5 rounded-full text-white ${c.color}`}>{c.label}</span>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event Triggers</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {EVENTS.map(({ key, icon: Icon, label, desc, merchantEvent }) => {
            const flags = cfg[key] ?? OFF_FLAGS;
            return (
              <div key={key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-neutral-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{label}</span>
                      {merchantEvent && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Merchant</span>
                      )}
                      <button type="button" onClick={() => setInfoKey(key)}
                        className="text-neutral-400 hover:text-neutral-600 inline-flex items-center shrink-0"
                        aria-label={`Info about ${label}`}>
                        <Info size={13} />
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500 truncate">{desc}</p>
                  </div>
                </div>
                <div className="flex gap-4 shrink-0">
                  {CHANNELS.map(ch => (
                    <ChannelToggle key={ch.key} enabled={flags[ch.key]} color={ch.color} label={ch.label}
                      onToggle={() => toggleChannel(key, ch.key)} />
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {saved && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 size={14} />Saved!</p>}
      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? 'Saving…' : 'Save Alert Settings'}
      </Button>
    </div>
  );
}
