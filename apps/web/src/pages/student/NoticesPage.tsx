import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import api from '@/lib/api';

export default function StudentNoticesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['student-notices'],
    queryFn: () => api.get('/student/notices').then(r => r.data),
  });
  const notices: any[] = data?.data || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Notices {data?.unreadCount > 0 && <span style={{ marginLeft: 6, background: '#1d4ed8', color: 'white', borderRadius: 100, fontSize: 11, padding: '2px 8px', fontWeight: 700 }}>{data.unreadCount}</span>}
        </h1>
      </div>
      {isLoading ? <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading…</p> :
       notices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Bell size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <p style={{ color: '#94a3b8' }}>No notices yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notices.map((n: any) => (
            <div key={n._id} style={{ background: n.isRead ? 'white' : '#eff6ff', borderRadius: 12, padding: '14px 16px', border: `1px solid ${n.isRead ? '#f1f5f9' : '#bfdbfe'}` }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.isRead ? '#e2e8f0' : '#3b82f6', marginTop: 6, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#0f172a', fontSize: 14, fontWeight: n.isRead ? 500 : 700, margin: '0 0 4px' }}>{n.title}</p>
                  <p style={{ color: '#475569', fontSize: 13, margin: '0 0 6px' }}>{n.message}</p>
                  <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>{new Date(n.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
