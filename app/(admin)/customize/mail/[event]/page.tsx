'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Mail } from 'lucide-react';

const EVENT_META: Record<string, { title: string; desc: string; vars: string[] }> = {
  'order-placed': {
    title: 'Order Placed',
    desc: 'Sent to the customer immediately after they place an order.',
    vars: ['{{customer_name}}', '{{order_id}}', '{{order_total}}', '{{store_name}}', '{{items_list}}'],
  },
  'order-shipped': {
    title: 'Order Shipped',
    desc: 'Sent when the merchant marks an order as shipped.',
    vars: ['{{customer_name}}', '{{order_id}}', '{{tracking_number}}', '{{store_name}}'],
  },
  'order-delivered': {
    title: 'Order Delivered',
    desc: 'Sent when the order status changes to delivered.',
    vars: ['{{customer_name}}', '{{order_id}}', '{{store_name}}'],
  },
  'order-cancelled': {
    title: 'Order Cancelled',
    desc: 'Sent when an order is cancelled by the merchant or customer.',
    vars: ['{{customer_name}}', '{{order_id}}', '{{order_total}}', '{{store_name}}'],
  },
  'welcome': {
    title: 'Welcome',
    desc: 'Sent when a new customer registers on the storefront.',
    vars: ['{{customer_name}}', '{{store_name}}', '{{store_url}}'],
  },
  'password-reset': {
    title: 'Password Reset',
    desc: 'Sent when a customer requests a password reset.',
    vars: ['{{customer_name}}', '{{reset_link}}', '{{store_name}}'],
  },
};

const DEFAULT_SUBJECTS: Record<string, string> = {
  'order-placed': 'Your order #{{order_id}} has been placed!',
  'order-shipped': 'Your order #{{order_id}} is on its way',
  'order-delivered': 'Your order #{{order_id}} has been delivered',
  'order-cancelled': 'Your order #{{order_id}} has been cancelled',
  'welcome': 'Welcome to {{store_name}}!',
  'password-reset': 'Reset your password for {{store_name}}',
};

const DEFAULT_BODIES: Record<string, string> = {
  'order-placed': `Hi {{customer_name}},\n\nThank you for your order! We've received your order #{{order_id}} for {{order_total}}.\n\nItems:\n{{items_list}}\n\nWe'll notify you when it ships.\n\nThanks,\n{{store_name}}`,
  'order-shipped': `Hi {{customer_name}},\n\nGreat news! Your order #{{order_id}} has been shipped.\n\nTracking number: {{tracking_number}}\n\nThanks,\n{{store_name}}`,
  'order-delivered': `Hi {{customer_name}},\n\nYour order #{{order_id}} has been delivered. We hope you love it!\n\nThanks for shopping with us,\n{{store_name}}`,
  'order-cancelled': `Hi {{customer_name}},\n\nYour order #{{order_id}} ({{order_total}}) has been cancelled.\n\nIf you have questions, please contact us.\n\nThanks,\n{{store_name}}`,
  'welcome': `Hi {{customer_name}},\n\nWelcome to {{store_name}}! We're excited to have you.\n\nStart shopping at: {{store_url}}\n\nThanks,\n{{store_name}}`,
  'password-reset': `Hi {{customer_name}},\n\nYou requested a password reset for your {{store_name}} account.\n\nClick the link below to reset your password:\n{{reset_link}}\n\nIf you didn't request this, ignore this email.\n\nThanks,\n{{store_name}}`,
};

export default function MailTemplatePage() {
  const params = useParams();
  const event = params.event as string;
  const meta = EVENT_META[event];

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!event) return;
    setLoading(true);
    api.get(`/store/mail-templates/${event}`)
      .then(r => {
        setSubject(r.data.subject || DEFAULT_SUBJECTS[event] || '');
        setBody(r.data.body || DEFAULT_BODIES[event] || '');
        setEnabled(r.data.enabled !== false);
      })
      .catch(() => {
        setSubject(DEFAULT_SUBJECTS[event] || '');
        setBody(DEFAULT_BODIES[event] || '');
        setEnabled(true);
      })
      .finally(() => setLoading(false));
  }, [event]);

  const save = async () => {
    setSaving(true); setMsg(''); setError('');
    try {
      await api.patch(`/store/mail-templates/${event}`, { subject, body, enabled });
      setMsg('Template saved');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setError('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setSubject(DEFAULT_SUBJECTS[event] || '');
    setBody(DEFAULT_BODIES[event] || '');
  };

  if (!meta) return <div className="p-8 text-neutral-400">Unknown mail event.</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Mail size={18} className="text-neutral-400" />
          <h1 className="text-xl font-bold">{meta.title}</h1>
        </div>
        <p className="text-sm text-neutral-500">{meta.desc}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Template</CardTitle>
            <label className="flex items-center gap-2 text-xs text-neutral-500 cursor-pointer">
              <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="rounded" />
              Send this email
            </label>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="h-32 flex items-center justify-center text-neutral-400 text-sm">Loading…</div>
          ) : (
            <>
              <div className="space-y-1">
                <Label>Subject</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject…" />
              </div>
              <div className="space-y-1">
                <Label>Body</Label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={12}
                  className="w-full font-mono text-sm border rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Email body…"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button type="button" onClick={reset}
                  className="text-xs text-neutral-400 hover:text-neutral-700 underline">
                  Reset to default
                </button>
                <div className="flex items-center gap-3">
                  {msg && <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 size={12} />{msg}</span>}
                  {error && <span className="text-xs text-red-500">{error}</span>}
                  <Button size="sm" onClick={save} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Template'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Available variables */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-neutral-500">Available variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {meta.vars.map(v => (
              <code key={v} className="text-xs bg-neutral-100 border rounded px-2 py-0.5 font-mono text-neutral-700">{v}</code>
            ))}
          </div>
          <p className="text-xs text-neutral-400 mt-2">Copy and paste these into your subject or body. They'll be replaced with real values when the email is sent.</p>
        </CardContent>
      </Card>
    </div>
  );
}
