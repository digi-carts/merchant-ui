'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', { email, token, newPassword });
      setStep(3);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg ?? 'Invalid or expired code.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">
            {step === 3 ? 'Password updated' : 'Reset password'}
          </CardTitle>
          {step === 1 && <p className="text-sm text-neutral-500">Enter your email and we&apos;ll send a 6-digit code.</p>}
          {step === 2 && <p className="text-sm text-neutral-500">Enter the code sent to <strong>{email}</strong></p>}
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 3 && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 size={40} className="text-green-500" />
              <p className="text-sm text-neutral-600">Redirecting to login…</p>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-3">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 size={15} className="animate-spin mr-1" /> : null}
                {loading ? 'Sending…' : 'Send reset code'}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleReset} className="space-y-3">
              <div className="space-y-1">
                <Label>6-digit code</Label>
                <Input value={token} onChange={e => setToken(e.target.value)} maxLength={6} placeholder="123456" required />
              </div>
              <div className="space-y-1">
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} required autoComplete="new-password" />
              </div>
              <div className="space-y-1">
                <Label>Confirm Password</Label>
                <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} minLength={8} required autoComplete="new-password" />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 size={15} className="animate-spin mr-1" /> : null}
                {loading ? 'Updating…' : 'Update password'}
              </Button>
              <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-neutral-400 hover:underline text-center">
                Resend code
              </button>
            </form>
          )}

          {step !== 3 && (
            <p className="text-sm text-center text-neutral-500">
              <Link href="/login" className="underline font-medium">Back to sign in</Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
