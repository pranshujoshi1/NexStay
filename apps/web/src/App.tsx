import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/shared';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';

// Shells
import MarketplaceLayout from '@/layouts/MarketplaceLayout';
import GuestPortalLayout from '@/layouts/GuestPortalLayout';
import HostelAdminShell from '@/layouts/HostelAdminShell';
import SuperAdminShell from '@/layouts/SuperAdminShell';

// Lazy shells for new portals
const WardenShell    = lazy(() => import('@/layouts/WardenShell'));
const MessShell      = lazy(() => import('@/layouts/MessShell'));
const StudentShell   = lazy(() => import('@/layouts/StudentShell'));

// Auth pages
import LoginPage from '@/pages/auth/Login';
import ForgotPasswordPage from '@/pages/auth/ForgotPassword';
import OtpVerificationPage from '@/pages/auth/OtpVerification';

// ─── Loading ──────────────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
      <p style={{ color: '#64748b', fontSize: 14 }}>Loading NexStay...</p>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── 403 ─────────────────────────────────────────────────────────────────────
const ForbiddenPage = () => (
  <div className="min-h-screen bg-surface flex items-center justify-center">
    <div className="text-center">
      <div className="text-6xl font-bold text-danger mb-4">403</div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
      <p className="text-text-secondary mb-6">You don't have permission to access this page.</p>
      <a href="/" className="btn-primary inline-block">Go Home</a>
    </div>
  </div>
);

// ─── Guards ───────────────────────────────────────────────────────────────────
const RequireAuth = ({ roles, children }: { roles?: string[]; children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to={`/login`} state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <ForbiddenPage />;
  return <>{children}</>;
};

// Redirect logged-in users away from login page to their dashboard
const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (user?.role === Role.SUPER_ADMIN)  return <Navigate to="/superadmin/dashboard" replace />;
  if (user?.role === Role.HOSTEL_ADMIN) return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === Role.WARDEN)       return <Navigate to="/warden/dashboard" replace />;
  if (user?.role === Role.MESS_MANAGER) return <Navigate to="/mess/dashboard" replace />;
  if (user?.role === Role.STUDENT)      return <Navigate to="/student/dashboard" replace />;
  return <>{children}</>;
};

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const { isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#fff', color: '#0F172A', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '14px' },
          success: { iconTheme: { primary: '#16A34A', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
        }}
      />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* ── Auth ──────────────────────────────────────── */}
          <Route path="/login"            element={<AuthRedirect><LoginPage /></AuthRedirect>} />
          <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
          <Route path="/verify-otp"       element={<OtpVerificationPage />} />

          {/* ── Student Portal ────────────────────────────── */}
          <Route path="/student/*" element={
            <RequireAuth roles={[Role.STUDENT]}>
              <StudentShell />
            </RequireAuth>
          } />

          {/* ── Legacy Student account portal ─────────────── */}
          <Route path="/account/*" element={
            <RequireAuth>
              <GuestPortalLayout />
            </RequireAuth>
          } />

          {/* ── Hostel Admin ERP ──────────────────────────── */}
          <Route path="/admin/*" element={
            <RequireAuth roles={[Role.HOSTEL_ADMIN]}>
              <HostelAdminShell />
            </RequireAuth>
          } />

          {/* ── Warden Portal ─────────────────────────────── */}
          <Route path="/warden/*" element={
            <RequireAuth roles={[Role.WARDEN]}>
              <WardenShell />
            </RequireAuth>
          } />

          {/* ── Mess Manager Portal ───────────────────────── */}
          <Route path="/mess/*" element={
            <RequireAuth roles={[Role.MESS_MANAGER]}>
              <MessShell />
            </RequireAuth>
          } />

          {/* ── Super Admin Panel ─────────────────────────── */}
          <Route path="/superadmin/*" element={
            <RequireAuth roles={[Role.SUPER_ADMIN]}>
              <SuperAdminShell />
            </RequireAuth>
          } />

          {/* ── 403 ──────────────────────────────────────── */}
          <Route path="/403" element={<ForbiddenPage />} />

          {/* ── Public Marketplace (catch-all — must be last) ── */}
          <Route path="/*" element={<MarketplaceLayout />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
