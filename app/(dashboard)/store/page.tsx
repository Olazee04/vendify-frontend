'use client';
import { useEffect, useState } from 'react';
import {
  Store, Globe, Phone, Image,
  Palette, Save, ExternalLink,
  Copy, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Store as StoreType, Theme } from '@/types';

export default function StorePage() {
  const [store, setStore] = useState<StoreType | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState({
    name: '',
    description: '',
    whatsAppNumber: '',
    instagramHandle: '',
    facebookPageUrl: '',
    twitterHandle: '',
    supportEmail: '',
    currency: 'NGN',
  });

  useEffect(() => {
    fetchStore();
    fetchThemes();
  }, []);

  const fetchStore = async () => {
    try {
      const res = await api.get('/stores/my-store');
      const s = res.data.data;
      setStore(s);
      setForm({
        name: s.name ?? '',
        description: s.description ?? '',
        whatsAppNumber: s.whatsAppNumber ?? '',
        instagramHandle: s.instagramHandle ?? '',
        facebookPageUrl: s.facebookPageUrl ?? '',
        twitterHandle: s.twitterHandle ?? '',
        supportEmail: s.supportEmail ?? '',
        currency: s.currency ?? 'NGN',
      });
    } catch {
      toast.error('Failed to load store');
    } finally {
      setLoading(false);
    }
  };

  const fetchThemes = async () => {
    try {
      const res = await api.get('/themes');
      setThemes(res.data.data ?? []);
    } catch {}
  };

  const saveStore = async () => {
    setSaving(true);
    try {
      await api.put('/stores', form);
      toast.success('Store updated successfully! ✅');
      fetchStore();
    } catch (error: any) {
      toast.error(error.response?.data?.message
        || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = async (themeId: string) => {
    try {
      await api.post('/themes/apply', { themeId });
      toast.success('Theme applied! 🎨');
      fetchStore();
    } catch {
      toast.error('Failed to apply theme');
    }
  };

  const copyStoreLink = () => {
    const link = `${window.location.origin}/store/${store?.slug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Store link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { key: 'general', label: 'General', icon: Store },
    { key: 'social', label: 'Social Media', icon: Phone },
    { key: 'themes', label: 'Themes', icon: Palette },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl
            border border-gray-100 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Store
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage your store settings
          </p>
        </div>
        {store && (
          <button
            onClick={copyStoreLink}
            className="flex items-center gap-2 px-4 py-2.5
              border border-gray-200 text-gray-600 rounded-xl
              text-sm font-medium hover:bg-gray-50
              transition-colors">
            {copied
              ? <><Check size={15} className="text-green-500"/>
                  Copied!</>
              : <><Copy size={15} /> Copy Link</>
            }
          </button>
        )}
      </div>

      {/* Store Card */}
      {store && (
        <div className="bg-white rounded-2xl border
          border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-100 rounded-xl
              flex items-center justify-center overflow-hidden">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name}
                  className="w-full h-full object-cover"/>
              ) : (
                <Store size={24} className="text-purple-500"/>
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-gray-900 text-lg">
                {store.name}
              </h2>
            <div className="flex items-center gap-2 mt-0.5">
                <Globe size={12} className="text-gray-400"/>
                <p className="text-sm text-gray-500">
                    vendify.com/{store.slug}
                </p>
                
                    href={`/store/${store.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 hover:text-purple-700"<a>
                    <ExternalLink size={12}/>
                </a>
                </div>
            </div>
            <div className="text-right">
              <div className="flex gap-4">
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {store.stats?.totalProducts ?? 0}
                  </p>
                  <p className="text-xs text-gray-400">Products</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {store.stats?.totalOrders ?? 0}
                  </p>
                  <p className="text-xs text-gray-400">Orders</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-purple-600">
                    ₦{(store.stats?.totalRevenue ?? 0)
                      .toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">Revenue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center
                gap-2 py-2.5 rounded-lg text-sm font-medium
                transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
              <Icon size={15}/>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border
        border-gray-100 p-6">

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-5">
            <h3 className="font-bold text-gray-900">
              Store Information
            </h3>

            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1.5">
                Store Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({
                  ...form, name: e.target.value
                })}
                className="w-full px-4 py-3 border border-gray-200
                  rounded-xl focus:outline-none focus:ring-2
                  focus:ring-purple-500 text-gray-900"
              />
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
              />
            </div>

            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1.5">
                Support Email
              </label>
              <input
                type="email"
                value={form.supportEmail}
                onChange={(e) => setForm({
                  ...form, supportEmail: e.target.value
                })}
                className="w-full px-4 py-3 border border-gray-200
                  rounded-xl focus:outline-none focus:ring-2
                  focus:ring-purple-500 text-gray-900"
                placeholder="support@yourstore.com"
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
                <option value="NGN">🇳🇬 Nigerian Naira (NGN)</option>
                <option value="USD">🇺🇸 US Dollar (USD)</option>
                <option value="GBP">🇬🇧 British Pound (GBP)</option>
                <option value="EUR">🇪🇺 Euro (EUR)</option>
                <option value="GHS">🇬🇭 Ghana Cedis (GHS)</option>
              </select>
            </div>
          </div>
        )}

        {/* Social Media Tab */}
        {activeTab === 'social' && (
          <div className="space-y-5">
            <h3 className="font-bold text-gray-900">
              Social Media & Contact
            </h3>
            <p className="text-sm text-gray-500">
              At least one contact method required
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
                  className="flex-1 px-3 py-3 focus:outline-none
                    text-gray-900 text-sm"
                  placeholder="yourstore"
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

            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1.5">
                🐦 Twitter / X Handle
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
                  value={form.twitterHandle}
                  onChange={(e) => setForm({
                    ...form, twitterHandle: e.target.value
                  })}
                  className="flex-1 px-3 py-3 focus:outline-none
                    text-gray-900 text-sm"
                  placeholder="yourstore"
                />
              </div>
            </div>
          </div>
        )}

        {/* Themes Tab */}
        {activeTab === 'themes' && (
          <div className="space-y-5">
            <div>
              <h3 className="font-bold text-gray-900">
                Store Theme
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Current theme:{' '}
                <strong className="text-purple-600">
                  {store?.themeId ?? 'minimal'}
                </strong>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => applyTheme(theme.id)}
                  className={`p-4 rounded-xl border-2 text-left
                    transition-all hover:shadow-md ${
                      store?.themeId === theme.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}>
                  <div
                    className="w-full h-8 rounded-lg mb-3"
                    style={{
                      background: `linear-gradient(135deg,
                        ${theme.primaryColor},
                        ${theme.secondaryColor})`
                    }}
                  />
                  <p className="font-semibold text-gray-900
                    text-sm">
                    {theme.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {theme.category}
                  </p>
                  {store?.themeId === theme.id && (
                    <span className="inline-block mt-2 px-2 py-0.5
                      bg-purple-100 text-purple-600 text-xs
                      rounded-full font-medium">
                      Active
                    </span>
                  )}
                  {theme.isPopular && (
                    <span className="inline-block mt-2 ml-1 px-2
                      py-0.5 bg-amber-100 text-amber-600 text-xs
                      rounded-full font-medium">
                      Popular
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Save button for general and social tabs */}
        {activeTab !== 'themes' && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <button
              onClick={saveStore}
              disabled={saving}
              className="flex items-center gap-2 bg-purple-600
                text-white px-6 py-3 rounded-xl font-semibold
                hover:bg-purple-700 disabled:opacity-50
                transition-colors">
              <Save size={16}/>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}