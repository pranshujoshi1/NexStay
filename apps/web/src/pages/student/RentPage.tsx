import { useQuery } from '@tanstack/react-query';
import { IndianRupee, Printer, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

const statusColor = (s: string) => s === 'PAID' ? { bg: '#dcfce7', color: '#16a34a' } : s === 'PARTIAL' ? { bg: '#fef3c7', color: '#d97706' } : { bg: '#fee2e2', color: '#dc2626' };

export default function StudentRentPage() {
  const { data: hist, isLoading } = useQuery({
    queryKey: ['student-rent'],
    queryFn: () => api.get('/student/rent').then(r => r.data),
  });
  const { data: cur } = useQuery({
    queryKey: ['student-rent-current'],
    queryFn: () => api.get('/student/rent/current').then(r => r.data.data),
  });

  if (isLoading) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading rent records…</div>;

  const records: any[] = hist?.data || [];

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>Rent & Payments</h1>

      {/* Current month card */}
      {cur && (
        <div style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', borderRadius: 16, padding: '20px 24px', marginBottom: 20, color: 'white' }}>
          <p style={{ margin: '0 0 4px', opacity: 0.7, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Current Month — {cur.month}</p>
          <p style={{ margin: '0 0 12px', fontSize: 28, fontWeight: 700 }}>₹{cur.amount?.toLocaleString('en-IN')}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>Due: {cur.dueDate ? new Date(cur.dueDate).toLocaleDateString('en-IN') : 'N/A'}</span>
            <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: cur.status === 'PAID' ? 'rgba(22,163,74,0.3)' : 'rgba(239,68,68,0.3)', color: 'white' }}>
              {cur.status}
            </span>
          </div>
          {cur.status !== 'PAID' && (
            <p style={{ margin: '12px 0 0', fontSize: 13, opacity: 0.8, background: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 8 }}>
              💡 Contact your warden or admin to pay rent. Payment will be recorded in the system.
            </p>
          )}
        </div>
      )}

      {hist?.securityDeposit > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ color: '#166534', fontSize: 13, margin: 0 }}>
            <strong>Security Deposit Paid:</strong> ₹{hist.securityDeposit?.toLocaleString('en-IN')} — Refundable on checkout
          </p>
        </div>
      )}

      {/* History */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Payment History</h2>
      {records.length === 0 ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>No rent records found</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {records.map((r: any) => {
            const sc = statusColor(r.status);
            return (
              <div key={r._id} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${sc.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {r.status === 'PAID' ? <CheckCircle2 size={18} color={sc.color} /> : r.status === 'PARTIAL' ? <Clock size={18} color={sc.color} /> : <AlertCircle size={18} color={sc.color} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 600, margin: '0 0 2px' }}>{r.month}</p>
                  <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>
                    ₹{r.amount?.toLocaleString('en-IN')} {r.fine > 0 && `+ ₹${r.fine} fine`}
                    {r.paidAt && ` · Paid ${new Date(r.paidAt).toLocaleDateString('en-IN')}`}
                    {r.paymentMethod && ` via ${r.paymentMethod}`}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>{r.status}</span>
                  {r.status === 'PAID' && (
                    <a href={`/api/hostel-admin/erp/rent/${r._id}/receipt`} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1d4ed8', fontSize: 12, textDecoration: 'none' }}>
                      <Printer size={12} /> Receipt
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
