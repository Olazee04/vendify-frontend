'use client';
import { useEffect, useState } from 'react';
import { Package, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Summary {
  openCount: number;
  expiredCount: number;
  checkedOutCount: number;
  releasedCount: number;
  amountHeld: number;
}

interface Row {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  totalItems: number;
  totalAmount: number;
  totalWeightKg: number;
  expiresAt?: string | null;
  createdAt: string;
  orderNumber?: string | null;
}

interface ItemView {
  productId: string;
  productName: string;
  productImageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weightKg?: number | null;
}

interface Deposit {
  id: string;
  paymentReference: string;
  paymentMethod: string;
  amountPaid: number;
  createdAt: string;
  refundedAt?: string | null;
}

interface Detail extends Row {
  items: ItemView[];
  deposits: Deposit[];
  releaseNote?: string | null;
  releasedAt?: string | null;
  checkedOutAt?: string | null;
}

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'Open', label: 'Open' },
  { key: 'Expired', label: 'Expired' },
  { key: 'CheckedOut', label: 'Checked out' },
  { key: 'Released', label: 'Released' },
];

const badge: Record<string, string> = {
  Open: 'bg-green-100 text-green-700',
  Expired: 'bg-amber-100 text-amber-700',
  CheckedOut: 'bg-blue-100 text-blue-700',
  Released: 'bg-gray-100 text-gray-600',
  CheckingOut: 'bg-blue-100 text-blue-700',
  Releasing: 'bg-gray-100 text-gray-600',
};

const naira = (n: number) => `₦${n.toLocaleString()}`;
const day = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString() : '—';
const wa = (phone: string) =>
  `https://wa.me/${phone.replace(/\D/g, '').replace(/^0/, '234')}`;

export default function CustomerStockpilesPage() {
  const [data, setData] = useState<{
    summary: Summary; stockpiles: Row[];
  } | null>(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [extendDays, setExtendDays] = useState('7');
  const [releaseNote, setReleaseNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
  }, [filter]);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/stockpile-admin', {
        params: filter ? { status: filter } : {},
      });
      setData(res.data.data);
    } catch {
      toast.error('Failed to load stockpiles');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/stockpile-admin/${id}`);
      setDetail(res.data.data);
    } catch {
      toast.error('Failed to load details');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggle = (id: string) => {
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
      return;
    }
    setOpenId(id);
    setDetail(null);
    setReleaseNote('');
    setExtendDays('7');
    loadDetail(id);
  };

  const refreshAll = async (id: string) => {
    await Promise.all([load(true), loadDetail(id)]);
  };

  const handleExtend = async (id: string) => {
    const days = parseInt(extendDays, 10);
    if (!days || days < 1 || days > 365) {
      toast.error('Enter a number of days between 1 and 365');
      return;
    }
    setBusy(true);
    try {
      await api.post(`/stockpile-admin/${id}/extend`, { days });
      toast.success(`Extended by ${days} days ✅`);
      await refreshAll(id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to extend');
    } finally {
      setBusy(false);
    }
  };

  const handleRelease = async (id: string) => {
    if (!confirm(
      'Release this stockpile?\n\n' +
      'The items go back into your stock and the customer can no longer ' +
      'check out. You will then need to refund their payments yourself. ' +
      'This cannot be undone.'
    )) return;

    setBusy(true);
    try {
      await api.post(`/stockpile-admin/${id}/release`, {
        note: releaseNote.trim() || null,
      });
      toast.success('Stockpile released. Stock restored ✅');
      await refreshAll(id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to release');
    } finally {
      setBusy(false);
    }
  };

  const handleRefunded = async (depositId: string, stockpileId: string) => {
    setBusy(true);
    try {
      await api.post(`/stockpile-admin/deposits/${depositId}/refunded`);
      toast.success('Marked as refunded');
      await refreshAll(stockpileId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update');
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-purple-500';

  const s = data?.summary;
  const canManage = (status: string) =>
    status === 'Open' || status === 'Expired';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package size={24} className="text-purple-600" />
            Customer stockpiles
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Items customers have paid for and are keeping at your store.
          </p>
          <a href="/stockpile"
            className="inline-block mt-2 text-sm font-semibold text-purple-600 hover:underline">
            ← Stockpile settings
          </a>
        </div>
        <button
          onClick={() => load()}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {s && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-gray-900">{s.openCount}</p>
            <p className="text-xs text-gray-500">Open</p>
          </div>
          <div className={`bg-white rounded-2xl border p-4 ${
            s.expiredCount > 0 ? 'border-amber-300' : 'border-gray-100'}`}>
            <p className="text-2xl font-bold text-gray-900">{s.expiredCount}</p>
            <p className="text-xs text-gray-500">
              Expired{s.expiredCount > 0 ? ' · needs you' : ''}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-gray-900">{s.checkedOutCount}</p>
            <p className="text-xs text-gray-500">Checked out</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-gray-900">{s.releasedCount}</p>
            <p className="text-xs text-gray-500">Released</p>
          </div>
          <div className="bg-white rounded-2xl border border-purple-100 p-4 col-span-2 sm:col-span-1">
            <p className="text-xl font-bold text-purple-600">
              {naira(s.amountHeld)}
            </p>
            <p className="text-xs text-gray-500">Paid, not shipped</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setOpenId(null); setDetail(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i}
              className="bg-white rounded-xl border border-gray-100 animate-pulse h-20" />
          ))}
        </div>
      ) : !data || data.stockpiles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Package size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="font-bold text-gray-700">No stockpiles here yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.stockpiles.map(row => (
            <div key={row.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

              <button
                onClick={() => toggle(row.id)}
                className="w-full text-left p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">
                      {row.customerName}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      badge[row.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {row.status === 'CheckedOut' ? 'Checked out' : row.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {row.customerEmail}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {row.totalItems} item{row.totalItems !== 1 ? 's' : ''}
                    {row.totalWeightKg > 0
                      ? ` · ${row.totalWeightKg.toFixed(2)} kg` : ''}
                    {row.expiresAt ? ` · keep until ${day(row.expiresAt)}` : ''}
                  </p>
                </div>
                <p className="font-bold text-purple-600">
                  {naira(row.totalAmount)}
                </p>
              </button>

              {openId === row.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
                  {detailLoading || !detail ? (
                    <div className="h-20 animate-pulse bg-gray-100 rounded-xl" />
                  ) : (
                    <>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          📞 {detail.customerPhone}{' '}
                          <a href={wa(detail.customerPhone)}
                            target="_blank" rel="noreferrer"
                            className="text-green-600 font-semibold hover:underline">
                            WhatsApp
                          </a>
                        </p>
                        <p>✉️ {detail.customerEmail}</p>
                        <p className="text-xs text-gray-400">
                          Started {day(detail.createdAt)}
                          {detail.checkedOutAt
                            ? ` · checked out ${day(detail.checkedOutAt)}` : ''}
                          {detail.releasedAt
                            ? ` · released ${day(detail.releasedAt)}` : ''}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {detail.items.map((item, i) => (
                          <div key={i}
                            className="flex gap-3 p-2 bg-white rounded-xl">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                              {item.productImageUrl ? (
                                <img src={item.productImageUrl}
                                  alt={item.productName}
                                  className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package size={16} className="text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.productName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.quantity} × {naira(item.unitPrice)}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-gray-900">
                              {naira(item.totalPrice)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                          Payments
                        </p>
                        <div className="space-y-2">
                          {detail.deposits.map(dep => (
                            <div key={dep.id}
                              className="flex items-center gap-3 p-2 bg-white rounded-xl text-sm">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900">
                                  {naira(dep.amountPaid)}
                                  <span className="text-xs text-gray-400 ml-2">
                                    {dep.paymentMethod} · {day(dep.createdAt)}
                                  </span>
                                </p>
                                <p className="text-xs text-gray-400 font-mono truncate">
                                  {dep.paymentReference}
                                </p>
                              </div>
                              {dep.refundedAt ? (
                                <span className="text-xs text-green-600 font-medium">
                                  Refunded {day(dep.refundedAt)}
                                </span>
                              ) : detail.status === 'Released' ? (
                                <button
                                  onClick={() => handleRefunded(dep.id, detail.id)}
                                  disabled={busy}
                                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                                  Mark refunded
                                </button>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>

                      {detail.status === 'CheckedOut' && (
                        <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-800">
                          Checked out as order{' '}
                          <strong>{detail.orderNumber}</strong>. Ship it from{' '}
                          <a href="/orders" className="underline font-semibold">
                            Orders
                          </a>.
                        </div>
                      )}

                      {detail.status === 'Released' && (
                        <div className="p-3 bg-amber-50 rounded-xl text-sm text-amber-800 space-y-1">
                          <p className="font-semibold">
                            Released. Refund these payments from your Paystack
                            or Flutterwave dashboard, then tap Mark refunded
                            above.
                          </p>
                          {detail.releaseNote && (
                            <p>Your note: {detail.releaseNote}</p>
                          )}
                        </div>
                      )}

                      {canManage(detail.status) && (
                        <div className="space-y-4 pt-2 border-t border-gray-200">
                          {detail.expiresAt && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                Give the customer more time
                              </p>
                              <div className="flex gap-2 flex-wrap items-center">
                                <input
                                  type="number" min="1" max="365"
                                  value={extendDays}
                                  onChange={(e) => setExtendDays(e.target.value)}
                                  className={inputClass + ' w-24'} />
                                <span className="text-sm text-gray-500">days</span>
                                <button
                                  onClick={() => handleExtend(detail.id)}
                                  disabled={busy}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                                  Extend
                                </button>
                              </div>
                            </div>
                          )}

                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                              Release this stockpile
                            </p>
                            <textarea
                              rows={2}
                              value={releaseNote}
                              onChange={(e) => setReleaseNote(e.target.value)}
                              placeholder="Optional note, e.g. customer asked for a refund"
                              className={inputClass + ' w-full resize-none'} />
                            <button
                              onClick={() => handleRelease(detail.id)}
                              disabled={busy}
                              className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                              Release and restock
                            </button>
                            <p className="text-xs text-gray-400 mt-1">
                              Puts the items back in your stock. You then refund
                              the customer yourself.
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}