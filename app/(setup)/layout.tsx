'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useTheme } from '@/lib/use-theme';
import { api } from '@/lib/api';
import axios from 'axios';
import { ShoppingBag, LogOut, User, X, Loader2, Sun, Moon, Monitor, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AiChat } from '@/components/ui/ai-chat';

// ─── Profile modal ────────────────────────────────────────────────────────────

function ProfileModal({ onClose }: Readonly<{ onClose: () => void }>) {
  const { user, setUserName } = useAuthStore();

  // Name form
  const [name, setName] = useState(user?.name ?? '');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameError, setNameError] = useState('');

  // Password form
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const touch = (f: string) => setTouched(t => ({ ...t, [f]: true }));
  const touchAll = (fields: string[]) => setTouched(t => ({ ...t, ...Object.fromEntries(fields.map(f => [f, true])) }));

  const pwErrors = {
    currentPw: !currentPw ? 'Required' : '',
    newPw: !newPw ? 'Required' : newPw.length < 8 ? 'At least 8 characters' : '',
    confirmPw: !confirmPw ? 'Required' : confirmPw !== newPw ? 'Passwords do not match' : '',
  };
  const shown = (f: keyof typeof pwErrors) => touched[f] ? pwErrors[f] : '';
  const errClass = (f: keyof typeof pwErrors) => shown(f) ? 'border-red-400 focus-visible:ring-red-400' : '';

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setNameError('Name is required'); return; }
    setNameLoading(true); setNameError(''); setNameSuccess('');
    try {
      await api.patch('/auth/me', { name: name.trim() });
      setUserName(name.trim());
      setNameSuccess('Name updated');
    } catch {
      setNameError('Failed to update name');
    } finally { setNameLoading(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    touchAll(['currentPw', 'newPw', 'confirmPw']);
    if (pwErrors.currentPw || pwErrors.newPw || pwErrors.confirmPw) return;
    setPwLoading(true); setPwError(''); setPwSuccess('');
    try {
      await api.patch('/auth/me/change-password', { currentPassword: currentPw, newPassword: newPw });
      setPwSuccess('Password changed');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTouched({});
    } catch (err: unknown) {
      setPwError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to change password');
    } finally { setPwLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold">Profile</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-neutral-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* ── Change name ── */}
          <form onSubmit={handleSaveName} className="space-y-3" noValidate>
            <p className="text-sm font-medium text-neutral-700">Merchant Name</p>
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input value={name} onChange={e => { setName(e.target.value); setNameError(''); setNameSuccess(''); }}
                placeholder="Your name" autoComplete="name"
                className={nameError ? 'border-red-400 focus-visible:ring-red-400' : ''} />
              {nameError && <p className="text-xs text-red-500">{nameError}</p>}
              {nameSuccess && <p className="text-xs text-green-600">{nameSuccess}</p>}
            </div>
            <Button type="submit" size="sm" disabled={nameLoading} className="gap-1.5">
              {nameLoading && <Loader2 size={13} className="animate-spin" />}
              Save Name
            </Button>
          </form>

          <div className="border-t" />

          {/* ── Change password ── */}
          <form onSubmit={handleChangePassword} className="space-y-3" noValidate>
            <p className="text-sm font-medium text-neutral-700">Change Password</p>
            <div className="space-y-1">
              <Label>Current Password</Label>
              <div className="relative">
                <Input type={showCurrent ? 'text' : 'password'} value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)} onBlur={() => touch('currentPw')}
                  placeholder="••••••••" autoComplete="current-password"
                  className={`pr-9 ${errClass('currentPw')}`} />
                <button type="button" onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600">
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {shown('currentPw') && <p className="text-xs text-red-500">{shown('currentPw')}</p>}
            </div>
            <div className="space-y-1">
              <Label>New Password</Label>
              <div className="relative">
                <Input type={showNew ? 'text' : 'password'} value={newPw}
                  onChange={e => setNewPw(e.target.value)} onBlur={() => touch('newPw')}
                  placeholder="Min 8 characters" autoComplete="new-password"
                  className={`pr-9 ${errClass('newPw')}`} />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600">
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {shown('newPw') && <p className="text-xs text-red-500">{shown('newPw')}</p>}
            </div>
            <div className="space-y-1">
              <Label>Confirm New Password</Label>
              <Input type="password" value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)} onBlur={() => touch('confirmPw')}
                placeholder="••••••••" autoComplete="new-password"
                className={errClass('confirmPw')} />
              {shown('confirmPw') && <p className="text-xs text-red-500">{shown('confirmPw')}</p>}
            </div>
            {pwError && <p className="text-xs text-red-500">{pwError}</p>}
            {pwSuccess && <p className="text-xs text-green-600">{pwSuccess}</p>}
            <Button type="submit" size="sm" disabled={pwLoading} className="gap-1.5">
              {pwLoading && <Loader2 size={13} className="animate-spin" />}
              Change Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function SetupLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, clearAuth, setAuth } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => { setHydrated(true); }, []);

  // Proactively refresh token on mount to ensure storeId is in JWT
  useEffect(() => {
    if (!hydrated || !user) return;
    const refreshToken = (() => {
      try {
        const raw = localStorage.getItem('auth-store-v3');
        return raw ? (JSON.parse(raw)?.state?.refreshToken ?? null) : null;
      } catch { return null; }
    })();
    if (refreshToken) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      axios.post(`${apiBase}/v1/auth/refresh`, { refreshToken })
        .then(r => {
          try {
            const raw = localStorage.getItem('auth-store-v3');
            if (raw) {
              const parsed = JSON.parse(raw);
              parsed.state.accessToken = r.data.accessToken;
              parsed.state.refreshToken = r.data.refreshToken;
              localStorage.setItem('auth-store-v3', JSON.stringify(parsed));
            }
          } catch { /* ignore */ }
        })
        .catch(() => { /* ignore refresh failure */ });
    }
  }, [hydrated, user]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'merchant') { router.replace('/login'); return; }
    if (user.setupStatus === 'COMPLETED') { router.replace('/dashboard'); }
  }, [hydrated, user, router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { clearAuth(); router.push('/login'); };
  const initials = (user?.name ?? user?.email ?? 'M').slice(0, 2).toUpperCase();

  if (!hydrated || user?.role !== 'merchant') return null;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 bg-white border-b flex items-center justify-between px-6 h-14 shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} />
          <span className="font-semibold text-sm">digi-carts</span>
        </div>

        <div className="relative" ref={avatarRef}>
          <button type="button" onClick={() => setAvatarOpen(v => !v)}
            className="flex items-center gap-2 rounded-full hover:bg-neutral-100 px-2 py-1 transition-colors">
            <div className="w-7 h-7 rounded-full bg-neutral-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">
              {initials}
            </div>
          </button>

          {avatarOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border rounded-xl shadow-lg py-1 z-50">
              <div className="px-3 py-2 border-b">
                {user.name && <p className="text-xs font-medium text-neutral-800 truncate">{user.name}</p>}
                <p className="text-xs text-neutral-500 truncate">{user.email}</p>
              </div>

              <button type="button"
                onClick={() => { setAvatarOpen(false); setProfileOpen(true); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
                <User size={14} /> Profile &amp; Password
              </button>

              <div className="px-3 py-2 border-t border-b">
                <p className="text-xs text-neutral-400 mb-1.5">Theme</p>
                <div className="flex gap-1">
                  {([['light', <Sun key="s" size={12} />], ['dark', <Moon key="m" size={12} />], ['system', <Monitor key="mo" size={12} />]] as const).map(([t, icon]) => (
                    <button key={t} type="button" onClick={() => setTheme(t)}
                      className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-xs transition-colors ${theme === t ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-neutral-600'}`}>
                      {icon}{t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
      <AiChat context="Store setup wizard — helping a new merchant configure their store step by step: shop details, domain, payments, notifications, AI, and subscription" />
    </div>
  );
}
