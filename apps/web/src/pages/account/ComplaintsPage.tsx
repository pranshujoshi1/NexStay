import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, X, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700', IN_PROGRESS: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-green-100 text-green-700', CLOSED: 'bg-slate-100 text-slate-600',
};
const CATEGORY_ICONS: Record<string, string> = {
  ELECTRICITY: '⚡', FOOD: '🍽️', INTERNET: '📶', WATER: '💧', CLEANING: '🧹', OTHER: '📌',
};
const CATEGORIES = ['ELECTRICITY', 'FOOD', 'INTERNET', 'WATER', 'CLEANING', 'OTHER'];

function useGuestComplaints(token: string | null) {
  return useQuery({
    queryKey: ['guest-complaints'],
    queryFn: async () => {
      const { data } = await axios.get('/api/guest/complaints', { headers: { Authorization: `Bearer ${token}` } });
      return data.data as any[];
    },
    enabled: !!token,
  });
}

function ComplaintTimeline({ history }: { history: any[] }) {
  if (!history?.length) return null;
  return (
    <div className="mt-3 pt-3 border-t border-slate-100 pl-3 space-y-2 relative">
      <div className="absolute left-0 top-3 bottom-3 w-px bg-slate-200" />
      {[...history].reverse().map((h: any, i: number) => (
        <div key={i} className="relative pl-3 flex flex-col gap-0.5">
          <div className="absolute -left-1.5 top-1.5 w-2 h-2 rounded-full bg-blue-500" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[h.status] ?? 'bg-slate-100 text-slate-600'}`}>
              {h.status.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-slate-400">{h.changedBy || 'Admin'}</span>
            <span className="text-[10px] text-slate-400 ml-auto">
              {new Date(h.changedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </span>
          </div>
          {h.note && <p className="text-xs text-slate-500">{h.note}</p>}
        </div>
      ))}
    </div>
  );
}

export default function ComplaintsPage() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  const { data: complaints = [], isLoading } = useGuestComplaints(accessToken);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'OTHER' });
  const [formError, setFormError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async (body: typeof form) => {
      const { data } = await axios.post('/api/guest/complaints', body, { headers: { Authorization: `Bearer ${accessToken}` } });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guest-complaints'] });
      setShowForm(false);
      setForm({ title: '', description: '', category: 'OTHER' });
    },
    onError: (err: any) => setFormError(err?.response?.data?.message ?? 'Failed to submit complaint.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim() || !form.description.trim()) { setFormError('Title and description are required.'); return; }
    createMutation.mutate(form);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">My Complaints</h1>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors">
          <Plus className="w-4 h-4" /> New Complaint
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Raise a Complaint</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(c => (
                  <button key={c} type="button" onClick={() => setForm(f => ({ ...f, category: c }))}
                    className={`py-2 px-3 rounded-xl border-2 text-xs font-semibold transition-all flex items-center gap-1 justify-center ${form.category === c ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    {CATEGORY_ICONS[c]} {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief summary of the issue"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description *</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe the issue in detail..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none" />
            </div>
            {formError && <div className="flex items-center gap-2 text-sm text-red-600"><AlertCircle className="w-4 h-4" /> {formError}</div>}
            <button type="submit" disabled={createMutation.isPending}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Submit Complaint
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-24 bg-slate-200 rounded-2xl animate-pulse" />)}</div>
      ) : complaints.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center gap-3">
          <div className="text-5xl">📋</div>
          <h3 className="font-bold text-slate-800">No complaints yet</h3>
          <p className="text-slate-500 text-sm">Have an issue? Raise a complaint and we'll look into it.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map(c => (
            <div key={c._id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                  {CATEGORY_ICONS[c.category] ?? '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 text-sm truncate">{c.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[c.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{c.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>{c.category}</span><span>·</span>
                    <span>{new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    {c.statusHistory?.length > 0 && (
                      <button onClick={() => setExpanded(expanded === c._id ? null : c._id)}
                        className="ml-auto flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium">
                        {expanded === c._id ? <><ChevronUp className="w-3 h-3" />Hide</> : <><ChevronDown className="w-3 h-3" />Timeline</>}
                      </button>
                    )}
                  </div>
                  {expanded === c._id && <ComplaintTimeline history={c.statusHistory} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
