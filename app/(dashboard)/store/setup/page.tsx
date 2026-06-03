'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function StoreSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    whatsAppNumber: '',
    instagramHandle: '',
    facebookPageUrl: '',
    currency: 'NGN',
  });

  // Auto-generate slug from store name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setForm({ ...form, name, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.whatsAppNumber &&
        !form.instagramHandle &&
        !form.facebookPageUrl) {
      toast.error(
        'Please add at least one social media or contact link'
      );
      return;
    }

    setLoading(true);
    try {
      await api.post('/stores', form);
      toast.success('Store created successfully! 🎉');
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message
        || 'Failed to create store';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50
      flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-600 mb-2">
            Vendify
          </h1>
          <h2 className="text-xl font-bold text-gray-900">
            Set Up Your Store 🏪
          </h2>
          <p className="text-gray-500 mt-1">
            This takes less than 2 minutes
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className={`flex-1 h-2 rounded-full
              transition-colors ${
                s <= step ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm
          border border-gray-100 p-8">

          <form onSubmit={handleSubmit}>

            {/* Step 1 — Basic Info */}
            {step === 1 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-gray-900">
                  Basic Information
                </h3>

                <div>
                  <label className="block text-sm font-medium
                    text-gray-700 mb-1.5">
                    Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      handleNameChange(e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-200
                      rounded-xl focus:outline-none focus:ring-2
                      focus:ring-purple-500 text-gray-900"
                    placeholder="e.g. Zainab Fashion Store"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium
                    text-gray-700 mb-1.5">
                    Store URL *
                  </label>
                  <div className="flex items-center border
                    border-gray-200 rounded-xl overflow-hidden
                    focus-within:ring-2 focus-within:ring-purple-500">
                    <span className="px-3 py-3 bg-gray-50
                      text-gray-400 text-sm border-r border-gray-200">
                      vendify.com/
                    </span>
                    <input
                      type="text"
                      required
                      value={form.slug}
                      onChange={(e) => setForm({
                        ...form,
                        slug: e.target.value.toLowerCase()
                          .replace(/[^a-z0-9-]/g, '')
                      })}
                      className="flex-1 px-3 py-3 focus:outline-none
                        text-gray-900 text-sm"
                      placeholder="zainab-fashion"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Only lowercase letters, numbers and hyphens
                  </p>
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
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200
                      rounded-xl focus:outline-none focus:ring-2
                      focus:ring-purple-500 text-gray-900 resize-none"
                    placeholder="Tell customers what you sell..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium
                    text-gray-700 mb-1.5">
                    Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({
                      ...form, currency: e.target.value
                    })}
                    className="w-full px-4 py-3 border border-gray-200
                      rounded-xl focus:outline-none focus:ring-2
                      focus:ring-purple-500 text-gray-900 bg-white">
                    <option value="NGN">
                      🇳🇬 Nigerian Naira (NGN)
                    </option>
                    <option value="USD">
                      🇺🇸 US Dollar (USD)
                    </option>
                    <option value="GBP">
                      🇬🇧 British Pound (GBP)
                    </option>
                    <option value="EUR">
                      🇪🇺 Euro (EUR)
                    </option>
                    <option value="GHS">
                      🇬🇭 Ghana Cedis (GHS)
                    </option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!form.name || !form.slug) {
                      toast.error('Please fill in store name and URL');
                      return;
                    }
                    setStep(2);
                  }}
                  className="w-full bg-purple-600 text-white py-3
                    rounded-xl font-semibold hover:bg-purple-700
                    transition-colors">
                  Continue →
                </button>
              </div>
            )}

            {/* Step 2 — Social Media */}
            {step === 2 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-gray-900">
                  Contact & Social Media
                </h3>
                <p className="text-sm text-gray-500">
                  Add at least one way for customers to reach you
                </p>

                <div>
                  <label className="block text-sm font-medium
                    text-gray-700 mb-1.5">
                    📱 WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={form.whatsAppNumber}
                    onChange={(e) => setForm({
                      ...form, whatsAppNumber: e.target.value
                    })}
                    className="w-full px-4 py-3 border border-gray-200
                      rounded-xl focus:outline-none focus:ring-2
                      focus:ring-purple-500 text-gray-900"
                    placeholder="08012345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium
                    text-gray-700 mb-1.5">
                    📸 Instagram Handle
                  </label>
                  <div className="flex items-center border
                    border-gray-200 rounded-xl overflow-hidden
                    focus-within:ring-2 focus-within:ring-purple-500">
                    <span className="px-3 py-3 bg-gray-50
                      text-gray-400 text-sm border-r border-gray-200">
                      @
                    </span>
                    <input
                      type="text"
                      value={form.instagramHandle}
                      onChange={(e) => setForm({
                        ...form, instagramHandle: e.target.value
                      })}
                      className="flex-1 px-3 py-3
                        focus:outline-none text-gray-900 text-sm"
                      placeholder="yourstorehandle"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium
                    text-gray-700 mb-1.5">
                    👍 Facebook Page
                  </label>
                  <input
                    type="text"
                    value={form.facebookPageUrl}
                    onChange={(e) => setForm({
                      ...form, facebookPageUrl: e.target.value
                    })}
                    className="w-full px-4 py-3 border border-gray-200
                      rounded-xl focus:outline-none focus:ring-2
                      focus:ring-purple-500 text-gray-900"
                    placeholder="YourStorePage"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 border-2 border-gray-200
                      text-gray-600 py-3 rounded-xl font-semibold
                      hover:border-purple-300 transition-colors">
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-purple-600 text-white
                      py-3 rounded-xl font-semibold
                      hover:bg-purple-700 disabled:opacity-50
                      transition-colors">
                    {loading ? 'Creating...' : 'Create Store 🚀'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}