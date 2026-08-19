'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';

interface ProviderField { key: string; label: string; type: string }
interface Provider {
  provider: string;
  displayName: string;
  enabled: boolean;
  configured: boolean;
  fields: ProviderField[];
  maskedCreds: Record<string, string>;
}

interface PincodeFallback { id: string; pincode: string; charge: number; label?: string }

const PROVIDER_ICONS: Record<string, string> = {
  own: '🚚',
  nimbuspost: '📦',
  shiprocket: '🚀',
  delhivery: '🏎',
  ecom_express: '⚡',
  shipway: '🛳',
  clickpost: '🖱',
};

export default function ShippingSettingsPage() {
  const [pickupPincode, setPickupPincode] = useState('');
  const [defaultWeight, setDefaultWeight] = useState(0.5);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [credInputs, setCredInputs] = useState<Record<string, Record<string, string>>>({});
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [error, setError] = useState('');

  const [fallbacks, setFallbacks] = useState<PincodeFallback[]>([]);
  const [newPin, setNewPin] = useState('');
  const [newCharge, setNewCharge] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const load = useCallback(async () => {
    const [provRes, fallRes] = await Promise.all([
      api.get('/shipping/providers').catch(() => null),
      api.get('/shipping/fallbacks').catch(() => null),
    ]);
    if (provRes?.data) {
      setProviders(provRes.data.providers ?? []);
      setActiveProvider(provRes.data.activeProvider ?? null);
      setPickupPincode(provRes.data.pickupPincode ?? '');
      setDefaultWeight(provRes.data.defaultWeight ?? 0.5);
      // Pre-fill credential inputs with masked values so UI shows configured state
      const inputs: Record<string, Record<string, string>> = {};
      for (const p of (provRes.data.providers ?? []) as Provider[]) {
        inputs[p.provider] = { ...p.maskedCreds };
      }
      setCredInputs(inputs);
    }
    if (fallRes?.data) setFallbacks(fallRes.data.fallbacks ?? []);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const saveConfig = async () => {
    setSavingConfig(true); setError('');
    try {
      await api.post('/shipping/config', { pickupPincode, defaultWeight });
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
    } catch { setError('Failed to save config.'); }
    finally { setSavingConfig(false); }
  };

  const saveProviderCreds = async (provider: string) => {
    setSavingProvider(provider); setError('');
    try {
      await api.post(`/shipping/providers/${provider}`, { credentials: credInputs[provider] ?? {} });
      await load();
      setExpandedProvider(null);
    } catch { setError(`Failed to save ${provider} credentials.`); }
    finally { setSavingProvider(null); }
  };

  const toggleProvider = async (provider: string, enabled: boolean) => {
    setError('');
    try {
      await api.patch(`/shipping/providers/${provider}/toggle`, { enabled });
      setProviders(prev => prev.map(p => p.provider === provider ? { ...p, enabled } : p));
    } catch { setError(`Failed to ${enabled ? 'enable' : 'disable'} ${provider}.`); }
  };

  const activateProvider = async (provider: string) => {
    setError('');
    // Ensure config exists first
    if (!pickupPincode) { setError('Set a pickup pincode before activating a provider.'); return; }
    try {
      await api.patch('/shipping/providers/activate', { provider });
      setActiveProvider(provider);
    } catch { setError('Failed to set active provider.'); }
  };

  const resolvePincode = async (pin: string) => {
    if (pin.length !== 6) return;
    try {
      const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await r.json() as [{ Status: string; PostOffice?: [{ District: string; State: string }] }];
      if (data[0]?.Status === 'Success' && data[0].PostOffice?.[0]) {
        const { District, State } = data[0].PostOffice[0];
        setNewLabel(`${District}, ${State}`);
      }
    } catch { /* ignore */ }
  };

  const addFallback = async () => {
    if (!newPin || !newCharge) return;
    try {
      const r = await api.post('/shipping/fallbacks', { pincode: newPin, charge: Number(newCharge), label: newLabel || undefined });
      setFallbacks(prev => [...prev.filter(f => f.pincode !== newPin), r.data.fallback]);
      setNewPin(''); setNewCharge(''); setNewLabel('');
    } catch { setError('Failed to add pincode.'); }
  };

  const removeFallback = async (id: string) => {
    try {
      await api.delete(`/shipping/fallbacks/${id}`);
      setFallbacks(prev => prev.filter(f => f.id !== id));
    } catch { setError('Failed to remove pincode.'); }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <Truck size={22} className="text-neutral-400" />
        <div>
          <h1 className="text-2xl font-bold">Shipping</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Configure shipping providers. The active provider is used to book shipments and return pickups automatically.</p>
        </div>
      </div>

      {/* General config */}
      <Card>
        <CardHeader><CardTitle className="text-base">General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Pickup Pincode</Label>
              <Input placeholder="682001" value={pickupPincode} onChange={e => setPickupPincode(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Default Package Weight (kg)</Label>
              <Input type="number" min={0.1} step={0.1} value={defaultWeight}
                onChange={e => setDefaultWeight(Number(e.target.value))} />
            </div>
          </div>
          {configSaved && <p className="text-sm text-green-600">Saved!</p>}
          <Button type="button" onClick={saveConfig} disabled={savingConfig} size="sm">
            {savingConfig ? 'Saving…' : 'Save'}
          </Button>
        </CardContent>
      </Card>

      {/* Provider list */}
      <Card>
        <CardHeader><CardTitle className="text-base">Shipping Providers</CardTitle></CardHeader>
        <CardContent className="space-y-2 p-0">
          {providers.map(p => {
            const isActive = activeProvider === p.provider;
            const isExpanded = expandedProvider === p.provider;
            const creds = credInputs[p.provider] ?? {};
            let configStatus = 'Not configured';
            if (p.provider === 'own') configStatus = 'You handle delivery yourself';
            else if (p.configured) configStatus = 'Credentials saved';

            return (
              <div key={p.provider} className={`border-b last:border-b-0 ${isActive ? 'bg-green-50' : ''}`}>
                {/* Provider header row */}
                <div className="flex items-center justify-between px-4 py-3 gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl">{PROVIDER_ICONS[p.provider] ?? '📦'}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{p.displayName}</span>
                        {isActive && (
                          <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">Active</span>
                        )}
                        {p.configured && !isActive && (
                          <span className="text-[10px] bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded-full">Configured</span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {configStatus}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Enable toggle (skip for own) */}
                    {p.provider !== 'own' && (
                      <button
                        type="button"
                        onClick={() => toggleProvider(p.provider, !p.enabled)}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          p.enabled ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-500 hover:border-black'
                        }`}
                      >
                        {p.enabled ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                        {p.enabled ? 'Enabled' : 'Enable'}
                      </button>
                    )}

                    {/* Set active */}
                    {!isActive && (p.configured || p.provider === 'own') && (
                      <Button type="button" size="sm" variant="outline" className="h-7 text-xs px-2.5"
                        onClick={() => activateProvider(p.provider)}>
                        Set Active
                      </Button>
                    )}

                    {/* Expand to configure (skip for own) */}
                    {p.provider !== 'own' && (
                      <button type="button"
                        onClick={() => setExpandedProvider(isExpanded ? null : p.provider)}
                        className="text-neutral-400 hover:text-black p-1">
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Credential form */}
                {isExpanded && p.fields.length > 0 && (
                  <div className="px-4 pb-4 pt-1 bg-neutral-50 border-t space-y-3">
                    <p className="text-xs text-neutral-500">Enter your {p.displayName} API credentials.</p>
                    {p.fields.map(field => (
                      <div key={field.key} className="space-y-1">
                        <Label className="text-xs">{field.label}</Label>
                        <Input
                          type={field.type}
                          placeholder={field.type === 'password' ? '••••••••' : field.label}
                          value={creds[field.key] ?? ''}
                          onChange={e => setCredInputs(prev => ({
                            ...prev,
                            [p.provider]: { ...prev[p.provider], [field.key]: e.target.value },
                          }))}
                        />
                      </div>
                    ))}
                    <Button type="button" size="sm" disabled={savingProvider === p.provider}
                      onClick={() => saveProviderCreds(p.provider)}>
                      {savingProvider === p.provider ? 'Saving…' : 'Save Credentials'}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Pincode Fallbacks */}
      <Card>
        <CardHeader><CardTitle className="text-base">Pincode Fallbacks</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-neutral-500">Flat shipping charges for specific pincodes when the courier returns no rate.</p>
          <div className="flex gap-2">
            <Input placeholder="Pincode" maxLength={10} className="w-28" value={newPin}
              onChange={e => { setNewPin(e.target.value); resolvePincode(e.target.value); }} />
            <Input placeholder="Label (auto)" className="flex-1" value={newLabel}
              onChange={e => setNewLabel(e.target.value)} />
            <Input placeholder="Charge" type="number" min={0} className="w-24"
              value={newCharge} onChange={e => setNewCharge(e.target.value)} />
            <Button type="button" variant="outline" size="sm" onClick={addFallback}>Add</Button>
          </div>
          {fallbacks.length > 0 && (
            <div className="rounded-lg border divide-y text-sm">
              {fallbacks.map(f => (
                <div key={f.id} className="flex items-center justify-between px-3 py-2">
                  <span className="font-mono">{f.pincode}</span>
                  <span className="text-neutral-500 flex-1 mx-3 truncate">{f.label}</span>
                  <span className="font-medium mr-3">₹{f.charge}</span>
                  <button type="button" onClick={() => removeFallback(f.id)} className="text-neutral-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
