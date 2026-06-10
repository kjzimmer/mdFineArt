import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/api';

type OrderStatus = 'DRAFT' | 'INVOICE_SENT' | 'PAID' | 'CANCELLED';
type ItemType = 'painting' | 'print' | 'custom';

interface OrderItemRecord {
  id: string;
  label: string;
  quantity: number;
  unitPrice: number;
  painting: { id: string; title: string; thumbUrl: string | null; imageUrl: string } | null;
}
interface OrderPerson { id: string; name: string; email: string; }
interface Order {
  id: string;
  person: OrderPerson | null;
  items: OrderItemRecord[];
  status: OrderStatus;
  amount: number;
  notes: string | null;
  createdAt: string;
}

interface APIPainting { id: string; title: string; price: number | null; status: string; thumbUrl: string | null; imageUrl: string; }
interface APIPrintProduct { id: string; type: string; size: string; price: number; }
interface APIPerson { id: string; name: string; email: string; }

// ── Line item in the modal ──────────────────────────────────────────────────
interface LineItem {
  _key: string;
  type: ItemType;
  paintingId: string;
  paintingThumb: string | null;
  printProductId: string;
  printProducts: APIPrintProduct[];
  label: string;
  quantity: number;
  unitPrice: string;
}

const newItem = (): LineItem => ({
  _key: Math.random().toString(36).slice(2),
  type: 'painting',
  paintingId: '', paintingThumb: null,
  printProductId: '', printProducts: [],
  label: '', quantity: 1, unitPrice: '',
});

// ── Status display ──────────────────────────────────────────────────────────
const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Draft', INVOICE_SENT: 'Invoice Sent', PAID: 'Paid', CANCELLED: 'Cancelled',
};
const STATUS_COLORS: Record<OrderStatus, string> = {
  DRAFT: 'bg-border text-text/60',
  INVOICE_SENT: 'bg-accent/15 text-accent',
  PAID: 'bg-green-500/15 text-green-400',
  CANCELLED: 'bg-red-500/10 text-red-400/80',
};
const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['INVOICE_SENT', 'CANCELLED'],
  INVOICE_SENT: ['PAID', 'CANCELLED'],
  PAID: [], CANCELLED: [],
};

// ── Props ───────────────────────────────────────────────────────────────────
export interface InvoicePreFill { personId?: string; personName?: string; personEmail?: string; }

export default function AdminOrders({
  initialForm,
  onModalClose,
}: {
  initialForm?: InvoicePreFill;
  onModalClose?: () => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Modal state
  const [personQuery, setPersonQuery] = useState('');
  const [personId, setPersonId] = useState('');
  const [personLabel, setPersonLabel] = useState('');
  const [items, setItems] = useState<LineItem[]>([newItem()]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reference data
  const [people, setPeople] = useState<APIPerson[]>([]);
  const [paintings, setPaintings] = useState<APIPainting[]>([]);

  const didOpen = useRef(false);

  const total = items.reduce((sum, item) => sum + item.quantity * (parseFloat(item.unitPrice) || 0), 0);

  useEffect(() => {
    apiFetch<Order[]>('/api/orders').then(setOrders).catch(console.error).finally(() => setLoading(false));
    apiFetch<APIPerson[]>('/api/people').then(setPeople).catch(console.error);
    apiFetch<APIPainting[]>('/api/paintings').then(setPaintings).catch(console.error);
  }, []);

  useEffect(() => {
    if (initialForm && !didOpen.current) {
      didOpen.current = true;
      openModal(initialForm);
    }
  }, []);

  const openModal = (prefill?: InvoicePreFill) => {
    setPersonId(prefill?.personId ?? '');
    setPersonLabel(prefill?.personName ? `${prefill.personName} · ${prefill.personEmail}` : '');
    setPersonQuery(prefill?.personName ?? '');
    setItems([newItem()]);
    setNotes('');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); onModalClose?.(); };

  // Person search
  const filteredPeople = personQuery.length > 1
    ? people.filter((p) =>
        p.name.toLowerCase().includes(personQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(personQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const selectPerson = (p: APIPerson) => {
    setPersonId(p.id);
    setPersonLabel(`${p.name} · ${p.email}`);
    setPersonQuery(p.name);
  };

  // Line item helpers
  const updateItem = (key: string, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((i) => i._key === key ? { ...i, ...patch } : i));

  const selectPainting = async (key: string, paintingId: string, type: ItemType) => {
    const p = paintings.find((x) => x.id === paintingId);
    if (!p) { updateItem(key, { paintingId: '', paintingThumb: null, label: '', unitPrice: '', printProducts: [], printProductId: '' }); return; }

    if (type === 'painting') {
      updateItem(key, {
        paintingId,
        paintingThumb: p.thumbUrl ?? p.imageUrl,
        label: `Original: ${p.title}`,
        unitPrice: p.price ? String(p.price) : '',
        printProducts: [], printProductId: '',
      });
    } else {
      // load prints for this painting
      const prints = await apiFetch<APIPrintProduct[]>(`/api/orders/print-products/${paintingId}`).catch(() => []);
      updateItem(key, {
        paintingId,
        paintingThumb: p.thumbUrl ?? p.imageUrl,
        printProducts: prints,
        printProductId: '',
        label: '',
        unitPrice: '',
      });
    }
  };

  const selectPrint = (key: string, printId: string, item: LineItem) => {
    const pr = item.printProducts.find((x) => x.id === printId);
    const p = paintings.find((x) => x.id === item.paintingId);
    updateItem(key, {
      printProductId: printId,
      label: pr && p ? `Print: ${p.title} — ${pr.size} ${pr.type}` : '',
      unitPrice: pr ? String(pr.price) : '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (total <= 0) return;
    setSubmitting(true);
    try {
      const payload = {
        personId: personId || null,
        notes: notes || null,
        items: items
          .filter((i) => i.label && parseFloat(i.unitPrice) > 0)
          .map((i) => ({
            paintingId: i.paintingId || null,
            printProductId: i.printProductId || null,
            label: i.label,
            quantity: i.quantity,
            unitPrice: parseFloat(i.unitPrice),
          })),
      };
      const order = await apiFetch<Order>('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
      setOrders((prev) => [order, ...prev]);
      closeModal();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const updateStatus = async (order: Order, status: OrderStatus) => {
    try {
      const updated = await apiFetch<Order>(`/api/orders/${order.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o));
    } catch (err) { console.error(err); }
  };

  const deleteOrder = async (order: Order) => {
    if (!confirm('Delete this order?')) return;
    try {
      await apiFetch(`/api/orders/${order.id}`, { method: 'DELETE' });
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    } catch (err) { console.error(err); }
  };

  const availablePaintings = paintings.filter((p) => p.status === 'AVAILABLE' || p.status === 'RESERVED');

  if (loading) return <p className="text-text/70">Loading…</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text">Orders</h2>
          <p className="text-sm text-text/50 mt-1">
            {orders.length} total · {orders.filter((o) => o.status === 'INVOICE_SENT').length} awaiting payment
          </p>
        </div>
        <button onClick={() => openModal()} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition hover:bg-accentHover">
          + New Invoice
        </button>
      </div>

      {/* Order list */}
      {orders.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface/60 py-16 text-center">
          <p className="text-text/50">No orders yet. Create your first invoice above.</p>
        </div>
      )}
      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="rounded-2xl border border-border bg-surface/80 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 min-w-0">
                {/* Customer */}
                <p className="text-sm text-text/60">
                  {order.person ? `${order.person.name} · ${order.person.email}` : <span className="italic text-text/40">No customer</span>}
                </p>
                {/* Items */}
                <div className="flex flex-wrap gap-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border bg-bg/60 px-3 py-1.5">
                      {item.painting?.thumbUrl && (
                        <img src={item.painting.thumbUrl} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-medium text-text leading-tight">{item.label}</p>
                        <p className="text-xs text-text/50">{item.quantity > 1 ? `${item.quantity} × ` : ''}${item.unitPrice.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm font-semibold text-accent">${order.amount.toLocaleString()}</p>
                {order.notes && <p className="text-xs text-text/50">{order.notes}</p>}
                <p className="text-xs text-text/40">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[order.status]}`}>
                  {STATUS_LABELS[order.status]}
                </span>
                <div className="flex gap-2 flex-wrap justify-end">
                  {STATUS_FLOW[order.status].map((next) => (
                    <button key={next} onClick={() => updateStatus(order, next)}
                      className={`text-xs uppercase tracking-widest transition ${
                        next === 'PAID' ? 'text-green-400 hover:text-green-300' :
                        next === 'CANCELLED' ? 'text-red-400/70 hover:text-red-400' :
                        'text-accent hover:text-accentHover'
                      }`}>
                      {next === 'PAID' ? 'Mark paid' : next === 'CANCELLED' ? 'Cancel' : STATUS_LABELS[next]}
                    </button>
                  ))}
                  {(order.status === 'DRAFT' || order.status === 'CANCELLED') && (
                    <button onClick={() => deleteOrder(order)} className="text-xs uppercase tracking-widest text-text/30 hover:text-red-400 transition">Delete</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-12 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
          <div className="w-full max-w-xl rounded-3xl border border-border bg-bg p-8 shadow-2xl my-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-text mb-6">New Invoice</h3>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Customer */}
              <div className="relative">
                <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Customer</label>
                <input type="text" placeholder="Search by name or email…" value={personQuery}
                  onChange={(e) => { setPersonQuery(e.target.value); if (!e.target.value) { setPersonId(''); setPersonLabel(''); } }}
                  className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent" />
                {filteredPeople.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 rounded-xl border border-border bg-bg shadow-lg overflow-hidden">
                    {filteredPeople.map((p) => (
                      <button key={p.id} type="button" onClick={() => selectPerson(p)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface/80 transition">
                        <span className="font-medium text-text">{p.name}</span>
                        <span className="text-text/50 ml-2">{p.email}</span>
                      </button>
                    ))}
                  </div>
                )}
                {personLabel && <p className="text-xs text-accent mt-1">{personLabel}</p>}
              </div>

              {/* Line items */}
              <div className="space-y-3">
                <label className="block text-xs uppercase tracking-widest text-text/50">Items</label>
                {items.map((item) => (
                  <div key={item._key} className="rounded-2xl border border-border bg-surface/60 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      {/* Type selector */}
                      <select value={item.type}
                        onChange={(e) => updateItem(item._key, { type: e.target.value as ItemType, paintingId: '', paintingThumb: null, printProductId: '', label: '', unitPrice: '', printProducts: [] })}
                        className="rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text outline-none focus:border-accent">
                        <option value="painting">Original</option>
                        <option value="print">Print</option>
                        <option value="custom">Custom</option>
                      </select>
                      <div className="flex-1" />
                      {items.length > 1 && (
                        <button type="button" onClick={() => setItems((prev) => prev.filter((i) => i._key !== item._key))}
                          className="text-text/30 hover:text-red-400 transition text-lg leading-none">×</button>
                      )}
                    </div>

                    {/* Painting picker (painting + print types) */}
                    {(item.type === 'painting' || item.type === 'print') && (
                      <div className="flex items-center gap-3">
                        {item.paintingThumb && (
                          <img src={item.paintingThumb} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0 border border-border" />
                        )}
                        <select value={item.paintingId}
                          onChange={(e) => selectPainting(item._key, e.target.value, item.type)}
                          className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent">
                          <option value="">— select painting —</option>
                          {availablePaintings.map((p) => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Print product picker */}
                    {item.type === 'print' && item.paintingId && (
                      item.printProducts.length === 0
                        ? <p className="text-xs text-text/40 italic">No print products configured for this painting.</p>
                        : <select value={item.printProductId}
                            onChange={(e) => selectPrint(item._key, e.target.value, item)}
                            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent">
                            <option value="">— select size / type —</option>
                            {item.printProducts.map((pr) => (
                              <option key={pr.id} value={pr.id}>{pr.size} · {pr.type} · ${pr.price}</option>
                            ))}
                          </select>
                    )}

                    {/* Label + price + qty */}
                    <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                      <input value={item.label} onChange={(e) => updateItem(item._key, { label: e.target.value })}
                        placeholder="Description"
                        className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent" />
                      <input type="number" min="0" step="0.01" value={item.unitPrice}
                        onChange={(e) => updateItem(item._key, { unitPrice: e.target.value })}
                        placeholder="Price"
                        className="w-24 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent" />
                      <input type="number" min="1" value={item.quantity}
                        onChange={(e) => updateItem(item._key, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-14 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-center text-text outline-none focus:border-accent" />
                    </div>
                  </div>
                ))}

                <button type="button" onClick={() => setItems((prev) => [...prev, newItem()])}
                  className="w-full rounded-xl border border-dashed border-border py-2.5 text-sm text-text/50 hover:text-text hover:border-accent/40 transition">
                  + Add item
                </button>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Notes (optional)</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Shipping, framing, payment terms…"
                  className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent resize-none" />
              </div>

              {/* Total + submit */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div>
                  <p className="text-xs text-text/50 uppercase tracking-widest">Total</p>
                  <p className="text-xl font-semibold text-text">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={closeModal}
                    className="rounded-xl border border-border px-5 py-3 text-sm text-text/60 transition hover:text-text">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting || total <= 0}
                    className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-50">
                    {submitting ? 'Creating…' : 'Create Invoice'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
