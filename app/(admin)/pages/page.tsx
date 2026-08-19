'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, ExternalLink, X } from 'lucide-react';

const STOREFRONT_BASE =
  process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://digi-cart-storefront-m6jmogmpra-ue.a.run.app';

interface Page {
  id: string; slug: string; title: string;
  published: boolean; createdAt: string; updatedAt: string;
}
interface PageDetail extends Page { content: string }

const emptyForm = { title: '', slug: '', content: '', published: true };
type FormState = typeof emptyForm;

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function PageForm({ initial, onSave, onCancel, saving, error }: Readonly<{
  initial: FormState;
  onSave: (f: FormState) => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
}>) {
  const [form, setForm] = useState(initial);
  const [slugEdited, setSlugEdited] = useState(!!initial.slug);

  const setTitle = (title: string) => {
    setForm(f => ({ ...f, title, slug: slugEdited ? f.slug : slugify(title) }));
  };

  return (
    <div className="border rounded-xl p-5 space-y-4 bg-neutral-50">
      <div className="space-y-1">
        <Label>Page Title</Label>
        <Input placeholder="About Us" value={form.title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Slug <span className="text-neutral-400 text-xs">(URL: /p/slug)</span></Label>
        <Input
          placeholder="about-us"
          value={form.slug}
          onChange={e => { setSlugEdited(true); setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })); }}
        />
      </div>
      <div className="space-y-1">
        <Label>Content <span className="text-neutral-400 text-xs">(Markdown supported)</span></Label>
        <Textarea
          placeholder="# Hello&#10;&#10;Write your page content here using **Markdown**."
          rows={10}
          value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          className="font-mono text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} />
        Published (visible on storefront)
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)} disabled={saving || !form.title || !form.slug}>
          {saving ? 'Saving…' : 'Save Page'}
        </Button>
        <Button variant="outline" onClick={onCancel}><X size={14} className="mr-1" />Cancel</Button>
      </div>
    </div>
  );
}

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editing, setEditing] = useState<PageDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [subdomain, setSubdomain] = useState('');

  const load = useCallback(async () => {
    const [pagesRes, storeRes] = await Promise.all([
      api.get('/store/pages'),
      api.get('/store'),
    ]);
    setPages(pagesRes.data.pages || []);
    setSubdomain(storeRes.data.store?.subdomain || '');
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const startCreate = () => { setEditing(null); setMode('create'); setError(''); };

  const startEdit = async (p: Page) => {
    setError('');
    const r = await api.get(`/store/pages/${p.id}`);
    setEditing(r.data.page);
    setMode('edit');
  };

  const save = async (form: FormState) => {
    setSaving(true); setError('');
    try {
      if (mode === 'create') {
        await api.post('/store/pages', form);
      } else if (editing) {
        await api.patch(`/store/pages/${editing.id}`, form);
      }
      await load();
      setMode('list');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const deletePage = async (p: Page) => {
    if (!confirm(`Delete page "${p.title}"?`)) return;
    await api.delete(`/store/pages/${p.id}`);
    await load();
  };

  const previewUrl = (slug: string) =>
    subdomain ? `${STOREFRONT_BASE}/s/${subdomain}/p/${slug}` : null;

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Pages</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create custom pages for your store.</p>
        </div>
        {mode === 'list' && (
          <Button size="sm" onClick={startCreate}><Plus size={14} className="mr-1" />New Page</Button>
        )}
      </div>

      {(mode === 'create') && (
        <PageForm
          initial={emptyForm}
          onSave={save}
          onCancel={() => setMode('list')}
          saving={saving}
          error={error}
        />
      )}

      {mode === 'edit' && editing && (
        <PageForm
          initial={{ title: editing.title, slug: editing.slug, content: editing.content, published: editing.published }}
          onSave={save}
          onCancel={() => setMode('list')}
          saving={saving}
          error={error}
        />
      )}

      {mode === 'list' && (
        <div className="space-y-2">
          {pages.length === 0 && (
            <div className="border rounded-xl p-8 text-center text-neutral-400 text-sm">
              No pages yet. Create your first custom page.
            </div>
          )}
          {pages.map(p => {
            const url = previewUrl(p.slug);
            return (
              <div key={p.id} className="border rounded-xl p-4 flex items-center gap-3 hover:bg-neutral-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{p.title}</span>
                    <Badge variant={p.published ? 'default' : 'secondary'} className="text-[10px] h-4 px-1.5">
                      {p.published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">/p/{p.slug}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 text-neutral-400 hover:text-black rounded">
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button onClick={() => startEdit(p)} className="p-1.5 text-neutral-400 hover:text-black rounded">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deletePage(p)} className="p-1.5 text-neutral-400 hover:text-red-500 rounded">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
