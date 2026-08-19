'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type WaProvider = 'META' | 'TWILIO';

export interface WhatsAppFormValues {
  waProvider?: WaProvider;
  waApiKey?: string;
  waPhoneId?: string;
  waAccountSid?: string;
  waAuthToken?: string;
  waEnabled?: boolean;
}

interface Props {
  readonly cfg: WhatsAppFormValues;
  readonly onChange: (patch: Partial<WhatsAppFormValues>) => void;
}

const MASK = '••••••••';

export function WhatsAppProviderFields({ cfg, onChange }: Props) {
  const provider = cfg.waProvider ?? 'META';
  const secretValue = (v?: string) => (v === MASK ? '' : (v || ''));

  return (
    <>
      <div className="space-y-1">
        <Label>Provider</Label>
        <div className="flex gap-2">
          {(['META', 'TWILIO'] as const).map(p => (
            <button key={p} type="button"
              onClick={() => onChange({ waProvider: p })}
              className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${provider === p ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
              {p === 'META' ? 'Meta (WhatsApp Business API)' : 'Twilio'}
            </button>
          ))}
        </div>
      </div>
      {provider === 'META' ? (
        <>
          <div className="space-y-1">
            <Label>Access Token</Label>
            <Input type="password" placeholder={cfg.waApiKey === MASK ? MASK : 'EAAxxxxxx…'}
              value={secretValue(cfg.waApiKey)}
              onChange={e => onChange({ waApiKey: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Phone Number ID</Label>
            <Input placeholder="123456789012345" value={cfg.waPhoneId || ''}
              onChange={e => onChange({ waPhoneId: e.target.value })} />
            <p className="text-xs text-neutral-400">
              Get from <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="underline">Meta for Developers</a> → Your App → WhatsApp → API Setup
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1">
            <Label>Account SID</Label>
            <Input placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={cfg.waAccountSid || ''}
              onChange={e => onChange({ waAccountSid: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Auth Token</Label>
            <Input type="password" placeholder={cfg.waAuthToken === MASK ? MASK : 'Twilio Auth Token'}
              value={secretValue(cfg.waAuthToken)}
              onChange={e => onChange({ waAuthToken: e.target.value })} />
            <p className="text-xs text-neutral-400">
              From <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="underline">Twilio Console</a> → Account Info
            </p>
          </div>
          <div className="space-y-1">
            <Label>Twilio WhatsApp Number</Label>
            <Input placeholder="+14155238886" value={cfg.waPhoneId || ''}
              onChange={e => onChange({ waPhoneId: e.target.value })} />
          </div>
        </>
      )}
    </>
  );
}
