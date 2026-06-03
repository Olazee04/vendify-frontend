import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>

      {/* ── Navbar ─────────────────────────────────── */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #f3f4f6',
        padding: '0 1rem',
      }}>
        <div style={{
          maxWidth: '1152px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#7c3aed',
          }}>
            Vendify
          </h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link href="/login" style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.9rem',
            }}>
              Login
            </Link>
            <Link href="/register" style={{
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 600,
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '0.9rem',
            }}>
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────── */}
      <section style={{
        paddingTop: '120px',
        paddingBottom: '80px',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        background: 'linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          <div style={{
            display: 'inline-block',
            backgroundColor: '#ede9fe',
            color: '#7c3aed',
            padding: '6px 16px',
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '24px',
          }}>
            🇳🇬 Built for Nigerian Merchants
          </div>

          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            color: '#111827',
            lineHeight: 1.2,
            marginBottom: '24px',
          }}>
            Sell Anything Online{' '}
            <span style={{ color: '#7c3aed' }}>In Minutes</span>
          </h2>

          <p style={{
            fontSize: '1.125rem',
            color: '#6b7280',
            marginBottom: '40px',
            lineHeight: 1.7,
            maxWidth: '600px',
            margin: '0 auto 40px',
          }}>
            Create your online store, add products, accept payments
            via Paystack and Flutterwave. No technical skills needed.
          </p>

          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <Link href="/register" style={{
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 700,
              padding: '16px 32px',
              borderRadius: '14px',
              fontSize: '1rem',
              display: 'inline-block',
            }}>
              Start Selling Today — Free 🚀
            </Link>
            <Link href="/login" style={{
              backgroundColor: '#ffffff',
              color: '#7c3aed',
              textDecoration: 'none',
              fontWeight: 700,
              padding: '16px 32px',
              borderRadius: '14px',
              fontSize: '1rem',
              border: '2px solid #ddd6fe',
              display: 'inline-block',
            }}>
              Login to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────── */}
      <section style={{
        padding: '80px 1rem',
        backgroundColor: '#ffffff',
      }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <h3 style={{
            fontSize: '2rem',
            fontWeight: 800,
            textAlign: 'center',
            color: '#111827',
            marginBottom: '12px',
          }}>
            Everything You Need to Sell Online
          </h3>
          <p style={{
            textAlign: 'center',
            color: '#9ca3af',
            marginBottom: '48px',
            fontSize: '1rem',
          }}>
            All the tools to run a successful online store
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {features.map((f) => (
              <div key={f.title} style={{
                padding: '28px',
                borderRadius: '16px',
                border: '1px solid #f3f4f6',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'all 0.2s',
              }}>
                <div style={{
                  fontSize: '2.5rem',
                  marginBottom: '16px',
                }}>
                  {f.icon}
                </div>
                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#111827',
                  marginBottom: '8px',
                }}>
                  {f.title}
                </h4>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#6b7280',
                  lineHeight: 1.6,
                }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────── */}
      <section style={{
        padding: '64px 1rem',
        backgroundColor: '#7c3aed',
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '32px',
          textAlign: 'center',
        }}>
          {stats.map((s) => (
            <div key={s.label}>
              <p style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: '#ffffff',
                marginBottom: '6px',
              }}>
                {s.value}
              </p>
              <p style={{
                fontSize: '0.875rem',
                color: '#ddd6fe',
              }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ───────────────────────────── */}
      <section style={{
        padding: '80px 1rem',
        backgroundColor: '#fafafa',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{
            fontSize: '2rem',
            fontWeight: 800,
            textAlign: 'center',
            color: '#111827',
            marginBottom: '12px',
          }}>
            Get Started in 4 Simple Steps
          </h3>
          <p style={{
            textAlign: 'center',
            color: '#9ca3af',
            marginBottom: '48px',
          }}>
            No technical skills needed
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '24px',
          }}>
            {steps.map((step, i) => (
              <div key={step.title} style={{
                textAlign: 'center',
                padding: '24px 16px',
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                border: '1px solid #f3f4f6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#ede9fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: '#7c3aed',
                }}>
                  {i + 1}
                </div>
                <p style={{
                  fontSize: '1.5rem',
                  marginBottom: '8px',
                }}>
                  {step.icon}
                </p>
                <h4 style={{
                  fontWeight: 700,
                  color: '#111827',
                  fontSize: '0.95rem',
                  marginBottom: '6px',
                }}>
                  {step.title}
                </h4>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#9ca3af',
                  lineHeight: 1.5,
                }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Payment Partners ────────────────────────── */}
      <section style={{
        padding: '60px 1rem',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #f3f4f6',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{
            color: '#9ca3af',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '32px',
          }}>
            Trusted Payment Partners
          </p>
          <div style={{
            display: 'flex',
            gap: '32px',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            {['🏦 Paystack', '💳 Flutterwave', '🌍 Stripe'].map(p => (
              <div key={p} style={{
                padding: '12px 24px',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                fontWeight: 600,
                color: '#374151',
                fontSize: '0.95rem',
                backgroundColor: '#f9fafb',
              }}>
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────── */}
      <section style={{
        padding: '80px 1rem',
        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: '16px',
          }}>
            Ready to Start Selling?
          </h3>
          <p style={{
            color: '#ddd6fe',
            marginBottom: '32px',
            fontSize: '1rem',
            lineHeight: 1.6,
          }}>
            Join thousands of Nigerian merchants already using Vendify.
            Free forever to get started.
          </p>
          <Link href="/register" style={{
            backgroundColor: '#ffffff',
            color: '#7c3aed',
            textDecoration: 'none',
            fontWeight: 800,
            padding: '16px 40px',
            borderRadius: '14px',
            fontSize: '1.1rem',
            display: 'inline-block',
          }}>
            Create Free Account 🚀
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────── */}
      <footer style={{
        padding: '32px 1rem',
        borderTop: '1px solid #f3f4f6',
        backgroundColor: '#ffffff',
      }}>
        <div style={{
          maxWidth: '1152px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#7c3aed',
          }}>
            Vendify
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
            © 2026 Vendify. Built with ❤️ in Nigeria 🇳🇬
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="/login" style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}>
              Login
            </Link>
            <Link href="/register" style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}>
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
    title: 'Nigerian Payments',
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

const steps = [
  {
    icon: '📝',
    title: 'Create Account',
    desc: 'Sign up free in under a minute',
  },
  {
    icon: '🏪',
    title: 'Set Up Store',
    desc: 'Add your store name and details',
  },
  {
    icon: '📦',
    title: 'Add Products',
    desc: 'Upload products with photos',
  },
  {
    icon: '🚀',
    title: 'Start Selling',
    desc: 'Share your link and get orders',
  },
];