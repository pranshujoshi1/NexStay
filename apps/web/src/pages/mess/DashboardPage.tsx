import { useQuery } from '@tanstack/react-query';
import { UtensilsCrossed, Users, Calendar, Wallet, ChefHat } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function MessDashboardPage() {
  const { user, hostel } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['mess-dashboard'],
    queryFn: () => api.get('/mess/dashboard').then(r => r.data.data),
  });

  if (isLoading) return <div style={{ textAlign: 'center', padding: 60, color: '#92400e' }}>Loading…</div>;

  const { studentCount, todayMenuUploaded, todayMenu, salary } = data || {};

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Hello, {user?.name?.split(' ')[0]} 🍽️</h1>
        <p style={{ color: '#64748b', margin: 0 }}>{hostel?.name} — Mess Manager Dashboard</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #f1f5f9' }}>
          <div style={{ width: 36, height: 36, background: '#fef3c7', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}><Users size={17} color="#b45309" /></div>
          <p style={{ color: '#0f172a', fontSize: 22, fontWeight: 700, margin: '0 0 2px' }}>{studentCount || 0}</p>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Students to Feed</p>
        </div>
        <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #f1f5f9' }}>
          <div style={{ width: 36, height: 36, background: todayMenuUploaded ? '#dcfce7' : '#fee2e2', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <ChefHat size={17} color={todayMenuUploaded ? '#16a34a' : '#dc2626'} />
          </div>
          <p style={{ color: todayMenuUploaded ? '#16a34a' : '#dc2626', fontSize: 15, fontWeight: 700, margin: '0 0 2px' }}>
            {todayMenuUploaded ? 'Uploaded ✓' : 'Not Uploaded'}
          </p>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Today's Menu</p>
        </div>
      </div>

      {/* Upload CTA */}
      {!todayMenuUploaded && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
          <p style={{ color: '#b45309', fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>⚠️ Today's menu hasn't been uploaded yet!</p>
          <Link to="/mess/menu" style={{ display: 'inline-block', padding: '8px 16px', background: '#d97706', color: 'white', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            Upload Now →
          </Link>
        </div>
      )}

      {/* Today's menu preview */}
      {todayMenu && (
        <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #f1f5f9', marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Today's Uploaded Menu</h3>
          {(['breakfast', 'lunch', 'dinner'] as const).map(meal => (
            <div key={meal} style={{ padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ color: '#64748b', fontSize: 12, textTransform: 'capitalize', fontWeight: 600 }}>{meal}: </span>
              <span style={{ color: '#374151', fontSize: 13 }}>{todayMenu[meal]?.items?.join(', ') || 'Not set'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Salary info */}
      {salary && (
        <div style={{ background: 'linear-gradient(135deg, #7c2d12, #9a3412)', borderRadius: 12, padding: '16px', color: 'white' }}>
          <p style={{ opacity: 0.7, fontSize: 12, margin: '0 0 4px' }}>Your Monthly Salary</p>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>₹{salary?.toLocaleString('en-IN')}</p>
        </div>
      )}
    </div>
  );
}
