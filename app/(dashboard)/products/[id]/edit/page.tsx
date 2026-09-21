'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Trash2,
  Eye, EyeOff, Upload, X, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Product, Category } from '@/types';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
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
    if (params.id) {
      fetchProduct();
      fetchCategories();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${params.id}`);
      const p: Product = res.data.data;
      setProduct(p);
      setForm({
        name: p.name,
        description: p.description ?? '',
        price: p.price.toString(),
        compareAtPrice: p.compareAtPrice?.toString() ?? '',
        stockQuantity: p.stockQuantity.toString(),
        trackInventory: p.trackInventory,
        isDigital: p.isDigital,
        isPublished: p.isPublished,
        sku: p.sku ?? '',
        tags: p.tags ?? '',
        categoryId: p.categoryId ?? '',
        weight: p.variants?.[0]?.toString() ?? '',
      });
    } catch {
      toast.error('Product not found');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data ?? []);
    } catch {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error('Name and price are required');
      return;
    }
    setSaving(true);
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

      await api.put(`/products/${params.id}`, payload);
      toast.success('Product updated! ✅');
      fetchProduct();
    } catch (error: any) {
      toast.error(error.response?.data?.message
        || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };
const formatPrice = (price: number) =>
  `₦${price.toLocaleString()}`;

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('isPrimary',
        (product?.images.length === 0).toString()
      );

      const res = await api.post(
        `/upload/products/${params.id}/images`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      toast.success('Image uploaded! 🖼️');
      fetchProduct();
    } catch (error: any) {
      toast.error(error.response?.data?.message
        || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const deleteImage = async (imageId: string) => {
    try {
      await api.delete(
        `/products/${params.id}/images/${imageId}`
      );
      toast.success('Image removed');
      fetchProduct();
    } catch {
      toast.error('Failed to remove image');
    }
  };

  const setPrimaryImage = async (imageId: string) => {
    try {
      await api.post(
        `/products/${params.id}/images`,
        { imageUrl: '', isPrimary: true }
      );
      fetchProduct();
    } catch {}
  };

  const togglePublish = async () => {
    try {
      await api.put(`/products/${params.id}/toggle-publish`);
      toast.success(
        product?.isPublished
          ? 'Product hidden from store'
          : 'Product published! 🎉'
      );
      router.push('/products');
      fetchProduct();
    } catch {
      toast.error('Failed to update');
      
    }
  };

  const handleDelete = async () => {
    if (!confirm(
      `Delete "${product?.name}"? This cannot be undone.`
    )) return;

    setDeleting(true);
    try {
      await api.delete(`/products/${params.id}`);
      toast.success('Product deleted');
      router.push('/products');
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl
            border border-gray-100 animate-pulse h-32"/>
        ))}
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/products"
            className="p-2 rounded-xl hover:bg-gray-100
              transition-colors text-gray-600">
            <ArrowLeft size={20}/>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Edit Product
            </h1>
            <p className="text-gray-500 text-sm truncate
              max-w-xs">
              {product.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={togglePublish}
            className={`flex items-center gap-2 px-3 py-2
              rounded-xl text-sm font-medium transition-colors
              ${product.isPublished
                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
            {product.isPublished
              ? <><Eye size={14}/> Published</>
              : <><EyeOff size={14}/> Draft</>
            }
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-xl bg-red-50 text-red-500
              hover:bg-red-100 transition-colors">
            <Trash2 size={16}/>
          </button>
        </div>
      </div>

      {/* Product Images */}
      <div className="bg-white rounded-2xl border
        border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">
            Product Images
          </h2>
          <label className={`flex items-center gap-2 px-4 py-2
            rounded-xl text-sm font-medium cursor-pointer
            transition-colors
            ${uploadingImage
              ? 'bg-gray-100 text-gray-400'
              : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}>
            {uploadingImage
              ? 'Uploading...'
              : <><Upload size={14}/> Add Image</>
            }
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
          </label>
        </div>

        {product.images.length === 0 ? (
          <label className="border-2 border-dashed
            border-gray-200 rounded-xl p-8 text-center
            cursor-pointer hover:border-purple-300
            transition-colors block">
            <Upload size={32}
              className="text-gray-300 mx-auto mb-2"/>
            <p className="text-gray-400 text-sm">
              Click to upload product images
            </p>
            <p className="text-gray-300 text-xs mt-1">
              JPG, PNG, WebP — max 5MB
            </p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4
            gap-3">
            {product.images
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((image) => (
              <div key={image.id}
                className="relative group aspect-square
                  rounded-xl overflow-hidden border-2
                  transition-all
                  border-gray-100 hover:border-purple-300">
                <img
                  src={image.url}
                  alt="Product"
                  className="w-full h-full object-cover"
                />
                {image.isPrimary && (
                  <div className="absolute top-1 left-1
                    px-1.5 py-0.5 bg-purple-600 text-white
                    text-xs rounded-md font-medium">
                    Main
                  </div>
                )}
                <div className="absolute inset-0
                  bg-black/40 opacity-0 group-hover:opacity-100
                  transition-opacity flex items-center
                  justify-center gap-2">
                  <button
                    onClick={() => deleteImage(image.id)}
                    className="p-1.5 bg-red-500 text-white
                      rounded-lg hover:bg-red-600">
                    <X size={14}/>
                  </button>
                </div>
              </div>
            ))}

            {/* Add more images */}
            <label className="aspect-square border-2
              border-dashed border-gray-200 rounded-xl
              flex items-center justify-center cursor-pointer
              hover:border-purple-300 transition-colors">
              <div className="text-center">
                <Plus size={20}
                  className="text-gray-300 mx-auto"/>
                <p className="text-xs text-gray-300 mt-1">
                  Add
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>
        )}
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSave} className="space-y-5">

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

          <div>
            <label className="block text-sm font-medium
              text-gray-700 mb-1.5">
              Tags
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
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-white rounded-2xl border
          border-gray-100 p-6 space-y-5">
          <h2 className="font-bold text-gray-900">
            Inventory
          </h2>

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
                SKU
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
              This is a digital product
            </label>
          </div>
        </div>

        {/* Visibility */}
        <div className="bg-white rounded-2xl border
          border-gray-100 p-5">
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

        {/* Product Stats */}
        <div className="bg-white rounded-2xl border
          border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-4">
            Product Stats
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-purple-50
              rounded-xl">
              <p className="text-2xl font-bold text-purple-600">
                {product.salesCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Total Sales
              </p>
            </div>
            <div className="text-center p-3 bg-blue-50
              rounded-xl">
              <p className="text-2xl font-bold text-blue-600">
                {product.stockQuantity}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                In Stock
              </p>
            </div>
            <div className="text-center p-3 bg-green-50
              rounded-xl">
              <p className="text-2xl font-bold text-green-600">
                {product.images.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Images
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3 pb-8">
          <Link href="/products"
            className="flex-1 text-center py-3 border-2
              border-gray-200 text-gray-600 rounded-xl
              font-semibold hover:border-gray-300
              transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center
              gap-2 bg-purple-600 text-white py-3 rounded-xl
              font-semibold hover:bg-purple-700 disabled:opacity-50
              transition-colors">
            <Save size={16}/>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}