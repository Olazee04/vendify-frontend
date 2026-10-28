'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { NIGERIAN_STATES } from '@/lib/nigerianStates';
import { ZoneOption, zoneFee, optionsForState } from '@/lib/shippingOptions';
import {
  StoredCustomerSession,
  getStoredSession,
  saveSession,
  clearStoredSession,
} from '@/lib/customerSession';

const API = process.env.NEXT_PUBLIC_API_URL;

interface StockpileItemView {
  productId: string;
  productName: string;
  productImageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weightKg?: number | null;
  variantInfo?: string | null;
}

interface StockpileView {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  expiresAt?: string | null;
  isExpired: boolean;
  items: StockpileItemView[];
  totalItems: number;
  totalAmount: number;
  totalWeightKg: number;
  maxItems?: number | null;
  maxAmount?: number | null;
  maxWeightKg?: number | null;
}

interface ShippingEstimate {
  fee: number;
  zoneName: string;
  deliveryEstimate?: string;
  isFreeShipping: boolean;
}

interface OrderRow {
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  total: number;
  itemCount: number;
}

type Mode =
  | 'loading' | 'signin' | 'signup' | 'verify'
  | 'forgot' | 'reset' | 'account';
type Tab = 'stockpile' | 'orders' | 'security';

const inputClass =
  'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white';
const primaryBtn =
  'w-full bg-purple-600 text-white py-3 rounded-xl font-semibold ' +
  'hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed ' +
  'transition-colors';
const card = 'bg-white rounded-2xl border border-gray-100 p-5';

const errMsg = (e: any, fallback: string) =>
  e?.response?.data?.message || fallback;

function Bar({ label, used, max, unit }: {
  label: string; used: number; max: number; unit?: string;
}) {
  const pct = Math.min(100, Math.round((used / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span>
          {unit === '₦' ? `₦${used.toLocaleString()}` : used}
          {' / '}
          {unit === '₦' ? `₦${max.toLocaleString()}` : max}
          {unit && unit !== '₦' ? ` ${unit}` : ''}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${pct >= 100 ? 'bg-amber-500' : 'bg-purple-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder, autoComplete }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={inputClass + ' pr-16'}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-700">
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

// ═══════════════════ STOCKPILE TAB ═══════════════════
function StockpileTab({ slug, session, store, onExpired }: {
  slug: string;
  session: StoredCustomerSession;
  store: { name: string; whatsAppNumber?: string } | null;
  onExpired: () => void;
}) {
  const token = session.token;
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<StockpileView | null>(null);
  const [message, setMessage] = useState('');
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [form, setForm] = useState({
    fullName: session.name,
    phone: session.phone,
    addressLine1: '',
    state: '',
  });
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{
        orderNumber: string; itemsTotal: number; shippingFee: number;
    reference?: string;
  } | null>(null);

  useEffect(() => {
    axios.get(`${API}/api/v1/shipping/${slug}`)
      .then(res => setZones(res.data.data ?? []))
      .catch(() => setZones([]));
  }, [slug]);

  useEffect(() => {
    load();
  }, [token]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API}/api/v1/stockpile/mine/${slug}`, { token }
      );
      setView(res.data.data);
      setMessage('');
    } catch (error: any) {
      if (error.response?.status === 401) {
        onExpired();
        return;
      }
      setView(null);
      setMessage(errMsg(error, 'Could not load your stockpile.'));
    } finally {
      setLoading(false);
    }
  };

  // The delivery options for the chosen state
  const shippingOptions = useMemo(
    () => optionsForState(zones, form.state),
    [zones, form.state]
  );

  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const isPickup = selectedZone?.type === 'Pickup';
  const fee = selectedZone ? zoneFee(selectedZone) : 0;

  // When the state changes, clear the choice. If there is only one
  // option, choose it for the customer.
  useEffect(() => {
    setSelectedZoneId(
      shippingOptions.length === 1 ? shippingOptions[0].id : ''
    );
  }, [form.state, zones]);

  const formReady =
    form.fullName.trim().length > 1 &&
    form.phone.replace(/\D/g, '').length >= 10 &&
    (isPickup || form.addressLine1.trim().length > 4) &&
    NIGERIAN_STATES.includes(form.state) &&
    !!selectedZone;

  const checkoutAddress = () => ({
    fullName: form.fullName.trim(),
    phoneNumber: form.phone.trim(),
    addressLine1: isPickup ? 'Store pickup' : form.addressLine1.trim(),
    city: form.state,
    state: form.state,
    country: 'Nigeria',
  });

  const submitCheckout = async (paymentMethod: number, reference?: string) => {
    setBusy(true);
    try {
      let res: any;
            if ((paymentMethod === 0 || paymentMethod === 1) && reference) {
        // Paystack: the server already holds the checkout details
        res = await axios.post(
          `${API}/api/v1/payments/fulfil/${encodeURIComponent(reference)}`
        );
      } else {
        res = await axios.post(
          `${API}/api/v1/stockpile/checkout/${slug}`,
          {
            token,
            paymentMethod,
            paymentReference: reference ?? null,
            shippingZoneId: selectedZoneId || null,
            shippingAddress: checkoutAddress(),
          }
        );
      }
      const d = res.data.data;
      setDone({
        orderNumber: d.orderNumber,
        itemsTotal: d.itemsTotal,
        shippingFee: d.shippingFee,
        reference,
      });
    } catch (error: any) {
      if (error.response?.status === 401 && !reference) {
        onExpired();
        return;
      }
      const msg = errMsg(error, 'Checkout failed');
      if (reference) {
        toast.error(
          `${msg} Your payment reference is ${reference}. If your order does not appear soon, please send it to the store.`,
          { duration: 20000 }
        );
      } else {
        toast.error(msg, { duration: 8000 });
      }
    } finally {
      setBusy(false);
    }
  };

  const payWithPaystack = async () => {
    if (!selectedZone || !view) return;
    const paystackKey = 'pk_test_8d0dd243c4f86c1148c9afdd8f85621c1759ff34';

    setBusy(true);
    let reference = '';
    try {
      const res = await axios.post(
        `${API}/api/v1/payments/intent/${slug}`,
        {
          kind: 'StockpileCheckout',
          payload: {
            token,
            shippingZoneId: selectedZoneId,
            shippingAddress: checkoutAddress(),
          },
        }
      );
      reference = res.data.data.reference;
    } catch (error: any) {
      toast.error(errMsg(error, 'Could not start the payment. Please try again.'));
      setBusy(false);
      return;
    }
    setBusy(false);

    await new Promise<void>((resolve) => {
      if ((window as any).PaystackPop) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });

    const handler = (window as any).PaystackPop.setup({
      key: paystackKey,
      email: view.customerEmail,
      amount: Math.round(fee * 100),
      currency: 'NGN',
      ref: reference,
      metadata: { store: store?.name, type: 'stockpile-shipping' },
      callback: function (response: any) {
        submitCheckout(0, reference);
      },
      onClose: function () {
        toast.error('Payment cancelled');
      },
    });
    handler.openIframe();
  };

  const payWithFlutterwave = async () => {
    if (!selectedZone || !view) return;
    const flwKey = 'FLWPUBK_TEST-1e289717a1d2fa62557cfc173631bd5f-X';

    // Tell the server about this checkout BEFORE the customer pays
    setBusy(true);
    let reference = '';
    try {
      const res = await axios.post(
        `${API}/api/v1/payments/intent/${slug}`,
        {
          kind: 'StockpileCheckout',
          payload: {
            token,
            shippingZoneId: selectedZoneId,
            shippingAddress: checkoutAddress(),
            paymentMethod: 1,
          },
        }
      );
      reference = res.data.data.reference;
    } catch (error: any) {
      toast.error(errMsg(error, 'Could not start the payment. Please try again.'));
      setBusy(false);
      return;
    }
    setBusy(false);

    await new Promise<void>((resolve) => {
      if ((window as any).FlutterwaveCheckout) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });

    let finished = false;
    const modal = (window as any).FlutterwaveCheckout({
      public_key: flwKey,
      tx_ref: reference,
      amount: fee,
      currency: 'NGN',
      payment_options: 'card,mobilemoney,ussd,banktransfer',
      customer: {
        email: view.customerEmail,
        name: form.fullName.trim(),
        phone_number: form.phone.trim(),
      },
      customizations: {
        title: store?.name ?? 'Vendify Store',
        description: 'Stockpile delivery',
        logo: '',
      },
      callback: function (response: any) {
        console.log('Flutterwave callback', response);
        if (finished) return;
        const s = String(response?.status ?? '').toLowerCase();
        const paid =
          ['successful', 'completed', 'success'].includes(s) ||
          String(response?.charge_response_code ?? '') === '00';
        if (!paid) {
          toast.error('The payment was not completed.');
          return;
        }
        finished = true;
        setTimeout(() => {
          try { modal?.close?.(); } catch {}
        }, 1500);
        submitCheckout(1, reference);
      },
      onclose: function () {
        if (!finished) toast('Payment window closed');
      },
    });
  };

  const whatsappLink = store?.whatsAppNumber
    ? `https://wa.me/${store.whatsAppNumber.replace(/\D/g, '').replace(/^0/, '234')}`
    : null;

  if (loading) {
    return <div className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />;
  }

    if (done) {
    const message = encodeURIComponent(
      `Hi! I just checked out my stockpile at *${store?.name ?? 'your store'}*.\n\n` +
      `*Order number:* ${done.orderNumber}\n` +
      `*Items (paid earlier):* N${done.itemsTotal.toLocaleString()}\n` +
      `*Delivery fee paid:* N${done.shippingFee.toLocaleString()}\n` +
      `*Total:* N${(done.itemsTotal + done.shippingFee).toLocaleString()}\n` +
      (done.reference ? `*Payment reference:* ${done.reference}\n` : '') +
      `\nPlease confirm my order. Thank you!`
    );
    const whatsappWithMessage = whatsappLink
      ? `${whatsappLink}?text=${message}`
      : null;

    return (
      <div className="bg-white rounded-2xl border border-green-100 p-6 text-center space-y-3">
        <p className="text-4xl">🎉</p>
        <h2 className="text-lg font-bold text-gray-900">Checkout complete!</h2>
        <p className="text-sm text-gray-600">
          Your order number is{' '}
          <strong className="text-purple-600">{done.orderNumber}</strong>.
          You can see it under <strong>Orders</strong>.
        </p>
        <p className="text-xs text-gray-400">
          Items ₦{done.itemsTotal.toLocaleString()} (paid earlier) + delivery ₦{done.shippingFee.toLocaleString()}
        </p>
        {whatsappWithMessage && (
          <a href={whatsappWithMessage} target="_blank" rel="noreferrer"
            className="inline-block bg-green-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors">
            Send order details on WhatsApp
          </a>
        )}
      </div>
    );
  }

  if (!view) {
    return (
      <div className={card + ' text-center space-y-3'}>
        <Package size={36} className="text-gray-300 mx-auto" />
        <p className="text-gray-600 text-sm">{message}</p>
        <Link href={`/store/${slug}`}
          className="inline-block text-sm text-purple-600 font-semibold hover:underline">
          Browse the store
        </Link>
      </div>
    );
  }

  return (
    <>
      {view.isExpired && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
          This stockpile has expired, so it cannot be checked out online.
          Please contact the store.
          {whatsappLink && (
            <> <a href={whatsappLink} target="_blank" rel="noreferrer"
              className="underline font-semibold">Chat on WhatsApp</a></>
          )}
        </div>
      )}

      <div className={card + ' space-y-4'}>
        <h2 className="font-bold text-gray-900">
          {view.totalItems} item{view.totalItems !== 1 ? 's' : ''} paid for
        </h2>

        <div className="space-y-2">
          {view.items.map((item, i) => (
            <div key={i} className="flex gap-3 p-2 bg-gray-50 rounded-xl">
              <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                {item.productImageUrl ? (
                  <img src={item.productImageUrl} alt={item.productName}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={18} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.productName}
                </p>
                <p className="text-xs text-gray-500">
                  {item.quantity} × ₦{item.unitPrice.toLocaleString()}
                </p>
                                {item.variantInfo && (
                  <p className="text-xs text-purple-600">{item.variantInfo}</p>
                )}
              </div>
              <p className="text-sm font-bold text-gray-900">
                ₦{item.totalPrice.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
          <span>Already paid</span>
          <span className="text-purple-600">₦{view.totalAmount.toLocaleString()}</span>
        </div>

        <div className="space-y-3 pt-1">
          {view.maxItems ? (
            <Bar label="Items" used={view.totalItems} max={view.maxItems} />
          ) : null}
          {view.maxAmount ? (
            <Bar label="Amount" used={view.totalAmount} max={view.maxAmount} unit="₦" />
          ) : null}
          {view.maxWeightKg ? (
            <Bar label="Weight" used={Number(view.totalWeightKg.toFixed(2))}
              max={view.maxWeightKg} unit="kg" />
          ) : null}
        </div>

        {view.expiresAt && (
          <p className="text-xs text-gray-400">
            Keep until {new Date(view.expiresAt).toLocaleDateString()}
          </p>
        )}
        <Link href={`/store/${slug}`}
          className="block text-sm text-purple-600 hover:underline">
          + Add more items
        </Link>
      </div>

      {!view.isExpired && (
        <div className={card + ' space-y-3'}>
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Truck size={18} className="text-purple-600" />
            Check out my stockpile
          </h2>
          <p className="text-xs text-gray-500">
            You have already paid for your items. Choose how to receive them
            and pay only the delivery fee.
          </p>

          <input type="text" placeholder="Full name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className={inputClass} />
          <input type="tel" placeholder="Phone number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputClass} />
          {!isPickup && (
            <input type="text" placeholder="Delivery address"
              value={form.addressLine1}
              onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
              className={inputClass} />
          )}
          <select
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            className={inputClass}>
            <option value="">Select your state</option>
            {NIGERIAN_STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {form.state && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-gray-500">
                Choose your delivery option
              </p>
              {shippingOptions.length === 0 ? (
                <p className="text-xs text-amber-600">
                  Sorry, this store does not deliver to {form.state} yet.
                </p>
              ) : (
                shippingOptions.map(opt => {
                  const optPickup = opt.type === 'Pickup';
                  const optFee = zoneFee(opt);
                  const selected = selectedZoneId === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                        selected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 bg-white hover:border-purple-300'
                      }`}>
                      <input
                        type="radio"
                        name="stockpile-delivery-option"
                        checked={selected}
                        onChange={() => setSelectedZoneId(opt.id)}
                        className="mt-1 accent-purple-600"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-gray-900">
                          {opt.name}
                        </span>
                        {opt.description && (
                          <span className="block text-xs text-gray-500">
                            {opt.description}
                          </span>
                        )}
                        {!optPickup && opt.deliveryEstimate && (
                          <span className="block text-xs text-gray-400">
                            {opt.deliveryEstimate}
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-bold text-purple-600 shrink-0">
                        {optFee === 0 ? 'FREE' : `₦${optFee.toLocaleString()}`}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          )}

          {selectedZone && (
            <div className="p-3 bg-purple-50 rounded-xl text-sm space-y-1">
              <div className="flex justify-between text-gray-600">
                <span>Items (already paid)</span>
                <span>₦{view.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900">
                <span>Delivery to pay now</span>
                <span className="text-purple-600">
                  {fee > 0 ? `₦${fee.toLocaleString()}` : 'FREE'}
                </span>
              </div>
              {isPickup && selectedZone.description && (
                <p className="text-xs text-gray-500">
                  Collect from: {selectedZone.description}
                </p>
              )}
            </div>
          )}

          {!formReady && (
            <p className="text-xs text-amber-700 text-center bg-amber-50 rounded-lg py-2 px-3">
              Fill in your details, choose your state and a delivery option
            </p>
          )}

          {selectedZone && fee > 0 ? (
            <>
              <button onClick={payWithPaystack} disabled={!formReady || busy}
                className={primaryBtn}>
                Pay delivery with Paystack
              </button>
              <button onClick={payWithFlutterwave} disabled={!formReady || busy}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Pay delivery with Flutterwave
              </button>
            </>
          ) : (
            <button onClick={() => submitCheckout(0)} disabled={!formReady || busy}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {busy ? 'Working...' : 'Confirm checkout'}
            </button>
          )}
        </div>
      )}
    </>
  );
}

// ═══════════════════ ORDERS TAB ═══════════════════

function OrdersTab({ slug, session, onExpired }: {
  slug: string;
  session: StoredCustomerSession;
  onExpired: () => void;
}) {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  useEffect(() => {
    axios.post(`${API}/api/v1/customer/orders/${slug}`, { token: session.token })
      .then(res => setOrders(res.data.data ?? []))
      .catch(error => {
        if (error.response?.status === 401) onExpired();
        else setOrders([]);
      });
  }, [session.token]);

  if (orders === null) {
    return <div className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />;
  }

  if (orders.length === 0) {
    return (
      <div className={card + ' text-center space-y-2'}>
        <p className="text-gray-600 text-sm">You have no orders at this store yet.</p>
        <Link href={`/store/${slug}`}
          className="inline-block text-sm text-purple-600 font-semibold hover:underline">
          Browse the store
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map(o => (
        <div key={o.orderNumber} className={card + ' flex items-center gap-3'}>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{o.orderNumber}</p>
            <p className="text-xs text-gray-400">
              {new Date(o.createdAt).toLocaleDateString()} · {o.itemCount} item{o.itemCount !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">{o.status}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                o.paymentStatus === 'Paid'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-amber-50 text-amber-700'}`}>
                {o.paymentStatus}
              </span>
            </div>
          </div>
          <p className="font-bold text-purple-600">₦{o.total.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════ SECURITY TAB ═══════════════════

function SecurityTab({ slug, session, onUpdate, onSignOut, onExpired }: {
  slug: string;
  session: StoredCustomerSession;
  onUpdate: (s: StoredCustomerSession) => void;
  onSignOut: () => void;
  onExpired: () => void;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== again) {
      toast.error('The new passwords do not match');
      return;
    }
    setBusy(true);
    try {
      const res = await axios.post(
        `${API}/api/v1/customer/change-password/${slug}`,
        { token: session.token, currentPassword: current, newPassword: next }
      );
      onUpdate(res.data.data);
      setCurrent(''); setNext(''); setAgain('');
      toast.success('Password changed ✅');
    } catch (error: any) {
      if (error.response?.status === 401) { onExpired(); return; }
      toast.error(errMsg(error, 'Could not change your password'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className={card + ' space-y-3'}>
        <h2 className="font-bold text-gray-900">Change password</h2>
        <PasswordInput value={current} onChange={setCurrent}
          placeholder="Current password" autoComplete="current-password" />
        <PasswordInput value={next} onChange={setNext}
          placeholder="New password (8+ characters, letters and numbers)"
          autoComplete="new-password" />
        <PasswordInput value={again} onChange={setAgain}
          placeholder="Repeat the new password" autoComplete="new-password" />
        <button type="submit" disabled={busy || !current || !next}
          className={primaryBtn}>
          {busy ? 'Saving...' : 'Change password'}
        </button>
      </form>

      <div className={card + ' space-y-2'}>
        <p className="text-sm text-gray-600">
          Signed in as <strong>{session.email}</strong>
        </p>
        <button onClick={onSignOut}
          className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
          Sign out
        </button>
      </div>
    </div>
  );
}

// ═══════════════════ THE PAGE ═══════════════════

export default function AccountPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params?.slug)
    ? params.slug[0]
    : (params?.slug as string);
  const base = `${API}/api/v1/customer`;

  const [store, setStore] = useState<{
    name: string; whatsAppNumber?: string;
  } | null>(null);
  const [mode, setMode] = useState<Mode>('loading');
  const [session, setSession] = useState<StoredCustomerSession | null>(null);
  const [tab, setTab] = useState<Tab>('stockpile');
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!slug) return;
    axios.get(`${API}/api/v1/stores/${slug}`)
      .then(res => setStore(res.data.data))
      .catch(() => setStore(null));

    const q = new URLSearchParams(window.location.search);
    const wanted: Mode = q.get('mode') === 'signup' ? 'signup' : 'signin';
    const saved = getStoredSession(slug);

    if (!saved) {
      setMode(wanted);
      return;
    }

    // Make sure the saved sign-in still works
    axios.post(`${base}/me/${slug}`, { token: saved.token })
      .then(() => { setSession(saved); setMode('account'); })
      .catch(() => { clearStoredSession(slug); setMode(wanted); });
  }, [slug]);

  const afterSignIn = (s: StoredCustomerSession) => {
    saveSession(slug, s);
    setSession(s);
    setPassword('');
    setCode('');
    setNewPassword('');

    const next = new URLSearchParams(window.location.search).get('next');
    if (next === 'cart' || next === 'cart-stockpile') {
      router.push(
        `/store/${slug}?cart=1${next === 'cart-stockpile' ? '&stockpile=1' : ''}`
      );
      return;
    }
    setMode('account');
  };

  const handleExpired = () => {
    clearStoredSession(slug);
    setSession(null);
    setMode('signin');
    toast.error('Your session has expired. Please sign in again.');
  };

  const signOut = () => {
    clearStoredSession(slug);
    setSession(null);
    setPassword('');
    setMode('signin');
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await axios.post(`${base}/register/${slug}`, {
        name, email: email.trim(), phone, password,
      });
      toast.success(res.data?.message || 'Check your email for a code',
        { duration: 7000 });
      setPassword('');
      setMode('verify');
    } catch (error: any) {
      toast.error(errMsg(error, 'Could not create your account'));
    } finally {
      setBusy(false);
    }
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await axios.post(`${base}/login/${slug}`, {
        email: email.trim(), password,
      });
      afterSignIn(res.data.data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast(errMsg(error, 'Please verify your email first.'), { duration: 7000 });
        setMode('verify');
      } else {
        toast.error(errMsg(error, 'Could not sign you in'));
      }
    } finally {
      setBusy(false);
    }
  };

  const verifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setBusy(true);
    try {
      const res = await axios.post(`${base}/verify/${slug}`, {
        email: email.trim(), code: code.trim(),
      });
      toast.success('Email verified. Welcome!');
      afterSignIn(res.data.data);
    } catch (error: any) {
      toast.error(errMsg(error, 'Could not verify the code'));
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    setBusy(true);
    try {
      const res = await axios.post(`${base}/resend/${slug}`, { email: email.trim() });
      toast.success(res.data?.message || 'A new code is on its way', { duration: 6000 });
    } catch (error: any) {
      toast.error(errMsg(error, 'Could not send a new code'));
    } finally {
      setBusy(false);
    }
  };

  const forgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await axios.post(`${base}/forgot/${slug}`, { email: email.trim() });
      toast.success(res.data?.message || 'Check your email', { duration: 7000 });
      setMode('reset');
    } catch (error: any) {
      toast.error(errMsg(error, 'Could not send the code'));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await axios.post(`${base}/reset/${slug}`, {
        email: email.trim(), code: code.trim(), newPassword,
      });
      toast.success(res.data?.message || 'Password changed. Please sign in.');
      setCode('');
      setNewPassword('');
      setMode('signin');
    } catch (error: any) {
      toast.error(errMsg(error, 'Could not reset your password'));
    } finally {
      setBusy(false);
    }
  };

  const tabBtn = (t: Tab, label: string) => (
    <button
      onClick={() => setTab(t)}
      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
        tab === t ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'}`}>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">

        <div className="flex items-center gap-3">
          <Link href={`/store/${slug}`}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {mode === 'account' && session
                ? `Hi, ${session.name.split(' ')[0]}`
                : 'My account'}
            </h1>
            <p className="text-sm text-gray-500">{store?.name}</p>
          </div>
        </div>

        {mode === 'loading' && (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* SIGN IN */}
        {mode === 'signin' && (
          <form onSubmit={signIn} className={card + ' space-y-4'}>
            <h2 className="font-bold text-gray-900">Sign in</h2>
            <input type="email" required placeholder="Email address"
              autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            <PasswordInput value={password} onChange={setPassword}
              placeholder="Password" autoComplete="current-password" />
            <button type="submit" disabled={busy || !email || !password}
              className={primaryBtn}>
              {busy ? 'Signing in...' : 'Sign in'}
            </button>
            <div className="flex justify-between text-sm">
              <button type="button" onClick={() => setMode('forgot')}
                className="text-gray-500 hover:underline">
                Forgot password?
              </button>
              <button type="button" onClick={() => setMode('signup')}
                className="text-purple-600 font-semibold hover:underline">
                Create an account
              </button>
            </div>
          </form>
        )}

        {/* SIGN UP */}
        {mode === 'signup' && (
          <form onSubmit={signUp} className={card + ' space-y-4'}>
            <h2 className="font-bold text-gray-900">Create your account</h2>
            <p className="text-xs text-gray-500">
              An account lets you stockpile items, check out later and see your
              orders. We will email you a code to confirm your email.
            </p>
            <input type="text" required placeholder="Full name"
              autoComplete="name" value={name}
              onChange={(e) => setName(e.target.value)} className={inputClass} />
            <input type="email" required placeholder="Email address"
              autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            <input type="tel" required placeholder="Phone number"
              autoComplete="tel" value={phone}
              onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            <PasswordInput value={password} onChange={setPassword}
              placeholder="Password (8+ characters, letters and numbers)"
              autoComplete="new-password" />
            <button type="submit"
              disabled={busy || !name || !email || !phone || !password}
              className={primaryBtn}>
              {busy ? 'Creating...' : 'Create account'}
            </button>
            <button type="button" onClick={() => setMode('signin')}
              className="w-full text-sm text-gray-500 hover:underline">
              I already have an account
            </button>
          </form>
        )}

        {/* VERIFY EMAIL */}
        {mode === 'verify' && (
          <form onSubmit={verifyEmail} className={card + ' space-y-4'}>
            <h2 className="font-bold text-gray-900">Check your email</h2>
            <p className="text-sm text-gray-600">
              We sent a 6-digit code to <strong>{email}</strong>. Check your spam
              folder too. It is valid for 10 minutes.
            </p>
            <input type="text" inputMode="numeric" maxLength={6}
              placeholder="6-digit code" value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className={inputClass + ' text-center tracking-widest text-lg'} />
            <button type="submit" disabled={busy || code.length !== 6}
              className={primaryBtn}>
              {busy ? 'Checking...' : 'Confirm my email'}
            </button>
            <div className="flex justify-between text-sm">
              <button type="button" onClick={resendCode} disabled={busy}
                className="text-purple-600 font-semibold hover:underline">
                Send a new code
              </button>
              <button type="button" onClick={() => setMode('signin')}
                className="text-gray-500 hover:underline">
                Back to sign in
              </button>
            </div>
          </form>
        )}

        {/* FORGOT */}
        {mode === 'forgot' && (
          <form onSubmit={forgot} className={card + ' space-y-4'}>
            <h2 className="font-bold text-gray-900">Forgot your password?</h2>
            <p className="text-sm text-gray-600">
              Enter your email and we will send you a code to choose a new one.
            </p>
            <input type="email" required placeholder="Email address"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className={inputClass} />
            <button type="submit" disabled={busy || !email} className={primaryBtn}>
              {busy ? 'Sending...' : 'Send me a code'}
            </button>
            <button type="button" onClick={() => setMode('signin')}
              className="w-full text-sm text-gray-500 hover:underline">
              Back to sign in
            </button>
          </form>
        )}

        {/* RESET */}
        {mode === 'reset' && (
          <form onSubmit={resetPassword} className={card + ' space-y-4'}>
            <h2 className="font-bold text-gray-900">Choose a new password</h2>
            <p className="text-sm text-gray-600">
              Enter the 6-digit code we emailed to <strong>{email}</strong>.
            </p>
            <input type="text" inputMode="numeric" maxLength={6}
              placeholder="6-digit code" value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className={inputClass + ' text-center tracking-widest text-lg'} />
            <PasswordInput value={newPassword} onChange={setNewPassword}
              placeholder="New password (8+ characters, letters and numbers)"
              autoComplete="new-password" />
            <button type="submit"
              disabled={busy || code.length !== 6 || !newPassword}
              className={primaryBtn}>
              {busy ? 'Saving...' : 'Change password'}
            </button>
            <button type="button" onClick={() => setMode('forgot')}
              className="w-full text-sm text-gray-500 hover:underline">
              Send a new code
            </button>
          </form>
        )}

        {/* SIGNED IN */}
        {mode === 'account' && session && (
          <>
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
              {tabBtn('stockpile', 'My stockpile')}
              {tabBtn('orders', 'Orders')}
              {tabBtn('security', 'Account')}
            </div>

            {tab === 'stockpile' && (
              <StockpileTab slug={slug} session={session} store={store}
                onExpired={handleExpired} />
            )}
            {tab === 'orders' && (
              <OrdersTab slug={slug} session={session} onExpired={handleExpired} />
            )}
            {tab === 'security' && (
              <SecurityTab slug={slug} session={session}
                onUpdate={(s) => { saveSession(slug, s); setSession(s); }}
                onSignOut={signOut} onExpired={handleExpired} />
            )}
          </>
        )}
      </div>
    </div>
  );
}