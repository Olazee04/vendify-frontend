'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { saveAuth } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: form.email.toLowerCase().trim(),
        password: form.password,
      });
      const { accessToken, refreshToken, user } = res.data.data;
saveAuth(user, accessToken, refreshToken);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message
          || 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
    }}>
      {/* Left Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        color: 'white',
      }}
        className="hidden lg:flex">
        <div>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '16px' }}>
            Vendify
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: '32px' }}>
            Your complete online store solution
          </p>
          {[
            'Accept Paystack & Flutterwave payments',
            'Manage products and inventory',
            'Track orders in real-time',
            'WhatsApp order notifications',
            'Beautiful store themes',
          ].map(item => (
            <div key={item} style={{
              display: 'flex', alignItems: 'center',
              gap: '12px', marginBottom: '12px',
            }}>
              <span style={{
                width: '20px', height: '20px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '12px',
              }}>✓</span>
              <span style={{ opacity: 0.9 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{
        flex: 1, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px', background: 'white',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <h2 style={{
            fontSize: '1.75rem', fontWeight: 800,
            color: '#111827', marginBottom: '8px',
          }}>
            Welcome back 👋
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '32px' }}>
            Login to your merchant dashboard
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block', fontSize: '14px',
                fontWeight: 600, color: '#374151',
                marginBottom: '6px',
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%', padding: '12px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px', fontSize: '15px',
                  outline: 'none', boxSizing: 'border-box',
                  color: '#111827',
                }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginBottom: '6px',
              }}>
                <label style={{
                  fontSize: '14px', fontWeight: 600,
                  color: '#374151',
                }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{
                  fontSize: '14px', color: '#7c3aed',
                  textDecoration: 'none',
                }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', padding: '12px 48px 12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px', fontSize: '15px',
                    outline: 'none', boxSizing: 'border-box',
                    color: '#111827',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '14px',
                    top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: '#9ca3af',
                    display: 'flex', alignItems: 'center',
                  }}>
                  {showPassword
                    ? <EyeOff size={18} />
                    : <Eye size={18} />
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? '#a78bfa' : '#7c3aed',
                color: 'white', border: 'none',
                borderRadius: '10px', fontSize: '16px',
                fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '16px',
              }}>
              {loading ? 'Logging in...' : 'Login to Dashboard'}
            </button>
          </form>

          <p style={{
            textAlign: 'center', marginTop: '24px',
            color: '#6b7280', fontSize: '14px',
          }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{
              color: '#7c3aed', fontWeight: 700,
              textDecoration: 'none',
            }}>
              Create free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}