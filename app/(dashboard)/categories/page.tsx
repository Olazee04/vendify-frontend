'use client';
import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Tag, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Category } from '@/types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    sortOrder: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data ?? []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', sortOrder: 0 });
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description ?? '',
      sortOrder: cat.sortOrder,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, form);
        toast.success('Category updated! ✅');
      } else {
        await api.post('/categories', form);
        toast.success('Category created! 🎉');
      }
      setShowForm(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message
        || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(
      `Delete "${name}"? Products in this category will be uncategorized.`
    )) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success(`"${name}" deleted`);
    } catch {
      toast.error('Failed to delete category');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Categories
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Organise your products into categories
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-purple-600
            text-white px-4 py-2.5 rounded-xl text-sm
            font-semibold hover:bg-purple-700 transition-colors">
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-purple-50 border border-purple-200
          rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">
              {editing ? 'Edit Category' : 'New Category'}
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
                  Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({
                    ...form, name: e.target.value
                  })}
                  className="w-full px-4 py-3 border
                    border-gray-200 rounded-xl focus:outline-none
                    focus:ring-2 focus:ring-purple-500
                    text-gray-900 bg-white"
                  placeholder="e.g. Women's Fashion"
                />
              </div>
              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-1.5">
                  Sort Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => setForm({
                    ...form, sortOrder: parseInt(e.target.value)
                  })}
                  className="w-full px-4 py-3 border
                    border-gray-200 rounded-xl focus:outline-none
                    focus:ring-2 focus:ring-purple-500
                    text-gray-900 bg-white"
                />
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
                placeholder="Optional description"
              />
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
                  font-semibold hover:bg-purple-700 disabled:opacity-50
                  transition-colors">
                <Check size={16} />
                {saving ? 'Saving...' : editing
                  ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl
              border border-gray-100 animate-pulse h-20" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border
          border-gray-100 p-16 text-center">
          <Tag size={48} className="text-gray-300 mx-auto mb-4"/>
          <h3 className="font-bold text-gray-700 text-lg mb-2">
            No categories yet
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            Categories help customers find products easily
          </p>
          <button
            onClick={openCreate}
            className="bg-purple-600 text-white px-6 py-3
              rounded-xl font-semibold hover:bg-purple-700
              transition-colors">
            Create First Category
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id}
              className="bg-white rounded-xl border
                border-gray-100 p-4 flex items-center gap-4
                hover:border-purple-200 hover:shadow-sm
                transition-all">

              {/* Icon */}
              <div className="w-10 h-10 bg-purple-100 rounded-xl
                flex items-center justify-center flex-shrink-0">
                <Tag size={16} className="text-purple-600" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">
                    {cat.name}
                  </h3>
                  <span className="px-2 py-0.5 bg-gray-100
                    text-gray-500 text-xs rounded-full">
                    {cat.productCount} products
                  </span>
                </div>
                {cat.description && (
                  <p className="text-sm text-gray-400 truncate mt-0.5">
                    {cat.description}
                  </p>
                )}
              </div>

              {/* Sort Order */}
              <div className="text-center hidden sm:block">
                <p className="text-xs text-gray-400">Order</p>
                <p className="font-semibold text-gray-600">
                  {cat.sortOrder}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-2 rounded-lg bg-blue-50
                    text-blue-600 hover:bg-blue-100
                    transition-colors">
                  <Edit size={15} />
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="p-2 rounded-lg bg-red-50
                    text-red-500 hover:bg-red-100
                    transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}