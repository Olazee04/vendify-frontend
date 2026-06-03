'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Lock, User, Bell, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed successfully! 🔐');
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message
        || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Settings
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage your account settings
        </p>
      </div>

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

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border
          border-gray-100 p-6 space-y-5">
          <h3 className="font-bold text-gray-900">
            Profile Information
          </h3>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-purple-600 rounded-2xl
              flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {user?.firstName[0]}{user?.lastName[0]}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-gray-500">
                {user?.email}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5
                bg-purple-100 text-purple-600 text-xs
                rounded-full font-medium">
                {user?.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium
                text-gray-500 mb-1">
                First Name
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl
                text-gray-900 text-sm">
                {user?.firstName}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium
                text-gray-500 mb-1">
                Last Name
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl
                text-gray-900 text-sm">
                {user?.lastName}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium
              text-gray-500 mb-1">
              Email Address
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-xl
              text-gray-900 text-sm">
              {user?.email}
            </div>
          </div>

          {user?.phoneNumber && (
            <div>
              <label className="block text-sm font-medium
                text-gray-500 mb-1">
                Phone Number
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl
                text-gray-900 text-sm">
                {user.phoneNumber}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-4
            bg-green-50 rounded-xl">
            <Shield size={16} className="text-green-600
              flex-shrink-0"/>
            <div>
              <p className="text-sm font-medium text-green-800">
                Account Status
              </p>
              <p className="text-xs text-green-600">
                {user?.isVerified
                  ? '✅ Email verified'
                  : '⚠️ Email not verified'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border
          border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-5">
            Change Password
          </h3>
          <form onSubmit={changePassword} className="space-y-4">

            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({
                  ...passwords,
                  currentPassword: e.target.value
                })}
                className="w-full px-4 py-3 border border-gray-200
                  rounded-xl focus:outline-none focus:ring-2
                  focus:ring-purple-500 text-gray-900"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={passwords.newPassword}
                onChange={(e) => setPasswords({
                  ...passwords,
                  newPassword: e.target.value
                })}
                className="w-full px-4 py-3 border border-gray-200
                  rounded-xl focus:outline-none focus:ring-2
                  focus:ring-purple-500 text-gray-900"
                placeholder="Min. 8 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({
                  ...passwords,
                  confirmPassword: e.target.value
                })}
                className="w-full px-4 py-3 border border-gray-200
                  rounded-xl focus:outline-none focus:ring-2
                  focus:ring-purple-500 text-gray-900"
                placeholder="Repeat new password"
              />
              {passwords.confirmPassword &&
                passwords.newPassword !==
                passwords.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  Passwords do not match
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-purple-600
                  text-white px-6 py-3 rounded-xl font-semibold
                  hover:bg-purple-700 disabled:opacity-50
                  transition-colors">
                <Lock size={16}/>
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}