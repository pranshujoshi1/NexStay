import { useQuery } from '@tanstack/react-query';
import { UtensilsCrossed } from 'lucide-react';
import api from '@/lib/api';

export default function WardenMenuPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['warden-menu'],
    queryFn: () => api.get('/warden/mess-menu').then(r => r.data.data),
  });

  const menu = data;
  const MEALS = ['breakfast', 'lunch', 'dinner'] as const;
  const LABELS = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', dinner: '🌙 Dinner' };

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Today's Mess Menu</h1>
      <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

      {isLoading ? <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading…</p> :
       !menu ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <UtensilsCrossed size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <p style={{ color: '#94a3b8', fontSize: 15 }}>Menu not uploaded yet for today.</p>
          <p style={{ color: '#cbd5e1', fontSize: 13 }}>The mess manager will upload it shortly.</p>
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
            {MEALS.map(meal => (
              <div key={meal} style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #f1f5f9' }}>
                <p style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, margin: '0 0 10px' }}>{LABELS[meal]}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {menu[meal]?.items?.length > 0 ? menu[meal].items.map((item: string, i: number) => (
                    <span key={i} style={{ padding: '4px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 100, fontSize: 13, color: '#374151' }}>{item}</span>
                  )) : <span style={{ color: '#94a3b8', fontSize: 13 }}>Not updated</span>}
                </div>
              </div>
            ))}
          </div>
          {menu.specialNote && (
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ color: '#b45309', fontSize: 14, margin: 0 }}>✨ Special: {menu.specialNote}</p>
            </div>
          )}
          {menu.uploadedBy?.name && (
            <p style={{ color: '#94a3b8', fontSize: 12, margin: '12px 0 0' }}>Uploaded by: {menu.uploadedBy.name}</p>
          )}
        </div>
      )}
    </div>
  );
}
