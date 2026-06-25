import { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Building2, Loader2, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function OtpVerificationPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const email = location.state?.email || '';
  const devOtp = location.state?.otp || '';

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setIsLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp: code });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);
      // Route to the correct dashboard based on the user's actual role from the server response
      if (data.user?.role === 'HOSTEL_ADMIN') {
        navigate('/admin/dashboard');
      } else if (data.user?.role === 'SUPER_ADMIN') {
        navigate('/superadmin/dashboard');
      } else {
        navigate('/account/bookings');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid OTP');
    } finally { setIsLoading(false); }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/forgot-password', { email });
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch { }
  };

  return (
    <div className="min-h-screen bg-surface-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-text-primary">Nex<span className="text-brand-primary">Stay</span></span>
        </div>

        <div className="glass-card rounded-xl p-8 shadow-card">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📱</span>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Verify your account</h2>
            <p className="text-text-muted text-sm">
              We sent a 6-digit OTP to<br />
              <span className="text-text-primary font-medium">{email || 'your email'}</span>
            </p>
            {devOtp && (
              <div className="mt-3 bg-brand-primary/10 border border-brand-primary/20 rounded-md px-3 py-2 text-xs text-brand-primary">
                🧪 Dev OTP: <span className="font-bold tracking-widest">{devOtp}</span>
              </div>
            )}
          </div>

          {/* OTP inputs */}
          <div className="flex gap-2 justify-center mb-6">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text" inputMode="numeric" maxLength={1} value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={cn(
                  'w-11 h-12 text-center text-xl font-bold rounded-lg border bg-surface-input text-text-primary',
                  'transition-all duration-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30',
                  digit ? 'border-brand-primary' : 'border-surface-border'
                )}
              />
            ))}
          </div>

          {error && <p className="text-status-error text-sm text-center mb-4">{error}</p>}

          <button onClick={handleVerify} disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 mb-4">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : 'Verify OTP'}
          </button>

          <button onClick={handleResend} className="btn-ghost w-full flex items-center justify-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" />
            {resent ? 'OTP resent!' : "Didn't receive it? Resend"}
          </button>
        </div>

        <p className="text-center text-text-muted text-sm mt-4">
          <Link to="/login" className="text-brand-primary hover:underline">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}
