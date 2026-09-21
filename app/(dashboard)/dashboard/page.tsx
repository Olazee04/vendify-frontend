'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, ShoppingBag, Package, Users,
  AlertTriangle, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle, Boxes, BarChart2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '@/lib/api';
import { Dashboard } from '@/types';

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      setData(res.data.data);
    } catch {
      // User may not have a store yet - show empty state
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse h-32 border border-gray-100" />
          ))}
        </div>
        <div className="bg-white rounded-2xl p-6 animate-pulse h-80 border border-gray-100" />
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Revenue',
      value: `N${(data?.totalRevenue ?? 0).toLocaleString()}`,
      sub: `N${(data?.monthRevenue ?? 0).toLocaleString()} this month`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      trend: data?.revenueGrowth ?? 0,
    },
    {
      label: 'Total Orders',
      value: data?.totalOrders ?? 0,
      sub: `${data?.monthOrders ?? 0} this month`,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      trend: data?.ordersGrowth ?? 0,
    },
    {
      label: 'Products',
      value: data?.totalProducts ?? 0,
      sub: `${data?.publishedProducts ?? 0} published`,
      icon: Package,
      color: 'text-green-600',
      bg: 'bg-green-100',
      trend: 0,
    },
    {
      label: 'Customers',
      value: data?.totalCustomers ?? 0,
      sub: `${data?.newCustomers ?? 0} new`,
      icon: Users,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      trend: 0,
    },
  ];

  const orderStats = [
    { label: 'Pending Orders', value: data?.pendingOrders ?? 0, icon: Clock, color: 'text-amber-500' },
    { label: 'Processing', value: data?.processingOrders ?? 0, icon: Package, color: 'text-blue-500' },
    { label: 'Low Stock', value: data?.lowStockProducts ?? 0, icon: AlertTriangle, color: 'text-red-500' },
    { label: 'Out of Stock', value: data?.outOfStockProducts ?? 0, icon: Boxes, color: 'text-gray-400' },
  ];

  const quickActions = [
    { label: 'Add Product', icon: Package, href: '/products/new', color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
    { label: 'View Orders', icon: ShoppingBag, href: '/orders', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
    { label: 'Check Inventory', icon: Boxes, href: '/inventory', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
    { label: 'View Analytics', icon: BarChart2, href: '/analytics', color: 'bg-green-50 text-green-600 hover:bg-green-100' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Here is what is happening with your store
          </p>
        </div>
        <Link href="/products/new"
          className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
          + Add Product
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href}
              className={`flex items-center gap-3 p-4 rounded-xl font-medium text-sm transition-colors ${action.color}`}>
              <Icon size={18} className="shrink-0" />
              {action.label}
            </Link>
          );
        })}
      </div>

      {(data?.lowStockProducts ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-amber-500 shrink-0" size={18} />
          <p className="text-amber-700 text-sm">
            <strong>{data?.lowStockProducts} products</strong> are running low on stock.{' '}
            <Link href="/inventory" className="underline font-semibold">Check inventory</Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={18} className={stat.color} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
              <div className="flex items-center gap-1 mt-2">
                {stat.trend > 0 ? (
                  <ArrowUpRight size={14} className="text-green-500" />
                ) : stat.trend < 0 ? (
                  <ArrowDownRight size={14} className="text-red-400" />
                ) : null}
                <p className="text-xs text-gray-400">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {orderStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
              <Icon size={20} className={stat.color} />
              <div>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {(data?.revenueByMonth?.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-900">Revenue Overview</h3>
              <p className="text-sm text-gray-400">Last 6 months</p>
            </div>
            <p className="text-xl font-bold text-purple-600">
              N{(data?.monthRevenue ?? 0).toLocaleString()}
              <span className="text-sm font-normal text-gray-400 ml-1">This month</span>
            </p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data?.revenueByMonth ?? []}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `N${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`N${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {(data?.recentOrders?.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Recent Orders</h3>
            <Link href="/orders" className="text-purple-600 text-sm font-medium hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data?.recentOrders?.slice(0, 5).map((order: any) => (
              <div key={order.id} className="flex items-center gap-4 p-4">
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                  <ShoppingBag size={16} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{order.customerName}</p>
                  <p className="text-xs text-gray-400">{order.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-sm">N{order.total?.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    order.status === 'Delivered' ? 'bg-green-100 text-green-600' :
                    order.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!data && (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Package size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-gray-700 text-lg mb-2">Welcome to Vendify!</h3>
          <p className="text-gray-400 text-sm mb-6">
            Set up your store to start selling
          </p>
          <Link href="/store/setup"
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors inline-block">
            Set Up My Store
          </Link>
        </div>
      )}
    </div>
  );
}