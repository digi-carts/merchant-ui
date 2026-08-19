'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';

export default function SignedOutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center">
            <LogOut size={28} className="text-neutral-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-neutral-900">You&apos;ve been signed out</h1>
          <p className="text-sm text-neutral-500">Your session has ended safely. Sign in again to continue managing your store.</p>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full rounded-lg bg-neutral-900 text-white text-sm font-medium py-2.5 px-4 hover:bg-neutral-700 transition-colors"
        >
          Sign in again
        </Link>

        <p className="text-xs text-neutral-400">digi-carts Admin</p>
      </div>
    </div>
  );
}
