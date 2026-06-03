'use client';
import { useEffect, useState } from 'react';
import {
  Search, AlertTriangle, Package,
  Plus, Minus, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { InventoryItem } from '@/types';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Purchase');

  useEffect(() => {
    fetchInventory();
  }, [filter]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      let url = '/inventory';
      if (filter === 'low') url = '/inventory/low-stock';
      if (filter === 'out') url = '/inventory/out-of-stock';
      const res = await api.get(url);
      setItems(res.data.data ?? []);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async (productId: string, add: boolean) => {
    const qty = parseInt(adjustQty);
    if (!qty || qty <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }

    try {
      await api.post('/inventory/adjust', {
        productId,
        quantity: add ? qty : -qty,
        reason: adjustReason,
      });
      toast.success('Stock updated successfully!');
      setAdjusting(null);
      setAdjustQty('');
      fetchInventory();
    } catch (error: any) {
      toast.error(error.response?.data?.message
        || 'Failed to adjust stock');
    }
  };

  const filtered = items.filter(item =>
    item.productName.toLowerCase()
      .includes(search.toLowerCase()) ||
    (item.sku?.toLowerCase().includes(search.toLowerCase()))
  );

  const stockStatusColor: Record<string, string> = {
    'In Stock': 'bg-green-100 text-green-700',
    'Low Stock': 'bg-amber-100 text-amber-700',
    'Out of Stock': 'bg-red-100 text-red-700',
    'Not Tracked': 'bg-gray-100 text-gray-600',
  };

  const lowCount = items.filter(
    i => i.stockStatus === 'Low Stock'
  ).length;
  const outCount = items.filter(
    i => i.stockStatus === 'Out of Stock'
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventory
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage your product stock levels
          </p>
        </div>
        <button
          onClick={fetchInventory}
          className="flex items-center gap-2 px-4 py-2.5
            border border-gray-200 text-gray-600 rounded-xl
            text-sm font-medium hover:bg-gray-50
            transition-colors">
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border
          border-gray-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl
            flex items-center justify-center">
            <Package size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {items.filter(
                i => i.stockStatus === 'In Stock'
              ).length}
            </p>
            <p className="text-sm text-gray-500">In Stock</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border
          border-amber-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl
            flex items-center justify-center">
            <AlertTriangle size={18}
              className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {lowCount}
            </p>
            <p className="text-sm text-gray-500">Low Stock</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border
          border-red-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl
            flex items-center justify-center">
            <Package size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {outCount}
            </p>
            <p className="text-sm text-gray-500">Out of Stock</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2
            -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border
              border-gray-200 rounded-xl text-sm
              focus:outline-none focus:ring-2
              focus:ring-purple-500 bg-white"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'low', label: '⚠️ Low Stock' },
            { key: 'out', label: '❌ Out of Stock' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2.5 rounded-xl text-sm
                font-medium transition-colors whitespace-nowrap
                ${filter === f.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600'
                }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl
              border border-gray-100 animate-pulse h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border
          border-gray-100 p-16 text-center">
          <Package size={48} className="text-gray-300
            mx-auto mb-4" />
          <p className="font-bold text-gray-700">
            No items found
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border
          border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3.5 text-xs
                  font-semibold text-gray-500 uppercase">
                  Product
                </th>
                <th className="text-left px-5 py-3.5 text-xs
                  font-semibold text-gray-500 uppercase">
                  SKU
                </th>
                <th className="text-left px-5 py-3.5 text-xs
                  font-semibold text-gray-500 uppercase">
                  Stock
                </th>
                <th className="text-left px-5 py-3.5 text-xs
                  font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-left px-5 py-3.5 text-xs
                  font-semibold text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-5 py-3.5 text-xs
                  font-semibold text-gray-500 uppercase">
                  Adjust
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => (
                <>
                  <tr key={item.productId}
                    className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img src={item.imageUrl}
                            alt={item.productName}
                            className="w-9 h-9 rounded-lg
                              object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 bg-gray-100
                            rounded-lg flex items-center
                            justify-center flex-shrink-0">
                            <Package size={14}
                              className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900
                            text-sm">
                            {item.productName}
                          </p>
                          {item.categoryName && (
                            <p className="text-xs text-gray-400">
                              {item.categoryName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-500
                        font-mono">
                        {item.sku || '—'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className={`text-xl font-bold
                        ${item.currentStock === 0
                          ? 'text-red-500'
                          : item.currentStock <= 5
                            ? 'text-amber-500'
                            : 'text-gray-900'
                        }`}>
                        {item.currentStock}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full
                        text-xs font-medium ${
                          stockStatusColor[item.stockStatus]
                          ?? 'bg-gray-100 text-gray-600'
                        }`}>
                        {item.stockStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900
                        text-sm">
                        ₦{item.price.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setAdjusting(
                          adjusting === item.productId
                            ? null
                            : item.productId
                        )}
                        className="px-3 py-1.5 rounded-lg
                          bg-purple-50 text-purple-600 text-xs
                          font-medium hover:bg-purple-100
                          transition-colors">
                        Adjust
                      </button>
                    </td>
                  </tr>

                  {/* Adjust Panel */}
                  {adjusting === item.productId && (
                    <tr key={`adj-${item.productId}`}>
                      <td colSpan={6} className="px-5 py-4
                        bg-purple-50 border-b border-purple-100">
                        <div className="flex items-center
                          gap-3 flex-wrap">
                          <p className="text-sm font-medium
                            text-purple-900">
                            Adjust stock for{' '}
                            <strong>{item.productName}</strong>
                          </p>
                          <input
                            type="number"
                            min="1"
                            value={adjustQty}
                            onChange={(e) =>
                              setAdjustQty(e.target.value)
                            }
                            placeholder="Quantity"
                            className="w-28 px-3 py-2 border
                              border-purple-200 rounded-lg text-sm
                              focus:outline-none focus:ring-2
                              focus:ring-purple-500 bg-white"
                          />
                          <select
                            value={adjustReason}
                            onChange={(e) =>
                              setAdjustReason(e.target.value)
                            }
                            className="px-3 py-2 border
                              border-purple-200 rounded-lg text-sm
                              focus:outline-none bg-white">
                            <option>Purchase</option>
                            <option>Return</option>
                            <option>Damaged</option>
                            <option>Correction</option>
                          </select>
                          <button
                            onClick={() => handleAdjust(
                              item.productId, true
                            )}
                            className="flex items-center gap-1.5
                              px-3 py-2 bg-green-600 text-white
                              rounded-lg text-sm font-medium
                              hover:bg-green-700">
                            <Plus size={14} /> Add
                          </button>
                          <button
                            onClick={() => handleAdjust(
                              item.productId, false
                            )}
                            className="flex items-center gap-1.5
                              px-3 py-2 bg-red-500 text-white
                              rounded-lg text-sm font-medium
                              hover:bg-red-600">
                            <Minus size={14} /> Remove
                          </button>
                          <button
                            onClick={() => setAdjusting(null)}
                            className="px-3 py-2 border
                              border-gray-300 text-gray-600
                              rounded-lg text-sm hover:bg-gray-100">
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}