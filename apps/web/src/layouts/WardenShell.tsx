import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Users, DoorOpen, MessageSquare, IndianRupee, Wallet,
  UtensilsCrossed, LogOut, Menu, X, ShieldCheck, Lock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { StaffPermissions } from '@/types/shared';
import { cn } from '@/lib/utils';

// Pages
import WardenDashboardPage  from '@/pages/warden/DashboardPage';
import WardenStudentsPage   from '@/pages/warden/StudentsPage';
import WardenRoomsPage      from '@/pages/warden/RoomsPage';
import WardenComplaintsPage from '@/pages/warden/ComplaintsPage';
import WardenRentPage       from '@/pages/warden/RentPage';
import WardenSalaryPage     from '@/pages/warden/SalaryPage';
import WardenMenuPage       from '@/pages/warden/MenuPage';

const perm = (p: keyof StaffPermissions) => (perms?: StaffPermissions | null) => perms?.[p] ?? false;
const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

export default function WardenShell() {
  const { user, hostel, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const perms = user?.staffPermissions;

  const navItems = [
    { to: '/warden/dashboard',   label: 'Dashboard',    icon: LayoutDashboard, allowed: true },
    { to: '/warden/students',    label: 'Students',     icon: Users,           allowed: perm('canViewStudents')(perms) },
    { to: '/warden/rooms',       label: 'Rooms',        icon: DoorOpen,        allowed: perm('canManageRooms')(perms) },
    { to: '/warden/complaints',  label: 'Complaints',   icon: MessageSquare,   allowed: perm('canManageComplaints')(perms) },
    { to: '/warden/rent',        label: 'Rent Records', icon: IndianRupee,     allowed: perm('canViewRentRecords')(perms) },
    { to: '/warden/salary',      label: 'My Salary',    icon: Wallet,          allowed: perm('canViewSalary')(perms) },
    { to: '/warden/menu',        label: "Today's Menu", icon: UtensilsCrossed, allowed: true },
  ];

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="h-screen overflow-hidden bg-surface flex">
      {/* Sidebar */}
      <aside className={cn(
        'flex-col w-[220px] bg-white border-r border-surface-border flex-shrink-0 h-full flex',
        'fixed lg:relative inset-y-0 left-0 z-40 transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-surface-border">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-text-primary">Nex<span className="text-indigo-600">Stay</span></span>
            <p className="text-[10px] text-text-muted">Warden Portal</p>
          </div>
          {/* Mobile close */}
          <button className="lg:hidden ml-auto text-text-muted" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hostel info */}
        <div className="px-3 py-2 border-b border-surface-border">
          <div className="bg-indigo-50 rounded-lg px-3 py-2">
            <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">{hostel?.hostelCode}</p>
            <p className="text-sm font-semibold text-indigo-900 truncate">{hostel?.name || 'Hostel'}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            item.allowed ? (
              <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => cn(
                  'nav-item',
                  isActive && 'text-indigo-600 bg-indigo-50 font-semibold'
                )}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ) : (
              <div key={item.to} className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-faint cursor-not-allowed text-sm">
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                <Lock className="w-3 h-3" />
              </div>
            )
          ))}
        </nav>

        {/* User footer */}
        <div className="px-2 py-3 border-t border-surface-border">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-surface transition-colors">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {getInitials(user?.name || 'W')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
              <p className="text-xs text-text-muted">Warden</p>
            </div>
            <button onClick={handleLogout} className="text-text-muted hover:text-danger transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-surface-border flex items-center gap-3 px-4 lg:px-6 sticky top-0 z-30">
          <button className="lg:hidden text-text-muted" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-text-primary hidden sm:block">
            Warden — <span className="text-indigo-600">{hostel?.hostelCode}</span>
          </span>
          <div className="ml-auto flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              {getInitials(user?.name || 'W')}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Routes>
              <Route index           element={<WardenDashboardPage />} />
              <Route path="dashboard"  element={<WardenDashboardPage />} />
              <Route path="students"   element={perms?.canViewStudents     ? <WardenStudentsPage />   : <AccessRestricted permission="canViewStudents" />} />
              <Route path="rooms"      element={perms?.canManageRooms      ? <WardenRoomsPage />      : <AccessRestricted permission="canManageRooms" />} />
              <Route path="complaints" element={perms?.canManageComplaints ? <WardenComplaintsPage /> : <AccessRestricted permission="canManageComplaints" />} />
              <Route path="rent"       element={perms?.canViewRentRecords  ? <WardenRentPage />       : <AccessRestricted permission="canViewRentRecords" />} />
              <Route path="salary"     element={perms?.canViewSalary       ? <WardenSalaryPage />     : <AccessRestricted permission="canViewSalary" />} />
              <Route path="menu"       element={<WardenMenuPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function AccessRestricted({ permission }: { permission: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <Lock className="w-7 h-7 text-red-400" />
      </div>
      <h2 className="text-lg font-bold text-text-primary mb-2">Access Restricted</h2>
      <p className="text-text-muted text-sm">
        You don't have permission to view this section.<br />
        Contact your hostel admin to enable <strong>{permission}</strong>.
      </p>
    </div>
  );
}
