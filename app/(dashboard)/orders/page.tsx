'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Eye, Package } from 'lucide-react';
import { exportOrdersToCSV } from '@/lib/exportUtils';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Order } from '@/types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
const [bulkUpdating, setBulkUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const params: any = {};
      if (filter !== 'all') params.status = filter;
      const res = await api.get('/orders', { params });
      setOrders(res.data.data?.orders ?? []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };
// Add bulk update function:
const bulkUpdateStatus = async (status: number, label: string) => {
  if (selectedOrders.length === 0) return;
  setBulkUpdating(true);
  let success = 0;
  for (const orderId of selectedOrders) {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      success++;
    } catch {}
  }
  toast.success(
    `${success} orders marked as ${label}`
  );
  setSelectedOrders([]);
  fetchOrders();
  setBulkUpdating(false);
};

  const updateStatus = async (
    id: string, status: number, label: string
  ) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      toast.success(`Order marked as ${label}`);
      fetchOrders();
    } catch {
      toast.error('Failed to update order');
    }
  };

  const filtered = orders.filter(o =>
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.customerEmail.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-700',
    Confirmed: 'bg-blue-100 text-blue-700',
    Processing: 'bg-purple-100 text-purple-700',
    Shipped: 'bg-indigo-100 text-indigo-700',
    Delivered: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

  const paymentColors: Record<string, string> = {
    Unpaid: 'bg-red-100 text-red-600',
    Paid: 'bg-green-100 text-green-600',
    Failed: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Orders
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {orders.length} total orders
          </p>
        </div>
      </div>

<div className="flex items-center gap-2">
  <button
    onClick={() => exportOrdersToCSV(filtered)}
    disabled={filtered.length === 0}
    className="flex items-center gap-2 px-4 py-2.5
      border border-gray-200 text-gray-600 rounded-xl
      text-sm font-medium hover:bg-gray-50
      disabled:opacity-50 transition-colors">
    <Download size={15}/>
    Export CSV
  </button>
</div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2
            -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border
              border-gray-200 rounded-xl text-sm
              focus:outline-none focus:ring-2
              focus:ring-purple-500 bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'Pending', 'Confirmed',
            'Shipped', 'Delivered'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2.5 rounded-xl text-sm
                font-medium transition-colors
                ${filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600'
                }`}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>
{selectedOrders.length > 0 && (
  <div className="flex items-center gap-3 p-3
    bg-purple-50 border border-purple-200 rounded-xl">
    <p className="text-sm font-medium text-purple-700">
      {selectedOrders.length} order(s) selected
    </p>
    <div className="flex gap-2 ml-auto">
      <button
        onClick={() => bulkUpdateStatus(1, 'Confirmed')}
        disabled={bulkUpdating}
        className="px-3 py-1.5 bg-blue-600 text-white
          rounded-lg text-xs font-medium hover:bg-blue-700
          disabled:opacity-50">
        Confirm All
      </button>
      <button
        onClick={() => bulkUpdateStatus(3, 'Shipped')}
        disabled={bulkUpdating}
        className="px-3 py-1.5 bg-indigo-600 text-white
          rounded-lg text-xs font-medium hover:bg-indigo-700
          disabled:opacity-50">
        Ship All
      </button>
      <button
        onClick={() => setSelectedOrders([])}
        className="px-3 py-1.5 border border-gray-300
          text-gray-600 rounded-lg text-xs font-medium">
        Clear
      </button>
    </div>
  </div>
)}
      {/* Orders Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl
              border border-gray-100 animate-pulse h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border
          border-gray-100 p-16 text-center">
          <Package size={48} className="text-gray-300
            mx-auto mb-4" />
          <h3 className="font-bold text-gray-700 text-lg mb-2">
            No orders found
          </h3>
          <p className="text-gray-400 text-sm">
            {search
              ? 'Try a different search'
              : 'Orders will appear here when customers buy'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border
          border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100
                  bg-gray-50">
                  <th className="text-left px-5 py-3.5 text-xs
                    font-semibold text-gray-500 uppercase">
                    Order
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs
                    font-semibold text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs
                    font-semibold text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs
                    font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs
                    font-semibold text-gray-500 uppercase">
                    Payment
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs
                    font-semibold text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-5 py-3.5 text-xs
                    font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                                     // In the table header row, add a checkbox column:
<th className="px-5 py-3.5">
  <input
    type="checkbox"
    onChange={(e) => {
      if (e.target.checked) {
        setSelectedOrders(filtered.map(o => o.id));
      } else {
        setSelectedOrders([]);
      }
    }}
    checked={
      selectedOrders.length === filtered.length &&
      filtered.length > 0
    }
    className="w-4 h-4 accent-purple-600"
  />
</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order) => (
                  <tr key={order.id}
                    className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900
                        text-sm">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-400">
                        {order.items.length} item(s)
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800
                        text-sm">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {order.customerPhone}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900 text-sm">
                        ₦{order.total.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full
                        text-xs font-medium ${
                          statusColors[order.status]
                          ?? 'bg-gray-100 text-gray-600'
                        }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full
                        text-xs font-medium ${
                          paymentColors[order.paymentStatus]
                          ?? 'bg-gray-100 text-gray-600'
                        }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt)
                          .toLocaleDateString('en-NG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                      </p>
                    </td>
<td className="px-5 py-4">
  <input
    type="checkbox"
    checked={selectedOrders.includes(order.id)}
    onChange={(e) => {
      if (e.target.checked) {
        setSelectedOrders(prev => [...prev, order.id]);
      } else {
        setSelectedOrders(prev =>
          prev.filter(id => id !== order.id)
        );
      }
    }}
    className="w-4 h-4 accent-purple-600"
    onClick={(e) => e.stopPropagation()}
  />
</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center
                        gap-2 justify-center">
                        <Link
                          href={`/orders/${order.id}`}
                          className="p-1.5 rounded-lg bg-gray-100
                            text-gray-600 hover:bg-purple-100
                            hover:text-purple-600 transition-colors">
                          <Eye size={14} />
                        </Link>
                        {order.status === 'Pending' && (
                          <button
                            onClick={() => updateStatus(
                              order.id, 1, 'Confirmed'
                            )}
                            className="px-2 py-1 rounded-lg
                              bg-blue-50 text-blue-600 text-xs
                              font-medium hover:bg-blue-100">
                            Confirm
                          </button>
                        )}
                        {order.status === 'Confirmed' && (
                          <button
                            onClick={() => updateStatus(
                              order.id, 3, 'Shipped'
                            )}
                            className="px-2 py-1 rounded-lg
                              bg-indigo-50 text-indigo-600
                              text-xs font-medium
                              hover:bg-indigo-100">
                            Ship
                          </button>
                        )}
                        {order.status === 'Shipped' && (
                          <button
                            onClick={() => updateStatus(
                              order.id, 4, 'Delivered'
                            )}
                            className="px-2 py-1 rounded-lg
                              bg-green-50 text-green-600 text-xs
                              font-medium hover:bg-green-100">
                            Delivered
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}