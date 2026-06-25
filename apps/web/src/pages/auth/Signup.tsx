import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, ArrowRight, Loader2, CheckCircle2, Home } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Role values must exactly match what the backend accepts ─────────────────
// Backend allowedRoles: ['GUEST', 'HOSTEL_ADMIN']
const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid phone number').max(15),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['GUEST', 'HOSTEL_ADMIN']),
  businessName: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pre-select role based on URL param (e.g. /signup?role=HOSTEL_ADMIN from "List Your PG")
  const roleParam = searchParams.get('role');
  const defaultRole = roleParam === 'HOSTEL_ADMIN' ? 'HOSTEL_ADMIN' : 'GUEST';

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole },
  });
  const selectedRole = watch('role');
  const isOwner = selectedRole === 'HOSTEL_ADMIN';

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      // role is already 'GUEST' or 'HOSTEL_ADMIN' — matches backend exactly
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role,
        ...(data.role === 'HOSTEL_ADMIN' && data.businessName ? { businessName: data.businessName } : {}),
      };
      const res = await api.post('/auth/register', payload);
      navigate('/verify-otp', { state: { email: data.email, otp: res.data.otp, role: data.role } });
    } catch (err: any) {
      setServerError(err?.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-surface-dark flex">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-[40%] relative overflow-hidden flex-col justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/15 via-surface-dark to-surface-card" />
        <div className="absolute top-20 right-0 w-72 h-72 bg-brand-secondary/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-text-primary">Nex<span className="text-brand-primary">Stay</span></span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-4 leading-tight">
            Join thousands of<br />
            <span className="bg-brand-gradient bg-clip-text text-transparent">PG owners & students</span>
          </h1>
          <p className="text-text-muted text-base mb-10">Create your free account and start managing smarter today.</p>
          {['Free to get started — no credit card required', 'Set up your first PG in under 5 minutes', 'Real-time rent tracking & notifications', 'Student mobile app included'].map((b) => (
            <div key={b} className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="w-4 h-4 text-status-success flex-shrink-0" />
              <span className="text-text-muted text-sm">{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-[60%] flex items-center justify-center p-8">
        <div className="w-full max-w-lg animate-slide-up">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary">Nex<span className="text-brand-primary">Stay</span></span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-1">Create your account</h2>
          <p className="text-text-muted mb-6">Get started with NexStay for free</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                {/* GUEST = student/tenant looking to book */}
                <button type="button" onClick={() => setValue('role', 'GUEST')}
                  className={cn('p-3 rounded-lg border text-left transition-all duration-200',
                    selectedRole === 'GUEST' ? 'border-brand-primary bg-brand-primary/10 shadow-sm' : 'border-surface-border bg-surface-card hover:border-brand-primary/40')}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Home className={cn('w-4 h-4', selectedRole === 'GUEST' ? 'text-brand-primary' : 'text-text-muted')} />
                    <p className={cn('font-medium text-sm', selectedRole === 'GUEST' ? 'text-text-primary' : 'text-text-muted')}>Student / Tenant</p>
                  </div>
                  <p className="text-xs text-text-faint mt-0.5 pl-6">Looking for a PG</p>
                </button>
                {/* HOSTEL_ADMIN = property owner who manages PGs */}
                <button type="button" onClick={() => setValue('role', 'HOSTEL_ADMIN')}
                  className={cn('p-3 rounded-lg border text-left transition-all duration-200',
                    selectedRole === 'HOSTEL_ADMIN' ? 'border-brand-primary bg-brand-primary/10 shadow-sm' : 'border-surface-border bg-surface-card hover:border-brand-primary/40')}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Building2 className={cn('w-4 h-4', selectedRole === 'HOSTEL_ADMIN' ? 'text-brand-primary' : 'text-text-muted')} />
                    <p className={cn('font-medium text-sm', selectedRole === 'HOSTEL_ADMIN' ? 'text-text-primary' : 'text-text-muted')}>PG Owner</p>
                  </div>
                  <p className="text-xs text-text-faint mt-0.5 pl-6">I manage PGs</p>
                </button>
              </div>
              {/* Contextual hint based on selected role */}
              {isOwner ? (
                <p className="text-xs text-brand-primary/80 mt-2 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 flex-shrink-0" /> You'll get access to the full Hostel ERP dashboard after verification
                </p>
              ) : (
                <p className="text-xs text-text-faint mt-2 flex items-center gap-1.5">
                  <Home className="w-3 h-3 flex-shrink-0" /> Browse and book verified PGs & hostels near you
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Full name</label>
                <input {...register('name')} placeholder="Arjun Kumar" className={cn('input-field', errors.name && 'border-status-error')} />
                {errors.name && <p className="text-status-error text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Phone</label>
                <input {...register('phone')} placeholder="9876543210" className={cn('input-field', errors.phone && 'border-status-error')} />
                {errors.phone && <p className="text-status-error text-xs mt-1">{errors.phone.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email address</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className={cn('input-field', errors.email && 'border-status-error')} />
              {errors.email && <p className="text-status-error text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Business name — only for hostel owners */}
            {isOwner && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Business / PG Name <span className="text-text-faint font-normal">(optional)</span>
                </label>
                <input {...register('businessName')} placeholder="e.g. Sunrise Boys PG" className="input-field" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Password</label>
                <input {...register('password')} type="password" placeholder="••••••••" className={cn('input-field', errors.password && 'border-status-error')} />
                {errors.password && <p className="text-status-error text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Confirm</label>
                <input {...register('confirmPassword')} type="password" placeholder="••••••••" className={cn('input-field', errors.confirmPassword && 'border-status-error')} />
                {errors.confirmPassword && <p className="text-status-error text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            {serverError && <div className="bg-status-error/10 border border-status-error/30 rounded-md px-4 py-3 text-sm text-status-error">{serverError}</div>}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : <>Create account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-text-muted text-sm mt-4">
            Already have an account? <Link to="/login" className="text-brand-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
