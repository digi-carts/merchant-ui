'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertCircle } from 'lucide-react';

type Channel = 'EMAIL' | 'WHATSAPP' | 'BOTH';

export function TestSendButtons({
  emailEnabled,
  waEnabled,
  defaultEmail,
}: Readonly<{ emailEnabled?: boolean; waEnabled?: boolean; defaultEmail?: string }>) {
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testing, setTesting] = useState<Channel | null>(null);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const send = async (channel: Channel) => {
    setTesting(channel); setResult(null);
    try {
      const { data } = await api.post('/notifications/notify/test', {
        channel,
        toEmail: testEmail || defaultEmail || undefined,
        toPhone: testPhone || undefined,
      });
      const lines = (data.results as { channel: string; ok: boolean; error?: string }[] | undefined)
        ?.map(r => r.ok ? `${r.channel}: sent` : `${r.channel}: ${r.error || 'failed'}`)
        .join(' · ');
      setResult({ ok: !!data.ok, msg: lines || (data.ok ? 'Test sent.' : 'Test failed.') });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { results?: { channel: string; ok: boolean; error?: string }[]; error?: string } } };
      const lines = err.response?.data?.results
        ?.map(r => r.ok ? `${r.channel}: sent` : `${r.channel}: ${r.error || 'failed'}`)
        .join(' · ');
      setResult({ ok: false, msg: lines || err.response?.data?.error || 'Failed to send test.' });
    } finally { setTesting(null); }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Test email</Label>
          <Input type="email" placeholder={defaultEmail || 'you@example.com'} value={testEmail}
            onChange={e => setTestEmail(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Test phone</Label>
          <Input placeholder="+919876543210" value={testPhone}
            onChange={e => setTestPhone(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={!emailEnabled || testing !== null}
          onClick={() => send('EMAIL')}>
          {testing === 'EMAIL' ? 'Sending…' : 'Send test email'}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={!waEnabled || testing !== null}
          onClick={() => send('WHATSAPP')}>
          {testing === 'WHATSAPP' ? 'Sending…' : 'Send test WhatsApp'}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={(!emailEnabled && !waEnabled) || testing !== null}
          onClick={() => send('BOTH')}>
          {testing === 'BOTH' ? 'Sending…' : 'Send test message'}
        </Button>
      </div>
      {result && (
        <p className={`text-sm flex items-center gap-1 ${result.ok ? 'text-green-600' : 'text-red-500'}`}>
          {result.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {result.msg}
        </p>
      )}
    </div>
  );
}
