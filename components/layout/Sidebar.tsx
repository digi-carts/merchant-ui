'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { ChevronDown, ChevronRight, ExternalLink, FileText, LayoutTemplate, LifeBuoy, MessageSquare, ShoppingBag, Settings, Tag, Globe, RotateCcw, Truck } from 'lucide-react';
import {
  IconCatalog, IconCustomize, IconDashboard, IconDomain, IconNotifications,
  IconOrders, IconPayment, IconReports, IconSettings, IconStock, IconSubscription,
} from '@/components/ui/icons';
import { getSubStatusCache, type SubFeatures } from '@/app/(admin)/layout';

const customizeSubLinks = [
  { href: '/customize/home/title', label: 'Title / Banner' },
  { href: '/customize/home/categories', label: 'Shop by Category' },
  { href: '/customize/home/new-arrivals', label: 'New Arrivals' },
  { href: '/customize/home/featured', label: 'Featured' },
  { href: '/customize/footer', label: 'Footer' },
  { href: '/customize/theme', label: 'Theme' },
  { href: '/customize/icons', label: 'Tab bar' },
  { href: '/customize/about', label: 'About' },
  { href: '/customize/navbar', label: 'Navbar' },
  { href: '/pages', label: 'Pages' },
];

const notificationSubLinks = [
  { href: '/notifications/config', label: 'Channels', Icon: IconNotifications },
  { href: '/notifications/customer-alerts', label: 'Customer Alerts', Icon: IconNotifications },
];

const settingsSubLinks = [
  { href: '/settings/shop', label: 'Shop Settings', Icon: IconSettings },
  { href: '/settings/domain', label: 'Domain & Publish', Icon: Globe },
  { href: '/settings/payment', label: 'Payment Settings', Icon: IconPayment },
  { href: '/settings/payment-options', label: 'Payment Options', Icon: IconPayment },
  { href: '/settings/shipping', label: 'Shipping', Icon: Truck },
  { href: '/settings/ai', label: 'AI Settings', Icon: IconSettings },
  { href: '/settings/discounts', label: 'Discounts', Icon: Tag },
];

const adminLinks = [
  { href: '/store', label: 'Domain', Icon: IconDomain },
  { href: '/reports', label: 'Reports', Icon: IconReports },
];

const bottomLinks = [
  { href: '/subscription', label: 'Subscription', Icon: IconSubscription },
  { href: '/support', label: 'Support', Icon: LifeBuoy },
];

const STOREFRONT_DOMAIN = process.env.NEXT_PUBLIC_STOREFRONT_DOMAIN || 'digi-carts.com';

interface SidebarProps { onClose?: () => void }

export function Sidebar({ onClose }: Readonly<SidebarProps>) {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [storePublished, setStorePublished] = useState(false);
  const [productsOpen, setProductsOpen] = useState(
    pathname.startsWith('/catalog') || pathname.startsWith('/stock')
  );
  const [customizeOpen, setCustomizeOpen] = useState(pathname.startsWith('/customize') || pathname.startsWith('/pages'));
  const [templatesOpen, setTemplatesOpen] = useState(pathname.startsWith('/templates'));
  const [ordersOpen, setOrdersOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith('/settings'));
  const [notificationsOpen, setNotificationsOpen] = useState(
    pathname.startsWith('/notifications') || pathname.startsWith('/settings/notifications')
  );
  const [features, setFeatures] = useState<SubFeatures>({});

  useEffect(() => {
    api.get('/store').then((r) => { setSubdomain(r.data.store?.subdomain); setStorePublished(!!r.data.store?.published); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/catalog') || pathname.startsWith('/stock')) setProductsOpen(true);
    if (pathname.startsWith('/customize') || pathname.startsWith('/pages')) setCustomizeOpen(true);
    if (pathname.startsWith('/templates')) setTemplatesOpen(true);
    if (pathname.startsWith('/settings')) setSettingsOpen(true);
    if (pathname.startsWith('/notifications') || pathname.startsWith('/settings/notifications')) setNotificationsOpen(true);
    const cached = getSubStatusCache();
    if (cached?.subscription?.features) setFeatures(cached.subscription.features);
  }, [pathname]);

  const storefrontHref = subdomain ? `https://${subdomain}.${STOREFRONT_DOMAIN}` : null;
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const subLink = (href: string, label: string, Icon?: React.ComponentType<{ size?: number }>, exact = false) => {
    const active = exact ? pathname === href : isActive(href);
    return (
    <Link key={href} href={href} onClick={onClose}
      className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg transition-colors ${active ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}>
      {Icon ? <Icon size={13} /> : <span className="w-3 shrink-0" />}
      {label}
    </Link>
  );
  };

  return (
    <aside className="w-56 h-screen bg-neutral-900 text-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingBag size={20} />
          <span className="font-bold text-base">digi-carts</span>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="lg:hidden text-neutral-400 hover:text-white p-1" aria-label="Close">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      <div className="px-4 py-2 shrink-0">
        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Admin</span>
      </div>

      <nav className="flex-1 px-2 pb-2 flex flex-col gap-0.5 overflow-y-auto min-h-0">
        {/* Dashboard */}
        <Link href="/dashboard" onClick={onClose}
          className={`flex items-center gap-3 text-sm py-2 px-3 rounded-lg transition-colors ${isActive('/dashboard') ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}>
          <IconDashboard size={16} />
          Dashboard
        </Link>

        {/* Products (Catalog + Stock) */}
        <div>
          <button type="button" onClick={() => setProductsOpen(!productsOpen)}
            className={`flex items-center gap-3 w-full text-sm py-2 px-3 rounded-lg transition-colors ${(isActive('/catalog') || isActive('/stock')) ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}>
            <IconCatalog size={16} />
            <span className="flex-1 text-left">Products</span>
            {productsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {productsOpen && (
            <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-neutral-700 pl-3">
              {subLink('/catalog', 'Catalog', IconCatalog)}
              {subLink('/stock', 'Stock', IconStock)}
            </div>
          )}
        </div>

        {/* Customize */}
        <div>
          <button type="button" onClick={() => setCustomizeOpen(!customizeOpen)}
            className={`flex items-center gap-3 w-full text-sm py-2 px-3 rounded-lg transition-colors ${(pathname.startsWith('/customize') || pathname.startsWith('/pages')) ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}>
            <IconCustomize size={16} />
            <span className="flex-1 text-left">Customize</span>
            {customizeOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {customizeOpen && (
            <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-neutral-700 pl-3">
              {customizeSubLinks.map(({ href, label }) => subLink(href, label))}
            </div>
          )}
        </div>

        {/* Templates */}
        <div>
          <button type="button" onClick={() => setTemplatesOpen(!templatesOpen)}
            className={`flex items-center gap-3 w-full text-sm py-2 px-3 rounded-lg transition-colors ${pathname.startsWith('/templates') ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}>
            <LayoutTemplate size={16} />
            <span className="flex-1 text-left">Templates</span>
            {templatesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {templatesOpen && (
            <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-neutral-700 pl-3">
              {subLink('/templates/messages', 'Message Templates', MessageSquare)}
              {subLink('/templates/bills', 'Bill Templates', FileText)}
            </div>
          )}
        </div>

        {/* Flat admin links (Domain, Reports) */}
        {adminLinks.map(({ href, label, Icon }) => {
          if (href === '/store' && features.customDomain === false) return null;
          if (href === '/reports' && features.reports === false) return null;
          return (
            <Link key={href} href={href} onClick={onClose}
              className={`flex items-center gap-3 text-sm py-2 px-3 rounded-lg transition-colors ${isActive(href) ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}>
              <Icon size={16} />
              {label}
            </Link>
          );
        })}

        {/* Orders */}
        <div>
          <button type="button" onClick={() => setOrdersOpen(!ordersOpen)}
            className={`flex items-center gap-3 w-full text-sm py-2 px-3 rounded-lg transition-colors ${pathname.startsWith('/orders') ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}>
            <IconOrders size={16} />
            <span className="flex-1 text-left">Orders</span>
            {ordersOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {ordersOpen && (
            <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-neutral-700 pl-3">
              {subLink('/orders', 'All Orders', IconOrders, true)}
              {subLink('/orders/returns', 'Returns', RotateCcw)}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div>
          <button type="button" onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={`flex items-center gap-3 w-full text-sm py-2 px-3 rounded-lg transition-colors ${(pathname.startsWith('/notifications') || pathname.startsWith('/settings/notifications')) ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}>
            <IconNotifications size={16} />
            <span className="flex-1 text-left">Notifications</span>
            {notificationsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {notificationsOpen && (
            <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-neutral-700 pl-3">
              {notificationSubLinks.map(({ href, label, Icon }) => subLink(href, label, Icon))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div>
          <button type="button" onClick={() => setSettingsOpen(!settingsOpen)}
            className={`flex items-center gap-3 w-full text-sm py-2 px-3 rounded-lg transition-colors ${pathname.startsWith('/settings') ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}>
            <Settings size={16} />
            <span className="flex-1 text-left">Settings</span>
            {settingsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {settingsOpen && (
            <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-neutral-700 pl-3">
              {settingsSubLinks.map(({ href, label, Icon }) => subLink(href, label, Icon))}
            </div>
          )}
        </div>

        {bottomLinks.map(({ href, label, Icon }) => (
            <Link key={href} href={href} onClick={onClose}
              className={`flex items-center gap-3 text-sm py-2 px-3 rounded-lg transition-colors ${isActive(href) ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}>
              <Icon size={16} />
              {label}
            </Link>
          ))}

        {storefrontHref && storePublished && (
          <a href={storefrontHref} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-neutral-400 hover:text-white py-2 px-3 rounded-lg hover:bg-neutral-800 transition-colors mt-2 border-t border-neutral-800 pt-3">
            <ExternalLink size={16} className="shrink-0" />
            View Store ↗
          </a>
        )}
      </nav>

      <div className="px-4 pb-3 shrink-0">
        <Separator className="bg-neutral-800 mb-2" />
        <p className="text-[11px] text-neutral-500 truncate">{user?.email}</p>
      </div>
    </aside>
  );
}
