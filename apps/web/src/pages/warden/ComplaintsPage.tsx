import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const STATUSES = ['ALL','OPEN','IN_PROGRESS','RESOLVED','CLOSED'];
const sc = (s: string) => ({ OPEN: { bg: '#fee2e2', color: '#dc2626' }, IN_PROGRESS: { bg: '#fef3c7', color: '#d97706' }, RESOLVED: { bg: '#dcfce7', color: '#16a34a' }, CLOSED: { bg: '#f1f5f9', color: '#64748b' } }[s] || { bg: '#f1f5f9', color: '#64748b' });

export default function WardenComplaintsPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updating, setUpdating] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['warden-complaints', statusFilter],
    queryFn: () => api.get('/warden/complaints', { params: { status: statusFilter } }).then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status, note }: any) => api.patch(`/warden/complaints/${id}/status`, { status, note }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['warden-complaints'] }); setUpdating(null); },
    onError: () => toast.error('Failed to update'),
  });

  const complaints: any[] = data?.data || [];

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>Complaints ({data?.total || 0})</h1>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '6px 14px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, transition: 'all 0.15s', background: statusFilter === s ? '#1d4ed8' : '#f1f5f9', color: statusFilter === s ? 'white' : '#64748b' }}>
            {s}
          </button>
        ))}
      </div>

      {isLoading ? <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading…</p> :
       complaints.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No complaints found</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {complaints.map((c: any) => {
            const s = sc(c.status);
            return (
              <div key={c._id} style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 700, margin: 0 }}>{c.title}</p>
                  <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, flexShrink: 0, marginLeft: 8 }}>{c.status}</span>
                </div>
                <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 6px' }}>{c.category} · {new Date(c.createdAt).toLocaleDateString('en-IN')}</p>
                <p style={{ color: '#475569', fontSize: 13, margin: '0 0 10px' }}>{c.description}</p>

                {/* Quick actions */}
                {c.status !== 'RESOLVED' && c.status !== 'CLOSED' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {c.status === 'OPEN' && (
                      <button onClick={() => mutation.mutate({ id: c._id, status: 'IN_PROGRESS', note: 'Working on it' })} style={{ padding: '5px 12px', background: '#fef3c7', color: '#d97706', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>Mark In Progress</button>
                    )}
                    <button onClick={() => mutation.mutate({ id: c._id, status: 'RESOLVED', note: 'Issue resolved' })} style={{ padding: '5px 12px', background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>Mark Resolved</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
