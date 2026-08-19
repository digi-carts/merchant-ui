'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorInput } from '@/components/ui/color-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Printer, RefreshCw, Settings2, ChevronDown, ChevronUp, X } from 'lucide-react';
import Link from 'next/link';

const STORE_SERVICE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');

const BILL_STATUSES = ['DRAFT', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const STATUS_COLOR: Record<string, string> = {
  DRAFT:      'bg-neutral-100 text-neutral-600',
  PENDING:    'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED:    'bg-purple-100 text-purple-800',
  DELIVERED:  'bg-green-100 text-green-800',
  CANCELLED:  'bg-red-100 text-red-700',
};

const BILL_TEMPLATE_STYLES = [
  { key: 'classic', label: 'Classic' },
  { key: 'modern', label: 'Modern' },
  { key: 'minimal', label: 'Minimal' },
];

interface BillItem {
  productId: string;
  productName: string;
  qty: number;
  priceAtOrder: number;
}

interface Bill {
  id: string;
  orderId: string;
  storeId: string;
  items: BillItem[];
  subtotal: number;
  deliveryCharge: number;
  packingCharge: number;
  gstPercent: number;
  gstAmount: number;
  couponDiscount: number;
  total: number;
  status: string;
  createdAt: string;
}

interface BillTemplate {
  name?: string;
  logoUrl?: string | null;
  header?: string | null;
  footer?: string | null;
  showGst?: boolean;
  showLogo?: boolean;
  accentColor?: string;
  templateStyle?: string;
}

function BillPreview({ tpl, currency = '₹' }: Readonly<{ tpl: BillTemplate; currency?: string }>) {
  const accent = tpl.accentColor || '#171717';
  const isMinimal = tpl.templateStyle === 'minimal';

  return (
    <div className="border rounded-lg overflow-hidden text-[10px] bg-white shadow-sm" style={{ fontFamily: 'sans-serif' }}>
      {/* Header */}
      {isMinimal ? (
        <div className="px-4 py-3 border-b flex items-center justify-between">
          {tpl.showLogo && tpl.logoUrl && (
            <img src={tpl.logoUrl} alt="logo" className="h-5 w-auto object-contain" />
          )}
          <span className="font-bold text-sm" style={{ color: accent }}>{tpl.name || 'Store Name'}</span>
          <span className="text-neutral-400 text-[9px] font-medium tracking-widest uppercase">Invoice</span>
        </div>
      ) : (
        <div className="px-4 py-3" style={{ backgroundColor: accent, color: '#fff' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {tpl.showLogo && tpl.logoUrl && (
                <img src={tpl.logoUrl} alt="logo" className="h-5 w-auto object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
              )}
              <span className="font-bold text-xs">{tpl.name || 'Store Name'}</span>
            </div>
            <span className="font-semibold text-[9px] opacity-80 tracking-widest">INVOICE</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-3 space-y-2">
        {tpl.header && <p className="text-center text-neutral-500 italic text-[9px]">{tpl.header}</p>}
        <div className="text-neutral-500 space-y-0.5">
          <p>Order #SAMPLE-001</p>
          <p>Date: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Items table */}
        <div className="border rounded overflow-hidden">
          <div className="grid grid-cols-4 px-2 py-1 font-semibold text-[9px]"
            style={isMinimal ? { borderBottom: `2px solid ${accent}`, color: accent } : { backgroundColor: `${accent}22`, color: accent }}>
            <span className="col-span-2">Item</span><span className="text-right">Qty</span><span className="text-right">Amt</span>
          </div>
          <div className="grid grid-cols-4 px-2 py-1 border-t text-neutral-600">
            <span className="col-span-2">Sample Product</span><span className="text-right">×2</span><span className="text-right">{currency}200</span>
          </div>
        </div>

        {/* Totals */}
        <div className="text-right space-y-0.5 text-neutral-600">
          <div className="flex justify-between"><span>Subtotal</span><span>{currency}200.00</span></div>
          {tpl.showGst !== false && (
            <div className="flex justify-between"><span>GST (18%)</span><span>{currency}36.00</span></div>
          )}
          <div className="flex justify-between font-bold text-xs pt-1 border-t mt-1" style={{ color: accent }}>
            <span>Total</span><span>{currency}236.00</span>
          </div>
        </div>

        {tpl.footer && <p className="text-center text-neutral-400 border-t pt-2 text-[9px]">{tpl.footer}</p>}
      </div>
    </div>
  );
}

function saveBtnLabel(saving: boolean, uploading: boolean, saved: boolean) {
  if (saving || uploading) return 'Saving…';
  if (saved) return 'Saved ✓';
  return 'Save Template';
}

function TemplatePanel({ onClose, currency }: Readonly<{ onClose: () => void; currency?: string }>) {
  const [tpl, setTpl] = useState<BillTemplate>({
    name: 'Default', logoUrl: '', header: '', footer: '',
    showGst: true, showLogo: true, accentColor: '#171717', templateStyle: 'classic',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    api.get('/billing/templates/my').then(r => {
      if (r.data.template) {
        const t = r.data.template as BillTemplate;
        setTpl(t);
        if (t.logoUrl) {
          setLogoPreview(t.logoUrl.startsWith('http') ? t.logoUrl : `${STORE_SERVICE}${t.logoUrl}`);
        }
      }
    }).catch(() => {});
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return tpl.logoUrl ?? null;
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', logoFile);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${STORE_SERVICE}/api/store/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token ?? ''}` },
        body: fd,
      });
      const data = await res.json();
      setLogoFile(null);
      return data.url as string;
    } catch { return tpl.logoUrl ?? null; }
    finally { setLogoUploading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const logoUrl = await uploadLogo();
      const toSave = { ...tpl, logoUrl };
      await api.put('/billing/templates/my', toSave);
      setTpl(t => ({ ...t, logoUrl }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const previewTpl: BillTemplate = { ...tpl, logoUrl: logoPreview || tpl.logoUrl };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 w-full h-full cursor-default" onClick={onClose} />
      <div className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-4xl mx-auto overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <p className="font-semibold">Bill Template Settings</p>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-black dark:hover:text-white"><X size={18} /></button>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left: settings */}
          <div className="w-1/2 px-5 py-4 space-y-4 overflow-y-auto border-r">
            {/* Template style */}
            <div className="space-y-1.5">
              <Label>Template Style</Label>
              <div className="flex gap-2">
                {BILL_TEMPLATE_STYLES.map(s => (
                  <button key={s.key} type="button"
                    onClick={() => setTpl(t => ({ ...t, templateStyle: s.key }))}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${tpl.templateStyle === s.key ? 'bg-black text-white border-black' : 'border-neutral-200 hover:border-black'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Name */}
            <div className="space-y-1">
              <Label>Template Name</Label>
              <Input value={tpl.name ?? ''} onChange={e => setTpl(t => ({ ...t, name: e.target.value }))} placeholder="My Store Bill" />
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo</Label>
              {logoPreview && (
                <img src={logoPreview} alt="Logo preview" className="h-10 w-auto object-contain rounded border p-1" />
              )}
              <div className="flex items-center gap-2">
                <input type="file" accept="image/*" className="hidden" id="bill-logo-upload" onChange={handleLogoChange} />
                <label htmlFor="bill-logo-upload">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border rounded-md cursor-pointer hover:bg-neutral-50">
                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </span>
                </label>
                {logoPreview && (
                  <button type="button" className="text-xs text-neutral-400 hover:text-red-500"
                    onClick={() => { setLogoPreview(''); setLogoFile(null); setTpl(t => ({ ...t, logoUrl: null })); }}>
                    Remove
                  </button>
                )}
              </div>
              {logoFile && <p className="text-xs text-neutral-400">{logoFile.name} (will upload on save)</p>}
            </div>

            {/* Header / Footer */}
            <div className="space-y-1">
              <Label>Header Text</Label>
              <textarea rows={2} value={tpl.header ?? ''} onChange={e => setTpl(t => ({ ...t, header: e.target.value || null }))}
                placeholder="e.g. Thank you for shopping with us!"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black resize-none dark:bg-neutral-800 dark:border-neutral-700" />
            </div>
            <div className="space-y-1">
              <Label>Footer Text</Label>
              <textarea rows={2} value={tpl.footer ?? ''} onChange={e => setTpl(t => ({ ...t, footer: e.target.value || null }))}
                placeholder="e.g. For queries: support@yourstore.com"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black resize-none dark:bg-neutral-800 dark:border-neutral-700" />
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={tpl.showGst ?? true} onChange={e => setTpl(t => ({ ...t, showGst: e.target.checked }))} className="accent-black" />{' '}
                Show GST line
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={tpl.showLogo ?? true} onChange={e => setTpl(t => ({ ...t, showLogo: e.target.checked }))} className="accent-black" />{' '}
                Show Logo
              </label>
            </div>

            {/* Accent Color */}
            <div className="space-y-1">
              <Label>Accent Color</Label>
              <ColorInput value={tpl.accentColor ?? '#171717'} onChange={v => setTpl(t => ({ ...t, accentColor: v }))} />
            </div>
          </div>

          {/* Right: live preview */}
          <div className="w-1/2 px-5 py-4 bg-neutral-50 overflow-y-auto">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">Live Preview</p>
            <BillPreview tpl={previewTpl} currency={currency} />
          </div>
        </div>

        <div className="px-5 py-3 flex justify-end gap-2 border-t shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          <Button size="sm" disabled={saving || logoUploading} onClick={save}>
            {saveBtnLabel(saving, logoUploading, saved)}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BillRow({ bill, selected, onToggle, currency }: Readonly<{
  bill: Bill; selected: boolean; onToggle: (id: string) => void; currency: string;
}>) {
  const [expanded, setExpanded] = useState(false);
  const items: BillItem[] = Array.isArray(bill.items) ? bill.items as BillItem[] : [];
  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-xl border overflow-hidden transition-colors ${selected ? 'ring-2 ring-black dark:ring-white' : ''}`}>
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
        <input type="checkbox" checked={selected} onChange={() => onToggle(bill.orderId)}
          className="accent-black shrink-0" aria-label={`Select bill ${bill.orderId}`} />
        <button type="button" onClick={() => setExpanded(e => !e)} className="text-neutral-400 hover:text-black dark:hover:text-white shrink-0">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-neutral-500">#{bill.orderId}</p>
          <p className="text-xs text-neutral-400">{new Date(bill.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-semibold text-sm">{currency}{bill.total.toFixed(2)}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[bill.status] ?? 'bg-neutral-100 text-neutral-600'}`}>{bill.status}</span>
        </div>
      </div>
      {expanded && (
        <div className="border-t px-4 py-3 bg-neutral-50 dark:bg-neutral-800 space-y-2">
          <div className="rounded-lg border bg-white dark:bg-neutral-900 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border-b text-xs font-semibold text-neutral-400 uppercase tracking-wide">
              <span>Item</span><span className="text-right">Qty</span><span className="text-right">Price</span><span className="text-right">Amount</span>
            </div>
            {items.map(item => (
              <div key={`${item.productId}-${item.priceAtOrder}`} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-2 border-b last:border-b-0 text-sm">
                <span className="truncate">{item.productName}</span>
                <span className="text-neutral-500 text-right">×{item.qty}</span>
                <span className="text-neutral-500 text-right">{currency}{item.priceAtOrder.toFixed(2)}</span>
                <span className="font-medium text-right">{currency}{(item.priceAtOrder * item.qty).toFixed(2)}</span>
              </div>
            ))}
            <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-t space-y-1 text-xs">
              <div className="flex justify-between text-neutral-500"><span>Subtotal</span><span>{currency}{bill.subtotal.toFixed(2)}</span></div>
              {bill.deliveryCharge > 0 && <div className="flex justify-between text-neutral-500"><span>Delivery</span><span>{currency}{bill.deliveryCharge.toFixed(2)}</span></div>}
              {bill.packingCharge > 0 && <div className="flex justify-between text-neutral-500"><span>Packing</span><span>{currency}{bill.packingCharge.toFixed(2)}</span></div>}
              {bill.gstAmount > 0 && <div className="flex justify-between text-neutral-500"><span>GST ({bill.gstPercent}%)</span><span>{currency}{bill.gstAmount.toFixed(2)}</span></div>}
              {bill.couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{currency}{bill.couponDiscount.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-sm pt-1 border-t mt-1"><span>Total</span><span>{currency}{bill.total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('₹');
  const [template, setTemplate] = useState<BillTemplate | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [statusOpen, setStatusOpen] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [idSearch, setIdSearch] = useState('');

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = () => setStatusOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const loadBills = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate + 'T23:59:59');
      if (idSearch) params.set('id', idSearch);
      const [billsRes, storeRes, tplRes] = await Promise.all([
        api.get(`/billing/bills?${params}`),
        api.get('/store').catch(() => null),
        api.get('/billing/templates/my').catch(() => null),
      ]);
      const loaded: Bill[] = billsRes.data.bills || [];
      setBills(loaded);
      setTotal(billsRes.data.total ?? loaded.length);
      if (tplRes?.data?.template) setTemplate(tplRes.data.template);
      const cur = storeRes?.data?.store?.currency || storeRes?.data?.store?.branding?.currency || 'INR';
      const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
      setCurrency(symbols[cur] || cur);
      setSelected(new Set(loaded.map((b: Bill) => b.orderId)));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [fromDate, toDate, idSearch]);

  useEffect(() => { loadBills(); }, [loadBills]);

  const toggleStatus = (s: string) =>
    setStatusFilters(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });

  const filteredBills = statusFilters.size === 0
    ? bills
    : bills.filter(b => statusFilters.has(b.status));

  const allIds = filteredBills.map(b => b.orderId);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));

  const toggleOne = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(allIds));

  const selectedBills = filteredBills.filter(b => selected.has(b.orderId));

  const generatePdf = async (action: 'download' | 'print') => {
    if (selectedBills.length === 0) return;
    setGenerating(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const storeName = template?.name || 'Store';
      const accent = template?.accentColor || '#171717';
      const r = Number.parseInt(accent.slice(1, 3), 16);
      const g = Number.parseInt(accent.slice(3, 5), 16);
      const b = Number.parseInt(accent.slice(5, 7), 16);

      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();

      selectedBills.forEach((bill, idx) => {
        if (idx > 0) doc.addPage();

        doc.setFillColor(r, g, b);
        doc.rect(0, 0, pageW, 22, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(storeName, 14, 14);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('INVOICE', pageW - 14, 14, { align: 'right' });

        doc.setTextColor(60, 60, 60);
        doc.setFontSize(9);
        doc.text(`Order #${bill.orderId}`, 14, 30);
        doc.text(`Date: ${new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 14, 36);
        doc.text(`Status: ${bill.status}`, 14, 42);

        if (template?.header) {
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(template.header, pageW / 2, 32, { align: 'center' });
        }

        autoTable(doc, {
          startY: 50,
          head: [['Item', 'Qty', 'Unit Price', 'Amount']],
          body: bill.items.map(item => [
            item.productName,
            item.qty,
            `${currency}${item.priceAtOrder.toFixed(2)}`,
            `${currency}${(item.priceAtOrder * item.qty).toFixed(2)}`,
          ]),
          headStyles: { fillColor: [r, g, b], textColor: [255, 255, 255], fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 'auto' }, 1: { halign: 'center', cellWidth: 18 }, 2: { halign: 'right', cellWidth: 35 }, 3: { halign: 'right', cellWidth: 35 } },
          margin: { left: 14, right: 14 },
        });

        const tableEndY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
        const totals: [string, string][] = [['Subtotal', `${currency}${bill.subtotal.toFixed(2)}`]];
        if (bill.deliveryCharge > 0) totals.push(['Delivery', `${currency}${bill.deliveryCharge.toFixed(2)}`]);
        if (bill.packingCharge > 0) totals.push(['Packing', `${currency}${bill.packingCharge.toFixed(2)}`]);
        if (bill.gstAmount > 0 && template?.showGst !== false) totals.push([`GST (${bill.gstPercent}%)`, `${currency}${bill.gstAmount.toFixed(2)}`]);
        if (bill.couponDiscount > 0) totals.push(['Discount', `−${currency}${bill.couponDiscount.toFixed(2)}`]);

        let y = tableEndY;
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        totals.forEach(([label, val]) => {
          doc.text(label, pageW - 50, y);
          doc.text(val, pageW - 14, y, { align: 'right' });
          y += 6;
        });

        doc.setDrawColor(r, g, b);
        doc.setLineWidth(0.3);
        doc.line(pageW - 60, y - 2, pageW - 14, y - 2);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(r, g, b);
        doc.text('Total', pageW - 50, y + 4);
        doc.text(`${currency}${bill.total.toFixed(2)}`, pageW - 14, y + 4, { align: 'right' });

        if (template?.footer) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(template.footer, pageW / 2, 285, { align: 'center' });
        }
      });

      if (action === 'download') {
        doc.save(`bills-${new Date().toISOString().slice(0, 10)}.pdf`);
      } else {
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
      }
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      {showTemplate && <TemplatePanel onClose={() => { setShowTemplate(false); loadBills(); }} currency={currency} />}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <FileText size={22} className="text-neutral-400" />
          <h1 className="text-2xl font-bold">Bills <span className="text-sm font-normal text-neutral-400 ml-1">({filteredBills.length}{statusFilters.size > 0 ? ` of ${total}` : ''})</span></h1>
        </div>
        <div className="flex gap-2">
          <Link href="/templates/bills">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Settings2 size={14} /> Template
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={loadBills} disabled={loading} className="gap-1.5">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Filters</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <div className="relative">
                <button type="button"
                  onClick={e => { e.stopPropagation(); setStatusOpen(o => !o); }}
                  className="flex items-center gap-2 h-8 px-3 rounded-lg border text-sm bg-white hover:border-black focus:outline-none focus:ring-1 focus:ring-black min-w-[140px]">
                  <span className="flex-1 text-left truncate text-neutral-600">
                    {statusFilters.size === 0 ? 'All statuses' : [...statusFilters].join(', ')}
                  </span>
                  <ChevronDown size={13} className="shrink-0 text-neutral-400" />
                </button>
                {statusOpen && (
                  <div role="menu" tabIndex={-1} className="absolute z-20 mt-1 bg-white border rounded-xl shadow-lg py-1 min-w-[160px]" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
                    {BILL_STATUSES.map(s => (
                      <label key={s} className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-neutral-50">
                        <input type="checkbox" checked={statusFilters.has(s)} onChange={() => toggleStatus(s)} className="accent-black" />
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${STATUS_COLOR[s] ?? 'bg-neutral-100 text-neutral-600'}`}>{s}</span>
                      </label>
                    ))}
                    {statusFilters.size > 0 && (
                      <button type="button" onClick={() => setStatusFilters(new Set())}
                        className="w-full text-left px-3 py-1.5 text-xs text-neutral-400 hover:text-black border-t mt-1 pt-2">
                        Clear selection
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="bill-from">From</Label>
              <Input id="bill-from" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-8 text-sm w-36" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="bill-to">To</Label>
              <Input id="bill-to" type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-8 text-sm w-36" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="bill-id">Order ID</Label>
              <Input id="bill-id" placeholder="Search by order ID…" value={idSearch} onChange={e => setIdSearch(e.target.value)}
                className="h-8 text-sm w-48" />
            </div>
            {(fromDate || toDate || idSearch || statusFilters.size > 0) && (
              <Button variant="ghost" size="sm" className="text-xs gap-1 self-end"
                onClick={() => { setFromDate(''); setToDate(''); setIdSearch(''); setStatusFilters(new Set()); setStatusOpen(false); }}>
                <X size={12} /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selection toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-2.5 border">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-black" aria-label="Select all" />
            {allSelected ? 'Deselect all' : 'Select all'}
          </label>
          {selected.size > 0 && (
            <span className="text-xs text-neutral-500">{selected.size} bill{selected.size !== 1 ? 's' : ''} selected</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={selected.size === 0 || generating} onClick={() => generatePdf('print')} className="gap-1.5">
            <Printer size={14} /> Print
          </Button>
          <Button size="sm" disabled={selected.size === 0 || generating} onClick={() => generatePdf('download')} className="gap-1.5">
            {generating ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            {generating ? 'Generating…' : 'Save PDF'}
          </Button>
        </div>
      </div>

      {/* Bill list */}
      <div className="space-y-2" ref={printRef}>
        {loading && ['sk-1', 'sk-2', 'sk-3'].map(k => (
          <div key={k} className="h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        ))}
        {!loading && filteredBills.map(bill => (
          <BillRow key={bill.orderId} bill={bill} selected={selected.has(bill.orderId)}
            onToggle={toggleOne} currency={currency} />
        ))}
        {!loading && filteredBills.length === 0 && (
          <p className="text-sm text-neutral-400 py-12 text-center">No bills found. Bills are created automatically when orders are placed.</p>
        )}
      </div>
    </div>
  );
}
