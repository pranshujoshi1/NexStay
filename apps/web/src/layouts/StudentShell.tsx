import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, IndianRupee, UtensilsCrossed,
  AlertCircle, Bell, User, LogOut, Menu, X, GraduationCap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

import StudentDashboardPage  from '@/pages/student/DashboardPage';
import StudentRentPage       from '@/pages/student/RentPage';
import StudentMessPage       from '@/pages/student/MessPage';
import StudentComplaintsPage from '@/pages/student/ComplaintsPage';
import StudentNoticesPage    from '@/pages/student/NoticesPage';
import StudentProfilePage    from '@/pages/student/ProfilePage';

const NAV = [
  { to: '/student/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/student/rent',       label: 'Rent',        icon: IndianRupee },
  { to: '/student/mess',       label: 'Mess Menu',   icon: UtensilsCrossed },
  { to: '/student/complaints', label: 'Complaints',  icon: AlertCircle },
  { to: '/student/notices',    label: 'Notices',     icon: Bell },
  { to: '/student/profile',    label: 'Profile',     icon: User },
];

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

export default function StudentShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-text-primary">Nex<span className="text-indigo-600">Stay</span></span>
            <p className="text-[10px] text-text-muted">Student Portal</p>
          </div>
          <button className="lg:hidden ml-auto text-text-muted" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Greeting card */}
        <div className="px-3 py-2 border-b border-surface-border">
          <div className="bg-indigo-50 rounded-lg px-3 py-2">
            <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Welcome back</p>
            <p className="text-sm font-semibold text-indigo-900 truncate">{user?.name || 'Student'}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                'nav-item',
                isActive && 'text-indigo-600 bg-indigo-50 font-semibold'
              )}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-2 py-3 border-t border-surface-border">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-surface transition-colors">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {getInitials(user?.name || 'S')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
              <p className="text-xs text-text-muted">Student</p>
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
            Student Portal
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-text-muted hidden sm:block">{user?.name}</span>
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              {getInitials(user?.name || 'S')}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-4xl mx-auto">
            <Routes>
              <Route index           element={<StudentDashboardPage />} />
              <Route path="dashboard"  element={<StudentDashboardPage />} />
              <Route path="rent"       element={<StudentRentPage />} />
              <Route path="mess"       element={<StudentMessPage />} />
              <Route path="complaints" element={<StudentComplaintsPage />} />
              <Route path="notices"    element={<StudentNoticesPage />} />
              <Route path="profile"    element={<StudentProfilePage />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
