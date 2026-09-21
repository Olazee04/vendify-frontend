'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Cookies from 'js-cookie';

type Step = 'register' | 'verify';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('register');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '',
    email: '', phoneNumber: '', password: '',
  });

  const getStrength = (pwd: string) => {
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  };

  const strengthColors = ['#ef4444','#f97316','#eab308','#22c55e'];
  const strengthLabels = ['Weak','Fair','Good','Strong'];
  const strength = getStrength(form.password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('Please enter your full name'); return;
    }
    if (!form.email.trim()) {
      toast.error('Email address is required'); return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(form.email)) {
      toast.error('Please enter a valid email address'); return;
    }

    const blockedDomains = [
      'mailinator.com','guerrillamail.com','throwaway.com',
      'yopmail.com','trashmail.com','tempmail.com',
      'temp-mail.org','sharklasers.com','maildrop.cc',
      'dispostable.com','fakeinbox.com','spam4.me',
      'mailnull.com','mytrashmail.com','example.com','test.com','fake.com',
    ];
    const domain = form.email.split('@')[1]?.toLowerCase();
    if (blockedDomains.includes(domain)) {
      toast.error('Disposable emails not allowed. Use your real email.'); return;
    }

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters'); return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.toLowerCase().trim(),
        phoneNumber: form.phoneNumber || null,
        password: form.password,
        role: 'Merchant',
      });
      setRegisteredEmail(form.email.toLowerCase().trim());
      toast.success('Account created! Check your email for the verification code.');
      setStep('verify');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter the 6-digit code'); return;
    }
    setVerifying(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        email: registeredEmail,
        otp: code,
      });
      const { accessToken, refreshToken, user } = res.data.data;
      Cookies.set('vendify_token', accessToken, { expires: 1 });
      Cookies.set('vendify_refresh', refreshToken, { expires: 7 });
      Cookies.set('vendify_user', JSON.stringify(user), { expires: 1 });
      toast.success('Email verified! Welcome to Vendify!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-otp', {
        email: registeredEmail,
        verificationMethod: 'email',
      });
      toast.success('New code sent! Check your email.');
      setOtp(['', '', '', '', '', '']);
    } catch {
      toast.error('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}>

      {/* Left panel */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'48px', color:'white' }} className="hidden lg:flex">
        <div>
          <h1 style={{ fontSize:'3rem', fontWeight:800, marginBottom:'16px' }}>Vendify</h1>
          <p style={{ fontSize:'1.25rem', opacity:0.9, marginBottom:'32px' }}>Start selling online in minutes</p>
          <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:'16px', padding:'24px' }}>
            <p style={{ fontWeight:700, marginBottom:'16px' }}>Getting started is easy:</p>
            {['Create your free account','Verify your email','Set up your store','Add your products','Start accepting payments!'].map((s,i) => (
              <p key={s} style={{ opacity:0.9, marginBottom:'8px' }}>{i+1}. {s}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', background:'white', overflowY:'auto' }}>
        <div style={{ width:'100%', maxWidth:'420px', padding:'24px 0' }}>

          {/* STEP 1 — REGISTER */}
          {step === 'register' && (
            <>
              <h2 style={{ fontSize:'1.75rem', fontWeight:800, color:'#111827', marginBottom:'8px' }}>
                Create your account
              </h2>
              <p style={{ color:'#6b7280', marginBottom:'32px', fontSize:'14px' }}>
                Free forever. No credit card required.
              </p>

              <form onSubmit={handleRegister}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'6px' }}>First Name *</label>
                    <input type="text" value={form.firstName} onChange={e => setForm({...form, firstName:e.target.value})} placeholder="Ada" required
                      style={{ width:'100%', padding:'12px', border:'1px solid #e5e7eb', borderRadius:'10px', fontSize:'14px', outline:'none', boxSizing:'border-box', color:'#111827' }} />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'6px' }}>Last Name *</label>
                    <input type="text" value={form.lastName} onChange={e => setForm({...form, lastName:e.target.value})} placeholder="Obi" required
                      style={{ width:'100%', padding:'12px', border:'1px solid #e5e7eb', borderRadius:'10px', fontSize:'14px', outline:'none', boxSizing:'border-box', color:'#111827' }} />
                  </div>
                </div>

                <div style={{ marginBottom:'16px' }}>
                  <label style={{ display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'6px' }}>Email Address *</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="you@gmail.com" required
                    style={{ width:'100%', padding:'12px 16px', border:'1px solid #e5e7eb', borderRadius:'10px', fontSize:'14px', outline:'none', boxSizing:'border-box', color:'#111827' }} />
                  <p style={{ fontSize:'11px', color:'#9ca3af', marginTop:'4px' }}>
                    A verification code will be sent to this email
                  </p>
                </div>

                <div style={{ marginBottom:'16px' }}>
                  <label style={{ display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'6px' }}>Phone Number</label>
                  <input type="tel" value={form.phoneNumber} onChange={e => setForm({...form, phoneNumber:e.target.value})} placeholder="08012345678"
                    style={{ width:'100%', padding:'12px 16px', border:'1px solid #e5e7eb', borderRadius:'10px', fontSize:'14px', outline:'none', boxSizing:'border-box', color:'#111827' }} />
                </div>

                <div style={{ marginBottom:'16px' }}>
                  <label style={{ display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'6px' }}>Password *</label>
                  <div style={{ position:'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="Min. 8 characters" required
                      style={{ width:'100%', padding:'12px 48px 12px 16px', border:'1px solid #e5e7eb', borderRadius:'10px', fontSize:'14px', outline:'none', boxSizing:'border-box', color:'#111827' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', alignItems:'center' }}>
                      {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                  {form.password.length > 0 && (
                    <div style={{ marginTop:'8px' }}>
                      <div style={{ display:'flex', gap:'4px', marginBottom:'4px' }}>
                        {[0,1,2,3].map(i => (
                          <div key={i} style={{ flex:1, height:'4px', borderRadius:'2px', background: i < strength ? strengthColors[strength-1] : '#e5e7eb', transition:'all 0.3s' }} />
                        ))}
                      </div>
                      <p style={{ fontSize:'11px', color: strengthColors[strength-1] || '#9ca3af' }}>
                        {strength > 0 ? strengthLabels[strength-1] : ''}
                      </p>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading}
                  style={{ width:'100%', padding:'14px', background: loading ? '#a78bfa' : '#7c3aed', color:'white', border:'none', borderRadius:'10px', fontSize:'15px', fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', marginTop:'8px' }}>
                  {loading ? 'Creating account...' : 'Create Free Account'}
                </button>
              </form>

              <p style={{ textAlign:'center', marginTop:'20px', color:'#6b7280', fontSize:'13px' }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color:'#7c3aed', fontWeight:700, textDecoration:'none' }}>Login here</Link>
              </p>
            </>
          )}

          {/* STEP 2 — OTP VERIFICATION */}
          {step === 'verify' && (
            <>
              <div style={{ textAlign:'center', marginBottom:'32px' }}>
                <div style={{ width:'64px', height:'64px', background:'#f5f3ff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <Mail size={28} style={{ color:'#7c3aed' }}/>
                </div>
                <h2 style={{ fontSize:'1.5rem', fontWeight:800, color:'#111827', marginBottom:'8px' }}>
                  Check your email
                </h2>
                <p style={{ color:'#6b7280', fontSize:'14px' }}>
                  We sent a 6-digit verification code to
                </p>
                <p style={{ color:'#7c3aed', fontWeight:700, fontSize:'14px', marginTop:'4px' }}>
                  {registeredEmail}
                </p>
              </div>

              {/* OTP inputs */}
              <div style={{ display:'flex', gap:'8px', justifyContent:'center', marginBottom:'24px' }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    style={{
                      width:'48px', height:'56px',
                      border: digit ? '2px solid #7c3aed' : '2px solid #e5e7eb',
                      borderRadius:'12px', textAlign:'center',
                      fontSize:'22px', fontWeight:700, color:'#111827',
                      outline:'none', transition:'border-color 0.2s',
                    }}
                  />
                ))}
              </div>

              <button onClick={handleVerify} disabled={verifying || otp.join('').length !== 6}
                style={{ width:'100%', padding:'14px', background: verifying ? '#a78bfa' : '#7c3aed', color:'white', border:'none', borderRadius:'10px', fontSize:'15px', fontWeight:700, cursor: verifying ? 'not-allowed' : 'pointer', marginBottom:'16px', opacity: otp.join('').length !== 6 ? 0.6 : 1 }}>
                {verifying ? 'Verifying...' : 'Verify Email'}
              </button>

              <div style={{ textAlign:'center' }}>
                <p style={{ color:'#9ca3af', fontSize:'13px', marginBottom:'8px' }}>
                  Did not receive the code?
                </p>
                <button onClick={handleResend} disabled={resending}
                  style={{ background:'none', border:'none', color:'#7c3aed', fontWeight:700, fontSize:'13px', cursor:'pointer' }}>
                  {resending ? 'Sending...' : 'Resend Code'}
                </button>
                <div style={{ marginTop:'16px' }}>
                  <button onClick={() => { setStep('register'); setOtp(['','','','','','']); }}
                    style={{ background:'none', border:'none', color:'#9ca3af', fontSize:'12px', cursor:'pointer' }}>
                    Go back and change details
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
