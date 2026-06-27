import { useQuery } from '@tanstack/react-query';
import { IndianRupee, Bell, UtensilsCrossed, AlertCircle, BedDouble, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{label}</p>
        <p style={{ color: '#0f172a', fontSize: 18, fontWeight: 700, margin: '2px 0 0' }}>{value}</p>
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => api.get('/student/dashboard').then(r => r.data.data),
  });

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  const d = data;
  const todayMenu = d?.todayMenu;
  const currentRent = d?.currentRent;
  const rentStatus = currentRent?.status || 'UNPAID';

  return (
    <div>
      {/* Greeting */}
      <div style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', borderRadius: 16, padding: '20px 24px', marginBottom: 20, color: 'white' }}>
        <p style={{ margin: '0 0 4px', opacity: 0.75, fontSize: 14 }}>{d?.greeting || 'Hello'},</p>
        <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 700 }}>{user?.name} 👋</h1>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {d?.student?.hostelName && <span style={{ fontSize: 13, opacity: 0.8 }}>🏠 {d.student.hostelName}</span>}
          {d?.student?.roomNumber && <span style={{ fontSize: 13, opacity: 0.8 }}>🚪 Room {d.student.roomNumber} · Bed {d.student.bedNumber}</span>}
          {d?.student?.stayDays > 0 && <span style={{ fontSize: 13, opacity: 0.8 }}>📅 {d.student.stayDays} days stay</span>}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard icon={IndianRupee} label="This Month Rent" color="#1d4ed8"
          value={currentRent ? `₹${currentRent.amount?.toLocaleString('en-IN')}` : '—'} />
        <StatCard icon={AlertCircle} label="Open Complaints" color="#dc2626" value={d?.pendingComplaints ?? 0} />
      </div>

      {/* Rent Status */}
      {currentRent && (
        <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #f1f5f9', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 4px' }}>Rent — {currentRent.month}</p>
              <p style={{ color: '#0f172a', fontSize: 20, fontWeight: 700, margin: 0 }}>₹{currentRent.amount?.toLocaleString('en-IN')}</p>
            </div>
            <span style={{
              padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700,
              background: rentStatus === 'PAID' ? '#dcfce7' : '#fee2e2',
              color: rentStatus === 'PAID' ? '#16a34a' : '#dc2626',
            }}>{rentStatus}</span>
          </div>
          {rentStatus !== 'PAID' && (
            <p style={{ color: '#b45309', fontSize: 13, margin: '8px 0 0', background: '#fef3c7', padding: '6px 10px', borderRadius: 6 }}>
              ⚠️ Due by {currentRent.dueDate ? new Date(currentRent.dueDate).toLocaleDateString('en-IN') : 'N/A'} — Contact warden to pay
            </p>
          )}
        </div>
      )}

      {/* Today's Mess Menu */}
      <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #f1f5f9', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <UtensilsCrossed size={16} color="#b45309" /> Today's Mess Menu
        </h3>
        {todayMenu ? (
          <div style={{ display: 'grid', gap: 8 }}>
            {(['breakfast', 'lunch', 'dinner'] as const).map(meal => (
              <div key={meal} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                <p style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px', fontWeight: 600 }}>{meal}</p>
                <p style={{ color: '#0f172a', fontSize: 13, margin: 0 }}>
                  {todayMenu[meal]?.items?.join(', ') || 'Not updated'}
                </p>
              </div>
            ))}
            {todayMenu.specialNote && (
              <p style={{ color: '#7c3aed', fontSize: 13, margin: 0, background: '#f3f0ff', padding: '8px 10px', borderRadius: 6 }}>{todayMenu.specialNote}</p>
            )}
          </div>
        ) : (
          <p style={{ color: '#94a3b8', fontSize: 14, margin: 0, textAlign: 'center', padding: '20px 0' }}>Menu not uploaded yet for today</p>
        )}
      </div>

      {/* Recent Notices */}
      {d?.recentNotices?.length > 0 && (
        <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bell size={16} color="#1d4ed8" /> Recent Notices
          </h3>
          {d.recentNotices.map((n: any) => (
            <div key={n._id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: n.isRead ? '#cbd5e1' : '#3b82f6', marginTop: 6, flexShrink: 0 }} />
              <div>
                <p style={{ color: '#0f172a', fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{n.title}</p>
                <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
