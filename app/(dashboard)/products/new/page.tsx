'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Category } from '@/types';
import AIProductDescriptionGenerator from '@/components/AIProductDescriptionGenerator';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data ?? []);
    } catch {}
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const validFiles = files.filter(f => {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} is too large. Max 5MB.`);
        return false;
      }
      return true;
    });

    setImages(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error('Name and price are required');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/products', {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        compareAtPrice: form.compareAtPrice
          ? parseFloat(form.compareAtPrice) : null,
        stockQuantity: parseInt(form.stockQuantity || '0'),
        trackInventory: form.trackInventory,
        isDigital: form.isDigital,
        isPublished: form.isPublished,
        sku: form.sku || null,
        tags: form.tags || null,
        categoryId: form.categoryId || null,
        weight: form.weight ? parseFloat(form.weight) : null,
      });

      const productId = res.data.data?.id;

      if (productId && images.length > 0) {
        for (const image of images) {
          const fd = new FormData();
          fd.append('file', image);
          try {
            await api.post(
              `/upload/products/${productId}/images`,
              fd,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
          } catch {
            toast.error(`Failed to upload ${image.name}`);
          }
        }
      }

      toast.success('Product created!');
      router.push('/products');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to create product'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/products"
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-500 text-sm">Fill in the details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
{/* AI Generator — add before the images section */}
<div className=" bg-linear-to-r from-purple-50 to-indigo-50
  rounded-2xl border border-purple-100 p-5">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="font-bold text-gray-900 flex items-center gap-2">
        ✨ AI Product Description
      </h3>
      <p className="text-sm text-gray-500 mt-0.5">
        Upload a photo and let AI generate your product details
      </p>
    </div>
    <AIProductDescriptionGenerator
      onApply={(data) => {
        setForm(prev => ({
          ...prev,
          name: data.name,
          description: data.description,
          tags: data.tags,
        }));
        toast.success('AI description applied!');
      }}
    />
  </div>
</div>
        {/* Images */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4">Product Images</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
            {imagePreviews.map((preview, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                <img src={preview} alt={`Preview ${i+1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={12} />
                </button>
                
                {i === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-purple-600 text-white text-xs text-center py-0.5 font-medium">
                    Main
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-400 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer bg-gray-50 hover:bg-purple-50">
              <Plus size={20} className="text-gray-400" />
              <span className="text-xs text-gray-400">Add Photo</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
          <p className="text-xs text-gray-400">
            Upload up to 10 images. First image is the main photo. Max 5MB each.
          </p>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-900">Basic Information</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Red Ankara Dress"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your product..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
              value={form.categoryId}
              onChange={e => setForm({ ...form, categoryId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white">
              <option value="">No category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-900">Pricing</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Price (N) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Compare At Price (N)
              </label>
              <input
                type="number"
                value={form.compareAtPrice}
                onChange={e => setForm({ ...form, compareAtPrice: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Set a compare price to show a discount (e.g. original price crossed out)
          </p>
        </div>

        {/* Inventory */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-900">Inventory</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Quantity</label>
              <input
                type="number"
                value={form.stockQuantity}
                onChange={e => setForm({ ...form, stockQuantity: e.target.value })}
                min="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={e => setForm({ ...form, sku: e.target.value })}
                placeholder="e.g. SKU-001"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="trackInventory"
              checked={form.trackInventory}
              onChange={e => setForm({ ...form, trackInventory: e.target.checked })}
              className="w-4 h-4 accent-purple-600"
            />
            <label htmlFor="trackInventory" className="text-sm text-gray-700">
              Track inventory for this product
            </label>
          </div>
        </div>

        {/* Additional */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-900">Additional Details</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
            <input
              type="text"
              value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })}
              placeholder="e.g. fashion, ankara, women"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            />
            <p className="text-xs text-gray-400 mt-1">Separate tags with commas</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isDigital"
              checked={form.isDigital}
              onChange={e => setForm({ ...form, isDigital: e.target.checked })}
              className="w-4 h-4 accent-purple-600"
            />
            <label htmlFor="isDigital" className="text-sm text-gray-700">
              This is a digital product
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors">
            {loading ? 'Creating...' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(prev => ({ ...prev, isPublished: true }));
              setTimeout(() => {
                document.querySelector('form')?.requestSubmit();
              }, 100);
            }}
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">
            {loading ? 'Publishing...' : 'Create & Publish'}
          </button>
        </div>

        <Link href="/products"
          className="block text-center text-sm text-gray-400 hover:text-gray-600 pb-4">
          Cancel and go back
        </Link>
      </form>
    </div>
  );
}