import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Search, Menu, X, Building2, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/shared';

// Pages
import HomePage from '@/pages/public/HomePage';
import SearchPage from '@/pages/public/SearchPage';
import PropertyDetailPage from '@/pages/public/PropertyDetailPage';
import BookingFlowPage from '@/pages/public/BookingFlowPage';

export default function MarketplaceLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const navigate = useNavigate();

  const handleNavSearch = () => {
    const q = navSearch.trim();
    navigate(q ? `/search?city=${encodeURIComponent(q)}` : '/search');
    setNavSearch('');
  };

  const handleLogout = () => { logout(); setMenuOpen(false); };

  const getDashboardLink = () => {
    if (user?.role === Role.HOSTEL_ADMIN)  return '/admin/dashboard';
    if (user?.role === Role.SUPER_ADMIN)   return '/superadmin/dashboard';
    if (user?.role === Role.WARDEN)        return '/warden/dashboard';
    if (user?.role === Role.MESS_MANAGER)  return '/mess/dashboard';
    if (user?.role === Role.STUDENT)       return '/student/dashboard';
    return '/login';
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-surface-border shadow-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary">
              Nex<span className="text-primary">Stay</span>
            </span>
          </Link>

          {/* Search bar — desktop */}
          <div className="hidden md:flex flex-1 max-w-md items-center gap-2 bg-surface border border-surface-border rounded-lg px-3 py-2 hover:border-primary/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
            <input
              id="nav-search"
              value={navSearch}
              onChange={e => setNavSearch(e.target.value)}
              placeholder="Search by city, locality or PG name..."
              className="bg-transparent text-sm text-text-primary placeholder-text-muted outline-none flex-1"
              onKeyDown={(e) => { if (e.key === 'Enter') handleNavSearch(); }}
            />
            {navSearch && (
              <button onClick={handleNavSearch} className="text-xs text-blue-600 font-medium px-2 py-0.5 rounded hover:bg-blue-50">
                Search
              </button>
            )}
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
            {user ? (
              <div className="flex items-center gap-2">
                <Link to={getDashboardLink()} className="flex items-center gap-2 btn-secondary">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <button onClick={handleLogout} className="btn-ghost flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary flex items-center gap-2">
                <LogIn className="w-4 h-4" />Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden ml-auto text-text-secondary hover:text-text-primary" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile search */}
        <div className="md:hidden px-4 pb-3 flex items-center gap-2 bg-white border-t border-surface-border">
          <Search className="w-4 h-4 text-text-muted" />
          <input
            id="nav-search-mobile"
            value={navSearch}
            onChange={e => setNavSearch(e.target.value)}
            placeholder="Search city, locality..."
            className="flex-1 text-sm text-text-primary placeholder-text-muted outline-none bg-transparent py-1.5"
            onKeyDown={e => { if (e.key === 'Enter') { handleNavSearch(); setMenuOpen(false); } }}
          />
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-surface-border px-4 py-3 space-y-1 animate-slide-up">
            {user ? (
              <>
                <Link to={getDashboardLink()} className="nav-item" onClick={() => setMenuOpen(false)}>
                  <LayoutDashboard className="w-4 h-4" />Dashboard
                </Link>
                <button onClick={handleLogout} className="nav-item w-full text-left text-danger">
                  <LogOut className="w-4 h-4" />Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="nav-item" onClick={() => setMenuOpen(false)}><LogIn className="w-4 h-4" />Login</Link>
            )}
          </div>
        )}
      </header>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <main>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="property/:id" element={<PropertyDetailPage />} />
          <Route path="book/:propertyId" element={<BookingFlowPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
    </div>
  );
}
