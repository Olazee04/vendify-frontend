'use client';
import { useState, useEffect } from 'react';
import {
  Copy, Check, Gift, Users,
  TrendingUp, Share2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  pendingEarnings: number;
  totalEarnings: number;
  referrals: Array<{
    merchantName: string;
    joinedAt: string;
    status: string;
    commission: number;
  }>;
}

export default function ReferralPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState<ReferralData | null>(null);

  // Generate referral code from user email
  const referralCode = user?.email
    ? `VND-${user.email
        .split('@')[0]
        .toUpperCase()
        .slice(0, 8)}`
    : 'VND-XXXXX';

  const referralLink =
    `${typeof window !== 'undefined'
      ? window.location.origin : ''
    }/register?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const message = encodeURIComponent(
      `🚀 Join me on Vendify — the easiest way to sell ` +
      `online in Nigeria!\n\nCreate your free online store ` +
      `and accept Paystack payments.\n\n` +
      `Sign up with my link and we both earn: ` +
      `${referralLink}`
    );
    window.open(
      `https://wa.me/?text=${message}`, '_blank'
    );
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Referral Program
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Earn commission by referring merchants to Vendify
        </p>
      </div>

      {/* How it works */}
      <div className="bg-purple-50 border border-purple-100
        rounded-2xl p-5">
        <h3 className="font-bold text-purple-900 mb-4">
          🎁 How It Works
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            {
              step: '1',
              icon: '🔗',
              title: 'Share your link',
              desc: 'Send your unique referral link to friends'
            },
            {
              step: '2',
              icon: '👤',
              title: 'They sign up',
              desc: 'They create a store using your link'
            },
            {
              step: '3',
              icon: '💰',
              title: 'You earn',
              desc: 'Get ₦2,000 for each paying merchant'
            },
          ].map(item => (
            <div key={item.step}>
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="font-semibold text-purple-800
                text-sm">
                {item.title}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border
          border-gray-100 p-4 text-center">
          <div className="w-10 h-10 bg-green-100 rounded-xl
            flex items-center justify-center mx-auto mb-2">
            <TrendingUp size={18}
              className="text-green-600"/>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ₦0
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Total Earned
          </p>
        </div>
        <div className="bg-white rounded-2xl border
          border-gray-100 p-4 text-center">
          <div className="w-10 h-10 bg-purple-100 rounded-xl
            flex items-center justify-center mx-auto mb-2">
            <Users size={18}
              className="text-purple-600"/>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            0
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Total Referrals
          </p>
        </div>
        <div className="bg-white rounded-2xl border
          border-gray-100 p-4 text-center">
          <div className="w-10 h-10 bg-amber-100 rounded-xl
            flex items-center justify-center mx-auto mb-2">
            <Gift size={18}
              className="text-amber-600"/>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ₦0
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Pending
          </p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-white rounded-2xl border
        border-gray-100 p-6 space-y-4">
        <h3 className="font-bold text-gray-900">
          Your Referral Link
        </h3>

        <div className="flex gap-2">
          <div className="flex-1 px-4 py-3 bg-gray-50 border
            border-gray-200 rounded-xl text-sm text-gray-600
            truncate font-mono">
            {referralLink}
          </div>
          <button
            onClick={copyLink}
            className={`flex items-center gap-2 px-4 py-3
              rounded-xl text-sm font-medium transition-colors
              ${copied
                ? 'bg-green-50 text-green-600'
                : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}>
            {copied
              ? <><Check size={15}/> Copied!</>
              : <><Copy size={15}/> Copy</>
            }
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={shareOnWhatsApp}
            className="flex-1 flex items-center justify-center
              gap-2 py-3 bg-green-500 text-white rounded-xl
              font-semibold hover:bg-green-600
              transition-colors text-sm">
            <Share2 size={16}/>
            Share on WhatsApp
          </button>
          <button
            onClick={() => {
              const text = encodeURIComponent(
                `Join Vendify and start selling online! ` +
                `${referralLink}`
              );
              window.open(
                `https://twitter.com/intent/tweet?text=${text}`,
                '_blank'
              );
            }}
            className="flex-1 flex items-center justify-center
              gap-2 py-3 bg-sky-500 text-white rounded-xl
              font-semibold hover:bg-sky-600
              transition-colors text-sm">
            🐦 Share on X
          </button>
        </div>
      </div>

      {/* Your Referral Code */}
      <div className="bg-white rounded-2xl border
        border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-3">
          Your Referral Code
        </h3>
        <div className="flex items-center gap-3">
          <div className="px-6 py-4 bg-purple-50
            border-2 border-dashed border-purple-300
            rounded-xl text-center flex-1">
            <p className="text-2xl font-bold text-purple-600
              font-mono tracking-widest">
              {referralCode}
            </p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(referralCode);
              toast.success('Code copied!');
            }}
            className="p-3 bg-gray-100 text-gray-600
              rounded-xl hover:bg-gray-200">
            <Copy size={16}/>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Share this code with friends. They enter it
          when signing up to connect to your referral.
        </p>
      </div>

      {/* Commission Structure */}
      <div className="bg-white rounded-2xl border
        border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4">
          Commission Structure
        </h3>
        <div className="space-y-3">
          {[
            {
              plan: 'Starter Plan',
              price: '₦3,500/month',
              commission: '₦700',
              percent: '20%',
              color: 'bg-blue-50 border-blue-200'
            },
            {
              plan: 'Pro Plan',
              price: '₦8,000/month',
              commission: '₦1,600',
              percent: '20%',
              color: 'bg-purple-50 border-purple-200'
            },
            {
              plan: 'Business Plan',
              price: '₦20,000/month',
              commission: '₦4,000',
              percent: '20%',
              color: 'bg-amber-50 border-amber-200'
            },
          ].map(item => (
            <div key={item.plan}
              className={`flex items-center justify-between
                p-4 rounded-xl border ${item.color}`}>
              <div>
                <p className="font-semibold text-gray-900
                  text-sm">
                  {item.plan}
                </p>
                <p className="text-xs text-gray-500">
                  {item.price}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">
                  +{item.commission}
                </p>
                <p className="text-xs text-gray-400">
                  per month
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          * Commissions paid monthly for active subscriptions.
          Recurring for as long as they stay subscribed.
        </p>
      </div>
    </div>
  );
}