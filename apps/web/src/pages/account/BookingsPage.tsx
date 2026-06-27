import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, BedDouble, Calendar, Trash2, Loader2, X, ExternalLink } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-amber-100 text-amber-700 border-amber-200',
  CONFIRMED:  'bg-blue-100 text-blue-700 border-blue-200',
  CHECKED_IN: 'bg-green-100 text-green-700 border-green-200',
  CHECKED_OUT:'bg-slate-100 text-slate-600 border-slate-200',
  CANCELLED:  'bg-red-100 text-red-600 border-red-200',
};

function useGuestBookings(token: string | null) {
  return useQuery({
    queryKey: ['guest-bookings'],
    queryFn: async () => {
      const { data } = await axios.get('/api/guest/bookings', { headers: { Authorization: `Bearer ${token}` } });
      return data.data as any[];
    },
    enabled: !!token,
  });
}

function CancelDialog({ booking, onConfirm, onClose, loading }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Cancel Booking?</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-600 mb-5">
          Are you sure you want to cancel your booking at <strong>{booking.propertyId?.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50">
            Keep Booking
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  const { data: bookings = [], isLoading } = useGuestBookings(accessToken);
  const [cancelTarget, setCancelTarget] = useState<any>(null);

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/guest/bookings/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guest-bookings'] });
      setCancelTarget(null);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-slate-900 mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center">
            <BedDouble className="w-10 h-10 text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg mb-1">No bookings yet</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              You haven't booked any PG yet. Find your perfect PG and secure your spot today.
            </p>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="mt-1 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            Find Your Perfect PG →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => {
            const statusCls = STATUS_COLORS[b.status] ?? 'bg-slate-100 text-slate-600 border-slate-200';
            const property = b.propertyId;
            const room = b.roomId;
            const bed = b.bedId;

            return (
              <div key={b._id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{property?.name ?? 'Property'}</h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3" /> {property?.city ?? '—'}
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusCls} flex-shrink-0`}>
                      {b.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <BedDouble className="w-3.5 h-3.5 text-blue-400" />
                      <span>Room {room?.roomNumber ?? '—'} · Bed {bed?.bedNumber ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      <span>{b.checkInDate ? new Date(b.checkInDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'TBD'}</span>
                    </div>
                    <div className="text-green-700 font-bold">₹{(b.monthlyRent ?? 0).toLocaleString('en-IN')}/mo</div>
                  </div>

                  {b.paymentId && (
                    <p className="text-[10px] text-slate-400 mt-2 font-mono">Ref: {b.paymentId}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between gap-2">
                  <button onClick={() => navigate(`/property/${property?._id}`)}
                    className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">
                    View Property <ExternalLink className="w-3 h-3" />
                  </button>
                  {b.status === 'PENDING' && (
                    <button onClick={() => setCancelTarget(b)}
                      className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium">
                      <Trash2 className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cancelTarget && (
        <CancelDialog
          booking={cancelTarget}
          loading={cancelMutation.isPending}
          onClose={() => setCancelTarget(null)}
          onConfirm={() => cancelMutation.mutate(cancelTarget._id)}
        />
      )}
    </div>
  );
}
