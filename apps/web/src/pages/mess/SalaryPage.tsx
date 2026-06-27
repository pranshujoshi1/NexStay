import { useQuery } from '@tanstack/react-query';
import { Wallet, IndianRupee } from 'lucide-react';
import api from '@/lib/api';

export default function MessSalaryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['mess-salary'],
    queryFn: () => api.get('/mess/salary').then(r => r.data.data),
  });

  if (isLoading) return <div style={{ textAlign: 'center', padding: 60, color: '#92400e' }}>Loading…</div>;

  const { staffRecord, salaryHistory } = data || {};

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>My Salary</h1>

      {staffRecord && (
        <div style={{ background: 'linear-gradient(135deg, #7c2d12, #b45309)', borderRadius: 16, padding: '24px', marginBottom: 20, color: 'white' }}>
          <p style={{ opacity: 0.6, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>Monthly Salary</p>
          <p style={{ fontSize: 32, fontWeight: 700, margin: '0 0 16px' }}>₹{staffRecord.salary?.toLocaleString('en-IN')}</p>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div><p style={{ opacity: 0.6, fontSize: 11, margin: '0 0 2px' }}>Role</p><p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{staffRecord.role}</p></div>
            <div><p style={{ opacity: 0.6, fontSize: 11, margin: '0 0 2px' }}>Joined</p><p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{staffRecord.joiningDate ? new Date(staffRecord.joiningDate).toLocaleDateString('en-IN') : '—'}</p></div>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Salary History</h2>
      {!salaryHistory?.length ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>No salary records found</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {salaryHistory.map((e: any) => (
            <div key={e._id} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, background: '#dcfce7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IndianRupee size={17} color="#16a34a" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 600, margin: '0 0 2px' }}>₹{e.amount?.toLocaleString('en-IN')}</p>
                <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{e.date} · {e.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
