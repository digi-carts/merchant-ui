'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoModal } from '@/components/ui/info-modal';
import { useInfoContent } from '@/lib/use-info-content';
import { Bell, Mail, MessageCircle, Phone, CheckCircle2, Info } from 'lucide-react';
import { WhatsAppProviderFields } from '@/components/notifications/WhatsAppProviderFields';
import { TestSendButtons } from '@/components/notifications/TestSendButtons';

const SMS_PROVIDERS = [
  { value: 'msg91', label: 'MSG91' },
  { value: 'twilio', label: 'Twilio' },
  { value: 'textlocal', label: 'TextLocal' },
  { value: 'fast2sms', label: 'Fast2SMS' },
  { value: 'kaleyra', label: 'Kaleyra' },
];

interface NotifConfig {
  smtpHost?: string; smtpPort?: number; smtpUser?: string; smtpPassword?: string; smtpFrom?: string;
  emailEnabled?: boolean;
  waProvider?: 'META' | 'TWILIO'; waApiKey?: string; waPhoneId?: string;
  waAccountSid?: string; waAuthToken?: string; waEnabled?: boolean;
  smsEnabled?: boolean; smsProvider?: string; smsApiKey?: string; smsSenderId?: string;
}

function Step({ n, children }: Readonly<{ n: number; children: React.ReactNode }>) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 w-5 h-5 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold">{n}</span>
      <span>{children}</span>
    </div>
  );
}

function A({ href, children }: Readonly<{ href: string; children: React.ReactNode }>) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">{children}</a>;
}

export default function NotificationsPage() {
  const info = useInfoContent();
  const [cfg, setCfg] = useState<NotifConfig>({
    smtpHost: 'smtp.gmail.com', smtpPort: 587, emailEnabled: false,
    waProvider: 'META', waEnabled: false,
    smsEnabled: false, smsProvider: 'msg91',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [emailInfoOpen, setEmailInfoOpen] = useState(false);
  const [waInfoOpen, setWaInfoOpen] = useState(false);

  useEffect(() => {
    api.get('/notifications/config').then(r => {
      if (r.data.config) setCfg(c => ({ ...c, ...r.data.config }));
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      await api.put('/notifications/config', cfg);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError('Failed to save.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <Bell size={22} className="text-neutral-400" />
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>
      <p className="text-sm text-neutral-500">Configure how customers are notified when they place or update an order.</p>

      {emailInfoOpen && (
        <InfoModal title={info.emailNotif?.title ?? 'How to set up Gmail SMTP'} onClose={() => setEmailInfoOpen(false)}>
          {(info.emailNotif?.steps ?? []).map((s, i) => <Step key={s} n={i + 1}>{s}</Step>)}
          {info.emailNotif?.note && <p className="text-xs text-neutral-400 pt-2">{info.emailNotif.note}</p>}
          {info.emailNotif?.youtubeUrl && (
            <div className="border-t pt-3 mt-2">
              <A href={info.emailNotif.youtubeUrl}>▶ Watch tutorial on YouTube</A>
            </div>
          )}
        </InfoModal>
      )}

      {waInfoOpen && (
        <InfoModal title={info.whatsappNotif?.title ?? 'How to set up WhatsApp notifications'} onClose={() => setWaInfoOpen(false)}>
          {(info.whatsappNotif?.steps ?? []).map((s, i) => <Step key={s} n={i + 1}>{s}</Step>)}
          {info.whatsappNotif?.note && <p className="text-xs text-neutral-400 pt-2">{info.whatsappNotif.note}</p>}
          {info.whatsappNotif?.youtubeUrl && (
            <div className="border-t pt-3 mt-2">
              <A href={info.whatsappNotif.youtubeUrl}>▶ Watch tutorial on YouTube</A>
            </div>
          )}
        </InfoModal>
      )}

      {/* Email */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail size={16} />Email (SMTP)
              <button type="button" onClick={() => setEmailInfoOpen(true)}
                className="text-neutral-400 hover:text-neutral-600 inline-flex items-center" aria-label="Email setup guide">
                <Info size={14} />
              </button>
            </CardTitle>
            <div className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-sm text-neutral-500">Enable</span>
              <button type="button" aria-label="Enable email notifications"
                onClick={() => setCfg(c => ({ ...c, emailEnabled: !c.emailEnabled }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${cfg.emailEnabled ? 'bg-black' : 'bg-neutral-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${cfg.emailEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>SMTP Host</Label>
              <Input placeholder="smtp.gmail.com" value={cfg.smtpHost || ''}
                onChange={e => setCfg(c => ({ ...c, smtpHost: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Port</Label>
              <Input type="number" placeholder="587" value={cfg.smtpPort || ''}
                onChange={e => setCfg(c => ({ ...c, smtpPort: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Email (sender)</Label>
            <Input type="email" placeholder="yourstore@gmail.com" value={cfg.smtpUser || ''}
              onChange={e => setCfg(c => ({ ...c, smtpUser: e.target.value, smtpFrom: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>App Password</Label>
            <Input type="password" placeholder={cfg.smtpPassword === '••••••••' ? '••••••••' : 'Gmail App Password'}
              value={cfg.smtpPassword === '••••••••' ? '' : (cfg.smtpPassword || '')}
              onChange={e => setCfg(c => ({ ...c, smtpPassword: e.target.value }))} />
            <p className="text-xs text-neutral-400">
              For Gmail: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline">myaccount.google.com/apppasswords</a> → create an App Password
            </p>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle size={16} />WhatsApp
              <button type="button" onClick={() => setWaInfoOpen(true)}
                className="text-neutral-400 hover:text-neutral-600 inline-flex items-center" aria-label="WhatsApp setup guide">
                <Info size={14} />
              </button>
            </CardTitle>
            <div className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-sm text-neutral-500">Enable</span>
              <button type="button" aria-label="Enable WhatsApp notifications"
                onClick={() => setCfg(c => ({ ...c, waEnabled: !c.waEnabled }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${cfg.waEnabled ? 'bg-green-500' : 'bg-neutral-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${cfg.waEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <WhatsAppProviderFields cfg={cfg} onChange={patch => setCfg(c => ({ ...c, ...patch }))} />
        </CardContent>
      </Card>

      {/* SMS */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone size={16} />SMS
            </CardTitle>
            <div className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-sm text-neutral-500">Enable</span>
              <button type="button" aria-label="Enable SMS notifications"
                onClick={() => setCfg(c => ({ ...c, smsEnabled: !c.smsEnabled }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${cfg.smsEnabled ? 'bg-blue-500' : 'bg-neutral-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${cfg.smsEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Provider</Label>
            <select value={cfg.smsProvider || 'msg91'}
              onChange={e => setCfg(c => ({ ...c, smsProvider: e.target.value }))}
              className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
              {SMS_PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label>API Key / Auth Token</Label>
            <Input type="password" placeholder="••••••••••••" value={cfg.smsApiKey || ''}
              onChange={e => setCfg(c => ({ ...c, smsApiKey: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Sender ID <span className="text-neutral-400 text-xs font-normal">(optional)</span></Label>
            <Input placeholder="MYSTORE" value={cfg.smsSenderId || ''}
              onChange={e => setCfg(c => ({ ...c, smsSenderId: e.target.value.toUpperCase() }))}
              maxLength={11} />
            <p className="text-xs text-neutral-400">6-character sender name shown on customer phones (if supported by provider).</p>
          </div>
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

      {error && <p className="text-sm text-red-500">{error}</p>}
      {saved && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 size={14} />Saved!</p>}
      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? 'Saving…' : 'Save Notification Settings'}
      </Button>
    </div>
  );
}
