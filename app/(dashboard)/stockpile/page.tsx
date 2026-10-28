'use client';
import { useEffect, useState } from 'react';
import { Package, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function StockpilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    isEnabled: false,
    maxItems: '',
    maxAmount: '',
    maxWeightKg: '',
    holdDays: '',
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await api.get('/stockpile/settings');
      const d = res.data.data;
      setForm({
        isEnabled: d.isEnabled,
        maxItems: d.maxItems?.toString() ?? '',
        maxAmount: d.maxAmount?.toString() ?? '',
        maxWeightKg: d.maxWeightKg?.toString() ?? '',
        holdDays: d.holdDays?.toString() ?? '',
      });
    } catch {
      toast.error('Failed to load stockpile settings');
    } finally {
      setLoading(false);
    }
  };

  const toInt = (v: string) =>
    v.trim() === '' ? null : parseInt(v, 10);
  const toNum = (v: string) =>
    v.trim() === '' ? null : parseFloat(v);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/stockpile/settings', {
        isEnabled: form.isEnabled,
        maxItems: toInt(form.maxItems),
        maxAmount: toNum(form.maxAmount),
        maxWeightKg: toNum(form.maxWeightKg),
        holdDays: toInt(form.holdDays),
      });
      toast.success('Stockpile settings saved ✅');
      load();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to save settings'
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 border border-gray-200 rounded-xl ' +
    'focus:outline-none focus:ring-2 focus:ring-purple-500 ' +
    'text-gray-900 bg-white';

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl border
        border-gray-100 animate-pulse h-64" />
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package size={24} className="text-purple-600" />
          Stockpile
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Let customers pay for items now and keep them at your store,
          then pay shipping once to receive everything together.
        </p>
                <a href="/stockpile/customers"
          className="inline-block mt-2 text-sm font-semibold text-purple-600 hover:underline">
          View customer stockpiles →
        </a>
      </div>

      <form onSubmit={handleSave}
        className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">

        <div className="flex items-center gap-3 p-3 bg-purple-50
          rounded-xl border border-purple-100">
          <input
            type="checkbox"
            id="stockpileEnabled"
            checked={form.isEnabled}
            onChange={(e) =>
              setForm({ ...form, isEnabled: e.target.checked })
            }
            className="w-4 h-4 accent-purple-600"
          />
          <label htmlFor="stockpileEnabled"
            className="text-sm font-medium text-gray-800 cursor-pointer">
            Turn on stockpile for my store
          </label>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-800 mb-1">
            Limits
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Once <strong>any one</strong> limit is reached, the customer
            can&apos;t add more and must check out their stockpile.
            Leave a box empty for no limit of that kind. Set at least
            one limit.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Max items
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.maxItems}
                onChange={(e) =>
                  setForm({ ...form, maxItems: e.target.value })
                }
                className={inputClass}
                placeholder="e.g. 10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Max amount (₦)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={form.maxAmount}
                onChange={(e) =>
                  setForm({ ...form, maxAmount: e.target.value })
                }
                className={inputClass}
                placeholder="e.g. 200000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Max weight (kg)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.maxWeightKg}
                onChange={(e) =>
                  setForm({ ...form, maxWeightKg: e.target.value })
                }
                className={inputClass}
                placeholder="e.g. 20"
              />
            </div>
          </div>
          <p className="text-xs text-amber-600 mt-2">
            The weight limit only works once your products have weights.
            We&apos;ll add a weight box to the product form next.
          </p>
        </div>

        <div className="sm:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Hold for (days)
          </label>
          <input
            type="number"
            min="1"
            max="365"
            step="1"
            value={form.holdDays}
            onChange={(e) =>
              setForm({ ...form, holdDays: e.target.value })
            }
            className={inputClass}
            placeholder="e.g. 30"
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional. How long a stockpile can sit before it expires.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2
            bg-purple-600 text-white py-3 rounded-xl font-semibold
            hover:bg-purple-700 disabled:opacity-50 transition-colors">
          <Check size={16} />
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}