'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle, ExternalLink, Upload } from 'lucide-react';

// ─── constants ────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: 'INR', label: 'INR — Indian Rupee' }, { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' }, { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'AUD', label: 'AUD — Australian Dollar' }, { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'SGD', label: 'SGD — Singapore Dollar' }, { code: 'AED', label: 'AED — UAE Dirham' },
  { code: 'JPY', label: 'JPY — Japanese Yen' }, { code: 'MYR', label: 'MYR — Malaysian Ringgit' },
];

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Australia', 'Canada', 'Singapore', 'UAE', 'Germany', 'France', 'Japan'];

const WHATSAPP_PROVIDERS = [
  { value: 'twilio', label: 'Twilio' },
  { value: 'wati', label: 'WATI' },
  { value: 'interakt', label: 'Interakt' },
  { value: 'gupshup', label: 'Gupshup' },
  { value: 'meta', label: 'Meta Business API (direct)' },
];

const SMS_PROVIDERS = [
  { value: 'msg91', label: 'MSG91' },
  { value: 'twilio', label: 'Twilio' },
  { value: 'textlocal', label: 'TextLocal' },
  { value: 'fast2sms', label: 'Fast2SMS' },
  { value: 'exotel', label: 'Exotel' },
  { value: 'kaleyra', label: 'Kaleyra' },
];

const PHONE_CODES = [
  { code: '+91', label: '🇮🇳 +91' }, { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' }, { code: '+61', label: '🇦🇺 +61' },
  { code: '+971', label: '🇦🇪 +971' }, { code: '+65', label: '🇸🇬 +65' },
  { code: '+60', label: '🇲🇾 +60' }, { code: '+81', label: '🇯🇵 +81' },
  { code: '+49', label: '🇩🇪 +49' }, { code: '+33', label: '🇫🇷 +33' },
];

const STEP_LABELS = ['Shop Details', 'Domain', 'Payments', 'Notifications', 'AI Assistant', 'Subscription', 'Finish'];

// Step number (1-7) ↔ config key. Order is fixed; the Super-Admin designer controls
// which steps are enabled/skippable, their labels, and (for shop/notifications) fields.
const STEP_KEYS = ['shop', 'domain', 'payments', 'notifications', 'ai', 'subscription', 'finish'] as const;

interface WizardField { key: string; label: string; enabled: boolean; required: boolean }
interface WizardStep { key: string; label: string; description: string; enabled: boolean; skippable: boolean; fields?: WizardField[] }
interface WizardConfig { steps: WizardStep[] }

const DEFAULT_WIZARD: WizardConfig = {
  steps: STEP_KEYS.map((key, i) => ({ key, label: STEP_LABELS[i], description: '', enabled: true, skippable: key !== 'finish' })),
};

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface SubscriptionPlan {
  id: string; name: string; price: number; currency: string;
  billingPeriod: string; level: string; maxProducts: number;
  features: Record<string, boolean>; details?: string;
}

interface BusinessLevel { key: string; label: string; description: string; color: string; order: number }

const FALLBACK_LEVELS: BusinessLevel[] = [
  { key: 'BASIC',    label: 'Basic',    description: 'For small stores just starting out',  color: 'bg-neutral-100 text-neutral-700', order: 1 },
  { key: 'GROW',     label: 'Grow',     description: 'For growing businesses',              color: 'bg-blue-50 text-blue-700',       order: 2 },
  { key: 'ADVANCED', label: 'Advanced', description: 'For established, high-volume stores', color: 'bg-purple-50 text-purple-700',    order: 3 },
];

// ─── Steps indicator ──────────────────────────────────────────────────────────

// Renders a Super-Admin-authored help doc: preserves line breaks; lines starting with "- " become bullets.
function StepHelp({ text }: Readonly<{ text?: string }>) {
  if (!text?.trim()) return null;
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const bullets = lines.filter(l => l.startsWith('- ')).map(l => l.slice(2));
  const paras = lines.filter(l => !l.startsWith('- '));
  return (
    <div className="mt-2 rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-sm text-neutral-600 space-y-1.5">
      {paras.map((p, i) => <p key={`p${i}`}>{p}</p>)}
      {bullets.length > 0 && (
        <ul className="list-disc list-inside space-y-0.5">
          {bullets.map((b, i) => <li key={`b${i}`}>{b}</li>)}
        </ul>
      )}
    </div>
  );
}

function WizardSteps({ current, steps }: Readonly<{ current: Step; steps: { n: Step; label: string }[] }>) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((s, i) => {
        const n = s.n;
        return (
          <div key={n} className="contents">
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 shrink-0
                ${n < current ? 'bg-neutral-900 border-neutral-900 text-white' : n === current ? 'bg-neutral-900 border-neutral-900 text-white' : 'border-neutral-300 text-neutral-400'}`}>
                {n < current ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] text-center leading-tight ${n === current ? 'text-neutral-900 font-medium' : 'text-neutral-400'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-neutral-200 mb-4 mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, hint, error, required, children }: Readonly<{
  label: string; hint?: string; error?: string; required?: boolean; children: React.ReactNode;
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

// ─── Image upload field ───────────────────────────────────────────────────────

function ImageUpload({ label, hint, url, onUrl }: Readonly<{ label: string; hint: string; url: string; onUrl: (u: string) => void }>) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true); setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/store/upload', fd);
      onUrl(data.url as string);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-3 flex-wrap">
        {url && <img src={url} alt={label} className="w-10 h-10 rounded object-cover border" />}
        <button type="button"
          onClick={() => { setUploadError(''); ref.current?.click(); }}
          className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm hover:bg-neutral-50 transition-colors disabled:opacity-50"
          disabled={uploading}>
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {url ? 'Change' : 'Upload'}
        </button>
        {!uploadError && <span className="text-xs text-neutral-400">{hint}</span>}
        {uploadError && <span className="text-xs text-red-500">{uploadError}</span>}
        <input ref={ref} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function SetupPage() {
  return <Suspense><SetupWizard /></Suspense>;
}

function SetupWizard() {
  const { user, setSetupProgress, setSetupComplete } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Step 1: Shop details
  const [storeName, setStoreName] = useState('');
  const [storeId, setStoreId] = useState('');
  const [storeIdManual, setStoreIdManual] = useState(false);
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
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // ── Step 2: Domain
  const [domainType, setDomainType] = useState<'free' | 'own'>('free');
  const [customDomain, setCustomDomain] = useState('');
  const [dnsInstructions, setDnsInstructions] = useState('');

  // ── Step 3: Razorpay
  const [rzpKeyId, setRzpKeyId] = useState('');
  const [rzpKeySecret, setRzpKeySecret] = useState('');
  const [rzpWebhook, setRzpWebhook] = useState('');

  // ── Step 4: Notifications
  const [notifWhatsapp, setNotifWhatsapp] = useState(false);
  const [notifWhatsappProvider, setNotifWhatsappProvider] = useState('');
  const [notifWhatsappNumber, setNotifWhatsappNumber] = useState('');
  const [notifWhatsappKey, setNotifWhatsappKey] = useState('');
  const [notifTwilioSid, setNotifTwilioSid] = useState('');
  const [notifTwilioToken, setNotifTwilioToken] = useState('');
  const [notifSms, setNotifSms] = useState(false);
  const [notifSmsProvider, setNotifSmsProvider] = useState('');
  const [notifSmsKey, setNotifSmsKey] = useState('');
  const [notifEmailEnabled, setNotifEmailEnabled] = useState(false);
  const [notifEmailHost, setNotifEmailHost] = useState('');
  const [notifEmailPort, setNotifEmailPort] = useState('587');
  const [notifEmailUser, setNotifEmailUser] = useState('');
  const [notifEmailPass, setNotifEmailPass] = useState('');

  // ── Step 5: AI
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-3.5-flash-lite');
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [geminiSaving, setGeminiSaving] = useState(false);
  const [geminiMsg, setGeminiMsg] = useState('');

  // ── Step 6: Subscription
  const [subStep, setSubStep] = useState<1 | 2 | 3>(1);
  const [subLevel, setSubLevel] = useState<string>('');
  const [levels, setLevels] = useState<BusinessLevel[]>(FALLBACK_LEVELS);
  const [wizardCfg, setWizardCfg] = useState<WizardConfig>(DEFAULT_WIZARD);
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [plansError, setPlansError] = useState('');

  // ── Shared
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [storeExists, setStoreExists] = useState(false);
  const [brandings, setBrandings] = useState<Record<string, unknown>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ── Derive step from URL (browser back/forward updates this automatically)
  const savedMax = Math.min(Math.max((user?.setupWizardPage ?? 0) + 1, 1), 7);
  const urlStep = parseInt(searchParams.get('step') ?? '0');
  const step: Step = (urlStep >= 1 && urlStep <= 7) ? urlStep as Step : savedMax as Step;

  // ── Wizard config (Super-Admin designed). Falls back to the default 7-step wizard.
  const stepCfg = (n: number): WizardStep => wizardCfg.steps.find(s => s.key === STEP_KEYS[n - 1]) ?? DEFAULT_WIZARD.steps[n - 1];
  const stepEnabled = (n: number) => stepCfg(n).enabled !== false;
  const enabledNums = ([1, 2, 3, 4, 5, 6, 7] as Step[]).filter(stepEnabled);
  const nextStep = (n: number): Step => (enabledNums.find(x => x > n) ?? 7) as Step;
  const prevStep = (n: number): Step => ([...enabledNums].reverse().find(x => x < n) ?? enabledNums[0] ?? 1) as Step;
  const wizardStepsForIndicator = enabledNums.map(n => ({ n, label: stepCfg(n).label }));
  const fieldCfg = (n: number, key: string) => stepCfg(n).fields?.find(f => f.key === key);
  const fieldOn = (n: number, key: string) => { const f = fieldCfg(n, key); return f ? f.enabled !== false : true; };
  const fieldReq = (n: number, key: string) => !!fieldCfg(n, key)?.required;

  const goStep = (n: Step) => { router.push(`/setup?step=${n}`); setError(''); };

  const touch = (f: string) => setTouched(t => ({ ...t, [f]: true }));
  const touchAll = (fields: string[]) => setTouched(t => Object.fromEntries([...Object.entries(t), ...fields.map(f => [f, true])]));

  // If the merchant lands on a disabled step (config change / stale URL), bounce to the next enabled one.
  useEffect(() => {
    if (searchParams.get('step') && !stepEnabled(step)) router.replace(`/setup?step=${nextStep(step)}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, wizardCfg]);

  // ── Init: redirect to correct step URL if no ?step param, load existing store
  useEffect(() => {
    const startStep = Math.min(Math.max((user?.setupWizardPage ?? 0) + 1, 1), 7) as Step;
    if (!searchParams.get('step')) router.replace(`/setup?step=${startStep}`);


    api.get('/store').then(r => {
      setStoreExists(true);
      const s = r.data.store as Record<string, unknown>;
      setStoreName((s.name as string) ?? '');
      setStoreId((s.storeUrlId as string) ?? (s.subdomain as string) ?? '');
      setShopEmail((s.email as string) ?? '');
      const storedPhone = (s.phone as string) ?? '';
      if (storedPhone) {
        const match = PHONE_CODES.map(p => p.code).find(c => storedPhone.startsWith(c));
        if (match) { setPhoneCode(match); setPhoneDigits(storedPhone.slice(match.length).trim()); }
        else setPhoneDigits(storedPhone);
      }
      if (s.currency) setCurrency(s.currency as string);
      if (s.domain) { setDomainType('own'); setCustomDomain(s.domain as string); }

      const b = (s.branding as Record<string, unknown>) ?? {};
      setBrandings(b);

      const addr = b.address as Record<string, string> | undefined;
      if (addr) {
        setAddressLine1(addr.line1 ?? '');
        setPincode(addr.pincode ?? '');
        setCity(addr.city ?? '');
        setDistrict(addr.district ?? '');
        setStateVal(addr.state ?? '');
        setCountry(addr.country ?? 'India');
      }
      if (b.logoUrl) setLogoUrl(b.logoUrl as string);
      if (b.pwaLogoUrl) setPwaLogoUrl(b.pwaLogoUrl as string);

      const rzp = b.razorpay as Record<string, string> | undefined;
      if (rzp) { setRzpKeyId(rzp.keyId ?? ''); setRzpKeySecret(rzp.keySecret ?? ''); setRzpWebhook(rzp.webhook ?? ''); }

      const notif = b.notifications as Record<string, Record<string, unknown>> | undefined;
      if (notif?.whatsapp) {
        setNotifWhatsapp(Boolean(notif.whatsapp.enabled));
        setNotifWhatsappProvider((notif.whatsapp.provider as string) ?? '');
        setNotifWhatsappNumber((notif.whatsapp.number as string) ?? '');
        setNotifWhatsappKey((notif.whatsapp.apiKey as string) ?? '');
        setNotifTwilioSid((notif.whatsapp.accountSid as string) ?? '');
        setNotifTwilioToken((notif.whatsapp.authToken as string) ?? '');
      }
      if (notif?.sms) { setNotifSms(Boolean(notif.sms.enabled)); setNotifSmsProvider((notif.sms.provider as string) ?? ''); setNotifSmsKey((notif.sms.apiKey as string) ?? ''); }
      if (notif?.emailSmtp) { setNotifEmailEnabled(Boolean(notif.emailSmtp.enabled)); setNotifEmailHost((notif.emailSmtp.host as string) ?? ''); setNotifEmailPort(String(notif.emailSmtp.port ?? 587)); setNotifEmailUser((notif.emailSmtp.user as string) ?? ''); setNotifEmailPass((notif.emailSmtp.pass as string) ?? ''); }
    }).catch(() => { setStoreExists(false); });

    // Load the Super-Admin-designed wizard config (falls back to the default 7-step wizard)
    api.get('/platform/setup-wizard')
      .then(r => { const c = r.data.config as WizardConfig; if (c?.steps?.length) setWizardCfg(c); })
      .catch(() => { /* keep DEFAULT_WIZARD */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-derive storeId from storeName (only if user hasn't manually set it)
  useEffect(() => {
    if (!storeIdManual && storeName) {
      setStoreId(storeName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''));
    }
  }, [storeName, storeIdManual]);

  // ── Pincode lookup
  useEffect(() => {
    if (!/^\d{6}$/.test(pincode)) return;
    setPincodeLoading(true);
    fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      .then(r => r.json())
      .then((data: Array<{ Status: string; PostOffice?: Array<{ District: string; State: string; Country: string; Block?: string }> }>) => {
        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.[0]) {
          const po = data[0].PostOffice[0];
          setDistrict(po.District ?? '');
          setStateVal(po.State ?? '');
          setCountry(po.Country ?? 'India');
          if (!city) setCity(po.Block ?? po.District ?? '');
        }
      })
      .catch(() => {})
      .finally(() => setPincodeLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincode]);

  // ── Fetch plans + business levels when entering step 6
  useEffect(() => {
    if (step !== 6) return;
    setPlansError('');
    api.get('/platform/subscriptions')
      .then(r => {
        setAllPlans((r.data.subscriptions ?? []) as SubscriptionPlan[]);
        setPlansError('');
      })
      .catch(err => {
        const errMsg = err.response?.data?.error ?? err.message ?? 'Failed to load plans';
        console.error('[setup] Failed to load subscription plans:', err.response?.status, errMsg);
        setPlansError(errMsg);
      });
    api.get('/platform/business-levels')
      .then(r => { const l = (r.data.levels ?? []) as BusinessLevel[]; if (l.length) setLevels(l); })
      .catch(err => console.error('[setup] Failed to load business levels:', err.response?.status));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Field validators
  const fieldErrors = {
    storeName: !storeName.trim() ? 'Store name is required' : storeName.trim().length < 2 ? 'At least 2 characters required' : storeName.trim().length > 100 ? 'Must be under 100 characters' : '',
    storeId: !storeId ? 'Store ID is required' : storeId.length < 3 ? 'At least 3 characters required' : !/^[a-z0-9-]+$/.test(storeId) ? 'Lowercase letters, numbers and hyphens only' : '',
    shopEmail: !shopEmail ? (fieldReq(1, 'email') ? 'Email is required' : '') : (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shopEmail) ? 'Enter a valid email address' : ''),
    phoneDigits: !phoneDigits ? (fieldReq(1, 'phone') ? 'Phone is required' : '') : (!/^[\d\s\-().]{7,15}$/.test(phoneDigits) ? 'Enter a valid phone number' : ''),
    customDomain: domainType === 'own' && !customDomain.trim() ? 'Domain is required' : domainType === 'own' && customDomain && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(customDomain.trim()) ? 'Enter a valid domain (e.g. shop.example.com)' : '',
    rzpKeyId: rzpKeyId && !rzpKeyId.startsWith('rzp_') ? 'Key ID should start with rzp_test_ or rzp_live_' : '',
    rzpKeySecret: rzpKeyId.trim() && !rzpKeySecret.trim() ? 'Key Secret is required when Key ID is set' : '',
    notifWhatsappProvider: notifWhatsapp && !notifWhatsappProvider ? 'Provider is required' : '',
    notifWhatsappNumber: notifWhatsapp && !notifWhatsappNumber.trim() ? 'WhatsApp number is required' : '',
    notifWhatsappKey: notifWhatsapp && notifWhatsappProvider !== 'twilio' && !notifWhatsappKey.trim() ? 'API key is required' : '',
    notifTwilioSid: notifWhatsapp && notifWhatsappProvider === 'twilio' && !notifTwilioSid.trim() ? 'Account SID is required' : '',
    notifTwilioToken: notifWhatsapp && notifWhatsappProvider === 'twilio' && !notifTwilioToken.trim() ? 'Auth token is required' : '',
    notifSmsProvider: notifSms && !notifSmsProvider.trim() ? 'Provider is required' : '',
    notifSmsKey: notifSms && !notifSmsKey.trim() ? 'API key is required' : '',
    notifEmailHost: notifEmailEnabled && !notifEmailHost.trim() ? 'SMTP host is required' : '',
    notifEmailUser: notifEmailEnabled && !notifEmailUser.trim() ? 'Username is required' : '',
    notifEmailPass: notifEmailEnabled && !notifEmailPass.trim() ? 'Password is required' : '',
  };
  const shown = (f: keyof typeof fieldErrors) => (touched[f] ? fieldErrors[f] : '') ?? '';

  const saveProgress = async (page: number) => {
    if (page <= (user?.setupWizardPage ?? 0)) return;
    setSetupProgress(page);
    await api.patch('/auth/setup-progress', { page });
  };

  const skipStep = async (currentStep: Step) => {
    try { await saveProgress(currentStep); } catch { /* non-fatal */ }
    goStep(nextStep(currentStep));
  };

  const mergedBranding = (patch: Record<string, unknown>) => ({ ...brandings, ...patch });

  // ── Step 1
  const handleStep1 = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    touchAll(['storeName', 'storeId', 'shopEmail', 'phoneDigits']);
    if (fieldErrors.storeName || fieldErrors.storeId || fieldErrors.shopEmail || fieldErrors.phoneDigits) return;

    setLoading(true); setError('');
    try {
      const phone = phoneDigits ? `${phoneCode}${phoneDigits}` : undefined;
      const newBranding = mergedBranding({ address: { line1: addressLine1, pincode, city, district, state: stateVal, country }, logoUrl, pwaLogoUrl });
      setBrandings(newBranding);

      if (!storeExists) {
        await api.post('/store', { name: storeName.trim(), subdomain: storeId, storeUrlId: storeId, email: shopEmail || undefined, phone, currency });
        setStoreExists(true);
      }
      await api.patch('/store', { name: storeName.trim(), email: shopEmail || undefined, phone, currency, branding: newBranding });
      await saveProgress(1);
      goStep(nextStep(1));
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to save. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Step 2
  const handleStep2 = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    touchAll(['customDomain']);
    if (fieldErrors.customDomain) return;

    setLoading(true); setError('');
    try {
      if (domainType === 'own' && customDomain.trim() && storeExists) {
        const { data } = await api.patch('/store/domain', { domain: customDomain.trim() });
        setDnsInstructions((data as { dnsInstructions?: string }).dnsInstructions ?? '');
      }
      await saveProgress(2);
      goStep(nextStep(2));
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to save domain. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Step 3
  const handleStep3 = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    touchAll(['rzpKeyId', 'rzpKeySecret']);
    if (fieldErrors.rzpKeyId || fieldErrors.rzpKeySecret) return;

    setLoading(true); setError('');
    try {
      if (rzpKeyId.trim() && storeExists) {
        const newBranding = mergedBranding({ razorpay: { keyId: rzpKeyId.trim(), keySecret: rzpKeySecret.trim(), webhook: rzpWebhook.trim() } });
        setBrandings(newBranding);
        await api.patch('/store', { branding: newBranding });
      }
      await saveProgress(3);
      goStep(nextStep(3));
    } catch {
      setError('Failed to save payment config. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Step 4
  const handleStep4 = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    touchAll(['notifWhatsappProvider', 'notifWhatsappNumber', 'notifWhatsappKey', 'notifTwilioSid', 'notifTwilioToken', 'notifSmsProvider', 'notifSmsKey', 'notifEmailHost', 'notifEmailUser', 'notifEmailPass']);
    if (fieldErrors.notifWhatsappProvider || fieldErrors.notifWhatsappNumber || fieldErrors.notifWhatsappKey ||
        fieldErrors.notifTwilioSid || fieldErrors.notifTwilioToken ||
        fieldErrors.notifSmsProvider || fieldErrors.notifSmsKey ||
        fieldErrors.notifEmailHost || fieldErrors.notifEmailUser || fieldErrors.notifEmailPass) return;

    setLoading(true); setError('');
    try {
      if (storeExists) {
        const notifications = {
          whatsapp: {
            enabled: notifWhatsapp, provider: notifWhatsappProvider, number: notifWhatsappNumber,
            apiKey: notifWhatsappKey, accountSid: notifTwilioSid, authToken: notifTwilioToken,
          },
          sms: { enabled: notifSms, provider: notifSmsProvider, apiKey: notifSmsKey },
          emailSmtp: { enabled: notifEmailEnabled, host: notifEmailHost, port: parseInt(notifEmailPort) || 587, user: notifEmailUser, pass: notifEmailPass },
        };
        const newBranding = mergedBranding({ notifications });
        setBrandings(newBranding);
        await api.patch('/store', { branding: newBranding });
        const waProvider = notifWhatsappProvider === 'twilio' ? 'TWILIO' : 'META';
        await api.put('/notifications/config', {
          emailEnabled: notifEmailEnabled,
          smtpHost: notifEmailHost,
          smtpPort: parseInt(notifEmailPort) || 587,
          smtpUser: notifEmailUser,
          smtpPassword: notifEmailPass,
          smtpFrom: notifEmailUser,
          waEnabled: notifWhatsapp,
          waProvider,
          waPhoneId: notifWhatsappNumber,
          waApiKey: waProvider === 'META' ? notifWhatsappKey : undefined,
          waAccountSid: waProvider === 'TWILIO' ? notifTwilioSid : undefined,
          waAuthToken: waProvider === 'TWILIO' ? notifTwilioToken : undefined,
        }).catch(() => { /* branding saved; channel config can be retried in settings */ });
      }
      await saveProgress(4);
      goStep(nextStep(4));
    } catch {
      setError('Failed to save notification config. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Step 5: AI (optional)
  const handleStep5 = async () => {
    if (geminiApiKey.trim() && storeExists) {
      setGeminiSaving(true);
      try {
        await api.patch('/store/ai-settings', { geminiApiKey: geminiApiKey.trim(), model: geminiModel });
        setGeminiConfigured(true);
        setGeminiMsg('API key saved!');
      } catch { /* non-fatal */ } finally { setGeminiSaving(false); }
    }
    await saveProgress(5).catch(() => {});
    goStep(nextStep(5));
  };

  // ── Step 5: Subscribe
  const handleSubscribe = async () => {
    if (!selectedPlan || !user?.email) return;
    setSubLoading(true); setError('');
    try {
      await api.post('/platform/manage/buy', {
        subscriptionId: selectedPlan.id,
        adminEmail: user.email,
        paymentMethod: selectedPlan.price === 0 ? 'free' : 'razorpay',
      });
      await saveProgress(6);
      goStep(nextStep(6));
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Subscription failed. Please try again.');
    } finally { setSubLoading(false); }
  };

  const handleFinish = async () => {
    setLoading(true); setError('');
    try {
      await api.patch('/store/publish', { published: true });
      await api.patch('/auth/setup-complete');
      setSetupComplete();
      router.replace('/dashboard');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const errClass = (f: keyof typeof fieldErrors) => shown(f) ? 'border-red-400 focus-visible:ring-red-400' : '';

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 py-10 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Welcome to digi-carts</h1>
          <p className="text-sm text-neutral-500 mt-1">Let's get your store set up — takes about 5 minutes.</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <WizardSteps current={step} steps={wizardStepsForIndicator} />
            <CardTitle className="text-lg">
              {stepCfg(step).label}
            </CardTitle>
            <StepHelp text={stepCfg(step).description} />
          </CardHeader>

          <CardContent>
            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4" noValidate>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Field label="Store Name" required error={shown('storeName')}>
                      <Input value={storeName} onChange={e => setStoreName(e.target.value)}
                        onBlur={() => touch('storeName')}
                        placeholder="My Awesome Store" autoComplete="off"
                        className={errClass('storeName')} />
                    </Field>
                  </div>
                  <div className="col-span-2">
                    <Field label="Store ID" required error={shown('storeId')} hint="Lowercase letters, numbers and hyphens only. Used as your free subdomain.">
                      <Input
                        value={storeId}
                        onChange={e => { setStoreIdManual(true); setStoreId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); }}
                        onBlur={() => touch('storeId')}
                        placeholder="my-store" autoComplete="off"
                        className={errClass('storeId')}
                      />
                    </Field>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {fieldOn(1, 'email') && (
                  <Field label="Store Email" required={fieldReq(1, 'email')} error={shown('shopEmail')}>
                    <Input type="email" value={shopEmail} onChange={e => setShopEmail(e.target.value)}
                      onBlur={() => touch('shopEmail')}
                      placeholder="contact@mystore.com"
                      className={errClass('shopEmail')} />
                  </Field>
                  )}
                  {fieldOn(1, 'phone') && (
                  <Field label="Phone" required={fieldReq(1, 'phone')} error={shown('phoneDigits')}>
                    <div className="flex">
                      <select value={phoneCode} onChange={e => setPhoneCode(e.target.value)}
                        className="shrink-0 border border-r-0 rounded-l-md px-2 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
                        {PHONE_CODES.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
                      </select>
                      <Input type="tel" value={phoneDigits} onChange={e => setPhoneDigits(e.target.value.replace(/[^\d\s\-().]/g, ''))}
                        onBlur={() => touch('phoneDigits')}
                        placeholder="98765 43210"
                        className={`rounded-l-none ${errClass('phoneDigits')}`} />
                    </div>
                  </Field>
                  )}
                  {fieldOn(1, 'currency') && (
                  <div className="space-y-1">
                    <Label>Currency</Label>
                    <select value={currency} onChange={e => setCurrency(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
                      {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                  </div>
                  )}
                  {fieldOn(1, 'country') && (
                  <div className="space-y-1">
                    <Label>Country</Label>
                    <select value={country} onChange={e => setCountry(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  )}
                </div>

                {fieldOn(1, 'address') && (
                <div className="space-y-3 border-t pt-4">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Shop Address</p>
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
                  <div className="space-y-1">
                    <Label>State</Label>
                    <Input value={stateVal} onChange={e => setStateVal(e.target.value)} placeholder="Karnataka" />
                  </div>
                </div>
                )}

                {(fieldOn(1, 'logo') || fieldOn(1, 'pwaIcon')) && (
                <div className="space-y-3 border-t pt-4">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Branding</p>
                  {fieldOn(1, 'logo') && <ImageUpload label="Store Logo" hint="Recommended: 200×200px PNG" url={logoUrl} onUrl={setLogoUrl} />}
                  {fieldOn(1, 'pwaIcon') && <ImageUpload label="PWA Icon" hint="512×512px PNG for home screen" url={pwaLogoUrl} onUrl={setPwaLogoUrl} />}
                </div>
                )}

                <div className="flex gap-2 pt-2">
                  {stepCfg(1).skippable && (<Button type="button" variant="outline" onClick={() => skipStep(1)} className="flex-none">Skip</Button>)}
                  <Button type="submit" className="flex-1 gap-2" disabled={loading}>
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <><span>Save & Continue</span><ArrowRight size={15} /></>}
                  </Button>
                </div>
              </form>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <form onSubmit={handleStep2} className="space-y-4" noValidate>
                <div className="flex gap-3">
                  {(['free', 'own'] as const).map(t => (
                    <button key={t} type="button"
                      onClick={() => { setDomainType(t); setError(''); setDnsInstructions(''); setTouched(v => ({ ...v, customDomain: false })); }}
                      className={`flex-1 border-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors
                        ${domainType === t ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'}`}>
                      {t === 'free' ? '🆓 Free Subdomain' : '🌐 Own Domain'}
                    </button>
                  ))}
                </div>

                {domainType === 'free' && (
                  <div className="rounded-lg bg-neutral-50 border p-4 space-y-2">
                    <p className="text-sm font-medium">Your free store URL</p>
                    <div className="font-mono text-base font-semibold text-neutral-900 break-all">
                      {storeId ? `${storeId}.digi-carts.com` : <span className="text-neutral-400 font-normal text-sm">Complete Step 1 first to see your URL</span>}
                    </div>
                    <p className="text-xs text-neutral-400">This is set automatically from your Store ID. No DNS setup needed.</p>
                  </div>
                )}

                {domainType === 'own' && (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1">
                      <p className="font-medium">How to connect your domain</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Log in to your domain registrar (GoDaddy, Namecheap, etc.)</li>
                        <li>Add a <strong>CNAME</strong> record: <code className="bg-amber-100 px-1 rounded">@ → api.digi-carts.com</code></li>
                        <li>Enter your domain below and save</li>
                      </ol>
                    </div>
                    <Field label="Your Domain" required error={shown('customDomain')}>
                      <Input value={customDomain} onChange={e => setCustomDomain(e.target.value.toLowerCase().trim())}
                        onBlur={() => touch('customDomain')}
                        placeholder="shop.yourdomain.com" autoComplete="off"
                        className={errClass('customDomain')} />
                    </Field>
                    {dnsInstructions && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-xs text-green-800 whitespace-pre-line">
                        {dnsInstructions}
                      </div>
                    )}
                    <a href="https://support.google.com/domains/answer/9211383" target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                      <ExternalLink size={12} /> Learn how to add a CNAME record
                    </a>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => goStep(prevStep(2))} className="gap-1">
                    <ArrowLeft size={15} /> Back
                  </Button>
                  {stepCfg(2).skippable && (<Button type="button" variant="outline" onClick={() => skipStep(2)}>Skip</Button>)}
                  <Button type="submit" className="flex-1 gap-2" disabled={loading}>
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <><span>Save & Continue</span><ArrowRight size={15} /></>}
                  </Button>
                </div>
              </form>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <form onSubmit={handleStep3} className="space-y-4" noValidate>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800 space-y-1">
                  <p className="font-medium">How to get your Razorpay keys</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Go to <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noreferrer" className="underline">dashboard.razorpay.com/app/keys</a></li>
                    <li>Click <strong>Generate Test Key</strong> (or use Live keys for production)</li>
                    <li>Copy the Key ID and Key Secret below</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <Field label="Key ID" error={shown('rzpKeyId')} hint="Starts with rzp_test_ or rzp_live_">
                    <Input value={rzpKeyId} onChange={e => setRzpKeyId(e.target.value.trim())}
                      onBlur={() => touch('rzpKeyId')}
                      placeholder="rzp_test_xxxxxxxxxxxx" autoComplete="off"
                      className={errClass('rzpKeyId')} />
                  </Field>
                  <Field label="Key Secret" error={shown('rzpKeySecret')}>
                    <Input type="password" value={rzpKeySecret} onChange={e => setRzpKeySecret(e.target.value.trim())}
                      onBlur={() => touch('rzpKeySecret')}
                      placeholder="••••••••••••••••" autoComplete="new-password"
                      className={errClass('rzpKeySecret')} />
                  </Field>
                  <Field label="Webhook Secret" hint="Required only if you set up a Razorpay webhook for order status updates.">
                    <Input type="password" value={rzpWebhook} onChange={e => setRzpWebhook(e.target.value.trim())}
                      placeholder="Webhook secret from Razorpay dashboard" autoComplete="new-password" />
                  </Field>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => goStep(prevStep(3))} className="gap-1">
                    <ArrowLeft size={15} /> Back
                  </Button>
                  {stepCfg(3).skippable && (<Button type="button" variant="outline" onClick={() => skipStep(3)}>Skip</Button>)}
                  <Button type="submit" className="flex-1 gap-2" disabled={loading}>
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <><span>Save & Continue</span><ArrowRight size={15} /></>}
                  </Button>
                </div>
              </form>
            )}

            {/* ── STEP 4 ── */}
            {step === 4 && (
              <form onSubmit={handleStep4} className="space-y-5" noValidate>
                {/* WhatsApp */}
                {fieldOn(4, 'whatsapp') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">WhatsApp</p>
                      <p className="text-xs text-neutral-400">Send order updates via WhatsApp Business API</p>
                    </div>
                    <button type="button" onClick={() => setNotifWhatsapp(v => !v)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${notifWhatsapp ? 'bg-neutral-900' : 'bg-neutral-200'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifWhatsapp ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  {notifWhatsapp && (
                    <div className="space-y-2 pl-2 border-l-2 border-neutral-200">
                      <div className="space-y-1">
                        <Label>Provider <span className="text-red-500 ml-0.5">*</span></Label>
                        <select value={notifWhatsappProvider} onChange={e => setNotifWhatsappProvider(e.target.value)}
                          onBlur={() => touch('notifWhatsappProvider')}
                          className={`w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black ${shown('notifWhatsappProvider') ? 'border-red-400' : ''}`}>
                          <option value="">Select provider</option>
                          {WHATSAPP_PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                        {shown('notifWhatsappProvider') && <p className="text-xs text-red-500">{shown('notifWhatsappProvider')}</p>}
                      </div>
                      <Field label="WhatsApp Business Number" required error={shown('notifWhatsappNumber')}>
                        <Input value={notifWhatsappNumber} onChange={e => setNotifWhatsappNumber(e.target.value)}
                          onBlur={() => touch('notifWhatsappNumber')}
                          placeholder="+91 98765 43210" autoComplete="off"
                          className={errClass('notifWhatsappNumber')} />
                      </Field>
                      {notifWhatsappProvider === 'twilio' ? (
                        <>
                          <Field label="Twilio Account SID" required error={shown('notifTwilioSid')}>
                            <Input value={notifTwilioSid} onChange={e => setNotifTwilioSid(e.target.value)}
                              onBlur={() => touch('notifTwilioSid')}
                              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" autoComplete="off"
                              className={errClass('notifTwilioSid')} />
                          </Field>
                          <Field label="Twilio Auth Token" required error={shown('notifTwilioToken')}>
                            <Input type="password" value={notifTwilioToken} onChange={e => setNotifTwilioToken(e.target.value)}
                              onBlur={() => touch('notifTwilioToken')}
                              placeholder="Auth token from Twilio Console" autoComplete="off"
                              className={errClass('notifTwilioToken')} />
                          </Field>
                        </>
                      ) : (
                        <Field label="API Key / Access Token" required error={shown('notifWhatsappKey')}>
                          <Input value={notifWhatsappKey} onChange={e => setNotifWhatsappKey(e.target.value)}
                            onBlur={() => touch('notifWhatsappKey')}
                            placeholder="API key from your WhatsApp provider" autoComplete="off"
                            className={errClass('notifWhatsappKey')} />
                        </Field>
                      )}
                    </div>
                  )}
                </div>
                )}

                {/* SMS */}
                {fieldOn(4, 'sms') && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">SMS</p>
                      <p className="text-xs text-neutral-400">Order alerts via SMS (Twilio, MSG91, etc.)</p>
                    </div>
                    <button type="button" onClick={() => setNotifSms(v => !v)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${notifSms ? 'bg-neutral-900' : 'bg-neutral-200'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifSms ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  {notifSms && (
                    <div className="space-y-2 pl-2 border-l-2 border-neutral-200">
                      <div className="space-y-1">
                        <Label>Provider <span className="text-red-500 ml-0.5">*</span></Label>
                        <select value={notifSmsProvider} onChange={e => setNotifSmsProvider(e.target.value)}
                          onBlur={() => touch('notifSmsProvider')}
                          className={`w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black ${shown('notifSmsProvider') ? 'border-red-400' : ''}`}>
                          <option value="">Select provider</option>
                          {SMS_PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                        {shown('notifSmsProvider') && <p className="text-xs text-red-500">{shown('notifSmsProvider')}</p>}
                      </div>
                      <Field label="API Key" required error={shown('notifSmsKey')}>
                        <Input value={notifSmsKey} onChange={e => setNotifSmsKey(e.target.value)}
                          onBlur={() => touch('notifSmsKey')}
                          placeholder="SMS provider API key" autoComplete="off"
                          className={errClass('notifSmsKey')} />
                      </Field>
                    </div>
                  )}
                </div>
                )}

                {/* Email SMTP */}
                {fieldOn(4, 'email') && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Email (SMTP)</p>
                      <p className="text-xs text-neutral-400">Transactional emails for orders and receipts</p>
                    </div>
                    <button type="button" onClick={() => setNotifEmailEnabled(v => !v)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${notifEmailEnabled ? 'bg-neutral-900' : 'bg-neutral-200'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifEmailEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  {notifEmailEnabled && (
                    <div className="space-y-2 pl-2 border-l-2 border-neutral-200">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <Field label="SMTP Host" error={shown('notifEmailHost')}>
                            <Input value={notifEmailHost} onChange={e => setNotifEmailHost(e.target.value)}
                              onBlur={() => touch('notifEmailHost')}
                              placeholder="smtp.gmail.com" autoComplete="off"
                              className={errClass('notifEmailHost')} />
                          </Field>
                        </div>
                        <div className="space-y-1">
                          <Label>Port</Label>
                          <Input value={notifEmailPort} onChange={e => setNotifEmailPort(e.target.value.replace(/\D/g, ''))} placeholder="587" />
                        </div>
                      </div>
                      <Field label="Username" error={shown('notifEmailUser')}>
                        <Input value={notifEmailUser} onChange={e => setNotifEmailUser(e.target.value)}
                          onBlur={() => touch('notifEmailUser')}
                          placeholder="you@gmail.com" autoComplete="off"
                          className={errClass('notifEmailUser')} />
                      </Field>
                      <Field label="Password / App Password" error={shown('notifEmailPass')}>
                        <Input type="password" value={notifEmailPass} onChange={e => setNotifEmailPass(e.target.value)}
                          onBlur={() => touch('notifEmailPass')}
                          placeholder="••••••••" autoComplete="new-password"
                          className={errClass('notifEmailPass')} />
                      </Field>
                    </div>
                  )}
                </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => goStep(prevStep(4))} className="gap-1">
                    <ArrowLeft size={15} /> Back
                  </Button>
                  {stepCfg(4).skippable && (<Button type="button" variant="outline" onClick={() => skipStep(4)}>Skip</Button>)}
                  <Button type="submit" className="flex-1 gap-2" disabled={loading}>
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <><span>Save & Continue</span><ArrowRight size={15} /></>}
                  </Button>
                </div>
              </form>
            )}

            {/* ── STEP 5: AI Assistant ── */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-xs text-purple-800 space-y-1">
                  <p className="font-medium">✦ Supercharge your catalog with AI</p>
                  <p>Connect Google Gemini to auto-generate product names, prices, descriptions, and specs from a simple description. You can skip this and set it up later in <strong>Settings → AI</strong>.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Gemini API Key <span className="text-neutral-400 font-normal">(optional)</span></label>
                  <Input
                    type="password"
                    value={geminiApiKey}
                    onChange={e => setGeminiApiKey(e.target.value)}
                    placeholder="AIza..."
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-neutral-400">
                    Get a free key at{' '}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-blue-600 underline">aistudio.google.com/apikey</a>
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Model</label>
                  <select value={geminiModel} onChange={e => setGeminiModel(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
                    <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (recommended — fast & affordable)</option>
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (high performance)</option>
                    <option value="gemini-3.6-flash">Gemini 3.6 Flash (latest & most capable)</option>
                  </select>
                </div>
                {geminiMsg && <p className="text-sm text-green-600">{geminiMsg}</p>}
                {geminiConfigured && !geminiMsg && (
                  <p className="text-sm text-green-600 flex items-center gap-1">✓ AI connected</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => goStep(prevStep(5))} className="gap-1">
                    <ArrowLeft size={15} /> Back
                  </Button>
                  {stepCfg(5).skippable && (<Button type="button" variant="outline" onClick={() => skipStep(5)}>Skip</Button>)}
                  <Button type="button" className="flex-1 gap-2" disabled={geminiSaving} onClick={handleStep5}>
                    {geminiSaving ? <Loader2 size={15} className="animate-spin" /> : null}
                    {geminiApiKey.trim() ? 'Save & Continue' : 'Continue'}
                    {!geminiSaving && <ArrowRight size={15} />}
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 6: Subscription ── */}
            {step === 6 && (
              <div className="space-y-4">
                {/* Sub-step indicator */}
                <div className="flex items-center gap-2 mb-2">
                  {(['Select Level', 'Choose Plan', 'Confirm & Pay'] as const).map((label, i) => (
                    <div key={label} className="contents">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center shrink-0
                          ${subStep > i + 1 ? 'bg-neutral-900 text-white' : subStep === i + 1 ? 'bg-neutral-900 text-white' : 'border border-neutral-300 text-neutral-400'}`}>
                          {subStep > i + 1 ? '✓' : i + 1}
                        </div>
                        <span className={`text-xs ${subStep === i + 1 ? 'font-medium text-neutral-900' : 'text-neutral-400'}`}>{label}</span>
                      </div>
                      {i < 2 && <div className="flex-1 h-px bg-neutral-200" />}
                    </div>
                  ))}
                </div>

                {/* Sub-step 1: Level */}
                {subStep === 1 && (
                  <div className="space-y-3">
                    {plansError && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800">
                        <p className="font-medium">Failed to load subscription plans</p>
                        <p className="mt-1">{plansError}</p>
                        <button type="button" onClick={() => { setPlansError(''); window.location.reload(); }} className="mt-2 text-red-600 hover:text-red-700 font-medium underline">
                          Retry
                        </button>
                      </div>
                    )}
                    <p className="text-sm text-neutral-500">Choose the plan tier that fits your business needs.</p>
                    <div className="grid gap-3">
                      {levels.map(lvl => (
                        <button key={lvl.key} type="button" disabled={!!plansError}
                          onClick={() => { setSubLevel(lvl.key); setSelectedPlan(null); setSubStep(2); }}
                          className={`text-left border-2 rounded-xl p-4 transition-colors hover:border-neutral-400
                            ${plansError ? 'opacity-50 cursor-not-allowed' : ''}
                            ${subLevel === lvl.key ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{lvl.label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lvl.color}`}>{lvl.label}</span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">{lvl.description}</p>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => goStep(prevStep(6))} className="gap-1">
                        <ArrowLeft size={15} /> Back
                      </Button>
                      {stepCfg(6).skippable && (<Button type="button" variant="outline" onClick={() => skipStep(6)} className="flex-1">Skip for now</Button>)}
                    </div>
                  </div>
                )}

                {/* Sub-step 2: Plans for selected level */}
                {subStep === 2 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setSubStep(1)} className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1">
                        <ArrowLeft size={12} /> Change level
                      </button>
                      <span className="text-xs text-neutral-300">|</span>
                      <span className="text-xs font-medium">{subLevel} plans</span>
                    </div>
                    {allPlans.filter(p => p.level?.toUpperCase() === subLevel).length === 0 ? (
                      <div className="text-center py-8 text-sm text-neutral-400">No plans available for this level yet.</div>
                    ) : (
                      <div className="grid gap-3">
                        {allPlans.filter(p => p.level?.toUpperCase() === subLevel).map(plan => (
                          <button key={plan.id} type="button"
                            onClick={() => { setSelectedPlan(plan); setSubStep(3); }}
                            className={`text-left border-2 rounded-xl p-4 transition-colors hover:border-neutral-400
                              ${selectedPlan?.id === plan.id ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm">{plan.name}</span>
                              <span className="font-semibold text-sm">
                                {plan.price === 0 ? 'Free' : `${plan.currency} ${plan.price} / ${plan.billingPeriod.toLowerCase()}`}
                              </span>
                            </div>
                            {plan.details && <p className="text-xs text-neutral-500 mt-0.5">{plan.details}</p>}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded-full">Up to {plan.maxProducts} products</span>
                              {plan.features?.customDomain && <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded-full">Custom domain</span>}
                              {plan.features?.reports && <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded-full">Reports</span>}
                              {plan.features?.notifications && <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded-full">Notifications</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setSubStep(1)} className="gap-1">
                        <ArrowLeft size={15} /> Back
                      </Button>
                      {stepCfg(6).skippable && (<Button type="button" variant="outline" onClick={() => skipStep(6)} className="flex-1">Skip for now</Button>)}
                    </div>
                  </div>
                )}

                {/* Sub-step 3: Confirm & Pay */}
                {subStep === 3 && selectedPlan && (
                  <div className="space-y-4">
                    <div className="rounded-xl border-2 border-neutral-900 bg-neutral-50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{selectedPlan.name}</p>
                          <p className="text-xs text-neutral-500 mt-0.5 capitalize">{selectedPlan.level?.toLowerCase()} tier · {selectedPlan.billingPeriod.toLowerCase()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">{selectedPlan.price === 0 ? 'Free' : `${selectedPlan.currency} ${selectedPlan.price}`}</p>
                          {selectedPlan.price > 0 && <p className="text-xs text-neutral-400">per {selectedPlan.billingPeriod.toLowerCase()}</p>}
                        </div>
                      </div>
                      <div className="border-t pt-3 flex flex-wrap gap-2">
                        <span className="text-xs bg-white border px-2 py-0.5 rounded-full">{selectedPlan.maxProducts} products</span>
                        {selectedPlan.features?.customDomain && <span className="text-xs bg-white border px-2 py-0.5 rounded-full">Custom domain</span>}
                        {selectedPlan.features?.reports && <span className="text-xs bg-white border px-2 py-0.5 rounded-full">Reports & Analytics</span>}
                        {selectedPlan.features?.notifications && <span className="text-xs bg-white border px-2 py-0.5 rounded-full">Notifications</span>}
                        {selectedPlan.features?.support && <span className="text-xs bg-white border px-2 py-0.5 rounded-full">Priority support</span>}
                      </div>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setSubStep(2)} className="gap-1">
                        <ArrowLeft size={15} /> Back
                      </Button>
                      <Button type="button" className="flex-1 gap-2" disabled={subLoading} onClick={handleSubscribe}>
                        {subLoading ? <Loader2 size={15} className="animate-spin" /> : null}
                        {selectedPlan.price === 0 ? 'Activate Free Plan' : `Pay ${selectedPlan.currency} ${selectedPlan.price}`}
                        {!subLoading && <ArrowRight size={15} />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 7: Finish ── */}
            {step === 7 && (
              <div className="space-y-6 text-center py-4">
                <CheckCircle size={56} className="mx-auto text-green-500" strokeWidth={1.5} />
                <div>
                  <h2 className="text-xl font-semibold">Setup complete!</h2>
                  <p className="text-sm text-neutral-500 mt-1">Your store is ready. You can update these settings anytime from the dashboard.</p>
                </div>
                <div className="text-left rounded-lg bg-neutral-50 border p-4 text-sm space-y-1.5">
                  {storeName && <div className="flex justify-between"><span className="text-neutral-500">Store</span><span className="font-medium">{storeName}</span></div>}
                  {storeId && <div className="flex justify-between"><span className="text-neutral-500">Store URL</span><a href={`${process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://digi-cart-storefront-m6jmogmpra-ue.a.run.app'}/s/${storeId}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-blue-600 underline break-all">{`${process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://digi-cart-storefront-m6jmogmpra-ue.a.run.app'}/s/${storeId}`}</a></div>}
                  {customDomain && domainType === 'own' && <div className="flex justify-between"><span className="text-neutral-500">Custom Domain</span><span className="font-mono text-xs">{customDomain}</span></div>}
                  {rzpKeyId && <div className="flex justify-between"><span className="text-neutral-500">Payments</span><span className="text-green-600">✓ Razorpay configured</span></div>}
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button onClick={handleFinish} className="w-full" disabled={loading}>
                  {loading ? <Loader2 size={15} className="animate-spin mr-1" /> : null}
                  Go to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
