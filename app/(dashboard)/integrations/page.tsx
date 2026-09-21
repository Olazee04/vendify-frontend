'use client';
import { useState } from 'react';
import { ExternalLink, Check, ChevronRight, Zap } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  logo: string;
  category: string;
  status: 'connected' | 'available' | 'coming_soon';
  setupUrl?: string;
  docsUrl?: string;
  features: string[];
  envVars?: string[];
}

const integrations: Integration[] = [
  // Logistics
  {
    id: 'gig',
    name: 'GIG Logistics',
    description: 'Auto-book delivery when order is confirmed. Track parcels in real-time.',
    logo: '🚚',
    category: 'Logistics',
    status: 'available',
    setupUrl: 'https://giglogistics.com/api',
    features: [
      'Auto-book delivery on order confirm',
      'Real-time parcel tracking',
      'SMS updates to customers',
      'Calculate delivery fees by state',
    ],
    envVars: ['GIG__ApiKey', 'GIG__BaseUrl'],
  },
  {
    id: 'dhl',
    name: 'DHL Nigeria',
    description: 'International shipping for global customers. Auto-calculate rates.',
    logo: '✈️',
    category: 'Logistics',
    status: 'available',
    setupUrl: 'https://developer.dhl.com',
    features: [
      'International shipping rates',
      'Auto-generate waybills',
      'Track international parcels',
      'Customs documentation',
    ],
    envVars: ['DHL__ApiKey', 'DHL__AccountNumber'],
  },
  // SMS/OTP
  {
    id: 'sendchamp',
    name: 'Sendchamp',
    description: 'Send SMS order notifications to Nigerian customers.',
    logo: '📱',
    category: 'Notifications',
    status: 'available',
    setupUrl: 'https://sendchamp.com',
    features: [
      'Order confirmation SMS',
      'Delivery status updates',
      'WhatsApp messages via API',
      'Bulk SMS campaigns',
    ],
    envVars: [
      'Sendchamp__PublicKey',
      'Sendchamp__SenderName',
    ],
  },
  {
    id: 'termii',
    name: 'Termii',
    description: 'OTP verification for customer accounts and checkout.',
    logo: '🔐',
    category: 'Security',
    status: 'available',
    setupUrl: 'https://termii.com',
    features: [
      'OTP for customer verification',
      'Phone number validation',
      'Checkout verification',
      'Nigerian number support',
    ],
    envVars: [
      'Termii__ApiKey',
      'Termii__SenderId',
    ],
  },
  // CRM
  {
    id: 'zoho',
    name: 'Zoho CRM',
    description: 'Sync customers and orders to Zoho CRM automatically.',
    logo: '📊',
    category: 'CRM',
    status: 'available',
    setupUrl: 'https://www.zoho.com/crm/developer',
    features: [
      'Auto-sync customers to CRM',
      'Create deals from orders',
      'Track customer lifetime value',
      'Email follow-up sequences',
    ],
    envVars: [
      'Zoho__ClientId',
      'Zoho__ClientSecret',
      'Zoho__RefreshToken',
    ],
  },
  // Analytics
  {
    id: 'ga',
    name: 'Google Analytics',
    description: 'Track store visitors, traffic sources and conversion rates.',
    logo: '📈',
    category: 'Analytics',
    status: 'available',
    setupUrl: 'https://analytics.google.com',
    features: [
      'Track store page views',
      'Monitor traffic sources',
      'Conversion tracking',
      'Customer journey analysis',
    ],
    envVars: ['GA__MeasurementId'],
  },
  {
    id: 'fbpixel',
    name: 'Facebook Pixel',
    description: 'Track ad conversions and build retargeting audiences.',
    logo: '🎯',
    category: 'Analytics',
    status: 'available',
    setupUrl: 'https://business.facebook.com/events_manager',
    features: [
      'Track add-to-cart events',
      'Purchase conversion tracking',
      'Build custom audiences',
      'Optimize ad campaigns',
    ],
    envVars: ['Facebook__PixelId'],
  },
  // Support
  {
    id: 'intercom',
    name: 'Intercom',
    description: 'Add live chat support widget to your store.',
    logo: '💬',
    category: 'Support',
    status: 'available',
    setupUrl: 'https://intercom.com',
    features: [
      'Live chat on your store',
      'Customer messaging',
      'Help center integration',
      'Automated chatbot',
    ],
    envVars: ['Intercom__AppId'],
  },
  // Coming soon
  {
    id: 'paystack-pos',
    name: 'Paystack POS',
    description: 'Accept in-person payments at your physical store.',
    logo: '💳',
    category: 'Payments',
    status: 'coming_soon',
    features: [
      'Physical card payments',
      'Sync with online inventory',
      'Unified reporting',
    ],
  },
  {
    id: 'jumia',
    name: 'Jumia Integration',
    description: 'Sync your products to Jumia marketplace automatically.',
    logo: '🛒',
    category: 'Marketplace',
    status: 'coming_soon',
    features: [
      'Auto-sync products',
      'Order management',
      'Inventory sync',
    ],
  },
];

const categories = [
  'All', 'Logistics', 'Notifications',
  'Security', 'CRM', 'Analytics',
  'Support', 'Marketplace', 'Payments',
];

export default function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = integrations.filter(i =>
    activeCategory === 'All' || i.category === activeCategory
  );

  const statusConfig = {
    connected: {
      label: 'Connected',
      color: 'bg-green-100 text-green-700',
    },
    available: {
      label: 'Set Up',
      color: 'bg-purple-100 text-purple-700',
    },
    coming_soon: {
      label: 'Coming Soon',
      color: 'bg-gray-100 text-gray-500',
    },
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Integrations
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Connect Vendify with your favourite tools
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Integration Cards */}
      <div className="space-y-3">
        {filtered.map(integration => {
          const isExpanded = expandedId === integration.id;
          const config = statusConfig[integration.status];

          return (
            <div key={integration.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

              {/* Main Row */}
              <div
                className="flex items-center gap-4 p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : integration.id)}>

                {/* Logo */}
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl shrink-0">
                  {integration.logo}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">
                      {integration.name}
                    </h3>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                      {integration.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">
                    {integration.description}
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.color}`}>
                    {config.label}
                  </span>
                  <ChevronRight size={16}
                    className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-5 bg-gray-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                    {/* Features */}
                    <div>
                      <p className="font-semibold text-gray-900 mb-3 text-sm">
                        ✨ Features
                      </p>
                      <div className="space-y-2">
                        {integration.features.map(f => (
                          <div key={f}
                            className="flex items-center gap-2 text-sm text-gray-600">
                            <Check size={14} className="text-green-500 shrink-0"/>
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Setup */}
                    {integration.status === 'available' && (
                      <div>
                        {integration.envVars && (
                          <>
                            <p className="font-semibold text-gray-900 mb-3 text-sm">
                              ⚙️ Environment Variables
                            </p>
                            <div className="bg-gray-900 rounded-xl p-3 mb-3">
                              {integration.envVars.map(v => (
                                <p key={v} className="text-green-400 font-mono text-xs">
                                  {v} = your_value
                                </p>
                              ))}
                            </div>
                          </>
                        )}
                        <div className="flex gap-2">
                          {integration.setupUrl && (
                            <a
                              href={integration.setupUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                              <ExternalLink size={14}/>
                              Get API Key
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {integration.status === 'coming_soon' && (
                      <div className="flex items-center justify-center bg-gray-100 rounded-xl p-6">
                        <div className="text-center">
                          <Zap size={24} className="text-gray-400 mx-auto mb-2"/>
                          <p className="text-sm font-medium text-gray-500">
                            Coming Soon
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            We&apos;re building this integration
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom Integration */}
      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6 text-center">
        <Zap size={32} className="text-purple-600 mx-auto mb-3"/>
        <h3 className="font-bold text-purple-900 mb-2">
          Need a Custom Integration?
        </h3>
        <p className="text-sm text-purple-700 mb-4">
          Your Vendify API is open. Connect any service that has an API!
        </p>
        <a
          href="https://docs.vendify.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-purple-700 text-sm">
          <ExternalLink size={14}/>
          View API Docs
        </a>
      </div>
    </div>
  );
}