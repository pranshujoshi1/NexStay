import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthUser, Role, IHostel } from '../types/shared';
import api from '../lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  hostel: IHostel | null;        // For WARDEN / MESS_MANAGER
  hostels: IHostel[];            // For HOSTEL_ADMIN
  selectedHostelId: string | null;
  setSelectedHostelId: (id: string | null) => void;
  accessToken: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string, role: string, hostelCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isWarden: boolean;
  isMessManager: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY   = 'nexstay_token';
const REFRESH_KEY = 'nexstay_refresh';
const HOSTEL_KEY  = 'nexstay_selected_hostel';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]                     = useState<AuthUser | null>(null);
  const [hostel, setHostel]                 = useState<IHostel | null>(null);
  const [hostels, setHostels]               = useState<IHostel[]>([]);
  const [accessToken, setAccessToken]       = useState<string | null>(null);
  const [isLoading, setIsLoading]           = useState(true);
  const [selectedHostelId, _setSelectedHostelId] = useState<string | null>(
    () => sessionStorage.getItem(HOSTEL_KEY)
  );

  const setSelectedHostelId = useCallback((id: string | null) => {
    _setSelectedHostelId(id);
    if (id) sessionStorage.setItem(HOSTEL_KEY, id);
    else sessionStorage.removeItem(HOSTEL_KEY);
  }, []);

  // Bootstrap: hydrate from stored token
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setIsLoading(false); return; }
    setAccessToken(token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    api.get('/auth/me')
      .then(r => {
        setUser(r.data.user);
        if (r.data.hostel) setHostel(r.data.hostel);
        if (r.data.hostels?.length) {
          setHostels(r.data.hostels);
          const stored = sessionStorage.getItem(HOSTEL_KEY);
          if (!stored) setSelectedHostelId(r.data.hostels[0]._id);
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (identifier: string, password: string, role: string, hostelCode?: string) => {
    const payload: Record<string, string> = { identifier, password, role };
    if (hostelCode) payload.hostelCode = hostelCode.toUpperCase();
    const { data } = await api.post('/auth/login', payload);
    const { user: u, accessToken: at, refreshToken: rt, hostel: h, hostels: hs } = data;

    localStorage.setItem(TOKEN_KEY, at);
    if (rt) localStorage.setItem(REFRESH_KEY, rt);
    api.defaults.headers.common['Authorization'] = `Bearer ${at}`;

    setUser(u);
    setAccessToken(at);
    if (h) setHostel(h);
    if (hs?.length) {
      setHostels(hs);
      const stored = sessionStorage.getItem(HOSTEL_KEY);
      if (!stored) setSelectedHostelId(hs[0]._id);
    }
  }, [setSelectedHostelId]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(HOSTEL_KEY);
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setAccessToken(null);
    setHostel(null);
    setHostels([]);
    _setSelectedHostelId(null);
  }, []);

  const value: AuthContextValue = {
    user, hostel, hostels, selectedHostelId, setSelectedHostelId,
    accessToken, isLoading,
    login, logout,
    isAuthenticated: !!user,
    isSuperAdmin:  user?.role === Role.SUPER_ADMIN,
    isAdmin:       user?.role === Role.HOSTEL_ADMIN,
    isWarden:      user?.role === Role.WARDEN,
    isMessManager: user?.role === Role.MESS_MANAGER,
    isStudent:     user?.role === Role.STUDENT,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
