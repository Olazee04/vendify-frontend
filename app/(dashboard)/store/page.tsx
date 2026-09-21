'use client';
import { useEffect, useState, useRef } from 'react';
import { Store, Globe, Phone, Palette, Save, ExternalLink, Copy, Check, Camera, Upload } from 'lucide-react';
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
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
      toast.success('Store updated!');
      fetchStore();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = async (themeId: string) => {
    try {
      await api.post('/themes/apply', { themeId });
      toast.success('Theme applied!');
      fetchStore();
    } catch {
      toast.error('Failed to apply theme');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post('/upload/store/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Logo updated!');
      fetchStore();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post('/upload/store/banner', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Banner updated!');
      fetchStore();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  };

  const copyStoreLink = () => {
    const link = `${window.location.origin}/store/${store?.slug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { key: 'general', label: 'General', icon: Store },
    { key: 'media', label: 'Logo & Banner', icon: Camera },
    { key: 'social', label: 'Social Media', icon: Phone },
    { key: 'themes', label: 'Themes', icon: Palette },
  ];

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Store</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your store settings</p>
        </div>
        {store && (
          <button onClick={copyStoreLink}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            {copied ? <><Check size={15} className="text-green-500" /> Copied!</> : <><Copy size={15} /> Copy Store Link</>}
          </button>
        )}
      </div>

      {store && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div style={{ background: 'linear-gradient(to right, #a855f7, #6366f1)', height: '8rem', position: 'relative', overflow: 'hidden' }}>
            {store.bannerUrl && <img src={store.bannerUrl} alt="Banner" className="w-full h-full object-cover" />}
          </div>
          <div className="p-5 flex items-center gap-4">
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center overflow-hidden -mt-8 border-4 border-white shadow-md shrink-0">
              {store.logoUrl ? <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" /> : <Store size={24} className="text-purple-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-lg">{store.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Globe size={12} className="text-gray-400" />
                <p className="text-sm text-gray-500 truncate">vendify.com/{store.slug}</p>
                <a href={`/store/${store.slug}`} target="_blank" rel="noreferrer" className="text-purple-600 hover:text-purple-700">
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
            <div className="gap-4 text-center hidden sm:flex">
              <div><p className="text-lg font-bold text-gray-900">{store.stats?.totalProducts ?? 0}</p><p className="text-xs text-gray-400">Products</p></div>
              <div><p className="text-lg font-bold text-gray-900">{store.stats?.totalOrders ?? 0}</p><p className="text-xs text-gray-400">Orders</p></div>
              <div><p className="text-lg font-bold text-purple-600">N{(store.stats?.totalRevenue ?? 0).toLocaleString()}</p><p className="text-xs text-gray-400">Revenue</p></div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-w-fit px-3 ${activeTab === tab.key ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">

        {activeTab === 'general' && (
          <div className="space-y-5">
            <h3 className="font-bold text-gray-900">Store Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Support Email</label>
              <input type="email" value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900" placeholder="support@yourstore.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white">
                <option value="NGN">Nigerian Naira (NGN)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="GBP">British Pound (GBP)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GHS">Ghana Cedis (GHS)</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="space-y-6">
            <h3 className="font-bold text-gray-900">Logo and Banner</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Store Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl border-2 border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50 shrink-0">
                  {store?.logoUrl ? <img src={store.logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <Store size={28} className="text-gray-300" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-3">Recommended: 200x200px, PNG or JPG, max 5MB</p>
                  <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors ${uploadingLogo ? 'bg-gray-100 text-gray-400' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                    <Upload size={14} />
                    {uploadingLogo ? 'Uploading...' : store?.logoUrl ? 'Change Logo' : 'Upload Logo'}
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                  </label>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Store Banner</label>
              <div className="rounded-xl border-2 border-gray-200 overflow-hidden mb-3 bg-gray-50">
                {store?.bannerUrl ? <img src={store.bannerUrl} alt="Banner" className="w-full h-32 object-cover" /> : <div className="h-32 flex items-center justify-center"><p className="text-gray-300 text-sm">No banner yet</p></div>}
              </div>
              <p className="text-sm text-gray-500 mb-3">Recommended: 1200x300px, JPG or PNG, max 5MB</p>
              <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors ${uploadingBanner ? 'bg-gray-100 text-gray-400' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                <Upload size={14} />
                {uploadingBanner ? 'Uploading...' : store?.bannerUrl ? 'Change Banner' : 'Upload Banner'}
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={uploadingBanner} />
              </label>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-5">
            <h3 className="font-bold text-gray-900">Social Media and Contact</h3>
            <p className="text-sm text-gray-500">Add at least one contact method</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp Number</label>
              <input type="tel" value={form.whatsAppNumber} onChange={(e) => setForm({ ...form, whatsAppNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900" placeholder="08012345678" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Instagram Handle</label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-500">
                <span className="px-3 py-3 bg-gray-50 text-gray-400 text-sm border-r border-gray-200">@</span>
                <input type="text" value={form.instagramHandle} onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
                  className="flex-1 px-3 py-3 focus:outline-none text-gray-900 text-sm" placeholder="yourstore" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Facebook Page</label>
              <input type="text" value={form.facebookPageUrl} onChange={(e) => setForm({ ...form, facebookPageUrl: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900" placeholder="YourStorePage" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Twitter / X Handle</label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-500">
                <span className="px-3 py-3 bg-gray-50 text-gray-400 text-sm border-r border-gray-200">@</span>
                <input type="text" value={form.twitterHandle} onChange={(e) => setForm({ ...form, twitterHandle: e.target.value })}
                  className="flex-1 px-3 py-3 focus:outline-none text-gray-900 text-sm" placeholder="yourstore" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'themes' && (
          <div className="space-y-5">
            <div>
              <h3 className="font-bold text-gray-900">Store Theme</h3>
              <p className="text-sm text-gray-500 mt-1">Current: <strong className="text-purple-600 capitalize">{store?.themeId ?? 'minimal'}</strong></p>
            </div>
            {themes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No themes available</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {themes.map((theme: Theme) => (
                  <button key={theme.id} onClick={() => applyTheme(theme.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${store?.themeId === theme.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}>
                    <div className="w-full h-8 rounded-lg mb-3" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }} />
                    <p className="font-semibold text-gray-900 text-sm">{theme.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{theme.category}</p>
                    <div className="flex gap-1 mt-2">
                      {store?.themeId === theme.id && <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full font-medium">Active</span>}
                      {theme.isPopular && <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-600 text-xs rounded-full font-medium">Popular</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {(activeTab === 'general' || activeTab === 'social') && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <button onClick={saveStore} disabled={saving}
              className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors">
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}