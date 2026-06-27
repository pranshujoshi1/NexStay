import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2, Eye, EyeOff, LogIn, Shield, Home, UserCheck,
  ChefHat, GraduationCap, AlertCircle, Hash,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types/shared';

/* ─── Role config ─────────────────────────────────────────────────────────── */
interface RoleOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  identifierLabel: string;
  identifierPlaceholder: string;
  passwordPlaceholder: string;
  needsHostelCode: boolean;  // Warden, Mess, Student need hostelCode to disambiguate
  identifierType: string;
}

const ROLES: RoleOption[] = [
  {
    value: Role.SUPER_ADMIN,
    label: 'Super Admin',
    icon: <Shield className="w-4 h-4" />,
    identifierLabel: 'Email Address',
    identifierPlaceholder: 'admin@nexstay.in',
    passwordPlaceholder: 'Password',
    needsHostelCode: false,
    identifierType: 'email',
  },
  {
    value: Role.HOSTEL_ADMIN,
    label: 'Hostel Owner',
    icon: <Home className="w-4 h-4" />,
    identifierLabel: 'Email Address',
    identifierPlaceholder: 'owner@example.com',
    passwordPlaceholder: 'Password',
    needsHostelCode: false,
    identifierType: 'email',
  },
  {
    value: Role.WARDEN,
    label: 'Warden',
    icon: <UserCheck className="w-4 h-4" />,
    identifierLabel: 'Email / Phone',
    identifierPlaceholder: 'warden@example.com',
    passwordPlaceholder: 'Password',
    needsHostelCode: true,
    identifierType: 'text',
  },
  {
    value: Role.MESS_MANAGER,
    label: 'Mess Manager',
    icon: <ChefHat className="w-4 h-4" />,
    identifierLabel: 'Email / Phone',
    identifierPlaceholder: 'mess@example.com',
    passwordPlaceholder: 'Password',
    needsHostelCode: true,
    identifierType: 'text',
  },
  {
    value: Role.STUDENT,
    label: 'Student',
    icon: <GraduationCap className="w-4 h-4" />,
    identifierLabel: 'Mobile Number / Student ID',
    identifierPlaceholder: '10-digit mobile number',
    passwordPlaceholder: 'Last 4 digits of mobile (default)',
    needsHostelCode: true,
    identifierType: 'text',
  },
];

const ROLE_REDIRECTS: Record<string, string> = {
  [Role.SUPER_ADMIN]:  '/superadmin/dashboard',
  [Role.HOSTEL_ADMIN]: '/admin/dashboard',
  [Role.WARDEN]:       '/warden/dashboard',
  [Role.MESS_MANAGER]: '/mess/dashboard',
  [Role.STUDENT]:      '/student/dashboard',
};

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [selectedRole, setSelectedRole] = useState<string>(Role.HOSTEL_ADMIN);
  const [identifier,   setIdentifier]   = useState('');
  const [hostelCode,   setHostelCode]   = useState('');
  const [password,     setPassword]     = useState('');
  const [showPw,       setShowPw]       = useState(false);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);

  const currentRole = ROLES.find(r => r.value === selectedRole)!;

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    setIdentifier('');
    setHostelCode('');
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) { setError('Please fill in all fields.'); return; }
    if (currentRole.needsHostelCode && !hostelCode.trim()) {
      setError('Please enter your Hostel Code (e.g. NST-001).'); return;
    }
    setError('');
    setLoading(true);
    try {
      await login(identifier.trim(), password, selectedRole, hostelCode.trim() || undefined);
      navigate(ROLE_REDIRECTS[selectedRole] || '/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[420px] flex-col justify-between p-10 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 relative overflow-hidden flex-shrink-0">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">NexStay</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
            Smart PG &<br />Hostel Management
          </h1>
          <p className="text-indigo-200 text-sm leading-relaxed">
            All-in-one platform for hostel owners, wardens, mess managers and students.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: '🏠', text: 'Multi-hostel management' },
              { icon: '👨‍🎓', text: 'Student & room tracking' },
              { icon: '🍽️', text: 'Mess menu & attendance' },
              { icon: '💰', text: 'Rent & payments' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-lg">{f.icon}</span>
                <span className="text-indigo-100 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-indigo-300 text-xs">
          © {new Date().getFullYear()} NexStay. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary">NexStay</span>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-1">Welcome back</h2>
          <p className="text-text-muted text-sm mb-8">Select your role and sign in to continue</p>

          {/* Role selector — dropdown */}
          <div className="mb-6">
            <label className="form-label mb-2">Login as</label>
            <div className="relative">
              <select
                value={selectedRole}
                onChange={e => handleRoleChange(e.target.value)}
                className="input-field appearance-none pr-10 cursor-pointer font-medium text-text-primary"
              >
                {ROLES.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              {/* Chevron icon */}
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hostel Code (conditionally shown) */}
            {currentRole.needsHostelCode && (
              <div>
                <label className="form-label">
                  Hostel Code <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={hostelCode}
                    onChange={e => setHostelCode(e.target.value.toUpperCase())}
                    placeholder="e.g. NST-001"
                    className="input-field pl-9 uppercase"
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-text-muted mt-1">Get this code from your Hostel Admin</p>
              </div>
            )}

            {/* Identifier */}
            <div>
              <label className="form-label">{currentRole.identifierLabel}</label>
              <input
                type={currentRole.identifierType}
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder={currentRole.identifierPlaceholder}
                required
                className="input-field"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="form-label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={currentRole.passwordPlaceholder}
                  required
                  className="input-field pr-10"
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-danger-light border border-danger/20 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                <span className="text-danger text-sm">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center gap-2 py-3 text-base">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
              ) : (
                <><LogIn className="w-4 h-4" />Sign In as {currentRole.label}</>
              )}
            </button>
          </form>

          {/* Dev Credentials */}
          {import.meta.env.DEV && (
            <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3">🛠 Dev Credentials</p>
              <div className="space-y-1">
                {[
                  { role: Role.SUPER_ADMIN,  id: 'admin@nexstay.in',    pw: 'admin123',  label: 'Super Admin',  code: '' },
                  { role: Role.HOSTEL_ADMIN, id: 'rajesh@nexstay.in',   pw: 'owner123',  label: 'Owner',        code: '' },
                  { role: Role.WARDEN,       id: 'warden@nexstay.in',   pw: 'warden123', label: 'Warden',       code: 'NST-001' },
                  { role: Role.MESS_MANAGER, id: 'mess@nexstay.in',     pw: 'mess123',   label: 'Mess Mgr',     code: 'NST-001' },
                  { role: Role.STUDENT,      id: '9000000001',           pw: '0001',      label: 'Student',      code: 'NST-001' },
                ].map(c => (
                  <button key={c.role} type="button"
                    onClick={() => { handleRoleChange(c.role); setIdentifier(c.id); setPassword(c.pw); setHostelCode(c.code); }}
                    className="block w-full text-left text-xs text-indigo-600 hover:text-indigo-800 font-mono py-0.5 transition-colors">
                    [{c.label}] {c.id} / {c.pw}{c.code ? ` · ${c.code}` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
