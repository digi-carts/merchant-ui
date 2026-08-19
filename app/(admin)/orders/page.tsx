'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Truck, X, FileText, Download, Printer, RefreshCw } from 'lucide-react';

const STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const STATUS_COLOR: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED:    'bg-purple-100 text-purple-800',
  DELIVERED:  'bg-green-100 text-green-800',
  CANCELLED:  'bg-red-100 text-red-700',
};

interface ShippingAddress { name: string; line1: string; city: string; country: string; zip: string }
interface OrderItem { productName: string; qty: number; priceAtOrder: number; productId: string }
interface Order {
  id: string; status: string; total: number; createdAt: string;
  userId: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  trackingId?: string | null;
  courierProvider?: string | null;
  adminComment?: string | null;
}

interface EnabledProvider { provider: string; displayName: string; enabled: boolean; configured: boolean }

interface StatusModalProps {
  order: Order;
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}

function StatusModal({ order, currency, onClose, onSaved }: Readonly<StatusModalProps>) {
  const [status, setStatus] = useState(order.status);
  const [courier, setCourier] = useState(order.courierProvider ?? '');
  const [tracking, setTracking] = useState(order.trackingId ?? '');
  const [comment, setComment] = useState(order.adminComment ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookErr, setBookErr] = useState('');
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [awbNumber, setAwbNumber] = useState<string | null>(null);
  const [providers, setProviders] = useState<EnabledProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  useEffect(() => {
    api.get('/shipping/providers').then(r => {
      const list: EnabledProvider[] = r.data.providers ?? [];
      setProviders(list);
      const active: string | null = r.data.activeProvider ?? null;
      if (active) setSelectedProvider(active);
    }).catch(() => {});
  }, []);

  const needsShipping = status === 'SHIPPED';
  const isOwn = selectedProvider === 'own';
  const isIntegrated = !!selectedProvider && selectedProvider !== 'own';
  // Show providers that are enabled or are 'own'
  const selectableProviders = providers.filter(p => p.enabled || p.provider === 'own');

  const bookShipment = async () => {
    setBooking(true); setBookErr('');
    try {
      const { data } = await api.post('/shipping/shipments', { orderId: order.id, provider: selectedProvider });
      if (data.courierName) setCourier(data.courierName);
      if (data.awbNumber) { setTracking(data.awbNumber); setAwbNumber(data.awbNumber); }
      if (data.labelUrl) setLabelUrl(data.labelUrl);
    } catch (err: unknown) {
      setBookErr((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Could not book shipment.');
    } finally { setBooking(false); }
  };

  const save = async () => {
    if (needsShipping && isOwn && (!courier.trim() || !tracking.trim())) {
      setError('Courier name and tracking ID are required for own delivery.');
      return;
    }
    setSaving(true); setError('');
    try {
      await api.patch(`/orders/orders/${order.id}/status`, {
        status,
        courierProvider: courier.trim() || undefined,
        trackingId:      tracking.trim() || undefined,
        adminComment:    comment.trim() || undefined,
        awbNumber:       awbNumber || undefined,
        labelUrl:        labelUrl || undefined,
      });
      onSaved();
      onClose();
    } catch {
      setError('Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  const selectedName = providers.find(p => p.provider === selectedProvider)?.displayName ?? selectedProvider;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 w-full h-full cursor-default"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <p className="font-semibold text-sm">Update Order Status</p>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">#{order.id} · {currency}{order.total.toFixed(2)}</p>
          </div>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-black">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button key={s} type="button"
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${status === s ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {needsShipping && (
            <div className="space-y-3 rounded-lg bg-blue-50 border border-blue-100 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                <Truck size={13} />
                Shipping Details {isOwn && <span className="text-red-500">*</span>}
              </div>

              {/* Provider selector */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium">Shipping Provider</p>
                {selectableProviders.length === 0 ? (
                  <p className="text-[11px] text-amber-600">No shipping provider enabled. Go to Settings → Shipping to configure one.</p>
                ) : (
                  <select
                    value={selectedProvider}
                    onChange={e => {
                      setSelectedProvider(e.target.value);
                      setBookErr('');
                      setLabelUrl(null);
                      setAwbNumber(null);
                    }}
                    className="w-full h-8 border rounded-lg px-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white"
                  >
                    {!selectedProvider && <option value="">— Select provider —</option>}
                    {selectableProviders.map(p => (
                      <option key={p.provider} value={p.provider}>{p.displayName}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Integrated provider — book button */}
              {isIntegrated && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" size="sm" variant="outline" disabled={booking} onClick={bookShipment}>
                      {booking ? 'Booking…' : `Book with ${selectedName}`}
                    </Button>
                    {labelUrl && (
                      <a href={labelUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">Download label</a>
                    )}
                  </div>
                  {bookErr && <p className="text-xs text-red-500">{bookErr}</p>}
                  <p className="text-[11px] text-neutral-400">Auto-books and fills tracking info below — or enter manually.</p>
                </div>
              )}

              {/* Own provider — manual note */}
              {isOwn && (
                <p className="text-[11px] text-neutral-600 font-medium">Own delivery — enter tracking details manually.</p>
              )}

              {/* Tracking fields — shown when a provider is selected */}
              {selectedProvider && (
                <>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium">
                      Courier Name {isOwn && <span className="text-red-500">*</span>}
                    </p>
                    <input
                      type="text"
                      placeholder={isOwn ? 'e.g. Delhivery, DTDC, BlueDart…' : 'Auto-filled after booking'}
                      value={courier}
                      onChange={e => setCourier(e.target.value)}
                      className="w-full h-8 border rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium">
                      Tracking ID / AWB {isOwn && <span className="text-red-500">*</span>}
                    </p>
                    <input
                      type="text"
                      placeholder={isOwn ? 'Enter tracking number…' : 'Auto-filled after booking'}
                      value={tracking}
                      onChange={e => setTracking(e.target.value)}
                      className="w-full h-8 border rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Comment <span className="text-neutral-400 font-normal">(optional)</span></p>
            <textarea
              rows={3}
              placeholder="Internal note for this status change…"
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="px-5 pb-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Update Status'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ o, onUpdate, currency, selected, onToggle }: Readonly<{
  o: Order; onUpdate: () => void; currency: string; selected: boolean; onToggle: (id: string) => void;
}>) {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const addr = o.shippingAddress as ShippingAddress | null;

  return (
    <>
      {modalOpen && (
        <StatusModal order={o} currency={currency} onClose={() => setModalOpen(false)} onSaved={onUpdate} />
      )}

      <div className={`bg-white rounded-xl border overflow-hidden transition-colors ${selected ? 'ring-2 ring-black' : ''}`}>
        <div className="flex items-center justify-between px-4 py-3 gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <input type="checkbox" checked={selected} onChange={() => onToggle(o.id)}
              className="accent-black shrink-0" aria-label={`Select order ${o.id}`} />
            <button type="button" onClick={() => setExpanded(e => !e)} className="text-neutral-400 hover:text-black shrink-0">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <div className="min-w-0">
              <p className="font-mono text-xs text-neutral-400">#{o.id}</p>
              <p className="text-xs text-neutral-400">{new Date(o.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <span className="font-bold text-sm">{currency}{o.total.toFixed(2)}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status] ?? 'bg-neutral-100 text-neutral-600'}`}>
              {o.status}
            </span>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => setModalOpen(true)}>
              Update Status
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="border-t px-4 py-3 bg-neutral-50 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">Customer</p>
                {addr ? (
                  <div className="text-sm space-y-0.5">
                    <p className="font-medium">{addr.name}</p>
                    <p className="text-neutral-500">{addr.line1}</p>
                    <p className="text-neutral-500">{addr.city}, {addr.country} — {addr.zip}</p>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400">No address on file</p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">Bill Breakdown</p>
                <div className="rounded-lg border bg-white overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-3 py-1.5 bg-neutral-50 border-b text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                    <span>Item</span>
                    <span className="text-right">Qty</span>
                    <span className="text-right">Amount</span>
                  </div>
                  {o.items.map(item => (
                    <div key={`${item.productName}-${item.priceAtOrder}`} className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-3 py-2 border-b last:border-b-0 text-sm">
                      <div className="min-w-0">
                        <p className="truncate text-neutral-800">{item.productName}</p>
                        <p className="text-xs text-neutral-400">{currency}{item.priceAtOrder.toFixed(2)} each</p>
                      </div>
                      <span className="text-neutral-500 text-right self-center">×{item.qty}</span>
                      <span className="font-medium text-right self-center shrink-0">{currency}{(item.priceAtOrder * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="px-3 py-2 bg-neutral-50 border-t space-y-1">
                    {(() => {
                      const subtotal = o.items.reduce((s, i) => s + i.priceAtOrder * i.qty, 0);
                      const shipping = o.total - subtotal;
                      return (
                        <>
                          <div className="flex justify-between text-xs text-neutral-500">
                            <span>Subtotal</span>
                            <span>{currency}{subtotal.toFixed(2)}</span>
                          </div>
                          {Math.abs(shipping) > 0.001 && (
                            <div className="flex justify-between text-xs text-neutral-500">
                              <span>Shipping</span>
                              <span>{shipping > 0 ? `+${currency}${shipping.toFixed(2)}` : `−${currency}${Math.abs(shipping).toFixed(2)}`}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-bold pt-1 border-t mt-1">
                            <span>Total</span>
                            <span>{currency}{o.total.toFixed(2)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {(o.status === 'SHIPPED' || o.status === 'DELIVERED') && (o.courierProvider || o.trackingId) && (
              <div className="rounded-lg border bg-white px-3 py-2 flex flex-wrap gap-4">
                {o.courierProvider && (
                  <div>
                    <p className="text-xs text-neutral-400 mb-0.5">Courier</p>
                    <p className="text-sm font-medium">{o.courierProvider}</p>
                  </div>
                )}
                {o.trackingId && (
                  <div>
                    <p className="text-xs text-neutral-400 mb-0.5">Tracking ID</p>
                    <p className="text-sm font-medium font-mono">{o.trackingId}</p>
                  </div>
                )}
              </div>
            )}

            {o.adminComment && (
              <div className="rounded-lg border bg-white px-3 py-2">
                <p className="text-xs text-neutral-400 mb-0.5">Note</p>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{o.adminComment}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currency, setCurrency] = useState('₹');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    const [ordersRes, storeRes] = await Promise.all([
      api.get('/orders/orders'),
      api.get('/store').catch(() => null),
    ]);
    setOrders(ordersRes.data.orders || []);
    const cur = storeRes?.data?.store?.currency || storeRes?.data?.store?.branding?.currency || 'INR';
    const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
    setCurrency(symbols[cur] || cur);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const filtered = orders.filter(o => {
    const matchStatus = filter === 'ALL' || o.status === filter;
    const addr = o.shippingAddress as ShippingAddress | null;
    const matchSearch = !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (addr?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      o.items.some(i => i.productName.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const filteredIds = filtered.map(o => o.id);
  const allSelected = filteredIds.length > 0 && filteredIds.every(id => selected.has(id));

  const toggleOne = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(filteredIds));

  const selectedOrders = filtered.filter(o => selected.has(o.id));

  const generatePdf = async (action: 'download' | 'print') => {
    if (selectedOrders.length === 0) return;
    setGenerating(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      // Try to load bill template for store branding
      let tpl: { name?: string; accentColor?: string; header?: string | null; footer?: string | null; showGst?: boolean } = {};
      try { const r = await api.get('/billing/templates/my'); tpl = r.data.template ?? {}; } catch { /* no template */ }

      const storeName = tpl.name || 'Store';
      const accent = tpl.accentColor || '#171717';
      const r = parseInt(accent.slice(1, 3), 16);
      const g = parseInt(accent.slice(3, 5), 16);
      const b = parseInt(accent.slice(5, 7), 16);

      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();

      selectedOrders.forEach((order, idx) => {
        if (idx > 0) doc.addPage();

        const addr = order.shippingAddress as ShippingAddress | null;
        const subtotal = order.items.reduce((s, i) => s + i.priceAtOrder * i.qty, 0);
        const delivery = Math.max(0, order.total - subtotal);

        // Header bar
        doc.setFillColor(r, g, b);
        doc.rect(0, 0, pageW, 22, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(storeName, 14, 14);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('INVOICE', pageW - 14, 14, { align: 'right' });

        // Order info
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(9);
        doc.text(`Order #${order.id}`, 14, 30);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 14, 36);
        doc.text(`Status: ${order.status}`, 14, 42);
        if (addr) {
          doc.text(`Customer: ${addr.name}`, pageW / 2, 30);
          doc.text(`${addr.line1}, ${addr.city}`, pageW / 2, 36);
          doc.text(`${addr.country} — ${addr.zip}`, pageW / 2, 42);
        }

        if (tpl.header) {
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text(tpl.header, pageW / 2, 26, { align: 'center' });
        }

        // Items table
        autoTable(doc, {
          startY: 50,
          head: [['Item', 'Qty', 'Unit Price', 'Amount']],
          body: order.items.map(item => [
            item.productName,
            item.qty,
            `${currency}${item.priceAtOrder.toFixed(2)}`,
            `${currency}${(item.priceAtOrder * item.qty).toFixed(2)}`,
          ]),
          headStyles: { fillColor: [r, g, b], textColor: [255, 255, 255], fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 'auto' }, 1: { halign: 'center', cellWidth: 15 }, 2: { halign: 'right', cellWidth: 30 }, 3: { halign: 'right', cellWidth: 30 } },
          margin: { left: 14, right: 14 },
        });

        const tableEndY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
        let y = tableEndY;
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text('Subtotal', pageW - 50, y);
        doc.text(`${currency}${subtotal.toFixed(2)}`, pageW - 14, y, { align: 'right' });
        y += 6;
        if (delivery > 0.001) {
          doc.text('Delivery', pageW - 50, y);
          doc.text(`${currency}${delivery.toFixed(2)}`, pageW - 14, y, { align: 'right' });
          y += 6;
        }
        doc.setDrawColor(r, g, b);
        doc.setLineWidth(0.3);
        doc.line(pageW - 60, y - 2, pageW - 14, y - 2);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(r, g, b);
        doc.text('Total', pageW - 50, y + 4);
        doc.text(`${currency}${order.total.toFixed(2)}`, pageW - 14, y + 4, { align: 'right' });

        if (tpl.footer) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(tpl.footer, pageW / 2, 285, { align: 'center' });
        }
      });

      if (action === 'download') {
        doc.save(`orders-${new Date().toISOString().slice(0, 10)}.pdf`);
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
    <div className="w-full">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Orders <span className="text-sm font-normal text-neutral-400 ml-1">({orders.length})</span></h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text" placeholder="Search order, customer, product…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="h-8 border rounded-full px-3 text-sm focus:outline-none focus:ring-1 focus:ring-black w-56"
        />
        <div className="flex gap-1 flex-wrap">
          {['ALL', ...STATUSES].map(s => (
            <button key={s} type="button" onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === s ? 'bg-black text-white' : 'border border-neutral-200 text-neutral-600 hover:border-black'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Selection toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-2.5 border mb-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-black" aria-label="Select all" />
            {allSelected ? 'Deselect all' : 'Select all'}
          </label>
          {selected.size > 0 && (
            <span className="text-xs text-neutral-500">{selected.size} order{selected.size !== 1 ? 's' : ''} selected</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={selected.size === 0 || generating}
            onClick={() => generatePdf('print')} className="gap-1.5 h-7 text-xs px-2">
            <Printer size={13} /> Print
          </Button>
          <Button size="sm" disabled={selected.size === 0 || generating}
            onClick={() => generatePdf('download')} className="gap-1.5 h-7 text-xs px-2">
            {generating
              ? <><RefreshCw size={13} className="animate-spin" /> Generating…</>
              : <><Download size={13} /> <FileText size={13} /> Generate Bill</>
            }
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(o => (
          <OrderCard key={o.id} o={o} onUpdate={load} currency={currency}
            selected={selected.has(o.id)} onToggle={toggleOne} />
        ))}
        {filtered.length === 0 && <p className="text-sm text-neutral-400 py-8 text-center">No orders found.</p>}
      </div>
    </div>
  );
}

