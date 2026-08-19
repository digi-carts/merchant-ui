'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorInput } from '@/components/ui/color-input';
import { Trash2, Plus } from 'lucide-react';
import { loadBranding, saveBranding } from '@/lib/customize-shared';

interface FooterLink { _id: string; label: string; href: string }
interface FooterLinkGroup { _id: string; heading: string; links: FooterLink[] }
interface FooterSocial { _id: string; label: string; href: string }

const SOCIAL_PLATFORMS = [
  { value: 'Instagram', icon: '📷' },
  { value: 'Facebook', icon: '📘' },
  { value: 'Twitter / X', icon: '✖️' },
  { value: 'YouTube', icon: '▶️' },
  { value: 'LinkedIn', icon: '💼' },
  { value: 'WhatsApp', icon: '💬' },
  { value: 'TikTok', icon: '🎵' },
  { value: 'Pinterest', icon: '📌' },
];

interface Config {
  footerEnabled: boolean;
  footerTemplate: string;
  footerShowOn: string;
  footerBg: string;
  footerText: string;
  footerAccent: string;
  footerCopyright: string;
  footerTagline: string;
  footerShowLinks: boolean;
  footerLinkGroups: FooterLinkGroup[];
  footerSocials: FooterSocial[];
}

const defaults: Config = {
  footerEnabled: true,
  footerTemplate: 'simple',
  footerShowOn: 'all',
  footerBg: '#111827',
  footerText: '#9ca3af',
  footerAccent: '#6366f1',
  footerCopyright: '',
  footerTagline: '',
  footerShowLinks: true,
  footerLinkGroups: [],
  footerSocials: [],
};

function uid() { return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }

const ensureIds = (groups: FooterLinkGroup[]): FooterLinkGroup[] =>
  groups.map(g => ({ ...g, _id: g._id || uid(), links: g.links.map(l => ({ ...l, _id: l._id || uid() })) }));

function ColorRow({ label, value, onChange }: Readonly<{ label: string; value: string; onChange: (v: string) => void }>) {
  return <ColorInput value={value} onChange={onChange} label={label} />;
}

export default function CustomizeFooterPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState<Config>(defaults);

  useEffect(() => {
    loadBranding().then(b => {
      setConfig({
        footerEnabled: b.footerEnabled !== false,
        footerTemplate: (b.footerTemplate as string) || 'simple',
        footerShowOn: (b.footerShowOn as string) || 'all',
        footerBg: (b.footerBg as string) || '#111827',
        footerText: (b.footerText as string) || '#9ca3af',
        footerAccent: (b.footerAccent as string) || '#6366f1',
        footerCopyright: (b.footerCopyright as string) || '',
        footerTagline: (b.footerTagline as string) || '',
        footerShowLinks: b.footerShowLinks !== false,
        footerLinkGroups: ensureIds((b.footerLinkGroups as FooterLinkGroup[]) || []),
        footerSocials: ((b.footerSocials as FooterSocial[]) || []).map(s => ({ ...s, _id: s._id || uid() })),
      });
    }).catch(() => {}).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Link groups helpers
  const addGroup = () => setConfig(c => ({ ...c, footerLinkGroups: [...c.footerLinkGroups, { _id: uid(), heading: '', links: [] }] }));
  const removeGroup = (gid: string) => setConfig(c => ({ ...c, footerLinkGroups: c.footerLinkGroups.filter(g => g._id !== gid) }));
  const updateGroupHeading = (gid: string, v: string) =>
    setConfig(c => ({ ...c, footerLinkGroups: c.footerLinkGroups.map(g => g._id === gid ? { ...g, heading: v } : g) }));
  const addLink = (gid: string) =>
    setConfig(c => ({ ...c, footerLinkGroups: c.footerLinkGroups.map(g => g._id === gid ? { ...g, links: [...g.links, { _id: uid(), label: '', href: '' }] } : g) }));
  const removeLink = (gid: string, lid: string) =>
    setConfig(c => ({ ...c, footerLinkGroups: c.footerLinkGroups.map(g => g._id === gid ? { ...g, links: g.links.filter(l => l._id !== lid) } : g) }));
  const updateLink = (gid: string, lid: string, field: 'label' | 'href', val: string) =>
    setConfig(c => ({ ...c, footerLinkGroups: c.footerLinkGroups.map(g => g._id === gid ? { ...g, links: g.links.map(l => l._id === lid ? { ...l, [field]: val } : l) } : g) }));

  // Socials helpers
  const addSocial = () => setConfig(c => ({ ...c, footerSocials: [...c.footerSocials, { _id: uid(), label: '', href: '' }] }));
  const removeSocial = (sid: string) => setConfig(c => ({ ...c, footerSocials: c.footerSocials.filter(s => s._id !== sid) }));
  const updateSocial = (sid: string, field: 'label' | 'href', val: string) =>
    setConfig(c => ({ ...c, footerSocials: c.footerSocials.map(s => s._id === sid ? { ...s, [field]: val } : s) }));

  const save = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveBranding(config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally { setSaving(false); }
  };

  if (loading) return <p className="text-neutral-400">Loading…</p>;

  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-bold">Footer</h1>
      <form onSubmit={save} className="space-y-5">

        <Card>
          <CardHeader><CardTitle className="text-base">Display Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer" htmlFor="footerEnabled">
              <input id="footerEnabled" type="checkbox"
                checked={config.footerEnabled}
                onChange={e => setConfig(c => ({ ...c, footerEnabled: e.target.checked }))}
                className="accent-black" />
              <span className="font-medium">Show footer on storefront</span>
            </label>
            <p className="text-xs text-neutral-400 -mt-2">Uncheck to hide the footer on your storefront entirely.</p>
            <div className="space-y-2">
              <Label>Footer Style</Label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  {
                    value: 'simple',
                    label: 'Simple',
                    preview: (
                      <div className="w-full space-y-1 px-1 py-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <div className="w-8 h-1.5 rounded bg-current opacity-80" />
                          <div className="flex gap-1">
                            <div className="w-5 h-1 rounded bg-current opacity-40" />
                            <div className="w-5 h-1 rounded bg-current opacity-40" />
                            <div className="w-5 h-1 rounded bg-current opacity-40" />
                          </div>
                        </div>
                        <div className="w-16 h-0.5 rounded bg-current opacity-20 mx-auto" />
                        <div className="w-12 h-1 rounded bg-current opacity-30 mx-auto" />
                      </div>
                    ),
                  },
                  {
                    value: 'standard',
                    label: 'Standard',
                    preview: (
                      <div className="w-full px-1 py-1.5 space-y-1.5">
                        <div className="flex gap-2">
                          <div className="flex-1 space-y-1">
                            <div className="w-10 h-1.5 rounded bg-current opacity-80" />
                            <div className="w-14 h-1 rounded bg-current opacity-30" />
                            <div className="w-12 h-1 rounded bg-current opacity-30" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="w-8 h-1.5 rounded bg-current opacity-60" />
                            <div className="w-10 h-1 rounded bg-current opacity-30" />
                            <div className="w-10 h-1 rounded bg-current opacity-30" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="w-8 h-1.5 rounded bg-current opacity-60" />
                            <div className="w-10 h-1 rounded bg-current opacity-30" />
                            <div className="w-10 h-1 rounded bg-current opacity-30" />
                          </div>
                        </div>
                        <div className="w-full h-px bg-current opacity-10" />
                        <div className="w-16 h-1 rounded bg-current opacity-30 mx-auto" />
                      </div>
                    ),
                  },
                  {
                    value: 'rich',
                    label: 'Rich',
                    preview: (
                      <div className="w-full px-1 py-1.5 space-y-1.5">
                        <div className="flex gap-2">
                          <div className="flex-1 space-y-1">
                            <div className="w-10 h-1.5 rounded bg-current opacity-80" />
                            <div className="w-14 h-1 rounded bg-current opacity-30" />
                            <div className="flex gap-1 mt-0.5">
                              <div className="w-3 h-3 rounded-full bg-current opacity-50" />
                              <div className="w-3 h-3 rounded-full bg-current opacity-50" />
                              <div className="w-3 h-3 rounded-full bg-current opacity-50" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="w-8 h-1.5 rounded bg-current opacity-60" />
                            <div className="w-10 h-1 rounded bg-current opacity-30" />
                            <div className="w-10 h-1 rounded bg-current opacity-30" />
                            <div className="w-10 h-1 rounded bg-current opacity-30" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="w-8 h-1.5 rounded bg-current opacity-60" />
                            <div className="w-10 h-1 rounded bg-current opacity-30" />
                            <div className="w-10 h-1 rounded bg-current opacity-30" />
                            <div className="w-10 h-1 rounded bg-current opacity-30" />
                          </div>
                        </div>
                        <div className="w-full h-px bg-current opacity-10" />
                        <div className="w-20 h-1 rounded bg-current opacity-30 mx-auto" />
                      </div>
                    ),
                  },
                ] as const).map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setConfig(c => ({ ...c, footerTemplate: opt.value }))}
                    className={`rounded-xl border-2 overflow-hidden transition-all text-left ${config.footerTemplate === opt.value ? 'border-black shadow-sm' : 'border-neutral-200 hover:border-neutral-400'}`}>
                    <div className="rounded-t-lg p-1" style={{ backgroundColor: config.footerBg, color: config.footerText }}>
                      {opt.preview}
                    </div>
                    <div className={`text-xs font-medium text-center py-1.5 ${config.footerTemplate === opt.value ? 'bg-black text-white' : 'bg-neutral-50 text-neutral-600'}`}>
                      {opt.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Show Footer On</Label>
              <Select value={config.footerShowOn} onValueChange={v => v && setConfig(c => ({ ...c, footerShowOn: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pages</SelectItem>
                  <SelectItem value="home">Home Page Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Colors</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <ColorRow label="Background" value={config.footerBg} onChange={v => setConfig(c => ({ ...c, footerBg: v }))} />
            <ColorRow label="Text" value={config.footerText} onChange={v => setConfig(c => ({ ...c, footerText: v }))} />
            <ColorRow label="Accent / Links" value={config.footerAccent} onChange={v => setConfig(c => ({ ...c, footerAccent: v }))} />
            <div className="mt-1 p-3 rounded-lg text-xs font-medium" style={{ backgroundColor: config.footerBg, color: config.footerText }}>
              Preview — <span style={{ color: config.footerAccent }}>Store Name</span> · Links
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Content</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Copyright Text <span className="text-neutral-400 text-xs">(leave blank for auto)</span></Label>
                <span className={`text-xs ${config.footerCopyright.length > 80 ? 'text-red-500 font-medium' : 'text-neutral-400'}`}>
                  {config.footerCopyright.length}/80
                </span>
              </div>
              <Input placeholder="© 2026 Your Store. All rights reserved." value={config.footerCopyright}
                onChange={e => setConfig(c => ({ ...c, footerCopyright: e.target.value }))} maxLength={80} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Tagline <span className="text-neutral-400 text-xs">(shown in Standard / Rich)</span></Label>
                <span className={`text-xs ${config.footerTagline.length > 80 ? 'text-red-500 font-medium' : 'text-neutral-400'}`}>
                  {config.footerTagline.length}/80
                </span>
              </div>
              <Input placeholder="Quality products for everyone." value={config.footerTagline}
                onChange={e => setConfig(c => ({ ...c, footerTagline: e.target.value }))} maxLength={80} />
            </div>
          </CardContent>
        </Card>

        {(config.footerTemplate === 'standard' || config.footerTemplate === 'rich') && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Link Groups</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addGroup}><Plus size={13} className="mr-1" />Add Group</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.footerLinkGroups.length === 0
                ? <p className="text-xs text-neutral-400">No link groups yet.</p>
                : config.footerLinkGroups.map(group => (
                  <div key={group._id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input placeholder="Group heading (e.g. Company)" value={group.heading}
                        onChange={e => updateGroupHeading(group._id, e.target.value)} className="h-8 text-sm flex-1" maxLength={50} />
                      <button type="button" onClick={() => removeGroup(group._id)} className="text-neutral-300 hover:text-red-500 shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="space-y-1.5 pl-2">
                      {group.links.map(lk => (
                        <div key={lk._id} className="flex items-center gap-2">
                          <Input placeholder="Label" value={lk.label}
                            onChange={e => updateLink(group._id, lk._id, 'label', e.target.value)} className="h-7 text-xs w-28" maxLength={50} />
                          <Input placeholder="/about or https://…" value={lk.href}
                            onChange={e => updateLink(group._id, lk._id, 'href', e.target.value)} className="h-7 text-xs flex-1" />
                          <button type="button" onClick={() => removeLink(group._id, lk._id)} className="text-neutral-300 hover:text-red-500 shrink-0">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addLink(group._id)}
                        className="text-xs text-indigo-600 hover:underline mt-1">+ Add Link</button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {config.footerTemplate === 'rich' && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Social Links</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addSocial}><Plus size={13} className="mr-1" />Add</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {config.footerSocials.length === 0
                ? <p className="text-xs text-neutral-400">No social links yet.</p>
                : config.footerSocials.map(s => {
                  const platform = SOCIAL_PLATFORMS.find(p => p.value === s.label);
                  return (
                    <div key={s._id} className="flex items-center gap-2">
                      <div className="relative w-40 shrink-0">
                        <select value={s.label}
                          onChange={e => updateSocial(s._id, 'label', e.target.value)}
                          className="w-full h-8 rounded-md border border-neutral-200 pl-7 pr-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black appearance-none">
                          <option value="">Select platform…</option>
                          {SOCIAL_PLATFORMS.map(p => (
                            <option key={p.value} value={p.value}>{p.value}</option>
                          ))}
                        </select>
                        {platform && (
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm pointer-events-none">{platform.icon}</span>
                        )}
                      </div>
                      <Input placeholder="https://instagram.com/…" value={s.href}
                        onChange={e => updateSocial(s._id, 'href', e.target.value)} className="h-8 text-sm flex-1" />
                      <button type="button" onClick={() => removeSocial(s._id)} className="text-neutral-300 hover:text-red-500 shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        )}

        {success && <p className="text-sm text-green-600">✓ Saved!</p>}
        <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Save'}</Button>
      </form>
    </div>
  );
}
