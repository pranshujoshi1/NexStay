import { useQuery } from '@tanstack/react-query';
import { Users, BedDouble, MessageSquare, IndianRupee, AlertCircle, UtensilsCrossed } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, background: `${color}15`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={color} />
        </div>
      </div>
      <p style={{ color: '#0f172a', fontSize: 22, fontWeight: 700, margin: '0 0 2px' }}>{value}</p>
      <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>{label}</p>
      {sub && <p style={{ color: '#94a3b8', fontSize: 11, margin: '4px 0 0' }}>{sub}</p>}
    </div>
  );
}

export default function WardenDashboardPage() {
  const { user, hostel } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['warden-dashboard'],
    queryFn: () => api.get('/warden/dashboard').then(r => r.data.data),
  });

  if (isLoading) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading…</div>;

  const { stats, todayMenu } = data || {};

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Welcome, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ color: '#64748b', margin: 0 }}>{hostel?.name} — {hostel?.hostelCode} · Warden Dashboard</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard icon={Users}        label="Active Students"   value={stats?.totalStudents || 0}  color="#1d4ed8" />
        <StatCard icon={BedDouble}    label="Available Beds"    value={stats?.availableBeds || 0} color="#16a34a" sub={`${stats?.occupiedBeds || 0} occupied`} />
        <StatCard icon={MessageSquare} label="Open Complaints" value={stats?.openComplaints || 0} color="#dc2626" />
        <StatCard icon={IndianRupee}  label="Pending Rent"      value={stats?.pendingRentCount || 0} color="#d97706" sub="students" />
      </div>

      {/* Today's Menu */}
      <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #f1f5f9' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <UtensilsCrossed size={16} color="#b45309" /> Today's Mess Menu
        </h3>
        {todayMenu ? (
          <div style={{ display: 'grid', gap: 8 }}>
            {(['breakfast', 'lunch', 'dinner'] as const).map(meal => (
              <div key={meal} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                <p style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, margin: '0 0 4px' }}>{meal}</p>
                <p style={{ color: '#0f172a', fontSize: 13, margin: 0 }}>{todayMenu[meal]?.items?.join(', ') || '—'}</p>
              </div>
            ))}
          </div>
        ) : <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Menu not yet uploaded for today</p>}
      </div>
    </div>
  );
}
