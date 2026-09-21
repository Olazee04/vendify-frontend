'use client';
import { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink, MessageCircle, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function WhatsAppBotPage() {
  const [store, setStore] = useState<any>(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    api.get('/stores/my-store')
      .then(res => setStore(res.data.data))
      .catch(() => {});
  }, []);

  const webhookUrl =
    `https://vendify-api.onrender.com/api/v1/` +
    `whatsapp/webhook/${store?.slug ?? 'your-store'}`;

  const verifyToken = 'vendify_verify_token';

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success('Copied!');
    setTimeout(() => setCopied(''), 2000);
  };

  const CopyField = ({
    label, value, id
  }: {
    label: string;
    value: string;
    id: string
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="flex gap-2">
        <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 font-mono truncate">
          {value}
        </div>
        <button
          onClick={() => copyText(value, id)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
            copied === id
              ? 'bg-green-50 text-green-600'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}>
          {copied === id
            ? <><Check size={14}/> Copied</>
            : <><Copy size={14}/> Copy</>
          }
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          WhatsApp Store Bot
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Let customers browse and order via WhatsApp
        </p>
      </div>

      {/* What the bot does */}
      <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
        <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
          <MessageCircle size={18}/>
          What Your WhatsApp Bot Does
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              emoji: '👋',
              text: 'Greets customers automatically'
            },
            {
              emoji: '📋',
              text: 'Sends product catalog on request'
            },
            {
              emoji: '🛍️',
              text: 'Shows product details and prices'
            },
            {
              emoji: '📦',
              text: 'Lets customers place orders in chat'
            },
            {
              emoji: '🔍',
              text: 'Tracks orders by order number'
            },
            {
              emoji: '📞',
              text: 'Shares your contact information'
            },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-2 text-sm text-green-700">
              <span>{item.emoji}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bot Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-4">
          Bot Preview
        </h3>
        <div className="bg-[#e5ddd5] rounded-xl p-4 space-y-2 max-h-64 overflow-y-auto">
          {[
            {
              from: 'customer',
              text: 'Hi!',
            },
            {
              from: 'bot',
              text: `👋 Welcome to ${store?.name ?? 'Your Store'}!\n\nReply with a number:\n*1* 🛍️ Browse Products\n*2* 📦 Track My Order\n*3* 📞 Contact Support`
            },
            { from: 'customer', text: '1' },
            {
              from: 'bot',
              text: '🛍️ *Product Catalog*\n\n*1.* Red Ankara Dress\n    ₦15,000\n\n*2.* Blue Agbada\n    ₦25,000\n\nReply with number to see details'
            },
          ].map((msg, i) => (
            <div key={i} className={`flex ${
              msg.from === 'customer'
                ? 'justify-end' : 'justify-start'
            }`}>
              <div className={`max-w-xs px-3 py-2 rounded-xl text-sm whitespace-pre-line shadow-sm ${
                msg.from === 'customer'
                  ? 'bg-[#d9fdd3] text-gray-800'
                  : 'bg-white text-gray-800'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Setup Steps */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
        <h3 className="font-bold text-gray-900">
          Setup Instructions
        </h3>

        {/* Step 1 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">1</span>
            </div>
            <h4 className="font-semibold text-gray-900">
              Create Meta Business App
            </h4>
          </div>
          <p className="text-sm text-gray-500 mb-3 ml-9">
            Go to Meta Developers and create a WhatsApp Business app.
          </p>
          <a
            href="https://developers.facebook.com"
            target="_blank"
            rel="noreferrer"
            className="ml-9 inline-flex items-center gap-2 text-purple-600 text-sm font-medium hover:underline">
            <ExternalLink size={14}/>
            Open Meta Developers
          </a>
        </div>

        {/* Step 2 */}
        <div className="border-t border-gray-100 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <h4 className="font-semibold text-gray-900">
              Configure Webhook
            </h4>
          </div>
          <p className="text-sm text-gray-500 mb-4 ml-9">
            In your Meta app, go to WhatsApp → Configuration → Webhook. Add these values:
          </p>
          <div className="ml-9 space-y-3">
            <CopyField
              label="Callback URL"
              value={webhookUrl}
              id="webhook"
            />
            <CopyField
              label="Verify Token"
              value={verifyToken}
              id="token"
            />
          </div>
        </div>

        {/* Step 3 */}
        <div className="border-t border-gray-100 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">3</span>
            </div>
            <h4 className="font-semibold text-gray-900">
              Add API Credentials to Render
            </h4>
          </div>
          <p className="text-sm text-gray-500 mb-4 ml-9">
            Copy your WhatsApp credentials from Meta and add them to your Render environment variables:
          </p>
          <div className="ml-9 bg-gray-900 rounded-xl p-4 text-sm font-mono text-green-400 space-y-1">
            <p>WhatsApp__AccessToken = your_token_here</p>
            <p>WhatsApp__PhoneNumberId = your_phone_id</p>
            <p>WhatsApp__VerifyToken = vendify_verify_token</p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="border-t border-gray-100 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">4</span>
            </div>
            <h4 className="font-semibold text-gray-900">
              Share Your WhatsApp Link
            </h4>
          </div>
          <p className="text-sm text-gray-500 mb-3 ml-9">
            Give customers this link to start chatting with your store bot:
          </p>
          {store?.whatsAppNumber && (
            <div className="ml-9">
              <CopyField
                label="Customer WhatsApp Link"
                value={`https://wa.me/${
                  store.whatsAppNumber
                    .replace(/\D/g, '')
                    .replace(/^0/, '234')
                }?text=Hi`}
                id="walink"
              />
            </div>
          )}
        </div>
      </div>

      {/* Test Message */}
      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5">
        <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
          <Zap size={16}/>
          Test Your Bot
        </h3>
        <p className="text-sm text-purple-700 mb-3">
          Send &quot;Hi&quot; to your WhatsApp business number to test the bot flow.
        </p>
        {store?.whatsAppNumber && (
          <a
            href={`https://wa.me/${
              store.whatsAppNumber
                .replace(/\D/g, '')
                .replace(/^0/, '234')
            }?text=Hi`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-600 transition-colors text-sm">
            <MessageCircle size={16}/>
            Test Bot on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}