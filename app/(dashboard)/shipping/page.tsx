'use client';
import { useEffect, useState } from 'react';
import {
  Plus, Edit, Trash2, Truck,
  X, Check, ToggleLeft, ToggleRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { ShippingZone } from '@/types';
import { NIGERIAN_STATES } from '@/lib/nigerianStates';

const TYPES = [
  { value: 0, label: 'Flat Rate', desc: 'A fixed fee for these areas' },
  { value: 1, label: 'Free Shipping', desc: 'No charge' },
  { value: 4, label: 'Store Pickup', desc: 'Customer collects, no fee' },
];

const emptyForm = {
  name: '',
  description: '',
  fee: '',
  type: 0,
  states: [] as string[],
  isActive: true,
  estimatedDaysMin: '',
  estimatedDaysMax: '',
};

const statesLabel = (z: ShippingZone) => {
  const list = (z.state ?? '')
    .split(',').map(s => s.trim()).filter(Boolean);
  if (list.length === 0) {
    return NIGERIAN_STATES.includes(z.name) ? z.name : 'All states';
  }
  return list.length > 3
    ? `${list.slice(0, 3).join(', ')} +${list.length - 3} more`
    : list.join(', ');
};

export default function ShippingPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ShippingZone | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

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
    setForm({ ...emptyForm, states: [] });
    setShowForm(true);
  };

  const openEdit = (zone: ShippingZone) => {
    const listed = (zone.state ?? '')
      .split(',').map(s => s.trim()).filter(Boolean);
    // Older zones were named after their state
    const states = listed.length > 0
      ? listed
      : NIGERIAN_STATES.includes(zone.name) ? [zone.name] : [];

    setEditing(zone);
    setForm({
      name: zone.name,
      description: zone.description ?? '',
      fee: zone.fee.toString(),
      type: zone.type === 'FreeShipping' ? 1
        : zone.type === 'Pickup' ? 4 : 0,
      states,
      isActive: zone.isActive,
      estimatedDaysMin: zone.estimatedDaysMin?.toString() ?? '',
      estimatedDaysMax: zone.estimatedDaysMax?.toString() ?? '',
    });
    setShowForm(true);
  };

  const toggleState = (s: string) => {
    setForm(f => ({
      ...f,
      states: f.states.includes(s)
        ? f.states.filter(x => x !== s)
        : [...f.states, s],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Give this option a name');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        fee: form.type === 0 ? (parseFloat(form.fee) || 0) : 0,
        type: form.type,
        state: form.states.join(', '),
        isActive: form.isActive,
        estimatedDaysMin: form.estimatedDaysMin
          ? parseInt(form.estimatedDaysMin) : undefined,
        estimatedDaysMax: form.estimatedDaysMax
          ? parseInt(form.estimatedDaysMax) : undefined,
      };

      if (editing) {
        await api.put(`/shipping/${editing.id}`, payload);
        toast.success('Delivery option updated ✅');
      } else {
        await api.post('/shipping', payload);
        toast.success('Delivery option created 🎉');
      }
      setShowForm(false);
      fetchZones();
    } catch (error: any) {
      toast.error(error.response?.data?.message
        || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/shipping/${id}`);
      setZones(prev => prev.filter(z => z.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const toggleActive = async (zone: ShippingZone) => {
    try {
      await api.put(`/shipping/${zone.id}`, {
        isActive: !zone.isActive
      });
      fetchZones();
    } catch {
      toast.error('Failed to update');
    }
  };

  const inputClass =
    'w-full px-4 py-3 border border-gray-200 rounded-xl ' +
    'focus:outline-none focus:ring-2 focus:ring-purple-500 ' +
    'text-gray-900 bg-white';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Shipping
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Customers pick one of these delivery options at checkout
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-purple-600
            text-white px-4 py-2.5 rounded-xl text-sm
            font-semibold hover:bg-purple-700 transition-colors">
          <Plus size={16} />
          Add Option
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100
        rounded-xl p-4 text-sm text-blue-700 space-y-1">
        <p>
          💡 <strong>How it works:</strong> name each option after the
          areas it covers, for example{' '}
          <em>&quot;Ikotun, Egbeda, Ipaja&quot;</em>, and give it a fee.
          Tick the states it applies to. One option can cover several
          states, like <em>&quot;Western States&quot;</em>.
        </p>
        <p>
          Add a <strong>Store Pickup</strong> option for customers who
          collect from you. Put your pickup address in the description.
        </p>
      </div>

      {showForm && (
        <div className="bg-purple-50 border border-purple-200
          rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">
              {editing ? 'Edit delivery option' : 'New delivery option'}
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
                Name (shown to customers) *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="e.g. Ikotun, Egbeda, Ipaja, Ayobo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-2">
                Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={`p-3 rounded-xl border-2 text-left
                      transition-all ${
                        form.type === t.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 bg-white hover:border-purple-300'
                      }`}>
                    <p className="font-medium text-gray-900 text-sm">
                      {t.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {form.type === 0 && (
              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-1.5">
                  Fee (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.fee}
                  onChange={(e) => setForm({ ...form, fee: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. 2500"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  States this option applies to
                </label>
                <div className="flex gap-3 text-xs font-medium">
                  <button type="button"
                    onClick={() => setForm({ ...form, states: [...NIGERIAN_STATES] })}
                    className="text-purple-600 hover:underline">
                    Select all
                  </button>
                  <button type="button"
                    onClick={() => setForm({ ...form, states: [] })}
                    className="text-gray-500 hover:underline">
                    Clear
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5
                max-h-56 overflow-y-auto p-3 bg-white rounded-xl
                border border-gray-200">
                {NIGERIAN_STATES.map(s => (
                  <label key={s}
                    className="flex items-center gap-2 text-sm
                      text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.states.includes(s)}
                      onChange={() => toggleState(s)}
                      className="w-4 h-4 accent-purple-600"
                    />
                    {s}
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {form.states.length === 0
                  ? 'No state ticked: this option is offered in every state.'
                  : `${form.states.length} state${form.states.length !== 1 ? 's' : ''} ticked.`}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1.5">
                {form.type === 4
                  ? 'Pickup address'
                  : 'Extra details (optional)'}
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={inputClass}
                placeholder={form.type === 4
                  ? 'e.g. 160b Ipaja Road, Baruwa'
                  : 'e.g. Doorstep delivery'}
              />
            </div>

            {form.type !== 4 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium
                    text-gray-700 mb-1.5">
                    Min days
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.estimatedDaysMin}
                    onChange={(e) => setForm({ ...form, estimatedDaysMin: e.target.value })}
                    className={inputClass}
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium
                    text-gray-700 mb-1.5">
                    Max days
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.estimatedDaysMax}
                    onChange={(e) => setForm({ ...form, estimatedDaysMax: e.target.value })}
                    className={inputClass}
                    placeholder="3"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3
              bg-white rounded-xl border border-gray-200">
              <input
                type="checkbox"
                id="zoneActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 accent-purple-600"
              />
              <label htmlFor="zoneActive"
                className="text-sm text-gray-700 cursor-pointer">
                Option is active
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
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

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
          <Truck size={48} className="text-gray-300 mx-auto mb-4"/>
          <h3 className="font-bold text-gray-700 text-lg mb-2">
            No delivery options yet
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            Add an option so customers can choose how to receive their order
          </p>
          <button
            onClick={openCreate}
            className="bg-purple-600 text-white px-6 py-3
              rounded-xl font-semibold hover:bg-purple-700
              transition-colors">
            Add the first option
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
                flex items-center justify-center shrink-0
                ${zone.isActive ? 'bg-purple-100' : 'bg-gray-100'}`}>
                <Truck size={16} className={
                  zone.isActive ? 'text-purple-600' : 'text-gray-400'
                }/>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">
                    {zone.name}
                  </h3>
                  {zone.type === 'Pickup' && (
                    <span className="px-2 py-0.5 bg-blue-50
                      text-blue-600 text-xs rounded-full">
                      Pickup
                    </span>
                  )}
                  {!zone.isActive && (
                    <span className="px-2 py-0.5 bg-gray-100
                      text-gray-500 text-xs rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-purple-600">
                  📍 {statesLabel(zone)}
                  {zone.city ? ` · area: ${zone.city}` : ''}
                </p>
                {zone.description && (
                  <p className="text-sm text-gray-400">
                    {zone.description}
                  </p>
                )}
                {zone.type !== 'Pickup' && zone.deliveryEstimate && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    🕐 {zone.deliveryEstimate}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-purple-600">
                  {zone.type === 'Pickup' || zone.type === 'FreeShipping' || zone.fee === 0
                    ? 'FREE'
                    : `₦${zone.fee.toLocaleString()}`}
                </p>
                <p className="text-xs text-gray-400">
                  {zone.type}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(zone)}
                  className="text-gray-400 hover:text-purple-600
                    transition-colors">
                  {zone.isActive
                    ? <ToggleRight size={24} className="text-purple-600"/>
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