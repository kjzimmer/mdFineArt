import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<SquarePayments>;
    };
  }
}

interface SquarePayments {
  card: () => Promise<SquareCard>;
}

interface SquareCard {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<{ status: string; token?: string; errors?: Array<{ message: string }> }>;
  destroy: () => void;
}

interface InvoiceItem {
  id: string;
  label: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceData {
  invoice: {
    id: string;
    status: string;
    subtotal: number;
    tax: number;
    shipping: number;
    amount: number;
    notes: string | null;
    createdAt: string;
    sentAt: string | null;
    paidAt: string | null;
    items: InvoiceItem[];
    person: { name: string } | null;
  };
  gallery: { name: string; logoUrl: string | null };
  square: { appId: string; locationId: string; environment: string };
}

function fmt(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents);
}

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function InvoicePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const cardRef = useRef<SquareCard | null>(null);
  const initRef = useRef(false);

  // Fetch invoice details
  useEffect(() => {
    fetch(`/api/invoices/public/${token}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
        return body as InvoiceData;
      })
      .then((d) => {
        setData(d);
        if (d.invoice.status === 'PAID') setPaid(true);
      })
      .catch((err: Error) => setLoadError(err.message));
  }, [token]);

  // Load Square SDK and initialize card form
  useEffect(() => {
    if (!data || paid) return;

    const src = data.square.environment === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js';

    const init = async () => {
      if (!window.Square || initRef.current) return;
      initRef.current = true;
      try {
        const payments = await window.Square.payments(data.square.appId, data.square.locationId);
        const card = await payments.card();
        await card.attach('#sq-card');
        cardRef.current = card;
        setSdkReady(true);
      } catch (err) {
        console.error('Square card init error:', err);
        setLoadError('Failed to initialize payment form. Please refresh the page.');
      }
    };

    if (window.Square) {
      init();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.onload = init;
    script.onerror = () => setLoadError('Failed to load payment SDK. Please refresh the page.');
    document.head.appendChild(script);
    return () => {
      cardRef.current?.destroy();
      cardRef.current = null;
      initRef.current = false;
    };
  }, [data, paid]);

  const submitPayment = async (sourceId: string) => {
    setPaying(true);
    setPayError(null);
    try {
      const res = await fetch(`/api/invoices/public/${token}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId }),
      });
      const body = await res.json();
      if (!res.ok) {
        setPayError(body.error || 'Payment failed. Please try again.');
        setPaying(false);
        return;
      }
      setPaid(true);
    } catch {
      setPayError('Payment failed. Please try again.');
      setPaying(false);
    }
  };

  const handlePay = async () => {
    if (!cardRef.current || !data) return;
    setPayError(null);
    try {
      const result = await cardRef.current.tokenize();
      if (result.status !== 'OK' || !result.token) {
        setPayError(result.errors?.map((e) => e.message).join(' ') || 'Card error — please check your details.');
        return;
      }
      await submitPayment(result.token);
    } catch {
      setPayError('Payment failed. Please try again.');
    }
  };

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6">
        <div className="max-w-md text-center">
          <p className="text-lg text-text/70">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const { invoice, gallery } = data;
  const invoiceDate = fmtDate(invoice.sentAt ?? invoice.createdAt);
  const paidDate = fmtDate(invoice.paidAt);

  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="mx-auto max-w-lg space-y-6">

        {/* Header — always visible including print */}
        <div className="text-center">
          {gallery.logoUrl && (
            <img src={gallery.logoUrl} alt={gallery.name} className="mx-auto mb-4 h-14 w-auto object-contain" />
          )}
          <h1 className="section-heading text-2xl text-text">{gallery.name}</h1>
          <p className="mt-1 text-sm text-text/50">Invoice</p>
        </div>

        {/* Invoice meta — gallery + customer + date */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-start justify-between gap-4 text-sm">
            <div className="space-y-0.5">
              <p className="text-xs uppercase tracking-widest text-text/40 mb-1">Bill To</p>
              <p className="font-medium text-text">{invoice.person?.name ?? '—'}</p>
            </div>
            <div className="text-right space-y-0.5">
              {paid && (
                <span className="inline-block rounded-full bg-green-500/15 px-3 py-0.5 text-xs font-semibold text-green-400 mb-1">
                  PAID
                </span>
              )}
              {invoiceDate && (
                <p className="text-xs text-text/50">{paid ? `Paid ${paidDate ?? invoiceDate}` : `Date: ${invoiceDate}`}</p>
              )}
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text/40 uppercase tracking-widest">
                <th className="pb-3 font-medium">Item</th>
                <th className="pb-3 text-center font-medium">Qty</th>
                <th className="pb-3 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 text-text">{item.label}</td>
                  <td className="py-3 text-center text-text/60">{item.quantity}</td>
                  <td className="py-3 text-right text-text">{fmt(item.unitPrice * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
            {invoice.subtotal !== invoice.amount && (
              <div className="flex justify-between text-text/60">
                <span>Subtotal</span><span>{fmt(invoice.subtotal)}</span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div className="flex justify-between text-text/60">
                <span>Tax</span><span>{fmt(invoice.tax)}</span>
              </div>
            )}
            {invoice.shipping > 0 && (
              <div className="flex justify-between text-text/60">
                <span>Shipping</span><span>{fmt(invoice.shipping)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 text-base font-semibold text-text">
              <span>Total</span><span>{fmt(invoice.amount)}</span>
            </div>
          </div>

          {invoice.notes && (
            <p className="mt-4 rounded-lg bg-surface-raised px-4 py-3 text-xs text-text/60">
              {invoice.notes}
            </p>
          )}
        </div>

        {/* Payment form — hidden when paid or printing */}
        {!paid && (
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 print:hidden">
            <p className="text-sm font-medium text-text">Payment details</p>

            {/* Square card form mounts here */}
            {!sdkReady && (
              <div className="flex items-center gap-2 text-xs text-text/40">
                <div className="h-3 w-3 animate-spin rounded-full border border-muted border-t-transparent" />
                Loading payment form…
              </div>
            )}
            <div
              id="sq-card"
              style={{ minHeight: '90px' }}
              className={`transition-opacity duration-300 ${sdkReady ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'}`}
            />

            {payError && (
              <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{payError}</p>
            )}

            <button
              type="button"
              onClick={handlePay}
              disabled={!sdkReady || paying}
              className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-40"
            >
              {paying ? 'Processing…' : `Pay ${fmt(invoice.amount)}`}
            </button>

            {/* Dev-only: bypass card form with Square test nonce */}
            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={() => submitPayment('cnon:card-nonce-ok')}
                disabled={paying}
                className="w-full rounded-xl border border-dashed border-border/60 py-2 text-xs text-text/30 transition hover:text-text/50 disabled:opacity-40"
              >
                Dev: test payment (sandbox nonce)
              </button>
            )}

            <p className="text-center text-xs text-text/30">
              Secured by Square · Your card details are never stored on our servers
            </p>
          </div>
        )}

        {/* Print button — hidden in print output */}
        <div className="text-center print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="text-xs text-text/40 hover:text-text/70 transition underline underline-offset-2"
          >
            Print invoice
          </button>
        </div>

      </div>
    </div>
  );
}
