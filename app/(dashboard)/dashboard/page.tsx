'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, ShoppingBag, Package,
  Users, AlertTriangle, ArrowUpRight,
  ArrowDownRight, Clock, CheckCircle
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

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      setData(res.data.data);
    } catch {
      console.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6
              animate-pulse h-32 border border-gray-100" />
          ))}
        </div>
        <div className="bg-white rounded-2xl p-6 animate-pulse
          h-80 border border-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Here&apos;s what&apos;s happening with your store
          </p>
        </div>
        <Link href="/products/new"
          className="bg-purple-600 text-white px-4 py-2
            rounded-xl text-sm font-medium hover:bg-purple-700
            transition-colors">
          + Add Product
        </Link>
      </div>

      {/* Alert — Low Stock */}
      {(data?.lowStockProducts ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200
          rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle
            className="text-amber-500 flex-shrink-0" size={18}/>
          <p className="text-amber-700 text-sm">
            <strong>{data?.lowStockProducts} products</strong> are
            running low on stock.{' '}
            <Link href="/inventory"
              className="underline font-semibold">
              Check inventory →
            </Link>
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₦${(data?.totalRevenue ?? 0).toLocaleString()}`}
          subtitle={`₦${(data?.revenueThisMonth ?? 0)
            .toLocaleString()} this month`}
          icon={TrendingUp}
          color="purple"
          trend={data?.revenueGrowthPercent}
        />
        <StatCard
          title="Total Orders"
          value={data?.totalOrders ?? 0}
          subtitle={`${data?.ordersThisMonth ?? 0} this month`}
          icon={ShoppingBag}
          color="blue"
        />
        <StatCard
          title="Products"
          value={data?.totalProducts ?? 0}
          subtitle={`${data?.publishedProducts ?? 0} published`}
          icon={Package}
          color="green"
        />
        <StatCard
          title="Customers"
          value={data?.totalCustomers ?? 0}
          subtitle={`${data?.newCustomersThisMonth ?? 0} new`}
          icon={Users}
          color="orange"
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStat
          label="Pending Orders"
          value={data?.pendingOrders ?? 0}
          icon={Clock}
          color="yellow"
          href="/orders"
        />
        <QuickStat
          label="Processing"
          value={data?.processingOrders ?? 0}
          icon={Package}
          color="blue"
          href="/orders"
        />
        <QuickStat
          label="Low Stock"
          value={data?.lowStockProducts ?? 0}
          icon={AlertTriangle}
          color="red"
          href="/inventory"
        />
        <QuickStat
          label="Out of Stock"
          value={data?.outOfStockProducts ?? 0}
          icon={Package}
          color="gray"
          href="/inventory"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl p-6
        border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Revenue Overview
            </h2>
            <p className="text-sm text-gray-500">
              Last 6 months
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              ₦{(data?.revenueThisMonth ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">This month</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data?.revenueChart ?? []}>
            <defs>
              <linearGradient id="colorRevenue"
                x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed"
                  stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#7c3aed"
                  stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3"
              stroke="#f0f0f0" />
            <XAxis dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(v) =>
                `₦${(v / 1000).toFixed(0)}k`}
              axisLine={false} tickLine={false} />
            <Tooltip
             formatter={(value) => [
            `₦${Number(value ?? 0).toLocaleString()}`, 'Revenue'
            ]}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#7c3aed"
              strokeWidth={2.5}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Products */}
        <div className="bg-white rounded-2xl p-6
          border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              Top Products
            </h2>
            <Link href="/products"
              className="text-sm text-purple-600
                hover:underline font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {(data?.topProducts ?? []).length > 0
              ? data?.topProducts.map((product, index) => (
                <div key={product.id}
                  className="flex items-center gap-3
                    p-2 rounded-xl hover:bg-gray-50">
                  <span className="text-gray-300 text-sm
                    font-bold w-5">
                    {index + 1}
                  </span>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg
                        object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-purple-100
                      rounded-lg flex items-center
                      justify-center flex-shrink-0">
                      <Package size={16}
                        className="text-purple-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800
                      text-sm truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {product.salesCount} sold
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    ₦{product.revenue.toLocaleString()}
                  </p>
                </div>
              ))
              : (
                <EmptyState
                  icon="📦"
                  message="No sales yet"
                  sub="Create products to start selling"
                />
              )
            }
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-6
          border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              Recent Orders
            </h2>
            <Link href="/orders"
              className="text-sm text-purple-600
                hover:underline font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {(data?.recentOrders ?? []).length > 0
              ? data?.recentOrders.map((order) => (
                <div key={order.id}
                  className="flex items-center gap-3
                    p-2 rounded-xl hover:bg-gray-50">
                  <div className="w-9 h-9 bg-gray-100
                    rounded-full flex items-center
                    justify-center flex-shrink-0">
                    <ShoppingBag size={15}
                      className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800
                      text-sm">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {order.customerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      ₦{order.total.toLocaleString()}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))
              : (
                <EmptyState
                  icon="🛒"
                  message="No orders yet"
                  sub="Share your store to get orders"
                />
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reusable Components ──────────────────────────────────

function StatCard({
  title, value, subtitle, icon: Icon, color, trend
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  color: string;
  trend?: number;
}) {
  const colors: Record<string, string> = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-2xl p-5
      border border-gray-100 hover:shadow-sm
      transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${colors[color]}`}>
          <Icon size={18} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs
            font-medium ${
              trend >= 0
                ? 'text-green-600'
                : 'text-red-500'
            }`}>
            {trend >= 0
              ? <ArrowUpRight size={14} />
              : <ArrowDownRight size={14} />
            }
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {value}
      </p>
      <p className="text-xs font-medium text-gray-500 mt-0.5">
        {title}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
    </div>
  );
}

function QuickStat({
  label, value, icon: Icon, color, href
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
  href: string;
}) {
  const colors: Record<string, string> = {
    yellow: 'text-amber-500',
    blue: 'text-blue-500',
    red: 'text-red-500',
    gray: 'text-gray-400',
  };

  return (
    <Link href={href}
      className="bg-white rounded-xl p-4 border border-gray-100
        hover:shadow-sm hover:border-purple-200
        transition-all flex items-center gap-3">
      <Icon size={18} className={colors[color]} />
      <div>
        <p className="text-xl font-bold text-gray-900">
          {value}
        </p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-600',
    Confirmed: 'bg-blue-100 text-blue-600',
    Processing: 'bg-purple-100 text-purple-600',
    Shipped: 'bg-indigo-100 text-indigo-600',
    Delivered: 'bg-green-100 text-green-600',
    Cancelled: 'bg-red-100 text-red-600',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full
      font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function EmptyState({
  icon, message, sub
}: {
  icon: string;
  message: string;
  sub: string;
}) {
  return (
    <div className="text-center py-8">
      <p className="text-3xl mb-2">{icon}</p>
      <p className="font-medium text-gray-700 text-sm">
        {message}
      </p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}