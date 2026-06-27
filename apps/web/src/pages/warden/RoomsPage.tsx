import { useQuery } from '@tanstack/react-query';
import { DoorOpen, BedDouble } from 'lucide-react';
import api from '@/lib/api';

export default function WardenRoomsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['warden-rooms'],
    queryFn: () => api.get('/warden/rooms').then(r => r.data.data),
  });

  if (isLoading) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading…</div>;

  const { floors = [], rooms = [], beds = [], summary = {} } = data || {};

  const bedsForRoom = (roomId: string) => beds.filter((b: any) => String(b.roomId) === String(roomId));

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Rooms Overview</h1>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <span style={{ color: '#64748b', fontSize: 14 }}>Total Beds: <strong>{summary.totalBeds}</strong></span>
        <span style={{ color: '#16a34a', fontSize: 14 }}>Available: <strong>{summary.availableBeds}</strong></span>
        <span style={{ color: '#dc2626', fontSize: 14 }}>Occupied: <strong>{summary.occupiedBeds}</strong></span>
      </div>

      {floors.map((floor: any) => {
        const floorRooms = rooms.filter((r: any) => String(r.floorId) === String(floor._id));
        return (
          <div key={floor._id} style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              🏢 {floor.name}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {floorRooms.map((room: any) => {
                const roomBeds = bedsForRoom(String(room._id));
                const occupied = roomBeds.filter((b: any) => b.status === 'OCCUPIED').length;
                const available = roomBeds.filter((b: any) => b.status === 'AVAILABLE').length;
                return (
                  <div key={room._id} style={{ background: 'white', borderRadius: 12, padding: '14px', border: `1px solid ${occupied === roomBeds.length ? '#fca5a5' : available === roomBeds.length ? '#bbf7d0' : '#e2e8f0'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 700, margin: 0 }}>Room {room.roomNumber}</p>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{room.roomType}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {roomBeds.map((bed: any) => (
                        <span key={bed._id} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: bed.status === 'OCCUPIED' ? '#fee2e2' : '#dcfce7', color: bed.status === 'OCCUPIED' ? '#dc2626' : '#16a34a' }}>
                          {bed.bedNumber}
                        </span>
                      ))}
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: 11, margin: '8px 0 0' }}>{occupied}/{roomBeds.length} occupied · ₹{room.pricePerBed?.toLocaleString('en-IN')}/mo</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
