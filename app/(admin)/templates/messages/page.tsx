'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare } from 'lucide-react';

type Channel = 'email' | 'whatsapp' | 'sms';
type EventKey = 'order_placed' | 'order_shipped' | 'order_delivered' | 'order_cancelled' | 'welcome' | 'order_placed_admin';

const EVENTS: { key: EventKey; label: string; vars: string[]; merchantEvent?: boolean }[] = [
  { key: 'order_placed',       label: 'Order Placed',            vars: ['{customerName}', '{orderId}', '{total}', '{storeName}'] },
  { key: 'order_shipped',      label: 'Order Shipped',           vars: ['{customerName}', '{orderId}', '{storeName}', '{deliveryService}', '{trackingId}'] },
  { key: 'order_delivered',    label: 'Order Delivered',         vars: ['{customerName}', '{orderId}', '{storeName}'] },
  { key: 'order_cancelled',    label: 'Order Cancelled',         vars: ['{customerName}', '{orderId}', '{storeName}'] },
  { key: 'welcome',            label: 'Welcome',                 vars: ['{customerName}', '{storeName}', '{storeUrl}'] },
  { key: 'order_placed_admin', label: 'Order Placed (Merchant)', vars: ['{merchantName}', '{orderId}', '{total}', '{customerName}', '{storeName}'], merchantEvent: true },
];

type Templates = Record<string, { subject?: string; body: string }>;

const DEFAULT_TEMPLATES: Record<EventKey, Record<Channel, { subject?: string; body: string }>> = {
  order_placed: {
    email:    { subject: 'Order #{orderId} confirmed – {storeName}', body: 'Hi {customerName},\n\nThank you for your order #{orderId}!\nTotal: {total}\n\nWe\'ll update you when it ships.\n\n{storeName}' },
    whatsapp: { body: 'Hi {customerName}! Your order #{orderId} from {storeName} is confirmed. Total: {total}. Thank you!' },
    sms:      { body: '{storeName}: Order #{orderId} confirmed. Total {total}. Thank you {customerName}!' },
  },
  order_shipped: {
    email:    { subject: 'Your order #{orderId} has shipped!', body: 'Hi {customerName},\n\nGreat news! Your order #{orderId} from {storeName} is on its way.\n\nDelivery Service: {deliveryService}\nTracking ID: {trackingId}\n\n{storeName}' },
    whatsapp: { body: 'Hi {customerName}! Your order #{orderId} from {storeName} has shipped.\nDelivery: {deliveryService} | Tracking: {trackingId}' },
    sms:      { body: '{storeName}: Order #{orderId} shipped via {deliveryService}. Track: {trackingId}' },
  },
  order_delivered: {
    email:    { subject: 'Order #{orderId} delivered', body: 'Hi {customerName},\n\nYour order #{orderId} from {storeName} has been delivered. Enjoy!\n\n{storeName}' },
    whatsapp: { body: 'Hi {customerName}! Your order #{orderId} from {storeName} has been delivered. Hope you love it!' },
    sms:      { body: '{storeName}: Order #{orderId} delivered. Hope you enjoy it, {customerName}!' },
  },
  order_cancelled: {
    email:    { subject: 'Order #{orderId} cancelled', body: 'Hi {customerName},\n\nYour order #{orderId} from {storeName} has been cancelled. Contact us if you have questions.\n\n{storeName}' },
    whatsapp: { body: 'Hi {customerName}. Your order #{orderId} from {storeName} has been cancelled. Contact us for help.' },
    sms:      { body: '{storeName}: Order #{orderId} cancelled. Contact us if you need help, {customerName}.' },
  },
  welcome: {
    email:    { subject: 'Welcome to {storeName}!', body: 'Hi {customerName},\n\nWelcome to {storeName}! Start shopping at {storeUrl}\n\n{storeName}' },
    whatsapp: { body: 'Hi {customerName}! Welcome to {storeName}. Start shopping: {storeUrl}' },
    sms:      { body: 'Welcome to {storeName}, {customerName}! Shop now: {storeUrl}' },
  },
  order_placed_admin: {
    email:    { subject: 'New order #{orderId} received – {storeName}', body: 'Hi {merchantName},\n\nA new order has been placed!\n\nOrder ID: #{orderId}\nCustomer: {customerName}\nTotal: {total}\n\nLog in to your dashboard to view and process it.\n\n{storeName}' },
    whatsapp: { body: 'Hi {merchantName}! New order #{orderId} from {customerName}. Total: {total}. Check your {storeName} dashboard.' },
    sms:      { body: '{storeName}: New order #{orderId} from {customerName}. Total: {total}.' },
  },
};

export default function MessageTemplatesPage() {
  const [channel, setChannel] = useState<Channel>('email');
  const [eventKey, setEventKey] = useState<EventKey>('order_placed');
  const [templates, setTemplates] = useState<Templates>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const storeKey = `${channel}_${eventKey}`;
  const currentEvent = EVENTS.find(e => e.key === eventKey)!;
  const isEmail = channel === 'email';

  const loadTemplates = useCallback(async () => {
    try {
      const r = await api.get('/store');
      const b = r.data.store?.branding || {};
      setTemplates((b.messageTemplates as Templates) || {});
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const current = templates[storeKey] || DEFAULT_TEMPLATES[eventKey][channel];

  const update = (field: 'subject' | 'body', value: string) => {
    setTemplates(prev => ({ ...prev, [storeKey]: { ...current, [field]: value } }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const storeRes = await api.get('/store');
      const existing = storeRes.data.store?.branding || {};
      await api.patch('/store', { branding: { ...existing, messageTemplates: templates } });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally { setSaving(false); }
  };

  const reset = () => {
    setTemplates(prev => {
      const next = { ...prev };
      delete next[storeKey];
      return next;
    });
  };

  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-bold">Message Templates</h1>
      <p className="text-sm text-neutral-500">
        Customize the messages sent for each event. Use variables like <code className="bg-neutral-100 px-1 rounded text-xs">{'{customerName}'}</code> which are replaced automatically.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Channel</Label>
          <Select value={channel} onValueChange={v => setChannel(v as Channel)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email"><span className="flex items-center gap-2"><Mail size={14} />Email</span></SelectItem>
              <SelectItem value="whatsapp"><span className="flex items-center gap-2"><MessageSquare size={14} />WhatsApp</span></SelectItem>
              <SelectItem value="sms"><span className="flex items-center gap-2"><MessageSquare size={14} />SMS</span></SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Event</Label>
          <Select value={eventKey} onValueChange={v => setEventKey(v as EventKey)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {EVENTS.map(e => (
                <SelectItem key={e.key} value={e.key}>
                  <span className="flex items-center gap-2">
                    {e.label}
                    {e.merchantEvent && <Badge variant="outline" className="text-[10px] px-1 py-0">Merchant</Badge>}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-neutral-400">Available variables:</span>
        {currentEvent.vars.map(v => (
          <code key={v} className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">{v}</code>
        ))}
        {currentEvent.merchantEvent && (
          <Badge variant="outline" className="text-[10px]">Sent to merchant</Badge>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{currentEvent.label} — {channel.charAt(0).toUpperCase() + channel.slice(1)}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {isEmail && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Subject</Label>
                <span className={`text-xs ${(current.subject || '').length > 100 ? 'text-red-500 font-medium' : 'text-neutral-400'}`}>
                  {(current.subject || '').length}/100
                </span>
              </div>
              <Input value={current.subject || ''} onChange={e => update('subject', e.target.value)} placeholder="Email subject line" maxLength={100} />
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Message Body</Label>
              <span className={`text-xs ${current.body.length > 1000 ? 'text-red-500 font-medium' : 'text-neutral-400'}`}>
                {current.body.length}/1000
              </span>
            </div>
            <Textarea value={current.body} onChange={e => update('body', e.target.value)}
              rows={isEmail ? 8 : 4} placeholder="Message content…" className="font-mono text-sm" maxLength={1000} />
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={reset}>Reset to Default</Button>
          </div>
        </CardContent>
      </Card>

      {success && <p className="text-sm text-green-600">✓ Templates saved!</p>}
      <Button onClick={save} disabled={saving} className="w-full">{saving ? 'Saving…' : 'Save Templates'}</Button>
    </div>
  );
}
