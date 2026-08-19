'use client';

import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, X } from 'lucide-react';
import { getSubStatusCache } from '@/app/(admin)/layout';

interface Product { id: string; name: string; price: number; stock: number; description?: string; images: string[]; categoryId?: string; category?: { id: string; name: string }; specs?: Spec[] }
interface Category { id: string; name: string; parentId: string | null; children?: Category[] }
interface Spec { _id: string; key: string; value: string }
interface ImageEntry { file: File; preview: string; id: string }

const CATALOG_SERVICE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ',
};

function imgUrl(src: string) {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  return `${CATALOG_SERVICE}${src}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => resolve(ev.target?.result as string);
    reader.readAsDataURL(file);
  });
}

type FormState = { name: string; price: string; stock: string; description: string; categoryId: string };
const emptyForm: FormState = { name: '', price: '', stock: '0', description: '', categoryId: '' };

function ExistingImageThumb({ url, onRemove }: Readonly<{ url: string; onRemove: () => void }>) {
  return (
    <div className="relative w-20 h-20">
      <img src={imgUrl(url)} alt="" className="w-20 h-20 object-cover rounded border" />
      <button type="button" onClick={onRemove}
        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600">
        ×
      </button>
    </div>
  );
}

function NewImageThumb({ preview, onRemove }: Readonly<{ preview: string; onRemove: () => void }>) {
  return (
    <div className="relative w-20 h-20">
      <img src={preview} alt="" className="w-20 h-20 object-cover rounded border opacity-70" />
      <button type="button" onClick={onRemove}
        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
        ×
      </button>
    </div>
  );
}

// ── AI Generate popup ──────────────────────────────────────────────────────────

interface AIPopupProps {
  categories: Category[];
  onClose: () => void;
  onApply: (fields: { name?: string; price?: string; description?: string; categoryId?: string; specs?: Spec[] }) => void;
}

function AIGeneratePopup({ categories, onClose, onApply }: Readonly<AIPopupProps>) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true); setError('');
    try {
      const catNames = categories.map(c => c.name);
      const { data } = await api.post('/store/ai-generate', { prompt: prompt.trim(), categories: catNames });
      const p = data.product as { name?: string; price?: number; description?: string; categoryName?: string; specs?: Array<{ key: string; value: string }> };

      // Try to match categoryName to an existing category id
      const matchedCat = categories.find(c =>
        c.name.toLowerCase() === (p.categoryName ?? '').toLowerCase() ||
        c.name.toLowerCase().includes((p.categoryName ?? '').toLowerCase())
      );

      onApply({
        name: p.name ?? '',
        price: p.price != null ? String(p.price) : '',
        description: p.description ?? '',
        categoryId: matchedCat?.id ?? '',
        specs: (p.specs ?? []).map(s => ({ ...s, _id: crypto.randomUUID() })),
      });
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Generation failed. Please try again.';
      setError(msg);
    } finally { setGenerating(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-500" />
            <span className="font-semibold text-sm">AI Product Generator</span>
          </div>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <Label>Describe your product</Label>
            <Textarea
              placeholder="e.g. Blue silk kurta with golden embroidery, handmade, 500 grams, suitable for weddings"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate(); }}
            />
            <p className="text-xs text-neutral-400">Tip: include material, color, size, use case, weight — more detail = better results.</p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button className="flex-1 gap-2" onClick={generate} disabled={generating || !prompt.trim()}>
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {generating ? 'Generating…' : 'Generate'}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
          <p className="text-[11px] text-neutral-400 text-center">Powered by Google Gemini · Results are suggestions — review before saving</p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const { storeId } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catTree, setCatTree] = useState<Category[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [mode, setMode] = useState<'idle' | 'add' | 'edit' | 'add-category'>('idle');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryParent, setNewCategoryParent] = useState('');
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI
  const [aiConfigured, setAiConfigured] = useState(false);
  const [aiPopupOpen, setAiPopupOpen] = useState(false);

  const load = () => api.get('/catalog/products').then((r) => setProducts(r.data.products)).catch(() => {});
  const loadCategories = () => api.get('/catalog/categories').then((r) => {
    setCategories(r.data.categories);
    setCatTree(r.data.tree || []);
  }).catch(() => {});

  const sub = getSubStatusCache();
  const maxProducts = sub?.subscription?.maxProducts ?? Infinity;
  const atLimit = products.length >= maxProducts;

  useEffect(() => {
    load();
    loadCategories();
    api.get('/store').then(r => {
      const currency = r.data.store?.currency || r.data.store?.branding?.currency || 'INR';
      setCurrencySymbol(CURRENCY_SYMBOLS[currency] || currency);
    }).catch(() => {});
    api.get('/store/ai-settings').then(r => setAiConfigured(r.data.configured as boolean)).catch(() => {});
  }, []);

  const openAdd = () => { setForm(emptyForm); setImages([]); setExistingImages([]); setSpecs([]); setEditingId(null); setError(''); setMode('add'); };
  const openEdit = (p: Product) => {
    setForm({ name: p.name, price: String(p.price), stock: String(p.stock), description: p.description || '', categoryId: p.categoryId || '' });
    setImages([]);
    setExistingImages(p.images || []);
    setSpecs((p.specs || []).map(s => ({ ...s, _id: s._id || crypto.randomUUID() })));
    setEditingId(p.id);
    setError('');
    setMode('edit');
  };
  const closeForm = () => { setMode('idle'); setEditingId(null); setImages([]); setExistingImages([]); setError(''); };

  const removeExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(i => i !== url));
  };

  const addImageFiles = async (files: File[]) => {
    const entries = await Promise.all(files.map(async (file) => ({
      file, preview: await readFileAsDataUrl(file), id: `${file.name}-${file.size}-${Date.now()}`,
    })));
    setImages((prev) => [...prev, ...entries]);
  };

  const uploadImage = async (productId: string, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    const token = localStorage.getItem('accessToken');
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');
    await fetch(`${baseUrl}/api/catalog/products/${productId}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}`, 'x-store-id': storeId ?? '', 'x-user-role': 'merchant' },
      body: fd,
    });
  };

  const saveCategory = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await api.post('/catalog/categories', {
        name: newCategory.trim(),
        parentId: newCategoryParent || null,
      });
      setNewCategory('');
      setNewCategoryParent('');
      setMode('idle');
      await loadCategories();
    } catch { setError('Failed to create category'); }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!storeId) { setError('Store not found — please re-login.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name,
        price: Number.parseFloat(form.price),
        stock: Number.parseInt(form.stock, 10),
        description: form.description || undefined,
        categoryId: form.categoryId || undefined,
        specs: specs.map(({ _id: _, ...s }) => s),
      };
      let productId = editingId;
      if (mode === 'add') {
        const { data } = await api.post('/catalog/products', payload);
        productId = data.product.id;
      } else if (editingId) {
        await api.patch(`/catalog/products/${editingId}`, { ...payload, images: existingImages });
      }
      if (images.length > 0 && productId) {
        await Promise.all(images.map((img) => uploadImage(productId!, img.file)));
      }
      closeForm(); await load();
    } catch { setError('Failed to save product. Please try again.');
    } finally { setSaving(false); }
  };

  const updateSpec = (i: number, field: 'key' | 'value', val: string) =>
    setSpecs(prev => prev.map((s, j) => j === i ? { ...s, [field]: val } : s));
  const removeSpec = (i: number) => setSpecs(prev => prev.filter((_, j) => j !== i));
  const addSpec = () => setSpecs(prev => [...prev, { _id: crypto.randomUUID(), key: '', value: '' }]);

  const del = async (id: string) => { await api.delete(`/catalog/products/${id}`); await load(); };
  const delCategory = async (id: string) => { await api.delete(`/catalog/categories/${id}`); await loadCategories(); };

  const applyAI = (fields: { name?: string; price?: string; description?: string; categoryId?: string; specs?: Spec[] }) => {
    setForm(prev => ({
      ...prev,
      ...(fields.name !== undefined && { name: fields.name }),
      ...(fields.price !== undefined && { price: fields.price }),
      ...(fields.description !== undefined && { description: fields.description }),
      ...(fields.categoryId !== undefined && { categoryId: fields.categoryId }),
    }));
    if (fields.specs) setSpecs(fields.specs);
  };

  return (
    <div>
      {aiPopupOpen && (
        <AIGeneratePopup
          categories={categories}
          onClose={() => setAiPopupOpen(false)}
          onApply={applyAI}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Catalog</h1>
          {maxProducts !== Infinity && (
            <p className={`text-xs mt-0.5 ${atLimit ? 'text-red-500 font-medium' : 'text-neutral-400'}`}>
              {products.length} / {maxProducts} products used
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setMode(mode === 'add-category' ? 'idle' : 'add-category')}>
            {mode === 'add-category' ? 'Cancel' : '+ Category'}
          </Button>
          <Button
            onClick={mode === 'add' || mode === 'edit' ? closeForm : openAdd}
            disabled={atLimit && mode !== 'add' && mode !== 'edit'}
            title={atLimit && mode !== 'add' && mode !== 'edit' ? `Plan limit of ${maxProducts} products reached` : undefined}
          >
            {mode === 'add' || mode === 'edit' ? 'Cancel' : 'Add Product'}
          </Button>
        </div>
      </div>

      {/* Categories tree */}
      {catTree.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {(function renderTree(nodes: Category[], depth: number): React.ReactNode {
            return nodes.map(c => (
              <span key={c.id} className="inline-flex flex-col gap-1">
                <span className="flex items-center gap-1 bg-neutral-100 text-neutral-700 text-xs px-2 py-1 rounded-full" style={{ marginLeft: depth * 12 }}>
                  {depth > 0 && <span className="text-neutral-400">↳</span>}
                  {c.name}
                  <button onClick={() => delCategory(c.id)} className="text-neutral-400 hover:text-red-500 ml-1">×</button>
                </span>
                {c.children?.length ? renderTree(c.children, depth + 1) : null}
              </span>
            ));
          })(catTree, 0)}
        </div>
      )}

      {/* Add Category Form */}
      {mode === 'add-category' && (
        <Card className="mb-4 max-w-sm">
          <CardContent className="pt-4">
            <form onSubmit={saveCategory} className="space-y-3">
              <Input placeholder="Category name" value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)} required autoFocus />
              <Select value={newCategoryParent} onValueChange={(v) => setNewCategoryParent(!v || v === '__none__' ? '' : (v as string))}>
                <SelectTrigger>
                  <SelectValue placeholder="Parent category (optional)">
                    {newCategoryParent ? (categories.find(c => c.id === newCategoryParent)?.name || 'Select parent…') : 'No parent (top-level)'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No parent (top-level)</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full">Add Category</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Product Form */}
      {(mode === 'add' || mode === 'edit') && (
        <Card className="mb-6 max-w-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{mode === 'edit' ? 'Edit Product' : 'New Product'}</CardTitle>
              {aiConfigured && (
                <button
                  type="button"
                  onClick={() => setAiPopupOpen(true)}
                  className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 border border-purple-200 hover:border-purple-400 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Sparkles size={13} />
                  AI Fill
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Price</Label>
                  <Input type="number" step="0.01" min="0" value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label>Stock</Label>
                  <Input type="number" min="0" value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: !v || v === '__none__' ? '' : (v as string) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category…">
                      {form.categoryId
                        ? (categories.find(c => c.id === form.categoryId)?.name || 'Select category…')
                        : 'Select category…'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— No category —</SelectItem>
                    {(function flatWithDepth(nodes: Category[], depth: number): React.ReactNode {
                      return nodes.map(c => [
                        <SelectItem key={c.id} value={c.id}>
                          {depth > 0 ? `${'  '.repeat(depth)}↳ ${c.name}` : c.name}
                        </SelectItem>,
                        c.children?.length ? flatWithDepth(c.children, depth + 1) : null,
                      ]);
                    })(catTree, 0)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>

              {/* Specs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Product Details</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSpec}>
                    + Add Field
                  </Button>
                </div>
                {specs.map((spec, i) => (
                  <div key={spec._id} className="flex gap-2 items-start">
                    <Input placeholder="Field name (e.g. Material)" value={spec.key}
                      onChange={(e) => updateSpec(i, 'key', e.target.value)}
                      className="w-1/3 shrink-0" />
                    <Textarea placeholder="Value (e.g. 100% Cotton)" value={spec.value} rows={1}
                      onChange={(e) => updateSpec(i, 'value', e.target.value)}
                      className="flex-1 min-h-0 resize-none" />
                    <button type="button" onClick={() => removeSpec(i)}
                      className="text-red-400 hover:text-red-600 text-lg leading-none mt-2">×</button>
                  </div>
                ))}
              </div>

              {/* Images */}
              <div className="space-y-2">
                <Label>Product Images</Label>
                {existingImages.length > 0 && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Saved images</p>
                    <div className="flex flex-wrap gap-2">
                      {existingImages.map((url) => (
                        <ExistingImageThumb key={url} url={url} onRemove={() => removeExistingImage(url)} />
                      ))}
                    </div>
                  </div>
                )}
                {images.length > 0 && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">New (not saved yet)</p>
                    <div className="flex flex-wrap gap-2">
                      {images.map((img) => (
                        <NewImageThumb key={img.id} preview={img.preview}
                          onRemove={() => setImages((prev) => prev.filter((i) => i.id !== img.id))} />
                      ))}
                    </div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => { addImageFiles(Array.from(e.target.files || [])); e.target.value = ''; }} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  + Add Images
                </Button>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : mode === 'edit' ? 'Update Product' : 'Save Product'}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Product List */}
      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3 bg-white rounded border">
            {p.images?.[0] ? (
              <img src={imgUrl(p.images[0])} alt={p.name} className="w-12 h-12 object-cover rounded border flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 bg-neutral-100 rounded border flex items-center justify-center text-neutral-300 text-xl flex-shrink-0">📦</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{p.name}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-neutral-400">{currencySymbol}{p.price.toFixed(2)} · {p.stock} in stock</p>
                {p.category && <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-full">{p.category.name}</span>}
              </div>
            </div>
            {(p.images?.length ?? 0) > 0 && <Badge variant="secondary" className="text-xs">{p.images.length} img</Badge>}
            <Button size="sm" variant="outline" onClick={() => openEdit(p)}>Edit</Button>
            <Button size="sm" variant="destructive" onClick={() => del(p.id)}>Delete</Button>
          </div>
        ))}
        {products.length === 0 && mode === 'idle' && <p className="text-sm text-neutral-400">No products yet.</p>}
      </div>
    </div>
  );
}
