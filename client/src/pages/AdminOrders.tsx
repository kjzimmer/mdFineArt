import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

type OrderStatus = 'DRAFT' | 'INVOICE_SENT' | 'PAID' | 'CANCELLED';

interface OrderPerson { id: string; name: string; email: string; }
interface OrderPainting { id: string; title: string; thumbUrl: string | null; }

interface Order {
  id: string;
  person: OrderPerson | null;
  painting: OrderPainting | null;
  status: OrderStatus;
  amount: number;
  notes: string | null;
  squareInvoiceId: string | null;
  createdAt: string;
}

interface Person { id: string; name: string; email: string; }
interface Painting { id: string; title: string; price: number | null; status: string; }

const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Draft',
  INVOICE_SENT: 'Invoice Sent',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
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
  PAID: [],
  CANCELLED: [],
};

interface InvoiceForm {
  personId: string;
  personName: string;
  personEmail: string;
  paintingId: string;
  amount: string;
  notes: string;
}

const emptyForm: InvoiceForm = {
  personId: '', personName: '', personEmail: '',
  paintingId: '', amount: '', notes: '',
};

export default function AdminOrders({ initialForm, onModalClose }: { initialForm?: Partial<InvoiceForm>; onModalClose?: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<InvoiceForm>({ ...emptyForm, ...initialForm });
  const [submitting, setSubmitting] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [personQuery, setPersonQuery] = useState('');

  useEffect(() => {
    apiFetch<Order[]>('/api/orders').then(setOrders).catch(console.error).finally(() => setLoading(false));
    apiFetch<Person[]>('/api/people').then(setPeople).catch(console.error);
    apiFetch<Painting[]>('/api/paintings').then((ps) =>
      setPaintings(ps.filter((p) => p.status === 'AVAILABLE' || p.status === 'RESERVED'))
    ).catch(console.error);
  }, []);

  useEffect(() => {
    if (initialForm) { setForm((f) => ({ ...f, ...initialForm })); setShowModal(true); }
  }, []);

  const openModal = () => { setForm({ ...emptyForm, ...initialForm }); setPersonQuery(''); setShowModal(true); };

  const selectPerson = (p: Person) => {
    setForm((f) => ({ ...f, personId: p.id, personName: p.name, personEmail: p.email }));
    setPersonQuery(p.name);
  };

  const selectPainting = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const painting = paintings.find((p) => p.id === e.target.value);
    setForm((f) => ({ ...f, paintingId: e.target.value, amount: painting?.price ? String(painting.price) : f.amount }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const order = await apiFetch<Order>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          personId: form.personId || null,
          paintingId: form.paintingId || null,
          amount: parseFloat(form.amount),
          notes: form.notes || null,
        }),
      });
      setOrders((prev) => [order, ...prev]);
      setShowModal(false);
      onModalClose?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (order: Order, status: OrderStatus) => {
    try {
      const updated = await apiFetch<Order>(`/api/orders/${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
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

  const filteredPeople = personQuery.length > 1
    ? people.filter((p) =>
        p.name.toLowerCase().includes(personQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(personQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  if (loading) return <p className="text-text/70">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text">Orders</h2>
          <p className="text-sm text-text/50 mt-1">{orders.length} total · {orders.filter(o => o.status === 'INVOICE_SENT').length} awaiting payment</p>
        </div>
        <button
          onClick={openModal}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition hover:bg-accentHover"
        >
          + New Invoice
        </button>
      </div>

      {orders.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface/60 py-16 text-center">
          <p className="text-text/50">No orders yet. Create your first invoice above.</p>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="rounded-2xl border border-border bg-surface/80 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4 items-start">
                {order.painting?.thumbUrl && (
                  <img src={order.painting.thumbUrl} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-text">
                    {order.painting?.title ?? <span className="text-text/50 italic">No painting</span>}
                  </p>
                  <p className="text-sm text-text/70 mt-0.5">
                    {order.person ? `${order.person.name} · ${order.person.email}` : <span className="italic text-text/40">No customer</span>}
                  </p>
                  <p className="text-sm font-semibold text-accent mt-1">${order.amount.toLocaleString()}</p>
                  {order.notes && <p className="text-xs text-text/50 mt-1">{order.notes}</p>}
                  <p className="text-xs text-text/40 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[order.status]}`}>
                  {STATUS_LABELS[order.status]}
                </span>
                <div className="flex gap-2 flex-wrap justify-end">
                  {STATUS_FLOW[order.status].map((next) => (
                    <button
                      key={next}
                      onClick={() => updateStatus(order, next)}
                      className={`text-xs uppercase tracking-widest transition ${
                        next === 'PAID' ? 'text-green-400 hover:text-green-300' :
                        next === 'CANCELLED' ? 'text-red-400/70 hover:text-red-400' :
                        'text-accent hover:text-accentHover'
                      }`}
                    >
                      {next === 'PAID' ? 'Mark paid' : next === 'CANCELLED' ? 'Cancel' : STATUS_LABELS[next]}
                    </button>
                  ))}
                  {(order.status === 'DRAFT' || order.status === 'CANCELLED') && (
                    <button onClick={() => deleteOrder(order)} className="text-xs uppercase tracking-widest text-text/30 hover:text-red-400 transition">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-3xl border border-border bg-bg p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-text mb-6">New Invoice</h3>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Customer */}
              <div className="relative">
                <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Customer</label>
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={personQuery}
                  onChange={(e) => { setPersonQuery(e.target.value); if (!e.target.value) setForm((f) => ({ ...f, personId: '', personName: '', personEmail: '' })); }}
                  className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent"
                />
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
                {form.personEmail && (
                  <p className="text-xs text-accent mt-1">{form.personName} · {form.personEmail}</p>
                )}
              </div>

              {/* Painting */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Painting</label>
                <select
                  value={form.paintingId}
                  onChange={selectPainting}
                  className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent"
                >
                  <option value="">— select a painting —</option>
                  {paintings.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}{p.price ? ` · $${p.price.toLocaleString()}` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Amount (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Notes (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Shipping details, frame included, special terms…"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting || !form.amount}
                  className="flex-1 rounded-xl bg-accent py-3 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-50"
                >
                  {submitting ? 'Creating…' : 'Create Invoice'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="rounded-xl border border-border px-5 py-3 text-sm text-text/60 transition hover:text-text">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
