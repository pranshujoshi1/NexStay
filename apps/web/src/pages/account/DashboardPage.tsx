import { useNavigate } from 'react-router-dom';
import { BookOpen, MessageSquare, User, Home, ChevronRight, BedDouble, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

function useGuestBookings(token: string | null) {
  return useQuery({
    queryKey: ['guest-bookings'],
    queryFn: async () => {
      const { data } = await axios.get('/api/guest/bookings', { headers: { Authorization: `Bearer ${token}` } });
      return data.data as any[];
    },
    enabled: !!token,
    staleTime: 60000,
  });
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-amber-100 text-amber-700',
  CONFIRMED:  'bg-blue-100 text-blue-700',
  CHECKED_IN: 'bg-green-100 text-green-700',
  CHECKED_OUT:'bg-slate-100 text-slate-600',
  CANCELLED:  'bg-red-100 text-red-600',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const { data: bookings = [] } = useGuestBookings(accessToken);

  const currentStay = bookings.find(b => b.status === 'CHECKED_IN');
  const recentBooking = bookings[0];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Welcome */}
      <div>
        <div className="text-2xl font-bold text-slate-900">
          Hello, {user?.name?.split(' ')[0]} 👋
        </div>
        <p className="text-slate-500 text-sm mt-1">Welcome to your NexStay account</p>
      </div>

      {/* Current Stay Card */}
      {currentStay ? (
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <BedDouble className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-blue-100 text-xs font-semibold uppercase tracking-wide mb-1">Current Stay</p>
              <h3 className="font-bold text-lg leading-tight">{currentStay.propertyId?.name ?? 'Your PG'}</h3>
              <p className="text-blue-200 text-sm">{currentStay.propertyId?.city}</p>
              <div className="flex items-center gap-3 mt-3 text-sm">
                <span className="bg-white/20 px-2 py-1 rounded-lg text-xs">
                  Room {currentStay.roomId?.roomNumber ?? '—'} · Bed {currentStay.bedId?.bedNumber ?? '—'}
                </span>
                <span className="bg-white/20 px-2 py-1 rounded-lg text-xs">
                  ₹{(currentStay.roomId?.pricePerBed ?? 0).toLocaleString('en-IN')}/mo
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : recentBooking ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Latest Booking</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[recentBooking.status] ?? 'bg-slate-100 text-slate-600'}`}>
              {recentBooking.status}
            </span>
          </div>
          <p className="font-bold text-slate-900">{recentBooking.propertyId?.name ?? 'Property'}</p>
          <p className="text-xs text-slate-500">{recentBooking.propertyId?.city}</p>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
          <div className="text-3xl mb-2">🏠</div>
          <p className="font-semibold text-slate-800">No bookings yet</p>
          <p className="text-sm text-slate-500 mb-3">Find a PG and make your first booking</p>
          <button onClick={() => navigate('/')} className="text-sm text-blue-600 font-semibold hover:underline">Explore PGs →</button>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: BookOpen, label: 'My Bookings', desc: `${bookings.length} total`, path: '/account/bookings', color: 'text-blue-600 bg-blue-50' },
            { icon: MessageSquare, label: 'Complaints', desc: 'View & raise', path: '/account/complaints', color: 'text-violet-600 bg-violet-50' },
            { icon: User, label: 'Profile', desc: 'Edit details', path: '/account/profile', color: 'text-green-600 bg-green-50' },
          ].map(({ icon: Icon, label, desc, path, color }) => (
            <button key={path} onClick={() => navigate(path)}
              className="bg-white border border-slate-200 rounded-2xl p-4 text-left hover:shadow-md hover:border-slate-300 transition-all group">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="font-semibold text-slate-900 text-sm">{label}</div>
              <div className="text-xs text-slate-500">{desc}</div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 mt-2 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Back to home */}
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <Home className="w-4 h-4" /> Back to Marketplace
      </button>
    </div>
  );
}
