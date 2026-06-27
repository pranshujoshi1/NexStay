import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, UtensilsCrossed, CalendarDays, Wallet, LogOut, Menu, X, ChefHat } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

import MessDashboardPage from '@/pages/mess/DashboardPage';
import MessMenuPage      from '@/pages/mess/MenuPage';
import MessHistoryPage   from '@/pages/mess/MenuHistoryPage';
import MessSalaryPage    from '@/pages/mess/SalaryPage';

const NAV = [
  { to: '/mess/dashboard', label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/mess/menu',      label: "Today's Menu", icon: UtensilsCrossed },
  { to: '/mess/history',   label: 'Menu History', icon: CalendarDays },
  { to: '/mess/salary',    label: 'My Salary',    icon: Wallet },
];

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

export default function MessShell() {
  const { user, hostel, logout } = useAuth();
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
            <ChefHat className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-text-primary">Nex<span className="text-indigo-600">Stay</span></span>
            <p className="text-[10px] text-text-muted">Mess Manager</p>
          </div>
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
              {getInitials(user?.name || 'M')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
              <p className="text-xs text-text-muted">Mess Manager</p>
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
            Mess Manager — <span className="text-indigo-600">{hostel?.hostelCode}</span>
          </span>
          <div className="ml-auto flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              {getInitials(user?.name || 'M')}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Routes>
              <Route index           element={<MessDashboardPage />} />
              <Route path="dashboard" element={<MessDashboardPage />} />
              <Route path="menu"      element={<MessMenuPage />} />
              <Route path="history"   element={<MessHistoryPage />} />
              <Route path="salary"    element={<MessSalaryPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
