'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth, setStoreId } = useAuthStore();
  const router = useRouter();

  const afterAuth = async (user: { id: string; email: string; role: string; storeId?: string | null; setupStatus?: string; setupWizardPage?: number }, accessToken: string, refreshToken: string) => {
    if (user.role !== 'merchant') { setError('Access denied. Admin accounts only.'); return; }
    setAuth({ ...user, role: user.role as 'merchant', storeId: user.storeId ?? undefined }, accessToken, refreshToken);
    if (user.storeId) setStoreId(user.storeId);
    if (user.setupStatus !== 'COMPLETED') {
      router.push('/setup');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await afterAuth(data.user, data.accessToken, data.refreshToken);
    } catch {
      setError('Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">digi-carts Admin</CardTitle>
          <p className="text-sm text-neutral-500">Sign in to your admin dashboard</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-neutral-500 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 size={15} className="animate-spin mr-1" /> Signing in…</> : 'Sign in'}
            </Button>
          </form>

          <p className="text-sm text-center text-neutral-500">
            New merchant?{' '}
            <Link href="/register" className="underline font-medium">Create account</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
