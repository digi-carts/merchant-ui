'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload } from 'lucide-react';

const CURRENCIES = [
  { code: 'INR', label: 'INR — Indian Rupee' }, { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' }, { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'AUD', label: 'AUD — Australian Dollar' }, { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'SGD', label: 'SGD — Singapore Dollar' }, { code: 'AED', label: 'AED — UAE Dirham' },
  { code: 'JPY', label: 'JPY — Japanese Yen' }, { code: 'MYR', label: 'MYR — Malaysian Ringgit' },
];

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Australia', 'Canada', 'Singapore', 'UAE', 'Germany', 'France', 'Japan'];

const PHONE_CODES = [
  { code: '+91', label: '🇮🇳 +91' }, { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' }, { code: '+61', label: '🇦🇺 +61' },
  { code: '+971', label: '🇦🇪 +971' }, { code: '+65', label: '🇸🇬 +65' },
  { code: '+60', label: '🇲🇾 +60' }, { code: '+81', label: '🇯🇵 +81' },
  { code: '+49', label: '🇩🇪 +49' }, { code: '+33', label: '🇫🇷 +33' },
];

function Field({ label, required, error, hint, children }: Readonly<{
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}>) {
  return (
    <div className="space-y-1">
      <Label>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
      {hint && !error && <p className="text-xs text-neutral-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function ImageUpload({ label, hint, url, onUrl }: Readonly<{ label: string; hint: string; url: string; onUrl: (u: string) => void }>) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const handle = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const { data } = await api.post('/store/upload', fd);
      onUrl(data.url as string);
    } catch { /* upload failed */ } finally { setUploading(false); }
  };
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        {url && <img src={url} alt={label} className="w-10 h-10 rounded object-cover border" />}
        <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
          className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm hover:bg-neutral-50 transition-colors disabled:opacity-50">
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {url ? 'Change' : 'Upload'}
        </button>
        <span className="text-xs text-neutral-400">{hint}</span>
        <input ref={ref} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); }} />
      </div>
    </div>
  );
}

export default function ShopSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // fields
  const [storeName, setStoreName] = useState('');
  const [shopEmail, setShopEmail] = useState('');
  const [phoneCode, setPhoneCode] = useState('+91');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [addressLine1, setAddressLine1] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [country, setCountry] = useState('India');
  const [logoUrl, setLogoUrl] = useState('');
  const [pwaLogoUrl, setPwaLogoUrl] = useState('');
  const [branding, setBranding] = useState<Record<string, unknown>>({});

  useEffect(() => {
    api.get('/store').then(r => {
      const s = r.data.store as Record<string, unknown>;
      setStoreName((s.name as string) ?? '');
      setShopEmail((s.email as string) ?? '');
      if (s.currency) setCurrency(s.currency as string);
      const storedPhone = (s.phone as string) ?? '';
      if (storedPhone) {
        const match = PHONE_CODES.map(p => p.code).find(c => storedPhone.startsWith(c));
        if (match) { setPhoneCode(match); setPhoneDigits(storedPhone.slice(match.length).trim()); }
        else setPhoneDigits(storedPhone);
      }
      const b = (s.branding as Record<string, unknown>) ?? {};
      setBranding(b);
      const addr = b.address as Record<string, string> | undefined;
      if (addr) {
        setAddressLine1(addr.line1 ?? ''); setPincode(addr.pincode ?? '');
        setCity(addr.city ?? ''); setDistrict(addr.district ?? '');
        setStateVal(addr.state ?? ''); setCountry(addr.country ?? 'India');
      }
      if (b.logoUrl) setLogoUrl(b.logoUrl as string);
      if (b.pwaLogoUrl) setPwaLogoUrl(b.pwaLogoUrl as string);
    }).catch(() => setError('Failed to load store settings.'))
      .finally(() => setLoading(false));
  }, []);

  // pincode auto-fill
  useEffect(() => {
    if (!/^\d{6}$/.test(pincode)) return;
    setPincodeLoading(true);
    fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      .then(r => r.json())
      .then((data: Array<{ Status: string; PostOffice?: Array<{ District: string; State: string; Country: string; Block?: string }> }>) => {
        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.[0]) {
          const po = data[0].PostOffice[0];
          setDistrict(po.District ?? ''); setStateVal(po.State ?? ''); setCountry(po.Country ?? 'India');
          if (!city) setCity(po.Block ?? po.District ?? '');
        }
      }).catch(() => {}).finally(() => setPincodeLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincode]);

  const touch = (f: string) => setTouched(t => ({ ...t, [f]: true }));
  const fieldErrors = {
    storeName: !storeName.trim() ? 'Required' : storeName.trim().length < 2 ? 'At least 2 characters' : '',
    shopEmail: shopEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shopEmail) ? 'Enter a valid email' : '',
    phoneDigits: phoneDigits && !/^[\d\s\-().]{7,15}$/.test(phoneDigits) ? 'Enter a valid number' : '',
  };
  const shown = (f: keyof typeof fieldErrors) => touched[f] ? fieldErrors[f] : '';
  const errClass = (f: keyof typeof fieldErrors) => shown(f) ? 'border-red-400 focus-visible:ring-red-400' : '';

  const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({ storeName: true, shopEmail: true, phoneDigits: true });
    if (fieldErrors.storeName || fieldErrors.shopEmail || fieldErrors.phoneDigits) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const phone = phoneDigits ? `${phoneCode}${phoneDigits}` : undefined;
      const newBranding = {
        ...branding,
        address: { line1: addressLine1, pincode, city, district, state: stateVal, country },
        logoUrl, pwaLogoUrl,
      };
      await api.patch('/store', { name: storeName.trim(), email: shopEmail || undefined, phone, currency, branding: newBranding });
      setBranding(newBranding);
      setSuccess('Settings saved.');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to save.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Shop Settings</h1>
        <p className="text-sm text-neutral-500">Manage your store's basic information and branding.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6" noValidate>
        <Card>
          <CardHeader><CardTitle className="text-base">Store Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Store Name" required error={shown('storeName')}>
              <Input value={storeName} onChange={e => setStoreName(e.target.value)} onBlur={() => touch('storeName')}
                placeholder="My Awesome Store" className={errClass('storeName')} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Store Email" error={shown('shopEmail')}>
                <Input type="email" value={shopEmail} onChange={e => setShopEmail(e.target.value)} onBlur={() => touch('shopEmail')}
                  placeholder="contact@mystore.com" className={errClass('shopEmail')} />
              </Field>
              <Field label="Phone" error={shown('phoneDigits')}>
                <div className="flex">
                  <select value={phoneCode} onChange={e => setPhoneCode(e.target.value)}
                    className="shrink-0 border border-r-0 rounded-l-md px-2 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
                    {PHONE_CODES.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
                  </select>
                  <Input type="tel" value={phoneDigits} onChange={e => setPhoneDigits(e.target.value.replace(/[^\d\s\-().]/g, ''))}
                    onBlur={() => touch('phoneDigits')} placeholder="98765 43210"
                    className={`rounded-l-none ${errClass('phoneDigits')}`} />
                </div>
              </Field>
            </div>
            <div className="space-y-1">
              <Label>Currency</Label>
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Shop Address</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Address Line 1</Label>
              <Input value={addressLine1} onChange={e => setAddressLine1(e.target.value)} placeholder="Street, Building No." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Pincode</Label>
                <div className="relative">
                  <Input value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="560001" maxLength={6} />
                  {pincodeLoading && <Loader2 size={13} className="absolute right-2.5 top-2.5 animate-spin text-neutral-400" />}
                </div>
              </div>
              <div className="space-y-1">
                <Label>City</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Bangalore" />
              </div>
              <div className="space-y-1">
                <Label>District</Label>
                <Input value={district} onChange={e => setDistrict(e.target.value)} placeholder="Bengaluru Urban" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>State</Label>
                <Input value={stateVal} onChange={e => setStateVal(e.target.value)} placeholder="Karnataka" />
              </div>
              <div className="space-y-1">
                <Label>Country</Label>
                <select value={country} onChange={e => setCountry(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Branding</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <ImageUpload label="Store Logo" hint="Recommended: 200×200px PNG" url={logoUrl} onUrl={setLogoUrl} />
            <ImageUpload label="PWA Icon" hint="512×512px PNG for home screen" url={pwaLogoUrl} onUrl={setPwaLogoUrl} />
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <Button type="submit" disabled={saving} className="gap-2">
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save Changes
        </Button>
      </form>
    </div>
  );
}
