'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ─── country dial codes ───────────────────────────────────────────────────────

const DIAL_CODES = [
  { label: '🇮🇳 +91',  value: '+91'  },
  { label: '🇺🇸 +1',   value: '+1'   },
  { label: '🇬🇧 +44',  value: '+44'  },
  { label: '🇦🇪 +971', value: '+971' },
  { label: '🇸🇬 +65',  value: '+65'  },
  { label: '🇦🇺 +61',  value: '+61'  },
  { label: '🇨🇦 +1',   value: '+1-CA' },
  { label: '🇩🇪 +49',  value: '+49'  },
  { label: '🇫🇷 +33',  value: '+33'  },
  { label: '🇯🇵 +81',  value: '+81'  },
  { label: '🇧🇷 +55',  value: '+55'  },
  { label: '🇿🇦 +27',  value: '+27'  },
  { label: '🇳🇬 +234', value: '+234' },
  { label: '🇰🇪 +254', value: '+254' },
  { label: '🇲🇾 +60',  value: '+60'  },
  { label: '🇵🇭 +63',  value: '+63'  },
  { label: '🇮🇩 +62',  value: '+62'  },
  { label: '🇵🇰 +92',  value: '+92'  },
  { label: '🇧🇩 +880', value: '+880' },
  { label: '🇱🇰 +94',  value: '+94'  },
  { label: '🇳🇿 +64',  value: '+64'  },
  { label: '🇳🇱 +31',  value: '+31'  },
  { label: '🇪🇸 +34',  value: '+34'  },
  { label: '🇮🇹 +39',  value: '+39'  },
  { label: '🇸🇦 +966', value: '+966' },
  { label: '🇶🇦 +974', value: '+974' },
  { label: '🇲🇽 +52',  value: '+52'  },
  { label: '🇨🇳 +86',  value: '+86'  },
];

const validators = {
  name: (v: string) => {
    if (!v.trim()) return 'Name is required';
    if (v.trim().length < 2) return 'Name must be at least 2 characters';
    if (v.trim().length > 60) return 'Name must be under 60 characters';
    return '';
  },
  email: (v: string) => {
    if (!v.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address';
    return '';
  },
  phone: (v: string) => {
    if (!v) return '';
    if (!/^[\d\s\-().]{5,15}$/.test(v)) return 'Enter a valid phone number';
    return '';
  },
  password: (v: string) => {
    if (!v) return 'Password is required';
    if (v.length < 8) return 'Password must be at least 8 characters';
    if (v.length > 128) return 'Password is too long';
    if (!/[A-Za-z]/.test(v)) return 'Password must contain at least one letter';
    if (!/[0-9]/.test(v)) return 'Password must contain at least one number';
    return '';
  },
  confirm: (v: string, pw: string) => {
    if (!v) return 'Please confirm your password';
    if (v !== pw) return 'Passwords do not match';
    return '';
  },
};

function passwordStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!pw) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-red-500' };
  if (score === 2) return { level: 2, label: 'Fair', color: 'bg-yellow-400' };
  return { level: 3, label: 'Strong', color: 'bg-green-500' };
}

// ─── field wrapper ────────────────────────────────────────────────────────────

function Field({ label, hint, error, children }: Readonly<{
  label: string; hint?: string; error: string; children: React.ReactNode;
}>) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-neutral-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [dialCode, setDialCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const searchParams = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get('ref') ?? searchParams.get('referral') ?? searchParams.get('code');
    if (ref) setReferralCode(ref.toUpperCase());
  }, [searchParams]);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth, setStoreId } = useAuthStore();
  const router = useRouter();

  const errors = {
    name: validators.name(adminName),
    email: validators.email(email),
    phone: validators.phone(phoneNumber),
    password: validators.password(password),
    confirm: validators.confirm(confirm, password),
  };

  const touch = (field: string) => setTouched(t => ({ ...t, [field]: true }));
  const shown = (field: keyof typeof errors) => touched[field] ? errors[field] : '';

  const isValid = Object.values(errors).every(e => !e);
  const strength = passwordStrength(password);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, password: true, confirm: true });
    if (!isValid) return;

    setLoading(true); setSubmitError('');
    try {
      const { data } = await api.post('/auth/merchant-register', {
        email: email.trim(),
        password,
        name: adminName.trim(),
        adminPhone: phoneNumber ? `${dialCode.replace('-CA', '')}${phoneNumber}` : undefined,
        referralCode: referralCode.trim() ? referralCode.trim().toUpperCase() : undefined,
      });
      if (data.user.role !== 'merchant') { setSubmitError('Access denied.'); return; }
      setAuth({ ...data.user, role: 'merchant' }, data.accessToken, data.refreshToken);
      if (data.user.storeId) setStoreId(data.user.storeId);
      router.push('/setup');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setSubmitError(msg ?? 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <p className="text-sm text-neutral-500">Start your free merchant account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <Field label="Full Name" error={shown('name')}>
              <Input
                value={adminName}
                onChange={e => setAdminName(e.target.value)}
                onBlur={() => touch('name')}
                autoComplete="name"
                placeholder="Your name"
                className={shown('name') ? 'border-red-400 focus-visible:ring-red-400' : ''}
              />
            </Field>

            <Field label="Email" error={shown('email')}>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => touch('email')}
                autoComplete="email"
                className={shown('email') ? 'border-red-400 focus-visible:ring-red-400' : ''}
              />
            </Field>

            <Field label="Phone" hint="Optional" error={shown('phone')}>
              <div className="flex gap-1.5">
                <Select value={dialCode} onValueChange={v => v && setDialCode(v)}>
                  <SelectTrigger className="w-28 shrink-0 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" className="max-h-64">
                    {DIAL_CODES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value.replace(/[^\d\s\-()]/g, ''))}
                  onBlur={() => touch('phone')}
                  placeholder="98765 43210"
                  autoComplete="tel-national"
                  className={shown('phone') ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
              </div>
            </Field>

            <Field label="Password" hint="Min 8 characters, at least one letter and one number" error={shown('password')}>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => touch('password')}
                autoComplete="new-password"
                className={shown('password') ? 'border-red-400 focus-visible:ring-red-400' : ''}
              />
              {password && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 rounded-full bg-neutral-200 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strength.color}`}
                      style={{ width: `${(strength.level / 3) * 100}%` }} />
                  </div>
                  <span className={`text-xs font-medium ${strength.level === 1 ? 'text-red-500' : strength.level === 2 ? 'text-yellow-500' : 'text-green-600'}`}>
                    {strength.label}
                  </span>
                </div>
              )}
            </Field>

            <Field label="Confirm Password" error={shown('confirm')}>
              <Input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onBlur={() => touch('confirm')}
                autoComplete="new-password"
                className={shown('confirm') ? 'border-red-400 focus-visible:ring-red-400' : ''}
              />
            </Field>

            <Field label="Referral Code" hint="Optional" error="">
              <Input
                value={referralCode}
                onChange={e => setReferralCode(e.target.value.toUpperCase())}
                placeholder="e.g. REF-JOHN"
                autoComplete="off"
                className="uppercase placeholder:normal-case"
              />
            </Field>

            {submitError && <p className="text-sm text-red-500">{submitError}</p>}

            <Button type="submit" className="w-full mt-1" disabled={loading}>
              {loading ? <><Loader2 size={15} className="animate-spin mr-1" /> Creating…</> : 'Create Account'}
            </Button>
          </form>

          <p className="text-sm text-center text-neutral-500 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="underline font-medium">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
