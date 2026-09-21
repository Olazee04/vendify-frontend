'use client';
import { useState } from 'react';
import { Check, Zap, Building, Star, X } from 'lucide-react';
import toast from 'react-hot-toast';

const plans = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    icon: Star,
    color: 'border-gray-200',
    headerColor: 'bg-gray-50',
    features: [
      '10 products maximum',
      '3 basic themes',
      'WhatsApp checkout',
      'Paystack payments',
      'Basic analytics',
      'Vendify branding',
    ],
    limitations: [
      'No custom domain',
      'No email notifications',
      'No CSV export',
    ],
    cta: 'Current Plan',
    current: true,
  },
  {
    name: 'Starter',
    price: 3500,
    period: 'month',
    icon: Zap,
    color: 'border-purple-300',
    headerColor: 'bg-purple-600',
    popular: false,
    features: [
      '100 products',
      'All 7 themes',
      'WhatsApp + Email checkout',
      'All payment providers',
      'Full analytics',
      'CSV import/export',
      'Custom domain',
      'No Vendify branding',
      'Priority support',
    ],
    limitations: [],
    cta: 'Upgrade to Starter',
    current: false,
  },
  {
    name: 'Pro',
    price: 8000,
    period: 'month',
    icon: Zap,
    color: 'border-purple-500',
    headerColor: 'bg-purple-600',
    popular: true,
    features: [
      'Unlimited products',
      'All 7 themes + custom',
      'All payment providers',
      'Advanced analytics',
      'Bulk operations',
      'Customer reviews',
      'Abandoned cart recovery',
      'API access',
      'Custom domain',
      'Dedicated support',
    ],
    limitations: [],
    cta: 'Upgrade to Pro',
    current: false,
  },
  {
    name: 'Business',
    price: 20000,
    period: 'month',
    icon: Building,
    color: 'border-amber-400',
    headerColor: 'bg-amber-500',
    popular: false,
    features: [
      'Everything in Pro',
      'Multiple stores (up to 5)',
      'Team members',
      'White-label branding',
      'SLA guarantee',
      'Custom integrations',
      'Dedicated account manager',
      'Priority phone support',
    ],
    limitations: [],
    cta: 'Contact Sales',
    current: false,
  },
];

export default function BillingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const getPrice = (price: number) => {
    if (price === 0) return '₦0';
    const p = billingPeriod === 'yearly'
      ? Math.round(price * 10)
      : price;
    return `₦${p.toLocaleString()}`;
  };

  const handleUpgrade = (planName: string) => {
    if (planName === 'Contact Sales') {
      const msg = encodeURIComponent(
        `Hi! I'm interested in the Vendify Business Plan.`
      );
      window.open(`https://wa.me/?text=${msg}`, '_blank');
      return;
    }
    toast.success(
      `Payment integration coming soon! 🚀\n` +
      `Contact us on WhatsApp to upgrade.`
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Choose Your Plan
        </h1>
        <p className="text-gray-500 mt-1">
          Scale your business with the right tools
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}>
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}>
            Yearly
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-bold">
              -17%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <div key={plan.name}
              className={`bg-white rounded-2xl border-2 overflow-hidden transition-shadow hover:shadow-lg relative ${plan.color}`}>

              {plan.popular && (
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                  Most Popular
                </div>
              )}

              <div className={`p-5 ${
                plan.name === 'Free'
                  ? 'bg-gray-50'
                  : plan.name === 'Business'
                    ? 'bg-amber-500'
                    : 'bg-purple-600'
              }`}>
                <Icon size={20} className={
                  plan.name === 'Free'
                    ? 'text-gray-600 mb-3'
                    : 'text-white mb-3'
                }/>
                <p className={`font-bold text-lg ${
                  plan.name === 'Free'
                    ? 'text-gray-900'
                    : 'text-white'
                }`}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className={`text-2xl font-black ${
                    plan.name === 'Free'
                      ? 'text-gray-900'
                      : 'text-white'
                  }`}>
                    {getPrice(plan.price)}
                  </p>
                  {plan.price > 0 && (
                    <p className={`text-sm ${
                      plan.name === 'Free'
                        ? 'text-gray-500'
                        : 'text-white/70'
                    }`}>
                      /{billingPeriod === 'yearly'
                        ? 'year' : 'mo'}
                    </p>
                  )}
                </div>
                {plan.price > 0 && billingPeriod === 'yearly' && (
                  <p className="text-xs text-white/70 mt-1">
                    ₦{plan.price.toLocaleString()}/mo
                    billed yearly
                  </p>
                )}
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  {plan.features.map((feature) => (
                    <div key={feature}
                      className="flex items-start gap-2">
                      <Check size={15}
                        className="text-green-500 mt-0.5 shrink-0"/>
                      <p className="text-sm text-gray-700">
                        {feature}
                      </p>
                    </div>
                  ))}
                  {plan.limitations.map((limit) => (
                    <div key={limit}
                      className="flex items-start gap-2 opacity-50">
                      <X size={15}
                        className="text-gray-400 mt-0.5 shrink-0"/>
                      <p className="text-sm text-gray-500">
                        {limit}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleUpgrade(plan.cta)}
                  disabled={plan.current}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:cursor-not-allowed ${
                    plan.current
                      ? 'bg-gray-100 text-gray-400'
                      : plan.name === 'Business'
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : plan.name === 'Free'
                          ? 'bg-gray-200 text-gray-600'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}>
                  {plan.current ? '✓ Current Plan' : plan.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4">
          Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          {[
            {
              q: 'Can I change plans anytime?',
              a: 'Yes! Upgrade or downgrade at any time. ' +
                'Changes take effect immediately.'
            },
            {
              q: 'Do I need a credit card for the Free plan?',
              a: 'No! The Free plan is completely free forever ' +
                'with no credit card required.'
            },
            {
              q: 'How do I pay for paid plans?',
              a: 'Pay via Paystack or bank transfer. ' +
                'Contact us on WhatsApp to upgrade.'
            },
            {
              q: 'What happens if I exceed my product limit?',
              a: 'You can still manage existing products but ' +
                'cannot add new ones until you upgrade.'
            },
          ].map(faq => (
            <div key={faq.q}
              className="p-4 bg-gray-50 rounded-xl">
              <p className="font-semibold text-gray-900 text-sm mb-1">
                {faq.q}
              </p>
              <p className="text-sm text-gray-500">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}