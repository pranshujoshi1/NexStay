import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Plus, X, UtensilsCrossed } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const MEALS = ['breakfast', 'lunch', 'dinner'] as const;
const MEAL_LABELS = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', dinner: '🌙 Dinner' };

const defaultMeal = () => ({ items: [] as string[], photoUrl: null });

export default function MessMenuPage() {
  const today = new Date().toISOString().split('T')[0];
  const qc = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ['mess-menu-today'],
    queryFn: () => api.get('/mess/menu').then(r => r.data.data),
  });

  const [form, setForm] = useState({ date: today, breakfast: defaultMeal(), lunch: defaultMeal(), dinner: defaultMeal(), specialNote: '' });
  const [newItems, setNewItems] = useState<Record<string, string>>({ breakfast: '', lunch: '', dinner: '' });
  const [initialized, setInitialized] = useState(false);

  // Pre-fill form from existing menu
  if (existing && !initialized) {
    setForm({
      date: existing.date || today,
      breakfast: existing.breakfast || defaultMeal(),
      lunch: existing.lunch || defaultMeal(),
      dinner: existing.dinner || defaultMeal(),
      specialNote: existing.specialNote || '',
    });
    setInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: () => api.post('/mess/menu', form),
    onSuccess: () => { toast.success('Menu saved! Students notified 🔔'); qc.invalidateQueries({ queryKey: ['mess-menu-today'] }); setInitialized(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Save failed'),
  });

  const addItem = (meal: string) => {
    const val = newItems[meal]?.trim();
    if (!val) return;
    setForm(p => ({ ...p, [meal]: { ...p[meal as keyof typeof p] as any, items: [...(p[meal as keyof typeof p] as any).items, val] } }));
    setNewItems(p => ({ ...p, [meal]: '' }));
  };

  const removeItem = (meal: string, idx: number) => {
    setForm(p => ({ ...p, [meal]: { ...(p[meal as keyof typeof p] as any), items: (p[meal as keyof typeof p] as any).items.filter((_: any, i: number) => i !== idx) } }));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Upload Today's Menu</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#b45309', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>
          <Save size={15} /> {mutation.isPending ? 'Saving…' : 'Save & Notify'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {MEALS.map(meal => (
          <div key={meal} style={{ background: 'white', borderRadius: 14, padding: '18px', border: '1px solid #f1f5f9' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>{MEAL_LABELS[meal]}</h3>

            {/* Items list */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {(form[meal] as any).items.map((item: string, i: number) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 100, fontSize: 13, color: '#92400e' }}>
                  {item}
                  <button onClick={() => removeItem(meal, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b45309', padding: 0, display: 'flex' }}><X size={12} /></button>
                </span>
              ))}
            </div>

            {/* Add item */}
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={newItems[meal]}
                onChange={e => setNewItems(p => ({ ...p, [meal]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(meal); } }}
                placeholder={`Add ${meal} item... (press Enter)`}
                style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              />
              <button onClick={() => addItem(meal)} style={{ padding: '8px 12px', background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Plus size={15} />
              </button>
            </div>
          </div>
        ))}

        {/* Special note */}
        <div style={{ background: 'white', borderRadius: 14, padding: '18px', border: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700 }}>✨ Special Note (optional)</h3>
          <input value={form.specialNote} onChange={e => setForm(p => ({ ...p, specialNote: e.target.value }))} placeholder="e.g. Sunday Special: Gulab Jamun in dinner!" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
        </div>
      </div>
    </div>
  );
}
