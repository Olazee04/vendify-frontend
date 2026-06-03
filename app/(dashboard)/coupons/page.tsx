'use client';
import { useEffect, useState } from 'react';
import {
  Plus, Edit, Trash2, Tag,
  X, Check, ToggleLeft, ToggleRight,
  Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Coupon } from '@/types';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discountType: 0,
    discountValue: '',
    minimumOrderAmount: '',
    usageLimit: '',
    expiresAt: '',
    isActive: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data.data ?? []);
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      code: '', discountType: 0, discountValue: '',
      minimumOrderAmount: '', usageLimit: '',
      expiresAt: '', isActive: true,
    });
    setShowForm(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType === 'Percentage' ? 0 : 1,
      discountValue: coupon.discountValue.toString(),
      minimumOrderAmount: coupon.minimumOrderAmount?.toString() ?? '',
      usageLimit: coupon.usageLimit?.toString() ?? '',
      expiresAt: coupon.expiresAt
        ? coupon.expiresAt.split('T')[0] : '',
      isActive: coupon.isActive,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.discountValue) {
      toast.error('Code and discount value are required');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        isActive: form.isActive,
      };
      if (form.minimumOrderAmount)
        payload.minimumOrderAmount =
          parseFloat(form.minimumOrderAmount);
      if (form.usageLimit)
        payload.usageLimit = parseInt(form.usageLimit);
      if (form.expiresAt)
        payload.expiresAt = new Date(form.expiresAt).toISOString();

      if (editing) {
        await api.put(`/coupons/${editing.id}`, payload);
        toast.success('Coupon updated! ✅');
      } else {
        await api.post('/coupons', payload);
        toast.success('Coupon created! 🎉');
      }
      setShowForm(false);
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.response?.data?.message
        || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.success(`Coupon "${code}" deleted`);
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  const toggleCoupon = async (id: string) => {
    try {
      await api.put(`/coupons/${id}/toggle`);
      fetchCoupons();
    } catch {
      toast.error('Failed to toggle coupon');
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Coupons
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Create discount codes for your customers
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-purple-600
            text-white px-4 py-2.5 rounded-xl text-sm
            font-semibold hover:bg-purple-700 transition-colors">
          <Plus size={16} />
          Create Coupon
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-purple-50 border border-purple-200
          rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">
              {editing ? 'Edit Coupon' : 'New Coupon'}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">

            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1.5">
                Coupon Code *
              </label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({
                  ...form,
                  code: e.target.value.toUpperCase()
                    .replace(/\s/g, '')
                })}
                className="w-full px-4 py-3 border border-gray-200
                  rounded-xl focus:outline-none focus:ring-2
                  focus:ring-purple-500 text-gray-900 bg-white
                  font-mono uppercase tracking-widest"
                placeholder="SAVE10"
                disabled={!!editing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-2">
                Discount Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({
                    ...form, discountType: 0
                  })}
                  className={`p-3 rounded-xl border-2 text-left
                    transition-all ${
                      form.discountType === 0
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white'
                    }`}>
                  <p className="font-semibold text-gray-900
                    text-sm">
                    % Percentage
                  </p>
                  <p className="text-xs text-gray-400">
                    e.g. 10% off
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({
                    ...form, discountType: 1
                  })}
                  className={`p-3 rounded-xl border-2 text-left
                    transition-all ${
                      form.discountType === 1
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white'
                    }`}>
                  <p className="font-semibold text-gray-900
                    text-sm">
                    ₦ Fixed Amount
                  </p>
                  <p className="text-xs text-gray-400">
                    e.g. ₦500 off
                  </p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-1.5">
                  Discount Value *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2
                    -translate-y-1/2 text-gray-400 text-sm">
                    {form.discountType === 0 ? '%' : '₦'}
                  </span>
                  <input
                    type="number"
                    required
                    min="0.01"
                    max={form.discountType === 0
                      ? '100' : undefined}
                    step="0.01"
                    value={form.discountValue}
                    onChange={(e) => setForm({
                      ...form, discountValue: e.target.value
                    })}
                    className="w-full pl-8 pr-4 py-3 border
                      border-gray-200 rounded-xl focus:outline-none
                      focus:ring-2 focus:ring-purple-500
                      text-gray-900 bg-white"
                    placeholder={
                      form.discountType === 0 ? '10' : '500'
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-1.5">
                  Min Order Amount (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.minimumOrderAmount}
                  onChange={(e) => setForm({
                    ...form, minimumOrderAmount: e.target.value
                  })}
                  className="w-full px-4 py-3 border border-gray-200
                    rounded-xl focus:outline-none focus:ring-2
                    focus:ring-purple-500 text-gray-900 bg-white"
                  placeholder="5000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-1.5">
                  Usage Limit
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.usageLimit}
                  onChange={(e) => setForm({
                    ...form, usageLimit: e.target.value
                  })}
                  className="w-full px-4 py-3 border border-gray-200
                    rounded-xl focus:outline-none focus:ring-2
                    focus:ring-purple-500 text-gray-900 bg-white"
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-1.5">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({
                    ...form, expiresAt: e.target.value
                  })}
                  className="w-full px-4 py-3 border border-gray-200
                    rounded-xl focus:outline-none focus:ring-2
                    focus:ring-purple-500 text-gray-900 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3
              bg-white rounded-xl border border-gray-200">
              <input
                type="checkbox"
                id="couponActive"
                checked={form.isActive}
                onChange={(e) => setForm({
                  ...form, isActive: e.target.checked
                })}
                className="w-4 h-4 accent-purple-600"
              />
              <label htmlFor="couponActive"
                className="text-sm text-gray-700 cursor-pointer">
                Coupon is active
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 border-2 border-gray-200
                  text-gray-600 rounded-xl font-semibold
                  hover:border-gray-300 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center
                  gap-2 bg-purple-600 text-white py-3 rounded-xl
                  font-semibold hover:bg-purple-700
                  disabled:opacity-50 transition-colors">
                <Check size={16}/>
                {saving ? 'Saving...' : editing
                  ? 'Update' : 'Create Coupon'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl
              border border-gray-100 animate-pulse h-24"/>
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border
          border-gray-100 p-16 text-center">
          <Tag size={48} className="text-gray-300 mx-auto mb-4"/>
          <h3 className="font-bold text-gray-700 text-lg mb-2">
            No coupons yet
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            Create discount codes to attract customers
          </p>
          <button
            onClick={openCreate}
            className="bg-purple-600 text-white px-6 py-3
              rounded-xl font-semibold hover:bg-purple-700
              transition-colors">
            Create First Coupon
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <div key={coupon.id}
              className={`bg-white rounded-xl border p-4
                transition-all ${
                  coupon.isActive && !coupon.isExpired
                    ? 'border-gray-100 hover:border-purple-200'
                    : 'border-gray-100 opacity-60'
                }`}>
              <div className="flex items-center gap-4">

                {/* Code */}
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 bg-purple-100
                    rounded-lg">
                    <p className="font-mono font-bold
                      text-purple-700 text-sm tracking-wider">
                      {coupon.code}
                    </p>
                  </div>
                  <button
                    onClick={() => copyCouponCode(coupon.code)}
                    className="p-1.5 text-gray-400
                      hover:text-purple-600 transition-colors">
                    <Copy size={14}/>
                  </button>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2
                    flex-wrap">
                    <p className="font-semibold text-gray-900
                      text-sm">
                      {coupon.discountType === 'Percentage'
                        ? `${coupon.discountValue}% off`
                        : `₦${coupon.discountValue.toLocaleString()} off`
                      }
                    </p>
                    {coupon.minimumOrderAmount && (
                      <span className="text-xs text-gray-400">
                        Min: ₦{coupon.minimumOrderAmount
                          .toLocaleString()}
                      </span>
                    )}
                    {coupon.isExpired && (
                      <span className="px-2 py-0.5 bg-red-100
                        text-red-600 text-xs rounded-full">
                        Expired
                      </span>
                    )}
                    {!coupon.isActive && !coupon.isExpired && (
                      <span className="px-2 py-0.5 bg-gray-100
                        text-gray-500 text-xs rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3
                    mt-1 flex-wrap">
                    <p className="text-xs text-gray-400">
                      Used: {coupon.usageCount}
                      {coupon.usageLimit
                        ? `/${coupon.usageLimit}`
                        : ' (unlimited)'
                      }
                    </p>
                    {coupon.expiresAt && (
                      <p className="text-xs text-gray-400">
                        Expires:{' '}
                        {new Date(coupon.expiresAt)
                          .toLocaleDateString('en-NG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Usage bar */}
                {coupon.usageLimit && (
                  <div className="hidden sm:block w-20">
                    <div className="h-1.5 bg-gray-100
                      rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500
                          rounded-full"
                        style={{
                          width: `${Math.min(
                            (coupon.usageCount /
                              coupon.usageLimit) * 100,
                            100
                          )}%`
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {coupon.remainingUses ?? 0} left
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCoupon(coupon.id)}
                    className="text-gray-400
                      hover:text-purple-600 transition-colors">
                    {coupon.isActive
                      ? <ToggleRight size={24}
                          className="text-purple-600"/>
                      : <ToggleLeft size={24}/>
                    }
                  </button>
                  <button
                    onClick={() => openEdit(coupon)}
                    className="p-2 rounded-lg bg-blue-50
                      text-blue-600 hover:bg-blue-100
                      transition-colors">
                    <Edit size={14}/>
                  </button>
                  <button
                    onClick={() => handleDelete(
                      coupon.id, coupon.code
                    )}
                    className="p-2 rounded-lg bg-red-50
                      text-red-500 hover:bg-red-100
                      transition-colors">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}