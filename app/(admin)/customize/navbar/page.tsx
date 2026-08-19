'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, GripVertical, PanelLeft, PanelRight } from 'lucide-react';

interface NavLink { label: string; href: string; enabled: boolean }

const DEFAULT_LINKS: NavLink[] = [
  { label: 'Home', href: '/', enabled: true },
  { label: 'Products', href: '/products', enabled: true },
  { label: 'About', href: '/about', enabled: true },
  { label: 'Orders', href: '/orders', enabled: true },
];

export default function CustomizeNavbarPage() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newHref, setNewHref] = useState('/');
  const [config, setConfig] = useState({
    navShowCart: true,
    navShowLogin: true,
    navMobileMenuSide: 'right',
    navBrandMode: 'logo',
    whatsappEnabled: false,
    whatsappNumber: '',
    navLinks: DEFAULT_LINKS,
  });

  useEffect(() => {
    api.get('/store').then((r) => {
      const b = r.data.store?.branding || {};
      setConfig({
        navShowCart: b.navShowCart !== false,
        navShowLogin: b.navShowLogin !== false,
        navMobileMenuSide: b.navMobileMenuSide || 'right',
        navBrandMode: b.navBrandMode || 'logo',
        whatsappEnabled: !!b.whatsappEnabled,
        whatsappNumber: b.whatsappNumber || '',
        navLinks: b.navLinks || DEFAULT_LINKS,
      });
    }).catch(() => {});
  }, []);

  const updateLink = (i: number, field: keyof NavLink, val: string | boolean) =>
    setConfig(prev => ({ ...prev, navLinks: prev.navLinks.map((l, j) => j === i ? { ...l, [field]: val } : l) }));

  const removeLink = (i: number) =>
    setConfig(prev => ({ ...prev, navLinks: prev.navLinks.filter((_, j) => j !== i) }));

  const addLink = () => {
    const label = newLabel.trim();
    const href = newHref.trim() || '/';
    if (!label) return;
    setConfig(prev => ({ ...prev, navLinks: [...prev.navLinks, { label, href, enabled: true }] }));
    setNewLabel('');
    setNewHref('/');
  };

  const save = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const storeRes = await api.get('/store');
      const existing = storeRes.data.store?.branding || {};
      await api.patch('/store', { branding: { ...existing, ...config } });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally { setSaving(false); }
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Customize Navbar</h1>
      <form onSubmit={save} className="space-y-5">

        <Card>
          <CardHeader><CardTitle className="text-base">Visibility</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {([
              ['navShowCart', 'Show Cart button'],
              ['navShowLogin', 'Show Sign in / Logout'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer" htmlFor={key}>
                <input id={key} type="checkbox"
                  checked={config[key]}
                  onChange={e => setConfig({ ...config, [key]: e.target.checked })}
                  className="accent-black" />
                <span>{label}</span>
              </label>
            ))}

            <div className="pt-2 border-t space-y-2">
              <Label className="text-xs">Mobile menu slide-in side</Label>
              <div className="flex gap-2">
                {([
                  { side: 'left', Icon: PanelLeft, label: 'Left' },
                  { side: 'right', Icon: PanelRight, label: 'Right' },
                ] as const).map(({ side, Icon, label }) => (
                  <button key={side} type="button"
                    onClick={() => setConfig({ ...config, navMobileMenuSide: side })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${config.navMobileMenuSide === side ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-600 hover:border-black'}`}>
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-neutral-400">Controls which side the mobile menu slides in from.</p>
            </div>

            <div className="pt-2 border-t space-y-2">
              <Label className="text-xs">Brand display in nav bar</Label>
              <div className="flex gap-2">
                {([
                  { mode: 'logo', label: 'Logo only' },
                  { mode: 'text', label: 'Store name' },
                  { mode: 'both', label: 'Logo + name' },
                ] as const).map(({ mode, label }) => (
                  <button key={mode} type="button"
                    onClick={() => setConfig({ ...config, navBrandMode: mode })}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${config.navBrandMode === mode ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-600 hover:border-black'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-neutral-400">Choose whether the nav bar shows your logo, your store name, or both. Falls back to the store name if no logo is uploaded.</p>
            </div>

            <div className="pt-2 border-t space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer" htmlFor="whatsappEnabled">
                <input id="whatsappEnabled" type="checkbox"
                  checked={config.whatsappEnabled}
                  onChange={e => setConfig({ ...config, whatsappEnabled: e.target.checked })}
                  className="accent-black" />
                <span className="font-medium">Show WhatsApp contact button</span>
              </label>
              <p className="text-xs text-neutral-400">A floating WhatsApp button on your storefront. On a product page it opens a chat pre-filled with that product&apos;s link.</p>
              {config.whatsappEnabled && (
                <div className="space-y-1">
                  <Label className="text-xs">WhatsApp number <span className="text-neutral-400 font-normal">(with country code, digits only)</span></Label>
                  <Input value={config.whatsappNumber}
                    onChange={e => setConfig({ ...config, whatsappNumber: e.target.value.replace(/[^\d]/g, '') })}
                    placeholder="919876543210" className="h-8 text-sm font-mono" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Navigation Links</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-2 items-center text-xs text-neutral-400 font-medium pb-1 border-b">
              <span className="w-5" />
              <span>Label</span>
              <span>Path</span>
              <span>On</span>
              <span />
            </div>

            {config.navLinks.map((link, i) => (
              <div key={`${link.href}-${i}`} className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-2 items-center">
                <GripVertical size={14} className="text-neutral-300 shrink-0" />
                <Input value={link.label} placeholder="Label"
                  onChange={e => updateLink(i, 'label', e.target.value)}
                  className="h-8 text-sm" maxLength={50} />
                <Input value={link.href} placeholder="/path"
                  onChange={e => updateLink(i, 'href', e.target.value)}
                  className="h-8 text-sm font-mono" />
                <input type="checkbox" checked={link.enabled}
                  onChange={e => updateLink(i, 'enabled', e.target.checked)}
                  className="accent-black" aria-label={`Enable ${link.label}`} />
                <button type="button" onClick={() => removeLink(i)}
                  className="text-neutral-300 hover:text-red-500 transition-colors" aria-label="Remove">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-2 items-center pt-2 border-t mt-2">
              <Plus size={14} className="text-neutral-400 shrink-0" />
              <Input value={newLabel} placeholder="Menu label"
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLink())}
                className="h-8 text-sm" maxLength={50} />
              <Input value={newHref} placeholder="/path or https://…"
                onChange={e => setNewHref(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLink())}
                className="h-8 text-sm font-mono" />
              <span />
              <button type="button" onClick={addLink}
                disabled={!newLabel.trim()}
                className="text-neutral-400 hover:text-black disabled:opacity-30 transition-colors" aria-label="Add">
                <Plus size={16} />
              </button>
            </div>
            <p className="text-xs text-neutral-400">Press Enter or click + to add. Use /path for store pages or full https:// URL for external links.</p>
          </CardContent>
        </Card>

        {success && <p className="text-sm text-green-600">✓ Saved!</p>}
        <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Save'}</Button>
      </form>
    </div>
  );
}
