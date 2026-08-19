'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, ExternalLink, Copy, Check, Loader2 } from 'lucide-react';

const STOREFRONT_DOMAIN =
  process.env.NEXT_PUBLIC_STOREFRONT_DOMAIN || 'digi-carts.com';
const STOREFRONT_BASE =
  process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://digi-cart-storefront-m6jmogmpra-ue.a.run.app';

function UrlRow({ label, url, hint }: Readonly<{ label: string; url: string; hint?: string }>) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input readOnly value={url} className="font-mono text-sm" />
        <Button type="button" variant="outline" size="sm" onClick={copy} className="gap-1 shrink-0">
          {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy'}
        </Button>
        <a href={url} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm border rounded-md px-3 py-1.5 hover:bg-neutral-50 shrink-0">
          <ExternalLink size={14} /> Open
        </a>
      </div>
      {hint && <p className="text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

interface Store {
  name?: string;
  subdomain?: string;
  storeUrlId?: string;
  domain?: string | null;
  published?: boolean;
}

export default function DomainPublishPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [savingDomain, setSavingDomain] = useState(false);
  const [dnsInstructions, setDnsInstructions] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const load = useCallback(async () => {
    try {
      const r = await api.get('/store');
      const s = (r.data.store ?? {}) as Store;
      setStore(s);
      setDomainInput(s.domain ?? '');
    } catch {
      setError('Failed to load store');
    }
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const subdomain = store?.subdomain || store?.storeUrlId || '';
  const subdomainUrl = subdomain ? `https://${subdomain}.${STOREFRONT_DOMAIN}` : '';
  const legacyUrl = subdomain ? `${STOREFRONT_BASE}/s/${subdomain}` : '';
  const domainUrl = store?.domain ? `https://${store.domain}` : '';

  const setPublished = async (published: boolean) => {
    setPublishing(true); setError(''); setMsg('');
    try {
      await api.patch('/store/publish', { published });
      await load();
      flash(published ? 'Your store is now live!' : 'Your store has been unpublished.');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to update publish status.');
    } finally { setPublishing(false); }
  };

  const saveDomain = async () => {
    const domain = domainInput.trim().toLowerCase();
    if (domain && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) { setError('Enter a valid domain (e.g. shop.example.com)'); return; }
    setSavingDomain(true); setError(''); setMsg('');
    try {
      const { data } = await api.patch('/store/domain', { domain });
      setDnsInstructions((data as { dnsInstructions?: string }).dnsInstructions ?? '');
      await load();
      flash('Custom domain saved — it can take up to 1 hour to go live.');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to save domain.');
    } finally { setSavingDomain(false); }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const published = !!store?.published;

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Globe size={20} className="text-neutral-400" />
        <h1 className="text-2xl font-bold">Domain &amp; Publish</h1>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {msg && <p className="text-sm text-green-600">{msg}</p>}

      {/* Publish status */}
      <Card>
        <CardHeader><CardTitle className="text-base">Store Status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full ${published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              <span className={`inline-block w-2 h-2 rounded-full ${published ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
              {published ? 'Live' : 'Draft'}
            </span>
            <p className="text-sm text-neutral-500">
              {published ? 'Your store is visible to customers.' : 'Your store is hidden until you publish it.'}
            </p>
          </div>
          <Button type="button" onClick={() => setPublished(!published)} disabled={publishing}
            variant={published ? 'outline' : 'default'} className="gap-2">
            {publishing && <Loader2 size={14} className="animate-spin" />}
            {published ? 'Unpublish store' : 'Publish store'}
          </Button>
          {!published && <p className="text-xs text-neutral-400">Publishing requires an active subscription.</p>}
        </CardContent>
      </Card>

      {/* Store URL */}
      <Card>
        <CardHeader><CardTitle className="text-base">Store URLs</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {subdomainUrl && <UrlRow label="Store URL" url={subdomainUrl} hint="Your store's primary address via the platform subdomain." />}
          {legacyUrl && <UrlRow label="Direct URL" url={legacyUrl} hint="Always available via the platform's direct link." />}
          {domainUrl
            ? <UrlRow label="Custom domain URL" url={domainUrl} hint="Live once your DNS points here." />
            : <p className="text-xs text-neutral-400">No custom domain connected yet — add one below to get a branded URL.</p>}
        </CardContent>
      </Card>

      {/* Custom domain */}
      <Card>
        <CardHeader><CardTitle className="text-base">Custom Domain</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
            ⏳ After saving, your custom domain can take <strong>up to 1 hour</strong> to go live while DNS propagates and the SSL certificate is issued. Your free subdomain keeps working in the meantime.
          </div>
          <div className="space-y-1">
            <Label>Connect your own domain <span className="text-neutral-400 text-xs font-normal">(optional)</span></Label>
            <div className="flex items-center gap-2">
              <Input value={domainInput} placeholder="shop.example.com"
                onChange={e => setDomainInput(e.target.value)} className="font-mono text-sm" />
              <Button type="button" onClick={saveDomain} disabled={savingDomain} className="gap-2 shrink-0">
                {savingDomain && <Loader2 size={14} className="animate-spin" />}
                Save Domain
              </Button>
            </div>
            <p className="text-xs text-neutral-400">Point your domain to us with a CNAME record, then save it here.</p>
          </div>
          {dnsInstructions && (
            <pre className="text-xs text-neutral-600 whitespace-pre-wrap font-mono bg-neutral-50 border rounded-lg p-3">{dnsInstructions}</pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
