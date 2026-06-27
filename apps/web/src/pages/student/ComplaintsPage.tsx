import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Plus, CheckCircle2, Clock, X } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['ELECTRICITY','FOOD','INTERNET','WATER','CLEANING','OTHER'];
const statusColor = (s: string) => ({ OPEN: { bg: '#fee2e2', color: '#dc2626' }, IN_PROGRESS: { bg: '#fef3c7', color: '#d97706' }, RESOLVED: { bg: '#dcfce7', color: '#16a34a' }, CLOSED: { bg: '#f1f5f9', color: '#64748b' } }[s] || { bg: '#f1f5f9', color: '#64748b' });

export default function StudentComplaintsPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'OTHER', description: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['student-complaints'],
    queryFn: () => api.get('/student/complaints').then(r => r.data.data),
  });

  const mutation = useMutation({
    mutationFn: (body: any) => api.post('/student/complaints', body),
    onSuccess: () => {
      toast.success('Complaint raised!');
      qc.invalidateQueries({ queryKey: ['student-complaints'] });
      setShowForm(false);
      setForm({ title: '', category: 'OTHER', description: '' });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const complaints: any[] = data || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Complaints</h1>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
          <Plus size={14} /> Raise Complaint
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: 12, padding: '20px', border: '1px solid #e2e8f0', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>New Complaint</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Brief title of the issue" style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: 'white' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the issue in detail…" rows={3} style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
            <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} style={{ padding: '10px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>
              {mutation.isPending ? 'Submitting…' : 'Submit Complaint'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Loading…</p> :
       complaints.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <CheckCircle2 size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <p style={{ color: '#94a3b8', fontSize: 14 }}>No complaints raised. Great!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {complaints.map((c: any) => {
            const sc = statusColor(c.status);
            return (
              <div key={c._id} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 600, margin: 0 }}>{c.title}</p>
                  <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, flexShrink: 0, marginLeft: 8 }}>{c.status}</span>
                </div>
                <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 4px' }}>{c.category} · {new Date(c.createdAt).toLocaleDateString('en-IN')}</p>
                <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>{c.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
