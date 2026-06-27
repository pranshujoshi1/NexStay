import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, BookOpen, CreditCard,
  ShieldCheck, LogOut, Hotel
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import NotificationBell from '@/components/NotificationBell';

// Pages
import SuperDashboard from '@/pages/superadmin/DashboardPage';
import SuperOwnersPage from '@/pages/superadmin/OwnersPage';
import SuperUsersPage from '@/pages/superadmin/GuestsPage';
import SuperPropertiesPage from '@/pages/superadmin/PropertiesVerificationPage';
import SuperBookingsPage from '@/pages/superadmin/BookingsPage';
import SuperReportsPage from '@/pages/superadmin/ReportsPage';
import SuperHostelsPage from '@/pages/superadmin/HostelsPage';

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const NAV = [
  { label: 'Dashboard',    icon: LayoutDashboard, path: '/superadmin/dashboard' },
  { label: 'Owner Verify', icon: ShieldCheck,      path: '/superadmin/owners' },
  { label: 'Hostels',      icon: Hotel,            path: '/superadmin/hostels' },
  { label: 'Users',        icon: Users,            path: '/superadmin/users' },
  { label: 'Properties',   icon: Building2,        path: '/superadmin/properties' },
  { label: 'Bookings',     icon: BookOpen,         path: '/superadmin/bookings' },
  { label: 'Revenue',      icon: CreditCard,       path: '/superadmin/reports' },
];

export default function SuperAdminShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="h-screen overflow-hidden bg-surface flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[220px] bg-white border-r border-surface-border flex-shrink-0 h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-surface-border">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-text-primary">Nex<span className="text-indigo-600">Stay</span></span>
            <p className="text-[10px] text-text-muted">Super Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ label, icon: Icon, path }) => (
            <NavLink key={path} to={path}
              className={({ isActive }) => cn(
                'nav-item',
                isActive && 'text-indigo-600 bg-indigo-50 font-semibold'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-2 py-3 border-t border-surface-border">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-surface transition-colors">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {getInitials(user?.name || 'SA')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
              <p className="text-xs text-text-muted">Super Admin</p>
            </div>
            <button onClick={handleLogout} className="text-text-muted hover:text-danger transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-surface-border flex items-center gap-3 px-6 sticky top-0 z-30">
          <span className="text-sm font-semibold text-text-primary">NexStay Platform Admin</span>
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              {getInitials(user?.name || 'SA')}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="dashboard"  element={<SuperDashboard />} />
            <Route path="owners"     element={<SuperOwnersPage />} />
            <Route path="hostels"    element={<SuperHostelsPage />} />
            <Route path="users"      element={<SuperUsersPage />} />
            <Route path="properties" element={<SuperPropertiesPage />} />
            <Route path="bookings"   element={<SuperBookingsPage />} />
            <Route path="reports"    element={<SuperReportsPage />} />
            <Route path="*"          element={<SuperDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
