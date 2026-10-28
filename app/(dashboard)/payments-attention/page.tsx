'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Row {
  id: string;
  reference: string;
  kind: string;
  provider: string;
  status: string;
  attempts: number;
  reason?: string | null;
  createdAt: string;
  updatedAt: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  itemCount: number;
}

const KIND: Record<string, string> = {
  Order: 'Order payment',
  StockpileDeposit: 'Stockpile payment',
  StockpileCheckout: 'Stockpile delivery payment',
};

const BADGE: Record<string, string> = {
  Failed: 'bg-red-100 text-red-700',
  Retrying: 'bg-amber-100 text-amber-700',
  Stuck: 'bg-amber-100 text-amber-700',
  Resolved: 'bg-green-100 text-green-700',
};

const when = (d: string) => new Date(d).toLocaleString();

export default function PaymentsAttentionPage() {
  const [showResolved, setShowResolved] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    load();
  }, [showResolved]);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/payments-admin', {
        params: { resolved: showResolved },
      });
      setRows(res.data.data.items ?? []);
      setOpenCount(res.data.data.openCount ?? 0);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Reference copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  const retry = async (id: string) => {
    setBusyId(id);
    try {
      const res = await api.post(`/payments-admin/${id}/retry`);
      toast.success(res.data?.message || 'Recorded ✅', { duration: 6000 });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Still could not be recorded',
        { duration: 9000 }
      );
    } finally {
      setBusyId(null);
      load(true);
    }
  };

  const resolve = async (id: string) => {
    setBusyId(id);
    try {
      await api.post(`/payments-admin/${id}/resolve`, {
        note: note.trim() || null,
      });
      toast.success('Marked as resolved');
      setResolvingId(null);
      setNote('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not update');
    } finally {
      setBusyId(null);
      load(true);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle size={24} className="text-amber-500" />
            Payments needing attention
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Payments that could not be recorded automatically. The customer
            may have paid, so please check each one.
          </p>
        </div>
        <button
          onClick={() => load()}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 space-y-1">
        <p><strong>What to do with each one</strong></p>
        <p>
          1. Copy the reference and search it in your Paystack or Flutterwave
          dashboard to see whether the money really arrived.
        </p>
        <p>
          2. If it arrived, press <strong>Try again</strong>. This checks the
          payment with the provider and creates the order or stockpile entry.
        </p>
        <p>
          3. If it keeps failing, or the money did not arrive, refund the
          customer if needed, then press <strong>Mark as resolved</strong>.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShowResolved(false)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            !showResolved
              ? 'bg-purple-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600'}`}>
          Needs attention{openCount > 0 ? ` (${openCount})` : ''}
        </button>
        <button
          onClick={() => setShowResolved(true)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            showResolved
              ? 'bg-purple-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600'}`}>
          Resolved
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i}
              className="bg-white rounded-xl border border-gray-100 animate-pulse h-28" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <CheckCircle2 size={48} className="text-green-400 mx-auto mb-4" />
          <p className="font-bold text-gray-700">
            {showResolved
              ? 'Nothing has been marked as resolved yet'
              : 'All payments are recorded. Nothing needs attention 🎉'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(row => (
            <div key={row.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">

              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">
                      {KIND[row.kind] ?? row.kind}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      BADGE[row.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {row.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                      {row.provider}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {when(row.createdAt)}
                    {row.attempts > 0
                      ? ` · ${row.attempts} automatic attempt${row.attempts !== 1 ? 's' : ''}`
                      : ''}
                  </p>
                </div>
                <button
                  onClick={() => copy(row.reference)}
                  title="Copy the reference"
                  className="font-mono text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg text-gray-700 max-w-full truncate">
                  {row.reference}
                </button>
              </div>

              {(row.customerName || row.customerEmail || row.customerPhone) && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-gray-800">
                    {row.customerName || 'Customer'}
                  </span>
                  {row.customerPhone ? ` · ${row.customerPhone}` : ''}
                  {row.customerEmail ? ` · ${row.customerEmail}` : ''}
                  {row.itemCount > 0
                    ? ` · ${row.itemCount} item${row.itemCount !== 1 ? 's' : ''}`
                    : ''}
                </div>
              )}

              {row.reason && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                  {row.reason}
                </p>
              )}

              {!showResolved && (
                resolvingId === row.id ? (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Optional note, e.g. refunded in Paystack"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => resolve(row.id)}
                        disabled={busyId === row.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                        Mark as resolved
                      </button>
                      <button
                        onClick={() => { setResolvingId(null); setNote(''); }}
                        className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => retry(row.id)}
                      disabled={busyId === row.id}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                      {busyId === row.id ? 'Trying...' : 'Try again'}
                    </button>
                    <button
                      onClick={() => { setResolvingId(row.id); setNote(''); }}
                      disabled={busyId === row.id}
                      className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
                      Mark as resolved
                    </button>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}