'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, Mail, MessageCircle, Bell } from 'lucide-react';
import { WhatsAppProviderFields, type WhatsAppFormValues } from '@/components/notifications/WhatsAppProviderFields';
import { TestSendButtons } from '@/components/notifications/TestSendButtons';

interface NotifConfig extends WhatsAppFormValues {
  smtpHost?: string; smtpPort?: number; smtpUser?: string; smtpPassword?: string; smtpFrom?: string;
  emailEnabled?: boolean;
}

interface AlertConfig {
  orderPlaced?: boolean;
  orderShipped?: boolean;
  orderDelivered?: boolean;
  orderCancelled?: boolean;
  orderRefunded?: boolean;
}

const ALERTS: { key: keyof AlertConfig; label: string; desc: string }[] = [
  { key: 'orderPlaced', label: 'Order Placed', desc: 'When a customer successfully places an order.' },
  { key: 'orderShipped', label: 'Order Shipped', desc: 'When you mark an order as shipped.' },
  { key: 'orderDelivered', label: 'Order Delivered', desc: 'When you mark an order as delivered.' },
  { key: 'orderCancelled', label: 'Order Cancelled', desc: 'When an order is cancelled.' },
  { key: 'orderRefunded', label: 'Order Refunded', desc: 'When a refund is issued.' },
];

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [cfg, setCfg] = useState<NotifConfig>({
    smtpHost: 'smtp.gmail.com', smtpPort: 587, emailEnabled: false,
    waProvider: 'META', waEnabled: false,
  });
  const [alerts, setAlerts] = useState<AlertConfig>({
    orderPlaced: true, orderShipped: true, orderDelivered: true, orderCancelled: true, orderRefunded: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [cfgRes, alertRes, storeRes] = await Promise.all([
          api.get('/notifications/config').catch(() => ({ data: { config: null } })),
          api.get('/notifications/alert-config').catch(() => ({ data: { config: null } })),
          api.get('/store').catch(() => ({ data: { store: null } })),
        ]);
        if (cfgRes.data.config) {
          setCfg(c => ({ ...c, ...cfgRes.data.config }));
        } else {
          const b = (storeRes.data.store?.branding ?? {}) as Record<string, unknown>;
          const nested = b.notifications as Record<string, Record<string, unknown>> | undefined;
          const wa = (nested?.whatsapp ?? b.whatsapp) as Record<string, unknown> | undefined;
          const email = (nested?.emailSmtp ?? b.emailNotif) as Record<string, unknown> | undefined;
          if (wa) {
            const provider = String(wa.provider || 'meta').toLowerCase() === 'twilio' ? 'TWILIO' : 'META';
            setCfg(c => ({
              ...c,
              waEnabled: !!wa.enabled,
              waProvider: provider,
              waPhoneId: (wa.number as string) || c.waPhoneId,
              waApiKey: (wa.apiKey as string) || c.waApiKey,
              waAccountSid: (wa.accountSid as string) || c.waAccountSid,
            }));
          }
          if (email) {
            setCfg(c => ({
              ...c,
              emailEnabled: !!email.enabled,
              smtpHost: String(email.smtpHost ?? email.host ?? c.smtpHost ?? ''),
              smtpPort: Number(email.smtpPort ?? email.port ?? c.smtpPort ?? 587),
              smtpUser: String(email.smtpUser ?? email.user ?? ''),
              smtpPassword: String(email.smtpPass ?? email.pass ?? ''),
              smtpFrom: String(email.smtpUser ?? email.user ?? ''),
            }));
          }
        }
        if (alertRes.data.config) setAlerts(c => ({ ...c, ...alertRes.data.config }));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await Promise.all([
        api.put('/notifications/config', cfg),
        api.put('/notifications/alert-config', alerts),
      ]);
      setSuccess('Settings saved.');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to save.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Notification Settings</h1>
        <p className="text-sm text-neutral-500">Configure channels and which order events notify your customers.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Mail size={16} />Email (SMTP)</CardTitle>
              <button type="button" aria-label="Enable email"
                onClick={() => setCfg(c => ({ ...c, emailEnabled: !c.emailEnabled }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${cfg.emailEnabled ? 'bg-black' : 'bg-neutral-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${cfg.emailEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </CardHeader>
          <CardContent className={`space-y-3 ${!cfg.emailEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>SMTP Host</Label>
                <Input value={cfg.smtpHost || ''} onChange={e => setCfg(c => ({ ...c, smtpHost: e.target.value }))} placeholder="smtp.gmail.com" />
              </div>
              <div className="space-y-1">
                <Label>Port</Label>
                <Input type="number" value={cfg.smtpPort || ''} onChange={e => setCfg(c => ({ ...c, smtpPort: Number(e.target.value) }))} placeholder="587" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Username / Email</Label>
              <Input value={cfg.smtpUser || ''} onChange={e => setCfg(c => ({ ...c, smtpUser: e.target.value, smtpFrom: e.target.value }))} placeholder="noreply@mystore.com" />
            </div>
            <div className="space-y-1">
              <Label>Password / App Password</Label>
              <Input type="password" value={cfg.smtpPassword === '••••••••' ? '' : (cfg.smtpPassword || '')}
                onChange={e => setCfg(c => ({ ...c, smtpPassword: e.target.value }))} placeholder="••••••••••••" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><MessageCircle size={16} />WhatsApp</CardTitle>
              <button type="button" aria-label="Enable WhatsApp"
                onClick={() => setCfg(c => ({ ...c, waEnabled: !c.waEnabled }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${cfg.waEnabled ? 'bg-green-500' : 'bg-neutral-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${cfg.waEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </CardHeader>
          <CardContent className={`space-y-3 ${!cfg.waEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <WhatsAppProviderFields cfg={cfg} onChange={patch => setCfg(c => ({ ...c, ...patch }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Send a test</CardTitle>
          </CardHeader>
          <CardContent>
            <TestSendButtons emailEnabled={cfg.emailEnabled} waEnabled={cfg.waEnabled} defaultEmail={cfg.smtpUser} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Bell size={16} />Customer alerts</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {ALERTS.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <span className="text-sm font-medium">{label}</span>
                  <p className="text-xs text-neutral-500">{desc}</p>
                </div>
                <button type="button" aria-label={`Toggle ${label}`}
                  onClick={() => setAlerts(c => ({ ...c, [key]: !c[key] }))}
                  className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${alerts[key] ? 'bg-black' : 'bg-neutral-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${alerts[key] ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 size={14} />{success}</p>}

        <Button type="submit" disabled={saving} className="gap-2">
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save Changes
        </Button>
      </form>
    </div>
  );
}
