import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, User } from 'lucide-react';
import api from '@/lib/api';

export default function WardenStudentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['warden-students', search, page],
    queryFn: () => api.get('/warden/students', { params: { search, page, limit: 20, status: 'ACTIVE' } }).then(r => r.data),
  });

  const students: any[] = data?.data || [];
  const total: number = data?.total || 0;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>Students ({total})</h1>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Search */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px' }}>
            <Search size={14} color="#94a3b8" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or phone…" style={{ border: 'none', background: 'none', outline: 'none', fontSize: 14, flex: 1, fontFamily: 'inherit' }} />
          </div>
        </div>

        {isLoading ? <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading…</p> :
         students.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No students found</p> : (
          <div>
            {students.map((s: any) => (
              <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ width: 36, height: 36, background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={16} color="#1d4ed8" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 600, margin: '0 0 2px' }}>{s.name}</p>
                  <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>
                    {s.phone}
                    {(s.bedId as any)?.bedNumber && ` · Bed ${(s.bedId as any).bedNumber}`}
                    {s.admissionDate && ` · Joined ${new Date(s.admissionDate).toLocaleDateString('en-IN')}`}
                  </p>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#16a34a' }}>ACTIVE</span>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div style={{ display: 'flex', gap: 8, padding: 12, justifyContent: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>← Prev</button>
            <span style={{ padding: '6px 12px', color: '#64748b', fontSize: 13 }}>Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={!data?.hasNextPage} style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
