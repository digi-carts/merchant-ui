'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

const SOCIAL_PLATFORMS = [
  { value: 'WhatsApp', icon: '💬' },
  { value: 'Instagram', icon: '📷' },
  { value: 'Facebook', icon: '📘' },
  { value: 'YouTube', icon: '▶️' },
  { value: 'X (Twitter)', icon: '✖️' },
  { value: 'LinkedIn', icon: '💼' },
  { value: 'TikTok', icon: '🎵' },
  { value: 'Pinterest', icon: '📌' },
  { value: 'Telegram', icon: '✈️' },
];

interface SocialLink { _id: string; label: string; href: string }

function uid() { return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }

const OLD_SOCIAL_KEYS: Record<string, string> = {
  WhatsApp: 'socialWhatsapp',
  Instagram: 'socialInstagram',
  Facebook: 'socialFacebook',
  YouTube: 'socialYoutube',
  'X (Twitter)': 'socialX',
};

export default function CustomizeAboutPage() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [about, setAbout] = useState({ title: '', description: '', businessHours: '' });
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [socials, setSocials] = useState<SocialLink[]>([]);

  useEffect(() => {
    api.get('/store').then((r) => {
      const b = r.data.store?.branding || {};
      setAbout({
        title: b.aboutTitle || '',
        description: b.aboutDescription || '',
        businessHours: b.businessHours || '',
      });
      setContactEmail(b.contactEmail || '');
      setContactPhone(b.contactPhone || '');

      if (Array.isArray(b.aboutSocials) && b.aboutSocials.length > 0) {
        setSocials(b.aboutSocials.map((s: SocialLink) => ({ ...s, _id: s._id || uid() })));
      } else {
        // migrate old flat fields to array format
        const migrated: SocialLink[] = [];
        for (const platform of SOCIAL_PLATFORMS) {
          const oldKey = OLD_SOCIAL_KEYS[platform.value];
          if (oldKey && b[oldKey]) {
            migrated.push({ _id: uid(), label: platform.value, href: b[oldKey] });
          }
        }
        setSocials(migrated);
      }
    }).catch(() => {});
  }, []);

  const addSocial = () => setSocials(s => [...s, { _id: uid(), label: '', href: '' }]);
  const removeSocial = (id: string) => setSocials(s => s.filter(x => x._id !== id));
  const updateSocial = (id: string, field: 'label' | 'href', val: string) =>
    setSocials(s => s.map(x => x._id === id ? { ...x, [field]: val } : x));

  const save = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const storeRes = await api.get('/store');
      const existing = storeRes.data.store?.branding || {};
      await api.patch('/store', {
        branding: {
          ...existing,
          aboutTitle: about.title,
          aboutDescription: about.description,
          businessHours: about.businessHours,
          contactEmail,
          contactPhone,
          aboutSocials: socials,
        },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally { setSaving(false); }
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Customize About Page</h1>
      <form onSubmit={save} className="space-y-5">

        <Card>
          <CardHeader><CardTitle className="text-base">About Section</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Page Title</Label>
                <span className={`text-xs ${about.title.length > 60 ? 'text-red-500 font-medium' : 'text-neutral-400'}`}>
                  {about.title.length}/60
                </span>
              </div>
              <Input value={about.title} placeholder="About Us"
                onChange={e => setAbout({ ...about, title: e.target.value })} maxLength={60} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Story / Description</Label>
                <span className={`text-xs ${about.description.length > 600 ? 'text-red-500 font-medium' : 'text-neutral-400'}`}>
                  {about.description.length}/600
                </span>
              </div>
              <Textarea value={about.description} placeholder="Tell your customers about your store, your journey, what makes you special…" rows={5}
                onChange={e => setAbout({ ...about, description: e.target.value })} maxLength={600} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Business Hours</Label>
                <span className={`text-xs ${about.businessHours.length > 50 ? 'text-red-500 font-medium' : 'text-neutral-400'}`}>
                  {about.businessHours.length}/50
                </span>
              </div>
              <Input value={about.businessHours} placeholder="Mon–Sat, 9am–7pm"
                onChange={e => setAbout({ ...about, businessHours: e.target.value })} maxLength={50} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="flex items-center gap-1"><span>✉️</span> Email</Label>
              <Input value={contactEmail} placeholder="hello@yourstore.com"
                onChange={e => setContactEmail(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-1"><span>📱</span> Phone / WhatsApp</Label>
              <Input value={contactPhone} placeholder="+91 98765 43210"
                onChange={e => setContactPhone(e.target.value)} maxLength={100} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Social Media</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addSocial}>
                <Plus size={13} className="mr-1" />Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {socials.length === 0
              ? <p className="text-xs text-neutral-400">No social links yet. Click Add to get started.</p>
              : socials.map(s => {
                const platform = SOCIAL_PLATFORMS.find(p => p.value === s.label);
                return (
                  <div key={s._id} className="flex items-center gap-2">
                    <div className="relative w-44 shrink-0">
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
                    <Input placeholder="https://…" value={s.href}
                      onChange={e => updateSocial(s._id, 'href', e.target.value)} className="h-8 text-sm flex-1" />
                    <button type="button" onClick={() => removeSocial(s._id)} className="text-neutral-300 hover:text-red-500 shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
          </CardContent>
        </Card>

        {success && <p className="text-sm text-green-600">✓ Saved!</p>}
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </form>
    </div>
  );
}
