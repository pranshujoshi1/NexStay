import { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, BedDouble, Users, BookOpen,
  CreditCard, Receipt, MessageSquare, BarChart3, Settings,
  LogOut, Menu, X,
  Package, UserCheck, Database
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import NotificationBell from '@/components/NotificationBell';

// Pages — Marketplace
import AdminDashboard from '@/pages/admin/DashboardPage';
import AdminPropertiesPage from '@/pages/admin/marketplace/PropertiesPage';
import AdminMarketplaceBookingsPage from '@/pages/admin/marketplace/BookingsPage';
// Pages — ERP
import AdminTenantsPage from '@/pages/admin/erp/TenantsPage';
import AdminRoomsBedsPage from '@/pages/admin/erp/RoomsBedsPage';
import AdminRentFeesPage from '@/pages/admin/erp/RentFeesPage';
import AdminStaffPage from '@/pages/admin/erp/StaffPage';
import AdminInventoryPage from '@/pages/admin/erp/InventoryPage';
import AdminExpensesPage from '@/pages/admin/erp/ExpensesPage';
import AdminComplaintsPage from '@/pages/admin/erp/ComplaintsPage';
import AdminReportsPage from '@/pages/admin/erp/ReportsPage';
import StudentProfilePage from '@/pages/admin/erp/StudentProfilePage';
import CheckInPage from '@/pages/admin/erp/CheckInPage';
import CheckOutPage from '@/pages/admin/erp/CheckOutPage';
import StaffProfilePage from '@/pages/admin/erp/StaffProfilePage';
// Pages — Settings
import AdminProfilePage from '@/pages/admin/settings/ProfilePage';
import DevEmailsPage from '@/pages/admin/dev/DevEmailsPage';

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const NAV = [
  { section: 'OVERVIEW', items: [{ label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' }] },
  { section: 'MARKETPLACE', items: [
    { label: 'My Properties', icon: Building2, path: '/admin/properties' },
    { label: 'Bookings', icon: BookOpen, path: '/admin/bookings' },
  ]},
  { section: 'HOSTEL ERP', items: [
    { label: 'Students', icon: Users, path: '/admin/tenants' },
    { label: 'Rooms & Beds', icon: BedDouble, path: '/admin/rooms' },
    { label: 'Rent & Fees', icon: CreditCard, path: '/admin/rent' },
    { label: 'Staff', icon: UserCheck, path: '/admin/staff' },
    { label: 'Inventory', icon: Package, path: '/admin/inventory' },
    { label: 'Expenses', icon: Receipt, path: '/admin/expenses' },
    { label: 'Complaints', icon: MessageSquare, path: '/admin/complaints' },
    { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
  ]},
  { section: 'SETTINGS', items: [
    { label: 'Profile', icon: Settings, path: '/admin/profile' },
    { label: '📬 Mock Emails', icon: Database, path: '/admin/dev/emails' },
  ]},
];

export default function HostelAdminShell() {
  // Collapse by default at tablet (md = 768px), expanded at desktop
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1024);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={cn(
      'flex flex-col bg-white border-r border-surface-border h-full transition-all duration-300',
      mobile ? 'w-64' : collapsed ? 'w-[60px]' : 'w-[240px]'
    )}>
      {/* Logo + ERP pill */}
      <div className={cn('flex items-center gap-3 px-4 py-4 border-b border-surface-border', collapsed && !mobile && 'justify-center px-2')}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        {(!collapsed || mobile) && (
          <div className="flex-1 min-w-0">
            <span className="text-base font-bold text-text-primary">Nex<span className="text-primary">Stay</span></span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-bold bg-primary text-white px-1.5 py-0.5 rounded uppercase tracking-wide">ERP</span>
              <span className="text-[10px] text-text-muted truncate">{user?.businessName || 'Admin Panel'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            {(!collapsed || mobile) && <p className="nav-section-label">{section}</p>}
            {items.map(({ label, icon: Icon, path }) => (
              <NavLink key={path} to={path}
                className={({ isActive }) => cn('nav-item', isActive && 'active', collapsed && !mobile && 'justify-center px-2')}
                title={collapsed && !mobile ? label : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {(!collapsed || mobile) && <span>{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
        {/* Billing — coming soon */}
        {(!collapsed || mobile) && (
          <div className="mt-2">
            <p className="nav-section-label">BILLING</p>
            <div className="nav-item opacity-50 cursor-not-allowed">
              <Database className="w-4 h-4 flex-shrink-0" />
              <span>Billing</span>
              <span className="ml-auto text-[9px] bg-surface-border text-text-muted px-1.5 py-0.5 rounded">Soon</span>
            </div>
          </div>
        )}
      </nav>

      {/* User */}
      <div className={cn('px-2 py-3 border-t border-surface-border', collapsed && !mobile && 'flex justify-center')}>
        {(!collapsed || mobile) ? (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-surface transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {getInitials(user?.name || 'A')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-text-muted hover:text-danger transition-colors flex-shrink-0">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="text-text-muted hover:text-danger transition-colors p-2">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <div className="h-screen overflow-hidden bg-surface flex">
      {/* Mobile overlay (only below md=768px) */}
      {mobileOpen && <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setMobileOpen(false)} />}
      <div className={cn('md:hidden fixed left-0 top-0 h-full z-50 transition-transform duration-300', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <Sidebar mobile />
      </div>

      {/* Desktop sidebar (visible from md=768px) */}
      <div className="hidden md:flex flex-col flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-surface-border flex items-center gap-3 px-4 flex-shrink-0 sticky top-0 z-30">
          {/* Hamburger — mobile opens drawer, desktop toggles collapse */}
          <button
            onClick={() => window.innerWidth < 768 ? setMobileOpen(!mobileOpen) : setCollapsed(!collapsed)}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <NotificationBell />
          <div className="flex items-center gap-2 pl-2 border-l border-surface-border">
            <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              {getInitials(user?.name || 'A')}
            </div>
            <span className="text-sm font-medium text-text-primary hidden sm:block">{user?.name?.split(' ')[0]}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="properties" element={<AdminPropertiesPage />} />
            <Route path="bookings" element={<AdminMarketplaceBookingsPage />} />
            <Route path="tenants" element={<AdminTenantsPage />} />
            <Route path="tenants/:id" element={<StudentProfilePage />} />
            <Route path="rooms" element={<AdminRoomsBedsPage />} />
            <Route path="rent" element={<AdminRentFeesPage />} />
            <Route path="staff" element={<AdminStaffPage />} />
            <Route path="staff/:id" element={<StaffProfilePage />} />
            <Route path="inventory" element={<AdminInventoryPage />} />
            <Route path="expenses" element={<AdminExpensesPage />} />
            <Route path="complaints" element={<AdminComplaintsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="checkin" element={<CheckInPage />} />
            <Route path="checkout/:studentId" element={<CheckOutPage />} />
            <Route path="dev/emails" element={<DevEmailsPage />} />
            <Route path="*" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
