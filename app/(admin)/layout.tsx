'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Menu, ShoppingBag, LogOut, User, Sun, Moon, Monitor } from 'lucide-react';
import { api } from '@/lib/api';
import axios from 'axios';
import Link from 'next/link';
import { useTheme } from '@/lib/use-theme';
import { AiChat } from '@/components/ui/ai-chat';

const PAGE_CONTEXTS: Record<string, string> = {
  '/dashboard':            'Dashboard — store overview, recent orders, revenue, and quick actions',
  '/orders':               'Orders — view, filter, update order status, and manage fulfilment',
  '/orders/bills':         'Invoice / bill generation for orders',
  '/products':             'Product catalog — add, edit, manage products and inventory',
  '/products/new':         'Create a new product — title, price, images, variants, stock',
  '/categories':           'Product categories — organise and manage your catalogue structure',
  '/discounts':            'Discount codes and promotional offers',
  '/offers':               'Offers and promotional deals for your store',
  '/customers':            'Customer list — view profiles, order history, and contact details',
  '/settings/payment':     'Payment settings — Razorpay API keys, Route payouts, order charges',
  '/settings/shipping':    'Shipping settings — NimbusPost courier integration, pickup pincode, fallback charges',
  '/settings/ai':          'AI settings — Gemini API key for AI-powered product descriptions',
  '/settings/store':       'Store settings — name, currency, timezone, and contact info',
  '/settings/domain':      'Domain settings — custom domain mapping and subdomain configuration',
  '/settings/profile':     'Profile — change your email or password',
  '/notifications/config': 'Notification settings — email (SMTP/Mailgun/SendGrid) and WhatsApp (Meta/Interakt/Wati)',
  '/templates/messages':   'Message templates — email, WhatsApp, and SMS copy for order and welcome events',
  '/templates/bills':      'Bill templates — invoice header, footer, logo, GST line, and accent color',
  '/customize/theme':      'Theme customisation — colors, dark mode, logo, storefront template',
  '/customize/footer':     'Footer customisation — links, social media, colors, copyright text',
  '/reports':              'Reports — sales analytics, revenue trends, and export',
};

interface SubFeatures {
  customDomain?: boolean;
  reports?: boolean;
  notifications?: boolean;
  support?: boolean;
}

interface SubStatus {
  subscribed: boolean;
  availableDays: number;
  expired: boolean;
  subscription: {
    name: string;
    price: number;
    currency: string;
    billingPeriod: string;
    maxProducts: number;
    features: SubFeatures;
  } | null;
}

export type { SubStatus, SubFeatures };

let _subStatusCache: SubStatus | null = null;
let _subStatusFetchedAt = 0;
let _subStatusInflight: Promise<void> | null = null;
const SUB_TTL_MS = 5 * 60 * 1000;
let _lastTokenRefreshAt = 0;
const TOKEN_REFRESH_COOLDOWN_MS = 5 * 60 * 1000;

export function getSubStatusCache() { return _subStatusCache; }

export function fetchSubStatus(): Promise<void> {
  if (_subStatusCache && Date.now() - _subStatusFetchedAt < SUB_TTL_MS) return Promise.resolve();
  if (_subStatusInflight !== null) return _subStatusInflight;
  _subStatusInflight = api.get('/platform/subscription-status')
    .then(({ data }) => { _subStatusCache = data; _subStatusFetchedAt = Date.now(); })
    .catch(() => {})
    .finally(() => { _subStatusInflight = null; });
  return _subStatusInflight;
}

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, clearAuth, setStoreId } = useAuthStore();
  const storeIdInState = useAuthStore(s => s.storeId);
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setHydrated(true); }, []);

  // Proactively refresh token on mount to ensure storeId is in JWT — throttled to once per session
  useEffect(() => {
    if (!hydrated || !user) return;
    if (Date.now() - _lastTokenRefreshAt < TOKEN_REFRESH_COOLDOWN_MS) return;
    const refreshToken = (() => {
      try {
        const raw = localStorage.getItem('auth-store-v3');
        return raw ? (JSON.parse(raw)?.state?.refreshToken ?? null) : null;
      } catch { return null; }
    })();
    if (refreshToken) {
      _lastTokenRefreshAt = Date.now();
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api') + '/v1';
      axios.post(`${apiBase}/auth/refresh`, { refreshToken })
        .then(r => {
          try {
            const raw = localStorage.getItem('auth-store-v3');
            if (raw) {
              const parsed = JSON.parse(raw);
              parsed.state.accessToken = r.data.accessToken;
              parsed.state.refreshToken = r.data.refreshToken;
              if (r.data.user?.storeId) parsed.state.storeId = r.data.user.storeId;
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
    if (user.setupStatus !== 'COMPLETED') { router.replace('/setup'); }
  }, [hydrated, user, router]);

  useEffect(() => {
    if (hydrated && user?.role === 'merchant') fetchSubStatus();
  }, [hydrated, user]);

  // Fetch and persist storeId for merchants who don't have it in state yet (e.g., pre-fix sessions)
  useEffect(() => {
    if (!hydrated || !user || storeIdInState) return;
    api.get('/store').then(r => {
      const id = r.data?.store?.id;
      if (id) setStoreId(id.toString());
    }).catch(() => {});
  }, [hydrated, user, storeIdInState, setStoreId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { clearAuth(); router.push('/signed-out'); };
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'A';
  const { theme, setTheme } = useTheme();

  if (!hydrated || user?.role !== 'merchant') return null;

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {sidebarOpen && (
        <button type="button" className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />
      )}
      <div className={`fixed inset-y-0 left-0 z-40 w-56 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="sticky top-0 z-20 bg-white border-b flex items-center justify-between px-4 h-14 shrink-0">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-neutral-100 lg:hidden" aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <ShoppingBag size={18} />
              <span className="font-semibold text-sm">digi-carts Admin</span>
            </div>
          </div>

          <div className="relative" ref={avatarRef}>
            <button
              type="button"
              onClick={() => setAvatarOpen(v => !v)}
              className="flex items-center gap-2 rounded-full hover:bg-neutral-100 px-2 py-1 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-neutral-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                {initials}
              </div>
            </button>

            {avatarOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border rounded-xl shadow-lg py-1 z-50">
                <div className="px-3 py-2 border-b">
                  <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                </div>
                <Link href="/settings/profile"
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
                  <User size={14} />
                  Profile & Password
                </Link>
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
                  <LogOut size={14} />
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">{children}</main>
      </div>
      <AiChat
        context={PAGE_CONTEXTS[pathname] ?? `Admin page: ${pathname.replace(/^\//, '').replace(/\//g, ' › ')}`}
        fallbackToPlatform={pathname.startsWith('/settings') || pathname.startsWith('/notifications')}
      />
    </div>
  );
}
