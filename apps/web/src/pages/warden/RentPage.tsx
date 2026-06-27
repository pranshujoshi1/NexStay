import { useQuery } from '@tanstack/react-query';
import { IndianRupee, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import api from '@/lib/api';

const sc = (s: string) => s === 'PAID' ? { bg: '#dcfce7', color: '#16a34a' } : s === 'PARTIAL' ? { bg: '#fef3c7', color: '#d97706' } : { bg: '#fee2e2', color: '#dc2626' };

export default function WardenRentPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['warden-rent'],
    queryFn: () => api.get('/warden/rent-records').then(r => r.data),
  });

  const records: any[] = data?.data || [];

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>Rent Records (View Only)</h1>
      <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
        <p style={{ color: '#b45309', fontSize: 13, margin: 0 }}>ℹ️ You can view rent records but payments are processed by the hostel admin.</p>
      </div>
      {isLoading ? <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading…</p> :
       records.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No records</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {records.map((r: any) => {
            const s = sc(r.status);
            const student = r.hostelStudentId as any;
            return (
              <div key={r._id} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, background: s.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {r.status === 'PAID' ? <CheckCircle2 size={17} color={s.color} /> : r.status === 'PARTIAL' ? <Clock size={17} color={s.color} /> : <AlertCircle size={17} color={s.color} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 600, margin: '0 0 2px' }}>{student?.name || 'Student'}</p>
                  <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{r.month} · ₹{r.amount?.toLocaleString('en-IN')}{r.fine > 0 ? ` + ₹${r.fine} fine` : ''}</p>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>{r.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
