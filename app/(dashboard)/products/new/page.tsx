'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Category } from '@/types';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    compareAtPrice: '',
    stockQuantity: '0',
    trackInventory: true,
    isDigital: false,
    isPublished: false,
    sku: '',
    tags: '',
    categoryId: '',
    weight: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data ?? []);
    } catch {
      // categories optional
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error('Name and price are required');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        stockQuantity: parseInt(form.stockQuantity),
        trackInventory: form.trackInventory,
        isDigital: form.isDigital,
        isPublished: form.isPublished,
      };

      if (form.compareAtPrice)
        payload.compareAtPrice = parseFloat(form.compareAtPrice);
      if (form.sku) payload.sku = form.sku;
      if (form.tags) payload.tags = form.tags;
      if (form.categoryId) payload.categoryId = form.categoryId;
      if (form.weight) payload.weight = parseFloat(form.weight);

      const res = await api.post('/products', payload);
      toast.success('Product created successfully! 🎉');
      router.push(`/products/${res.data.data.id}/edit`);
    } catch (error: any) {
      toast.error(error.response?.data?.message
        || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/products"
          className="p-2 rounded-xl hover:bg-gray-100
            transition-colors text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Add New Product
          </h1>
          <p className="text-gray-500 text-sm">
            Fill in the details below
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic Info */}
        <div className="bg-white rounded-2xl border
          border-gray-100 p-6 space-y-5">
          <h2 className="font-bold text-gray-900">
            Basic Information
          </h2>

          <div>
            <label className="block text-sm font-medium
              text-gray-700 mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({
                ...form, name: e.target.value
              })}
              className="w-full px-4 py-3 border border-gray-200
                rounded-xl focus:outline-none focus:ring-2
                focus:ring-purple-500 text-gray-900"
              placeholder="e.g. Red Ankara Dress"
            />
          </div>

          <div>
            <label className="block text-sm font-medium
              text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({
                ...form, description: e.target.value
              })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200
                rounded-xl focus:outline-none focus:ring-2
                focus:ring-purple-500 text-gray-900 resize-none"
              placeholder="Describe your product..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium
              text-gray-700 mb-1.5">
              Category
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({
                ...form, categoryId: e.target.value
              })}
              className="w-full px-4 py-3 border border-gray-200
                rounded-xl focus:outline-none focus:ring-2
                focus:ring-purple-500 text-gray-900 bg-white">
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl border
          border-gray-100 p-6 space-y-5">
          <h2 className="font-bold text-gray-900">Pricing</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1.5">
                Price (₦) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({
                  ...form, price: e.target.value
                })}
                className="w-full px-4 py-3 border border-gray-200
                  rounded-xl focus:outline-none focus:ring-2
                  focus:ring-purple-500 text-gray-900"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1.5">
                Compare At Price (₦)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.compareAtPrice}
                onChange={(e) => setForm({
                  ...form, compareAtPrice: e.target.value
                })}
                className="w-full px-4 py-3 border border-gray-200
                  rounded-xl focus:outline-none focus:ring-2
                  focus:ring-purple-500 text-gray-900"
                placeholder="Original price"
              />
              <p className="text-xs text-gray-400 mt-1">
                Shows as strikethrough price
              </p>
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-white rounded-2xl border
          border-gray-100 p-6 space-y-5">
          <h2 className="font-bold text-gray-900">Inventory</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1.5">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={form.stockQuantity}
                onChange={(e) => setForm({
                  ...form, stockQuantity: e.target.value
                })}
                className="w-full px-4 py-3 border border-gray-200
                  rounded-xl focus:outline-none focus:ring-2
                  focus:ring-purple-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1.5">
                SKU (Optional)
              </label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({
                  ...form, sku: e.target.value
                })}
                className="w-full px-4 py-3 border border-gray-200
                  rounded-xl focus:outline-none focus:ring-2
                  focus:ring-purple-500 text-gray-900"
                placeholder="SKU-001"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4
            bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              id="trackInventory"
              checked={form.trackInventory}
              onChange={(e) => setForm({
                ...form, trackInventory: e.target.checked
              })}
              className="w-4 h-4 accent-purple-600"
            />
            <label htmlFor="trackInventory"
              className="text-sm text-gray-700 cursor-pointer">
              Track inventory for this product
            </label>
          </div>

          <div className="flex items-center gap-3 p-4
            bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              id="isDigital"
              checked={form.isDigital}
              onChange={(e) => setForm({
                ...form, isDigital: e.target.checked
              })}
              className="w-4 h-4 accent-purple-600"
            />
            <label htmlFor="isDigital"
              className="text-sm text-gray-700 cursor-pointer">
              This is a digital product (ebook, course, etc.)
            </label>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-2xl border
          border-gray-100 p-6 space-y-5">
          <h2 className="font-bold text-gray-900">
            Tags & Organization
          </h2>
          <div>
            <label className="block text-sm font-medium
              text-gray-700 mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({
                ...form, tags: e.target.value
              })}
              className="w-full px-4 py-3 border border-gray-200
                rounded-xl focus:outline-none focus:ring-2
                focus:ring-purple-500 text-gray-900"
              placeholder="fashion, ankara, women"
            />
          </div>
        </div>

        {/* Publish Options */}
        <div className="bg-white rounded-2xl border
          border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">
                Visibility
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {form.isPublished
                  ? 'Visible to customers'
                  : 'Hidden from customers (draft)'
                }
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm({
                ...form, isPublished: !form.isPublished
              })}
              className={`relative w-12 h-6 rounded-full
                transition-colors ${
                  form.isPublished
                    ? 'bg-purple-600'
                    : 'bg-gray-300'
                }`}>
              <div className={`absolute top-0.5 w-5 h-5
                bg-white rounded-full shadow transition-transform
                ${form.isPublished
                  ? 'translate-x-6'
                  : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link href="/products"
            className="flex-1 text-center py-3 border-2
              border-gray-200 text-gray-600 rounded-xl
              font-semibold hover:border-gray-300
              transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple-600 text-white py-3
              rounded-xl font-semibold hover:bg-purple-700
              disabled:opacity-50 transition-colors">
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}