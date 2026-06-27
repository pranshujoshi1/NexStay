import { useState } from 'react';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

interface AuthModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  defaultTab?: 'login' | 'signup';
}

export default function AuthModal({ onClose, onSuccess, defaultTab = 'login' }: AuthModalProps) {
  const { login } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>(defaultTab);
  const [showPw, setShowPw] = useState(false);

  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Signup form
  const [signupForm, setSignupForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '' });
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(loginForm.email, loginForm.password, 'HOSTEL_ADMIN');
      onClose();
      onSuccess?.();
    } catch (err: any) {
      setLoginError(err?.response?.data?.message ?? 'Invalid credentials. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('Public signup is disabled. Contact the admin to create an account.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <h2 className="text-lg font-bold text-slate-900">
            {tab === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mx-6 mt-4 border border-slate-200 rounded-xl overflow-hidden">
          <button onClick={() => setTab('login')}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${tab === 'login' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            Login
          </button>
          <button onClick={() => setTab('signup')}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${tab === 'signup' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            Create Account
          </button>
        </div>

        <div className="p-6">
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input type="email" required value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} required value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Your password"
                    className="w-full pl-3 pr-9 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                  <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
              <button type="submit" disabled={loginLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-sm">
                {loginLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loginLoading ? 'Signing in…' : 'Sign In'}
              </button>
              <p className="text-center text-xs text-slate-500">
                No account?{' '}
                <button type="button" onClick={() => setTab('signup')} className="text-blue-600 font-semibold hover:underline">
                  Create one free
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                  <input required value={signupForm.name}
                    onChange={e => setSignupForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone *</label>
                  <input required type="tel" value={signupForm.phone}
                    onChange={e => setSignupForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="10-digit"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                <input type="email" required value={signupForm.email}
                  onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Password *</label>
                  <input type="password" required value={signupForm.password}
                    onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min 6 chars"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm *</label>
                  <input type="password" required value={signupForm.confirm}
                    onChange={e => setSignupForm(f => ({ ...f, confirm: e.target.value }))}
                    placeholder="Re-enter"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
              </div>
              {signupError && <p className="text-red-500 text-sm">{signupError}</p>}
              <button type="submit" disabled={signupLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-sm">
                {signupLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {signupLoading ? 'Creating…' : 'Create Account & Continue'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
