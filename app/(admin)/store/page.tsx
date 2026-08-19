'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle2, ExternalLink, Info, Loader2 } from 'lucide-react';
import { InfoModal } from '@/components/ui/info-modal';

const TEMPLATES = ['default', 'minimal', 'bold', 'elegant'];
const STOREFRONT_BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://digi-cart-storefront-m6jmogmpra-ue.a.run.app';
const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'digi-carts.digi-carts.com';

interface Store { id: string; name: string; subdomain: string; storeUrlId?: string; domain?: string; template: string; published: boolean }
interface SubStatus { expired: boolean; availableDays: number; subscribed: boolean }

export default function StoreSettingsPage() {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [form, setForm] = useState({ name: '', subdomain: '' });
  const [domain, setDomain] = useState('');
  const [subdomainInput, setSubdomainInput] = useState('');
  const [subdomainMsg, setSubdomainMsg] = useState('');
  const [subdomainError, setSubdomainError] = useState('');
  const [template, setTemplate] = useState('default');
  const [dnsHint, setDnsHint] = useState('');
  const [dnsError, setDnsError] = useState('');
  const [domainLoading, setDomainLoading] = useState(false);
  const [pubError, setPubError] = useState('');
  const [pubNote, setPubNote] = useState('');
  const [pubPhase, setPubPhase] = useState<null | 'publishing' | 'dns' | 'propagating' | 'live' | 'dns_failed'>(null);
  const [pubCountdown, setPubCountdown] = useState(0);
  const [domainMapped, setDomainMapped] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [creating, setCreating] = useState(false);
  const [subdomainSaving, setSubdomainSaving] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const load = useCallback(async () => {
    const [storeRes, subRes] = await Promise.all([
      api.get('/store').catch(() => null),
      api.get('/platform/subscription-status').catch(() => null),
    ]);
    if (storeRes) {
      const s = storeRes.data.store;
      setStore(s);
      setTemplate(s?.template || 'default');
      setSubdomainInput('');
    }
    if (subRes) setSub(subRes.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (sub?.expired && store?.published) {
      api.patch('/store/publish', { published: false }).then(() => load()).catch(() => {});
    }
  }, [sub, store?.published, load]);

  const createStore = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/store', { ...form, template });
      await load();
    } finally {
      setCreating(false);
    }
  };

  const addDomain = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDnsError(''); setDnsHint(''); setDomainLoading(true);
    try {
      const { data } = await api.post('/store/domain-mapping', { domain, storeId: store?.id });
      const records: { type: string; name: string; rrdata: string }[] = data.dnsRecords || [];
      setDnsHint(records.map((r) => `${r.type}  ${r.name}  →  ${r.rrdata}`).join('\n') || data.message || 'Domain mapping created.');
      await load();
    } catch (err: unknown) {
      setDnsError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create domain mapping');
    } finally {
      setDomainLoading(false);
    }
  };

  const saveSubdomain = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubdomainError(''); setSubdomainMsg('');
    const slug = subdomainInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (slug.length < 3) { setSubdomainError('Must be at least 3 characters'); return; }
    setSubdomainSaving(true);
    try {
      await api.patch('/store', { subdomain: slug, storeUrlId: slug });
      setSubdomainMsg('Subdomain updated!');
      setTimeout(() => setSubdomainMsg(''), 3000);
      await load();
    } catch (err: unknown) {
      setSubdomainError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update');
    } finally {
      setSubdomainSaving(false);
    }
  };

  const togglePublish = async () => {
    setPubError('');
    const publishing = !store?.published;

    if (!publishing) {
      // Unpublish: simple, no animation needed
      setPubPhase(null);
      if (countdownRef.current) clearInterval(countdownRef.current);
      try {
        await api.patch('/store/publish', { published: false });
        await load();
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        if (msg) setPubError(msg);
      }
      return;
    }

    // Publish with DNS progress
    setPubPhase('publishing');
    setPubNote('');
    if (countdownRef.current) clearInterval(countdownRef.current);
    try {
      const { data } = await api.patch('/store/publish', { published: true });
      setStore(data.store);

      const dns = data.dnsResult as { ok?: boolean; skipped?: boolean; created?: boolean; existed?: boolean; reason?: string; error?: string; recordName?: string; domainMapped?: boolean };
      if (!dns || dns?.skipped) {
        setPubPhase('live');
        if (dns?.reason) setPubNote(`DNS note: ${dns.reason}`);
      } else if (dns?.ok === false) {
        setPubPhase('dns_failed');
        setPubNote(`DNS record creation failed: ${dns.error || 'Unknown error'}. Create the CNAME manually or check Cloudflare settings in platform admin.`);
      } else {
        setDomainMapped(!!dns?.domainMapped);
        setPubPhase('dns');
        await new Promise(r => setTimeout(r, 1200));
        if (dns?.domainMapped) {
          // Cloud Run domain mapping created — Google provisions SSL (5–30 min)
          setPubPhase('live');
          setPubNote('SSL certificate is being provisioned by Google. Your custom domain will be fully accessible in 5–30 minutes.');
        } else {
          setPubPhase('propagating');
          if (dns?.recordName) setPubNote(`DNS record: ${dns.recordName}`);
          const TOTAL = dns?.existed ? 5 : 30;
          setPubCountdown(TOTAL);
          countdownRef.current = setInterval(() => {
            setPubCountdown(c => {
              if (c <= 1) {
                if (countdownRef.current) clearInterval(countdownRef.current);
                setPubPhase('live');
                return 0;
              }
              return c - 1;
            });
          }, 1000);
        }
      }
    } catch (err: unknown) {
      setPubPhase(null);
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (msg) setPubError(msg);
    }
  };

  if (!store) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Create Your Store</h1>
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <form onSubmit={createStore} className="space-y-4">
              <div className="space-y-1"><Label>Store Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-1"><Label>Subdomain</Label>
                <div className="flex items-center gap-1">
                  <Input value={form.subdomain} onChange={e => setForm({ ...form, subdomain: e.target.value.toLowerCase() })} required />
                  <span className="text-sm text-neutral-500 whitespace-nowrap">.{PLATFORM_DOMAIN}</span>
                </div>
              </div>
              <div className="space-y-1"><Label>Template</Label>
                <Select value={template} onValueChange={v => v && setTemplate(v as string)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TEMPLATES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? 'Creating…' : 'Create Store'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subExpired = sub?.expired === true;
  const platformUrl = `${store.subdomain}.${PLATFORM_DOMAIN}`;
  const storeHref = store.domain
    ? `https://${store.domain}`
    : `https://${platformUrl}`;

  return (
    <div className="space-y-6">
      {subExpired && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-700 mb-1">Subscription required</p>
            <p className="text-red-600">Your store has been unpublished. Renew your subscription to publish again.</p>
          </div>
          <Button size="sm" onClick={() => router.push('/subscription')} className="shrink-0">Renew →</Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Domain</h1>
        <button type="button" onClick={() => setShowInfo(true)}
          className="text-neutral-400 hover:text-indigo-600 transition-colors" aria-label="How to configure domain">
          <Info size={18} />
        </button>
      </div>

      <Card className="max-w-md">
        <CardHeader><CardTitle className="text-base">Store URL</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Platform subdomain */}
          <div>
            <p className="text-xs text-neutral-500 mb-1">Platform URL</p>
            <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg border text-sm font-mono">
              <span className="text-indigo-600 font-semibold">{store.subdomain}</span>
              <span className="text-neutral-400">.{PLATFORM_DOMAIN}</span>
              <a href={`https://${platformUrl}`} target="_blank" rel="noopener noreferrer"
                className="ml-auto text-neutral-400 hover:text-indigo-600">
                <ExternalLink size={14} />
              </a>
            </div>
            <form onSubmit={saveSubdomain} className="mt-2 space-y-2">
              <div className="flex items-center gap-1">
                <Input
                  placeholder={store.subdomain}
                  value={subdomainInput}
                  onChange={e => setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="font-mono"
                />
                <span className="text-sm text-neutral-400 whitespace-nowrap">.{PLATFORM_DOMAIN}</span>
              </div>
              {subdomainError && <p className="text-xs text-red-500">{subdomainError}</p>}
              {subdomainMsg && <p className="text-xs text-green-600">{subdomainMsg}</p>}
              <Button type="submit" size="sm" disabled={subdomainSaving || !subdomainInput || subdomainInput === store.subdomain}>
                {subdomainSaving ? 'Updating…' : 'Update Subdomain'}
              </Button>
            </form>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-neutral-500 mb-1">Custom Domain</p>
            {store.domain && (
              <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg border text-sm font-mono mb-2">
                <span className="text-indigo-600 font-semibold">{store.domain}</span>
                <a href={`https://${store.domain}`} target="_blank" rel="noopener noreferrer"
                  className="ml-auto text-neutral-400 hover:text-indigo-600">
                  <ExternalLink size={14} />
                </a>
              </div>
            )}
            <form onSubmit={addDomain} className="flex gap-2">
              <Input placeholder="myshop.com" value={domain} onChange={e => setDomain(e.target.value)} />
              <Button type="submit" disabled={domainLoading || !domain}>{domainLoading ? 'Setting…' : 'Set'}</Button>
            </form>
            {dnsError && <p className="text-xs text-red-500 mt-2">{dnsError}</p>}
            {dnsHint && (
              <div className="mt-2 p-2 bg-neutral-50 rounded border text-xs font-mono whitespace-pre text-neutral-600">
                {dnsHint}
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant={store.published ? 'default' : 'secondary'}>{store.published ? 'Live' : 'Draft'}</Badge>
                {store.published && (
                  <a href={storeHref} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                    View Store <ExternalLink size={13} />
                  </a>
                )}
              </div>
              <Button
                onClick={togglePublish}
                variant={store.published ? 'outline' : 'default'}
                size="sm"
                disabled={(subExpired && !store.published) || (pubPhase !== null && pubPhase !== 'live' && pubPhase !== 'dns_failed')}
              >
                {pubPhase === 'publishing' || pubPhase === 'dns' || pubPhase === 'propagating'
                  ? <><Loader2 size={13} className="animate-spin mr-1.5" />Publishing…</>
                  : store.published ? 'Unpublish' : 'Publish'}
              </Button>
            </div>

            {pubError && (
              <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                <AlertTriangle size={13} />
                {pubError} — <button type="button" onClick={() => router.push('/subscription')} className="underline font-medium">Subscribe now</button>
              </div>
            )}

            {pubPhase && (
              <div className={`p-3 rounded-lg border space-y-2.5 ${pubPhase === 'dns_failed' ? 'bg-amber-50 border-amber-200' : 'bg-neutral-50'}`}>
                <div className="flex items-center gap-2 text-sm">
                  {pubPhase === 'publishing' && (
                    <><Loader2 size={14} className="animate-spin text-indigo-500 shrink-0" /><span>Publishing your store…</span></>
                  )}
                  {pubPhase === 'dns' && (
                    <><Loader2 size={14} className="animate-spin text-indigo-500 shrink-0" /><span>Creating DNS record…</span></>
                  )}
                  {pubPhase === 'propagating' && (
                    <><Loader2 size={14} className="animate-spin text-amber-500 shrink-0" />
                      <span className="text-amber-700">
                        DNS propagating — ready in <span className="font-semibold tabular-nums">{pubCountdown}s</span>
                      </span>
                    </>
                  )}
                  {pubPhase === 'live' && (
                    <><CheckCircle2 size={14} className="text-green-500 shrink-0" />
                      <span className="font-medium text-green-700">{domainMapped ? 'Store published!' : 'Your store is live!'}</span>
                    </>
                  )}
                  {pubPhase === 'dns_failed' && (
                    <><AlertTriangle size={14} className="text-amber-500 shrink-0" />
                      <span className="font-medium text-amber-700">Store published — DNS setup failed</span>
                    </>
                  )}
                </div>
                {pubPhase === 'propagating' && (
                  <div className="w-full bg-neutral-200 rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-1 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.round(((30 - pubCountdown) / 30) * 100)}%` }}
                    />
                  </div>
                )}
                {(pubPhase === 'live' || pubPhase === 'propagating' || pubPhase === 'dns_failed') && (
                  <a href={storeHref} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline">
                    Open your store <ExternalLink size={12} />
                  </a>
                )}
                {pubPhase === 'propagating' && (
                  <p className="text-xs text-neutral-400">DNS record activated. Worldwide propagation can take up to 5 min.</p>
                )}
                {pubPhase === 'live' && domainMapped && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    Google is provisioning an SSL certificate for your domain. The link above will work fully in <span className="font-semibold">5–30 minutes</span>. No action needed — this is automatic.
                  </p>
                )}
                {pubNote && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">{pubNote}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showInfo && (
        <InfoModal title="How to configure your domain" onClose={() => setShowInfo(false)}>
          <p className="font-medium">Platform subdomain (free, instant)</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-600">
            <li>Type a unique slug (e.g. <span className="font-mono">myshop</span>) in the Platform URL field.</li>
            <li>Click <strong>Update Subdomain</strong>.</li>
            <li>Your store is immediately live at <span className="font-mono">myshop.{PLATFORM_DOMAIN}</span>.</li>
          </ol>
          <p className="font-medium pt-2">Custom domain (your own domain)</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-600">
            <li>Enter your domain (e.g. <span className="font-mono">myshop.com</span>) and click <strong>Set</strong>.</li>
            <li>The DNS record shown will appear — add it in your domain registrar or Cloudflare:</li>
          </ol>
          <div className="bg-neutral-100 rounded p-3 font-mono text-xs space-y-1">
            <p>Type: CNAME</p>
            <p>Name: <span className="text-indigo-600">your-domain.com</span></p>
            <p>Value: ghs.googlehosted.com</p>
            <p>Proxy: DNS only (grey cloud in Cloudflare)</p>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-neutral-600" start={3}>
            <li>Wait 5–10 minutes for the SSL certificate to be issued.</li>
            <li>Your store will be live at <span className="font-mono">https://your-domain.com</span>.</li>
          </ol>
          <p className="text-neutral-500 text-xs pt-1">Note: if you use Cloudflare, make sure the CNAME is set to <strong>DNS only</strong> (not proxied), otherwise the SSL certificate cannot be issued.</p>
        </InfoModal>
      )}
    </div>
  );
}
