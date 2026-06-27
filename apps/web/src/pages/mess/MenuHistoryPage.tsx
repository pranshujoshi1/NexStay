import { useQuery } from '@tanstack/react-query';
import { Calendar, UtensilsCrossed } from 'lucide-react';
import api from '@/lib/api';

export default function MessHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['mess-menu-history'],
    queryFn: () => api.get('/mess/menu/history').then(r => r.data.data),
  });

  const menus: any[] = data || [];
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>Menu History (Last 30 Days)</h1>
      {isLoading ? <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading…</p> :
        menus.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Calendar size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <p style={{ color: '#94a3b8' }}>No menus uploaded in the last 30 days</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {menus.map((menu: any) => (
              <div key={menu._id} style={{ background: menu.date === today ? '#fffbeb' : 'white', borderRadius: 12, padding: '16px', border: `1px solid ${menu.date === today ? '#fde68a' : '#f1f5f9'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 700, margin: 0 }}>
                    {menu.date === today ? '📍 Today — ' : ''}{new Date(menu.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  {(menu.uploadedBy as any)?.name && (
                    <span style={{ color: '#94a3b8', fontSize: 11 }}>by {(menu.uploadedBy as any).name}</span>
                  )}
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {(['breakfast', 'lunch', 'dinner'] as const).map(meal => (
                    menu[meal]?.items?.length > 0 && (
                      <div key={meal}>
                        <span style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>{meal}: </span>
                        <span style={{ color: '#374151', fontSize: 13 }}>{menu[meal].items.join(', ')}</span>
                      </div>
                    )
                  ))}
                </div>
                {menu.specialNote && <p style={{ color: '#7c3aed', fontSize: 12, margin: '8px 0 0' }}>✨ {menu.specialNote}</p>}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
