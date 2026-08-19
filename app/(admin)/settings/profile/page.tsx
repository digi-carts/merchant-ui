'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/auth-store';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (newPw.length < 6) { setError('New password must be at least 6 characters.'); return; }
    if (newPw !== confirm) { setError('Passwords do not match.'); return; }
    setSaving(true);
    try {
      await api.post('/auth/merchant-mgmt/change-password', { currentPassword: current, newPassword: newPw });
      setSuccess('Password updated successfully.');
      setCurrent(''); setNewPw(''); setConfirm('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={user?.email ?? ''} disabled className="bg-neutral-50" />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Input value="Admin" disabled className="bg-neutral-50" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Current Password</Label>
              <Input type="password" value={current} onChange={e => setCurrent(e.target.value)} required autoComplete="current-password" />
            </div>
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required autoComplete="new-password" />
            </div>
            <div className="space-y-1">
              <Label>Confirm New Password</Label>
              <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Updating…' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
