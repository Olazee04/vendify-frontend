'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import {
  LayoutDashboard, Package, ShoppingBag,
  Store, BarChart2, Settings,
  LogOut, Menu, X, Boxes, Tag,
  Truck, ChevronRight, Ticket,
  Star, Gift, CreditCard,
  MessageCircle, Share2, Plug,
  Bell, Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/products', icon: Package },
  { label: 'Orders', href: '/orders', icon: ShoppingBag },
  { label: 'Inventory', href: '/inventory', icon: Boxes },
  { label: 'Categories', href: '/categories', icon: Tag },
  { label: 'Shipping', href: '/shipping', icon: Truck },
  { label: 'Coupons', href: '/coupons', icon: Ticket },
  { label: 'Analytics', href: '/analytics', icon: BarChart2 },
  { label: 'Reviews', href: '/reviews', icon: Star },
  { label: 'WhatsApp Bot', href: '/whatsapp-bot', icon: MessageCircle },
  { label: 'Instagram', href: '/instagram', icon: ImageIcon },
  { label: 'FB Catalog', href: '/facebook-catalog', icon: Share2 },
  { label: 'Referrals', href: '/referral', icon: Gift },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'Integrations', href: '/integrations', icon: Plug },
  { label: 'My Store', href: '/store', icon: Store },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [lowStock, setLowStock] = useState(0);

  useEffect(() => {
    const token = Cookies.get('vendify_token');
    if (!loading && !token) {
      router.push('/login');
    }
  }, [loading, router]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const [ordersRes, inventoryRes] = await Promise.all([
        api.get('/orders?status=Pending'),
        api.get('/inventory/low-stock'),
      ]);
      setOrderCount(ordersRes.data.data?.orders?.length ?? 0);
      setLowStock(inventoryRes.data.data?.length ?? 0);
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`
    : 'VD';

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>

        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <Link href="/dashboard">
            <h1 className="text-xl font-bold text-purple-600">Vendify</h1>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-purple-50">
              <div className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium group ${isActive ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                <Icon size={18} className="shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.label === 'Orders' && orderCount > 0 && (
                  <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {orderCount > 9 ? '9+' : orderCount}
                  </span>
                )}
                {item.label === 'Inventory' && lowStock > 0 && (
                  <span className="w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {lowStock}
                  </span>
                )}
                {isActive && <ChevronRight size={14} className="opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 w-full text-sm font-medium transition-colors">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700 p-1">
            <Menu size={20} />
          </button>

          <h2 className="font-semibold text-gray-800 text-sm capitalize hidden sm:block">
            {pathname === '/dashboard'
              ? 'Dashboard Overview'
              : pathname.replace('/', '').replace('-', ' ')}
          </h2>

          <div className="flex-1" />

          <button
            onClick={() => router.push('/orders')}
            className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Bell size={18} className="text-gray-500" />
            {orderCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {orderCount > 9 ? '9+' : orderCount}
              </span>
            )}
          </button>

          {user && (
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500 hidden sm:block">
                Hi, {user.firstName}!
              </p>
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
