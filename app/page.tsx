import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50
        bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4
          flex items-center justify-between">
          <h1 className="text-2xl font-bold text-purple-600">
            Vendify
          </h1>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-gray-600 hover:text-purple-600
                font-medium px-4 py-2 transition-colors">
              Login
            </Link>
            <Link href="/register"
              className="bg-purple-600 text-white px-5 py-2
                rounded-lg font-medium hover:bg-purple-700
                transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%)'
      }} className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-purple-100
            text-purple-600 px-4 py-1 rounded-full
            text-sm font-medium mb-6">
             Ecommerce Platform for All Businesses 
          </div>
          <h2 className="text-5xl font-bold text-gray-900
            leading-tight mb-6">
            Sell Anything Online
            <span className="text-purple-600"> In Minutes</span>
          </h2>
          <p className="text-xl text-gray-500 mb-10
            max-w-2xl mx-auto">
            Create your online store, add products, accept
            payments via Paystack and Flutterwave.
            No technical skills needed.
          </p>
          <div className="flex flex-col sm:flex-row
            gap-4 justify-center">
            <Link href="/register"
              className="bg-purple-600 text-white px-8 py-4
                rounded-xl font-bold text-lg
                hover:bg-purple-700 transition-colors">
              Start Selling Today — Free 🚀
            </Link>
            <Link href="/login"
              className="bg-white text-purple-600 px-8 py-4
                rounded-xl font-bold text-lg border-2
                border-purple-200 hover:border-purple-400
                transition-colors">
              Login to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center
            text-gray-900 mb-4">
            Everything You Need to Sell Online
          </h3>
          <p className="text-gray-500 text-center mb-12">
            All the tools to run a successful online store
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2
            lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title}
                className="p-6 rounded-2xl border border-gray-100
                  hover:border-purple-200 hover:shadow-lg
                  transition-all duration-200">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h4 className="text-lg font-bold
                  text-gray-900 mb-2">
                  {f.title}
                </h4>
                <p className="text-gray-500 text-sm
                  leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-purple-600">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4
            gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-bold
                  text-white mb-2">{s.value}</p>
                <p className="text-purple-200 text-sm">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Selling?
          </h3>
          <p className="text-gray-500 mb-8">
            Join thousands of merchants already
            using Vendify
          </p>
          <Link href="/register"
            className="bg-purple-600 text-white px-8 py-4
              rounded-xl font-bold text-lg
              hover:bg-purple-700 transition-colors
              inline-block">
            Create Free Account 🚀
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col
          md:flex-row items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-purple-600">
            Vendify
          </h2>
          <p className="text-gray-400 text-sm">
            © 2026 Vendify. Built with ❤️ 
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link href="/login"
              className="hover:text-purple-600">
              Login
            </Link>
            <Link href="/register"
              className="hover:text-purple-600">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: '🏪',
    title: 'Easy Store Setup',
    desc: 'Create your store in minutes. No technical skills needed. Just add products and start selling.',
  },
  {
    icon: '💳',
    title: 'Payments Integration',
    desc: 'Accept payments via Paystack and Flutterwave. Support for Naira and international currencies.',
  },
  {
    icon: '📦',
    title: 'Order Management',
    desc: 'Track orders from placement to delivery. Update status and notify customers automatically.',
  },
  {
    icon: '📱',
    title: 'WhatsApp Integration',
    desc: 'Get instant order notifications on WhatsApp. Let customers contact you directly.',
  },
  {
    icon: '📊',
    title: 'Sales Analytics',
    desc: 'See your revenue, top products, and growth in a beautiful real-time dashboard.',
  },
  {
    icon: '🎨',
    title: 'Beautiful Themes',
    desc: 'Choose from 7 free themes — Fashion, Tech, Food, Beauty, Digital and Naija Market.',
  },
];

const stats = [
  { value: '7', label: 'Free Themes' },
  { value: '3', label: 'Payment Providers' },
  { value: '60+', label: 'API Endpoints' },
  { value: '100%', label: 'Free to Start' },
];