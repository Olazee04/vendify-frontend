'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { saveAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', form);
      const { accessToken, refreshToken, user } = response.data.data;

      saveAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.firstName}! 👋`);

      if (user.hasStore) {
        router.push('/dashboard');
      } else {
        router.push('/store/setup');
      }
    } catch (error: any) {
      const message = error.response?.data?.message
        || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* Left side - decorative */}
      <div className="hidden lg:flex lg:w-1/2
        bg-purple-600 flex-col items-center
        justify-center p-12 text-white">
        <h1 className="text-4xl font-bold mb-4">Vendify</h1>
        <p className="text-xl text-purple-200 text-center mb-8">
          Your complete online store solution
        </p>
        <div className="space-y-4 w-full max-w-sm">
          {[
            '✅ Accept Paystack & Flutterwave payments',
            '✅ Manage products and inventory',
            '✅ Track orders in real-time',
            '✅ WhatsApp order notifications',
            '✅ Beautiful store themes',
          ].map((item) => (
            <p key={item} className="text-purple-100 text-sm">
              {item}
            </p>
          ))}
        </div>
      </div>

      {/* Right side - form */}
      <div className="w-full lg:w-1/2 flex items-center
        justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">

          {/* Logo for mobile */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-purple-600">
              Vendify
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm
            border border-gray-100 p-8">

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back 👋
            </h2>
            <p className="text-gray-500 mb-8">
              Login to your merchant dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({
                    ...form, email: e.target.value
                  })}
                  className="w-full px-4 py-3 border border-gray-200
                    rounded-xl focus:outline-none focus:ring-2
                    focus:ring-purple-500 focus:border-transparent
                    transition-all text-gray-900"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex items-center
                  justify-between mb-1.5">
                  <label className="block text-sm font-medium
                    text-gray-700">
                    Password
                  </label>
                  <Link href="/forgot-password"
                    className="text-sm text-purple-600
                      hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({
                    ...form, password: e.target.value
                  })}
                  className="w-full px-4 py-3 border border-gray-200
                    rounded-xl focus:outline-none focus:ring-2
                    focus:ring-purple-500 focus:border-transparent
                    transition-all text-gray-900"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3
                  rounded-xl font-semibold hover:bg-purple-700
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors text-base">
                {loading ? (
                  <span className="flex items-center
                    justify-center gap-2">
                    <svg className="animate-spin h-5 w-5"
                      viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12"
                        cy="12" r="10" stroke="currentColor"
                        strokeWidth="4"/>
                      <path className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Logging in...
                  </span>
                ) : 'Login to Dashboard'}
              </button>
            </form>

            <p className="text-center text-gray-500 mt-6 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/register"
                className="text-purple-600 font-semibold
                  hover:underline">
                Create free account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}