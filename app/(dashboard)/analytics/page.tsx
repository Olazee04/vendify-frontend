'use client';
import { useEffect, useState } from 'react';
import {
  TrendingUp, ShoppingBag,
  Package, Users, ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart,
  Pie, Cell, Legend
} from 'recharts';
import api from '@/lib/api';
import { Dashboard } from '@/types';

const COLORS = [
  '#7c3aed', '#2563eb', '#059669',
  '#d97706', '#dc2626', '#6b7280'
];

export default function AnalyticsPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      setData(res.data.data);
    } catch {
      console.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl
            border border-gray-100 animate-pulse h-64" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Your store performance overview
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Revenue',
            value: `₦${(data?.totalRevenue ?? 0)
              .toLocaleString()}`,
            sub: `₦${(data?.revenueThisMonth ?? 0)
              .toLocaleString()} this month`,
            icon: TrendingUp,
            color: 'purple',
            trend: data?.revenueGrowthPercent,
          },
          {
            label: 'Total Orders',
            value: data?.totalOrders ?? 0,
            sub: `${data?.ordersThisMonth ?? 0} this month`,
            icon: ShoppingBag,
            color: 'blue',
          },
          {
            label: 'Products',
            value: data?.totalProducts ?? 0,
            sub: `${data?.publishedProducts ?? 0} published`,
            icon: Package,
            color: 'green',
          },
          {
            label: 'Customers',
            value: data?.totalCustomers ?? 0,
            sub: `${data?.newCustomersThisMonth ?? 0} new`,
            icon: Users,
            color: 'orange',
          },
        ].map((card) => {
          const Icon = card.icon;
          const colors: Record<string, string> = {
            purple: 'bg-purple-100 text-purple-600',
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            orange: 'bg-orange-100 text-orange-600',
          };

          return (
            <div key={card.label}
              className="bg-white rounded-2xl p-5
                border border-gray-100">
              <div className="flex items-start
                justify-between mb-3">
                <div className={`p-2 rounded-xl
                  ${colors[card.color]}`}>
                  <Icon size={18} />
                </div>
                {card.trend !== undefined && (
                  <div className={`flex items-center gap-0.5
                    text-xs font-medium ${
                      card.trend >= 0
                        ? 'text-green-600'
                        : 'text-red-500'
                    }`}>
                    {card.trend >= 0
                      ? <ArrowUpRight size={14} />
                      : <ArrowDownRight size={14} />
                    }
                    {Math.abs(card.trend ?? 0)}%
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {card.value}
              </p>
              <p className="text-xs font-medium
                text-gray-500 mt-0.5">
                {card.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {card.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl p-6
        border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          Revenue Trend
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Last 6 months performance
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data?.revenueChart ?? []}>
            <defs>
              <linearGradient id="grad1"
                x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed"
                  stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#7c3aed"
                  stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3"
              stroke="#f5f5f5"/>
            <XAxis dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false} tickLine={false}/>
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(v) =>
                `₦${(v/1000).toFixed(0)}k`}
              axisLine={false} tickLine={false}/>
            <Tooltip
             formatter={(v) => [
            `₦${Number(v ?? 0).toLocaleString()}`, 'Revenue'
            ]}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}/>
            <Area type="monotone" dataKey="revenue"
              stroke="#7c3aed" strokeWidth={2.5}
              fill="url(#grad1)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Orders Chart + Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Orders Bar Chart */}
        <div className="bg-white rounded-2xl p-6
          border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Orders Per Month
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Monthly order volume
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.revenueChart ?? []}>
              <CartesianGrid strokeDasharray="3 3"
                stroke="#f5f5f5"/>
              <XAxis dataKey="label"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false} tickLine={false}/>
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false} tickLine={false}/>
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}/>
              <Bar dataKey="orders" fill="#7c3aed"
                radius={[6, 6, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie */}
        <div className="bg-white rounded-2xl p-6
          border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Orders by Status
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Current order distribution
          </p>
          {(data?.ordersByStatus ?? []).length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data?.ordersByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}>
                  {(data?.ordersByStatus ?? []).map(
                    (_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    )
                  )}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [v, name]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}/>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center
              h-48 text-gray-400 text-sm">
              No orders yet
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-2xl p-6
        border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-6">
          Top Performing Products
        </h2>
        {(data?.topProducts ?? []).length > 0 ? (
          <div className="space-y-4">
            {data?.topProducts.map((product, index) => {
              const maxRevenue = Math.max(
                ...(data?.topProducts.map(p => p.revenue) ?? [1])
              );
              const percent = (product.revenue / maxRevenue) * 100;

              return (
                <div key={product.id}
                  className="flex items-center gap-4">
                  <span className="text-sm font-bold
                    text-gray-300 w-5">
                    {index + 1}
                  </span>
                  {product.imageUrl ? (
                    <img src={product.imageUrl}
                      alt={product.name}
                      className="w-10 h-10 rounded-xl
                        object-cover flex-shrink-0"/>
                  ) : (
                    <div className="w-10 h-10 bg-purple-100
                      rounded-xl flex items-center
                      justify-center flex-shrink-0">
                      <Package size={16}
                        className="text-purple-400"/>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center
                      justify-between mb-1">
                      <p className="font-medium text-gray-800
                        text-sm truncate">
                        {product.name}
                      </p>
                      <p className="text-sm font-bold
                        text-gray-900 ml-4 flex-shrink-0">
                        ₦{product.revenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5
                        bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500
                            rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400
                        flex-shrink-0">
                        {product.salesCount} sold
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Package size={40} className="mx-auto mb-3
              opacity-30"/>
            <p className="text-sm">
              No sales data yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}