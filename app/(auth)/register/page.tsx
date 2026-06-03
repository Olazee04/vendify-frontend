'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const router = useRouter();
  const { saveAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        ...form,
        role: 'Merchant'
      });
      const { accessToken, refreshToken, user } = response.data.data;

      saveAuth(user, accessToken, refreshToken);
      toast.success(`Welcome to Vendify, ${user.firstName}! 🎉`);
      router.push('/store/setup');
    } catch (error: any) {
      const message = error.response?.data?.message
        || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* Left side */}
      <div className="hidden lg:flex lg:w-1/2
        bg-purple-600 flex-col items-center
        justify-center p-12 text-white">
        <h1 className="text-4xl font-bold mb-4">Vendify</h1>
        <p className="text-xl text-purple-200 text-center mb-8">
          Start selling online in minutes
        </p>
        <div className="bg-white/10 rounded-2xl p-6
          w-full max-w-sm space-y-3">
          <p className="font-semibold text-white">
            Getting started is easy:
          </p>
          {[
            '1. Create your free account',
            '2. Set up your store',
            '3. Add your products',
            '4. Start accepting payments',
            '5. Grow your business! 🚀',
          ].map((step) => (
            <p key={step} className="text-purple-100 text-sm">
              {step}
            </p>
          ))}
        </div>
      </div>

      {/* Right side */}
      <div className="w-full lg:w-1/2 flex items-center
        justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">

          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-purple-600">
              Vendify
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm
            border border-gray-100 p-8">

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Create your account 🚀
            </h2>
            <p className="text-gray-500 mb-8">
              Free forever. No credit card required.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium
                    text-gray-700 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({
                      ...form, firstName: e.target.value
                    })}
                    className="w-full px-4 py-3 border border-gray-200
                      rounded-xl focus:outline-none focus:ring-2
                      focus:ring-purple-500 focus:border-transparent
                      transition-all text-gray-900"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium
                    text-gray-700 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({
                      ...form, lastName: e.target.value
                    })}
                    className="w-full px-4 py-3 border border-gray-200
                      rounded-xl focus:outline-none focus:ring-2
                      focus:ring-purple-500 focus:border-transparent
                      transition-all text-gray-900"
                    placeholder="Doe"
                  />
                </div>
              </div>

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
                <label className="block text-sm font-medium
                  text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({
                    ...form, phoneNumber: e.target.value
                  })}
                  className="w-full px-4 py-3 border border-gray-200
                    rounded-xl focus:outline-none focus:ring-2
                    focus:ring-purple-500 focus:border-transparent
                    transition-all text-gray-900"
                  placeholder="08012345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-1.5">
                  Password
                </label>
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
                  placeholder="Min. 8 characters"
                />
                {form.password.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full
                        transition-colors ${
                          form.password.length >= (i + 1) * 2
                            ? i < 2
                              ? 'bg-red-400'
                              : i < 3
                                ? 'bg-yellow-400'
                                : 'bg-green-400'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3
                  rounded-xl font-semibold hover:bg-purple-700
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors text-base mt-2">
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
                    Creating account...
                  </span>
                ) : 'Create Free Account'}
              </button>

              <p className="text-xs text-gray-400 text-center">
                By registering you agree to our Terms of Service
              </p>
            </form>

            <p className="text-center text-gray-500 mt-6 text-sm">
              Already have an account?{' '}
              <Link href="/login"
                className="text-purple-600 font-semibold
                  hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}