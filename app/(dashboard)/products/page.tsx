'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Filter,
  Eye, EyeOff, Edit, Trash2,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Product } from '@/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products/my-products');
      setProducts(res.data.data?.products ?? []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (id: string, name: string) => {
    try {
      await api.put(`/products/${id}/toggle-publish`);
      await fetchProducts();
      toast.success(`${name} updated!`);
    } catch {
      toast.error('Failed to update product');
    }
  };

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`))
      return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success(`${name} deleted`);
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase()
      .includes(search.toLowerCase());
    if (filter === 'published') return matchSearch && p.isPublished;
    if (filter === 'draft') return matchSearch && !p.isPublished;
    if (filter === 'low') return matchSearch &&
      p.trackInventory && p.stockQuantity <= 5;
    return matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Products
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {products.length} total products
          </p>
        </div>
        <Link href="/products/new"
          className="flex items-center gap-2 bg-purple-600
            text-white px-4 py-2.5 rounded-xl text-sm
            font-semibold hover:bg-purple-700 transition-colors">
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2
            -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border
              border-gray-200 rounded-xl text-sm
              focus:outline-none focus:ring-2
              focus:ring-purple-500 bg-white"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'published', 'draft', 'low'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm
                font-medium transition-colors capitalize
                ${filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'
                }`}>
              {f === 'low' ? 'Low Stock' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2
          lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl
              border border-gray-100 animate-pulse h-64" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border
          border-gray-100 p-16 text-center">
          <Package size={48} className="text-gray-300
            mx-auto mb-4" />
          <h3 className="font-bold text-gray-700 text-lg mb-2">
            {search ? 'No products found' : 'No products yet'}
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            {search
              ? 'Try a different search term'
              : 'Add your first product to start selling'
            }
          </p>
          {!search && (
            <Link href="/products/new"
              className="bg-purple-600 text-white px-6 py-3
                rounded-xl font-semibold hover:bg-purple-700
                transition-colors inline-block">
              Add First Product
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2
          lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <div key={product.id}
              className="bg-white rounded-2xl border
                border-gray-100 overflow-hidden hover:shadow-md
                transition-shadow group">

              {/* Image */}
              <div className="aspect-square bg-gray-50
                relative overflow-hidden">
                {product.images[0] ? (
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    className="w-full h-full object-cover
                      group-hover:scale-105 transition-transform
                      duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center
                    justify-center">
                    <Package size={40}
                      className="text-gray-300" />
                  </div>
                )}

                {/* Status badge */}
                <div className={`absolute top-2 left-2 px-2
                  py-0.5 rounded-full text-xs font-medium
                  ${product.isPublished
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                  {product.isPublished ? 'Published' : 'Draft'}
                </div>

                {/* Stock badge */}
                {product.trackInventory &&
                  product.stockQuantity <= 5 && (
                  <div className="absolute top-2 right-2 px-2
                    py-0.5 rounded-full text-xs font-medium
                    bg-red-100 text-red-600">
                    {product.stockQuantity === 0
                      ? 'Out of stock'
                      : `${product.stockQuantity} left`
                    }
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900
                  text-sm truncate mb-1">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-purple-600 font-bold text-sm">
                    ₦{product.price.toLocaleString()}
                  </p>
                  {product.compareAtPrice && (
                    <p className="text-gray-400 text-xs
                      line-through">
                      ₦{product.compareAtPrice.toLocaleString()}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  {product.salesCount} sold •{' '}
                  {product.stockQuantity} in stock
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => togglePublish(
                      product.id, product.name
                    )}
                    className={`flex-1 flex items-center
                      justify-center gap-1.5 py-2 rounded-lg
                      text-xs font-medium transition-colors
                      ${product.isPublished
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                      }`}>
                    {product.isPublished
                      ? <><EyeOff size={12} /> Hide</>
                      : <><Eye size={12} /> Publish</>
                    }
                  </button>
                  <Link
                    href={`/products/${product.id}/edit`}
                    className="p-2 rounded-lg bg-blue-50
                      text-blue-600 hover:bg-blue-100
                      transition-colors">
                    <Edit size={14} />
                  </Link>
                  <button
                    onClick={() => deleteProduct(
                      product.id, product.name
                    )}
                    className="p-2 rounded-lg bg-red-50
                      text-red-500 hover:bg-red-100
                      transition-colors">
                    <Trash2 size={14} />
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