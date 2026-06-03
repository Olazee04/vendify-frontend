'use client';
import { useEffect, useState } from 'react';
import {
  Plus, Edit, Trash2, Truck,
  X, Check, ToggleLeft, ToggleRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { ShippingZone } from '@/types';

export default function ShippingPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ShippingZone | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    fee: '',
    type: 0,
    isActive: true,
    estimatedDaysMin: '',
    estimatedDaysMax: '',
  });

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const res = await api.get('/shipping/my-zones');
      setZones(res.data.data ?? []);
    } catch {
      toast.error('Failed to load shipping zones');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '', description: '', fee: '',
      type: 0, isActive: true,
      estimatedDaysMin: '', estimatedDaysMax: '',
    });
    setShowForm(true);
  };

  const openEdit = (zone: ShippingZone) => {
    setEditing(zone);
    setForm({
      name: zone.name,
      description: zone.description ?? '',
      fee: zone.fee.toString(),
      type: zone.type === 'FlatRate' ? 0
        : zone.type === 'FreeShipping' ? 1
        : zone.type === 'ByWeight' ? 2 : 3,
      isActive: zone.isActive,
      estimatedDaysMin: zone.estimatedDaysMin?.toString() ?? '',
      estimatedDaysMax: zone.estimatedDaysMax?.toString() ?? '',
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        fee: parseFloat(form.fee) || 0,
        type: form.type,
        isActive: form.isActive,
        estimatedDaysMin: form.estimatedDaysMin
          ? parseInt(form.estimatedDaysMin) : undefined,
        estimatedDaysMax: form.estimatedDaysMax
          ? parseInt(form.estimatedDaysMax) : undefined,
      };

      if (editing) {
        await api.put(`/shipping/${editing.id}`, payload);
        toast.success('Zone updated! ✅');
      } else {
        await api.post('/shipping', payload);
        toast.success('Shipping zone created! 🎉');
      }
      setShowForm(false);
      fetchZones();
    } catch (error: any) {
      toast.error(error.response?.data?.message
        || 'Failed to save zone');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" shipping zone?`)) return;
    try {
      await api.delete(`/shipping/${id}`);
      setZones(prev => prev.filter(z => z.id !== id));
      toast.success('Zone deleted');
    } catch {
      toast.error('Failed to delete zone');
    }
  };

  const toggleActive = async (zone: ShippingZone) => {
    try {
      await api.put(`/shipping/${zone.id}`, {
        isActive: !zone.isActive
      });
      fetchZones();
    } catch {
      toast.error('Failed to update zone');
    }
  };

  const shippingTypes = [
    { value: 0, label: 'Flat Rate', desc: 'Fixed fee for all orders' },
    { value: 1, label: 'Free Shipping', desc: 'No charge' },
    { value: 2, label: 'By Weight', desc: 'Fee based on weight' },
    { value: 3, label: 'By Location', desc: 'Fee by location' },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Shipping Zones
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Set delivery fees for different locations
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-purple-600
            text-white px-4 py-2.5 rounded-xl text-sm
            font-semibold hover:bg-purple-700 transition-colors">
          <Plus size={16} />
          Add Zone
        </button>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-100
        rounded-xl p-4">
        <p className="text-sm text-blue-700">
          💡 <strong>Tip:</strong> Add a &quot;Nationwide&quot; zone
          to cover all states. Add specific states like
          &quot;Lagos&quot; for faster local delivery rates.
        </p>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-purple-50 border border-purple-200
          rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">
              {editing ? 'Edit Zone' : 'New Shipping Zone'}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-1.5">
                  Zone Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({
                    ...form, name: e.target.value
                  })}
                  className="w-full px-4 py-3 border border-gray-200
                    rounded-xl focus:outline-none focus:ring-2
                    focus:ring-purple-500 text-gray-900 bg-white"
                  placeholder="e.g. Lagos, Nationwide"
                />
              </div>
              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-1.5">
                  Shipping Fee (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.fee}
                  onChange={(e) => setForm({
                    ...form, fee: e.target.value
                  })}
                  className="w-full px-4 py-3 border border-gray-200
                    rounded-xl focus:outline-none focus:ring-2
                    focus:ring-purple-500 text-gray-900 bg-white"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-2">
                Shipping Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {shippingTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({
                      ...form, type: t.value
                    })}
                    className={`p-3 rounded-xl border-2 text-left
                      transition-all ${
                        form.type === t.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 bg-white hover:border-purple-300'
                      }`}>
                    <p className="font-medium text-gray-900
                      text-sm">
                      {t.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({
                  ...form, description: e.target.value
                })}
                className="w-full px-4 py-3 border border-gray-200
                  rounded-xl focus:outline-none focus:ring-2
                  focus:ring-purple-500 text-gray-900 bg-white"
                placeholder="e.g. Same day delivery in Lagos"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-1.5">
                  Min Days
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.estimatedDaysMin}
                  onChange={(e) => setForm({
                    ...form, estimatedDaysMin: e.target.value
                  })}
                  className="w-full px-4 py-3 border border-gray-200
                    rounded-xl focus:outline-none focus:ring-2
                    focus:ring-purple-500 text-gray-900 bg-white"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-1.5">
                  Max Days
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.estimatedDaysMax}
                  onChange={(e) => setForm({
                    ...form, estimatedDaysMax: e.target.value
                  })}
                  className="w-full px-4 py-3 border border-gray-200
                    rounded-xl focus:outline-none focus:ring-2
                    focus:ring-purple-500 text-gray-900 bg-white"
                  placeholder="3"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3
              bg-white rounded-xl border border-gray-200">
              <input
                type="checkbox"
                id="zoneActive"
                checked={form.isActive}
                onChange={(e) => setForm({
                  ...form, isActive: e.target.checked
                })}
                className="w-4 h-4 accent-purple-600"
              />
              <label htmlFor="zoneActive"
                className="text-sm text-gray-700 cursor-pointer">
                Zone is active
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
                <Check size={16} />
                {saving ? 'Saving...' : editing
                  ? 'Update' : 'Create Zone'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Zones List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl
              border border-gray-100 animate-pulse h-24" />
          ))}
        </div>
      ) : zones.length === 0 ? (
        <div className="bg-white rounded-2xl border
          border-gray-100 p-16 text-center">
          <Truck size={48} className="text-gray-300
            mx-auto mb-4"/>
          <h3 className="font-bold text-gray-700 text-lg mb-2">
            No shipping zones yet
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            Add zones to charge delivery fees
          </p>
          <button
            onClick={openCreate}
            className="bg-purple-600 text-white px-6 py-3
              rounded-xl font-semibold hover:bg-purple-700
              transition-colors">
            Add First Zone
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((zone) => (
            <div key={zone.id}
              className={`bg-white rounded-xl border p-4
                flex items-center gap-4 transition-all
                ${zone.isActive
                  ? 'border-gray-100 hover:border-purple-200'
                  : 'border-gray-100 opacity-60'
                }`}>

              <div className={`w-10 h-10 rounded-xl
                flex items-center justify-center flex-shrink-0
                ${zone.isActive
                  ? 'bg-purple-100'
                  : 'bg-gray-100'
                }`}>
                <Truck size={16} className={
                  zone.isActive
                    ? 'text-purple-600'
                    : 'text-gray-400'
                }/>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">
                    {zone.name}
                  </h3>
                  {!zone.isActive && (
                    <span className="px-2 py-0.5 bg-gray-100
                      text-gray-500 text-xs rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                {zone.description && (
                  <p className="text-sm text-gray-400 truncate">
                    {zone.description}
                  </p>
                )}
                {zone.deliveryEstimate && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    🕐 {zone.deliveryEstimate}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="font-bold text-purple-600">
                  {zone.fee === 0
                    ? 'FREE'
                    : `₦${zone.fee.toLocaleString()}`
                  }
                </p>
                <p className="text-xs text-gray-400">
                  {zone.type}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(zone)}
                  className="text-gray-400 hover:text-purple-600
                    transition-colors">
                  {zone.isActive
                    ? <ToggleRight size={24}
                        className="text-purple-600"/>
                    : <ToggleLeft size={24}/>
                  }
                </button>
                <button
                  onClick={() => openEdit(zone)}
                  className="p-2 rounded-lg bg-blue-50
                    text-blue-600 hover:bg-blue-100
                    transition-colors">
                  <Edit size={14}/>
                </button>
                <button
                  onClick={() => handleDelete(zone.id, zone.name)}
                  className="p-2 rounded-lg bg-red-50
                    text-red-500 hover:bg-red-100
                    transition-colors">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}