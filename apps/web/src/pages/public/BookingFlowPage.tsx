import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Check, Loader2, BedDouble,
  CreditCard, Smartphone, Building2, Upload, X, AlertCircle
} from 'lucide-react';
import { usePublicPropertyDetail } from '@/lib/publicApi';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/marketplace/AuthModal';
import BedGrid from '@/components/marketplace/BedGrid';
import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BookingState {
  selectedRoomType: string;
  selectedRoomId: string;
  selectedBedId: string;
  selectedBedNumber: string;
  selectedPricePerBed: number;
  checkInDate: string;
  advancePaid: number;
  paymentMethod: 'UPI' | 'CARD' | 'NETBANKING';
  termsAccepted: boolean;
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: 'Single Room', DOUBLE: 'Double Sharing', TRIPLE: 'Triple Sharing', FOUR_SHARING: '4-Person Sharing',
};

const STEPS = ['Room Type', 'Select Bed', 'Summary', 'Documents', 'Payment', 'Confirmed'];

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex flex-col items-center gap-1`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-100 text-slate-400'}`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < total - 1 && (
              <div className={`h-0.5 w-6 sm:w-10 mb-4 transition-colors ${done ? 'bg-green-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BookingFlowPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const { data, isLoading } = usePublicPropertyDetail(propertyId);
  const property = data?.data?.property;
  const rooms = data?.data?.rooms ?? [];

  const [step, setStep] = useState(0);
  const [showAuth, setShowAuth] = useState(!user);
  const [booking, setBooking] = useState<BookingState>({
    selectedRoomType: searchParams.get('roomType') ?? '',
    selectedRoomId: '',
    selectedBedId: '',
    selectedBedNumber: '',
    selectedPricePerBed: 0,
    checkInDate: '',
    advancePaid: 0,
    paymentMethod: 'UPI',
    termsAccepted: false,
  });

  const [beds, setBeds] = useState<any[]>([]);
  const [bedsLoading, setBedsLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [docPreviews, setDocPreviews] = useState<Record<string, string>>({});

  // Redirect if not logged in after auth modal
  useEffect(() => { if (user) setShowAuth(false); }, [user]);

  const roomTypes = Array.from(new Set(rooms.map(r => r.roomType)));

  // Fetch beds when room is selected
  useEffect(() => {
    if (!booking.selectedRoomId) { setBeds([]); return; }
    setBedsLoading(true);
    axios.get(`/api/public/properties/${propertyId}/beds?roomId=${booking.selectedRoomId}`)
      .then(r => setBeds(r.data?.data ?? []))
      .catch(() => setBeds([]))
      .finally(() => setBedsLoading(false));
  }, [booking.selectedRoomId]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const canProceed = () => {
    if (step === 0) return !!booking.selectedRoomType;
    if (step === 1) return !!booking.selectedBedId;
    if (step === 2) return !!booking.checkInDate && booking.termsAccepted;
    if (step === 3) return true; // docs optional
    if (step === 4) return !!booking.paymentMethod;
    return false;
  };

  const handleNext = async () => {
    if (step === 4) { await handlePay(); return; }
    setStep(s => s + 1);
  };
  const handleBack = () => {
    if (step === 0) navigate(`/property/${propertyId}`);
    else setStep(s => s - 1);
  };

  // ── Payment handler ──────────────────────────────────────────────────────────
  const handlePay = async () => {
    setPayLoading(true);
    setPayError('');
    try {
      const res = await axios.post('/api/guest/bookings', {
        propertyId,
        roomId: booking.selectedRoomId,
        bedId: booking.selectedBedId,
        checkInDate: booking.checkInDate,
        monthlyRent: booking.selectedPricePerBed,
        paymentMethod: booking.paymentMethod,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookingRef(res.data.referenceId ?? '');
      setBookingId(res.data.data?._id ?? '');
      setStep(5);
    } catch (err: any) {
      setPayError(err?.response?.data?.message ?? 'Booking failed. Please try again.');
    } finally {
      setPayLoading(false);
    }
  };

  // ── Doc upload (mock) ───────────────────────────────────────────────────────
  const handleDocUpload = (type: string, file: File) => {
    const reader = new FileReader();
    reader.onload = e => setDocPreviews(p => ({ ...p, [type]: e.target?.result as string }));
    reader.readAsDataURL(file);
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <AuthModal
          onClose={() => navigate(`/property/${propertyId}`)}
          onSuccess={() => setShowAuth(false)}
        />
      </div>
    );
  }

  if (isLoading || !property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const startingPrice = property.startingPrice ?? 0;
  const advance = booking.selectedPricePerBed || startingPrice;

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={handleBack} className="text-slate-500 hover:text-slate-800 p-1 -ml-1">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-900 text-sm truncate">{property.name}</h1>
            <p className="text-xs text-slate-500">{property.city} · {STEPS[step]}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8">
        <StepBar current={step} total={STEPS.length} />

        {/* ── Step 0: Select Room Type ────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Choose a Room Type</h2>
            {roomTypes.map(rt => {
              const rtRooms = rooms.filter(r => r.roomType === rt);
              const totalAvailable = rtRooms.reduce((s, r) => s + r.availableBeds, 0);
              const minPrice = Math.min(...rtRooms.map(r => r.pricePerBed));
              const selected = booking.selectedRoomType === rt;
              return (
                <button key={rt} onClick={() => setBooking(b => ({ ...b, selectedRoomType: rt, selectedRoomId: '', selectedBedId: '' }))}
                  className={`w-full text-left p-4 border-2 rounded-2xl transition-all ${selected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{ROOM_TYPE_LABELS[rt] ?? rt}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Capacity: {rt === 'SINGLE' ? 1 : rt === 'DOUBLE' ? 2 : rt === 'TRIPLE' ? 3 : 4} person{rt !== 'SINGLE' ? 's' : ''}</div>
                      <div className={`text-xs font-semibold mt-1 ${totalAvailable > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {totalAvailable} bed{totalAvailable !== 1 ? 's' : ''} available
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-600 font-bold">₹{minPrice.toLocaleString('en-IN')}/mo</div>
                      <div className="text-xs text-slate-400">per bed</div>
                      {selected && <div className="mt-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center ml-auto"><Check className="w-3 h-3 text-white" /></div>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Step 1: Select Bed ──────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Select a Bed</h2>
            <div className="space-y-4">
              {rooms.filter(r => r.roomType === booking.selectedRoomType).map(room => (
                <div key={room._id} className={`bg-white border-2 rounded-2xl p-4 transition-all cursor-pointer ${booking.selectedRoomId === room._id ? 'border-blue-400' : 'border-slate-200 hover:border-slate-300'}`}
                  onClick={() => setBooking(b => ({ ...b, selectedRoomId: room._id, selectedBedId: '', selectedPricePerBed: room.pricePerBed }))}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-slate-900 text-sm">Room {room.roomNumber}</span>
                    <span className="text-green-600 font-bold text-sm">₹{room.pricePerBed.toLocaleString('en-IN')}/mo</span>
                  </div>
                  {/* Simplified bed tiles using room data */}
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: room.totalBeds }).map((_, i) => {
                      const isOccupied = i >= room.availableBeds;
                      const bedId = `${room._id}-bed-${i}`;
                      const isSelected = booking.selectedBedId === bedId && booking.selectedRoomId === room._id;
                      return (
                        <button
                          key={i}
                          disabled={isOccupied}
                          onClick={e => {
                            e.stopPropagation();
                            setBooking(b => ({
                              ...b,
                              selectedRoomId: room._id,
                              selectedBedId: bedId,
                              selectedBedNumber: `B${i+1}`,
                              selectedPricePerBed: room.pricePerBed,
                            }));
                          }}
                          className={`w-12 h-12 rounded-lg border-2 flex flex-col items-center justify-center text-xs font-bold transition-all
                            ${isSelected ? 'border-blue-600 bg-blue-100 text-blue-700 scale-105 ring-2 ring-blue-300'
                              : isOccupied ? 'bg-red-100 border-red-200 text-red-400 cursor-not-allowed'
                              : 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200 cursor-pointer'}`}
                        >
                          B{i+1}
                          {isSelected && <span className="text-[8px]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Summary ─────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Booking Summary</h2>
            <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
              {[
                ['Property', property.name],
                ['Location', `${property.city}, ${property.state}`],
                ['Room Type', ROOM_TYPE_LABELS[booking.selectedRoomType] ?? booking.selectedRoomType],
                ['Bed', booking.selectedBedNumber || 'B1'],
                ['Monthly Rent', `₹${(booking.selectedPricePerBed || startingPrice).toLocaleString('en-IN')}`],
                ['Advance (1 month)', `₹${(booking.selectedPricePerBed || startingPrice).toLocaleString('en-IN')}`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </div>

            {/* Check-in date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Check-in Date *</label>
              <input type="date"
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                value={booking.checkInDate}
                onChange={e => setBooking(b => ({ ...b, checkInDate: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>

            {/* T&C */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={booking.termsAccepted}
                onChange={e => setBooking(b => ({ ...b, termsAccepted: e.target.checked }))}
                className="mt-0.5 accent-blue-600 w-4 h-4" />
              <span className="text-sm text-slate-600">
                I agree to the <span className="text-blue-600 font-medium">Terms & Conditions</span> and understand that advance is non-refundable after check-in.
              </span>
            </label>
          </div>
        )}

        {/* ── Step 3: Documents ───────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Upload Documents</h2>
              <p className="text-sm text-slate-500 mt-1">Optional — you can upload later from your profile. Max 5MB each. Accepted: images and PDF.</p>
            </div>
            {[
              { key: 'aadhaar', label: 'Aadhaar Card', icon: '🪪' },
              { key: 'studentId', label: 'Student / ID Card', icon: '🎓' },
              { key: 'photo', label: 'Your Photo', icon: '🤳' },
            ].map(({ key, label, icon }) => (
              <div key={key} className="border-2 border-dashed border-slate-200 rounded-2xl p-5 hover:border-blue-300 transition-colors">
                <label className="cursor-pointer flex flex-col items-center gap-2 text-center">
                  {docPreviews[key] ? (
                    <div className="relative">
                      <img src={docPreviews[key]} alt={label} className="w-24 h-20 object-cover rounded-lg" />
                      <button onClick={() => setDocPreviews(p => { const n = { ...p }; delete n[key]; return n; })}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-3xl">{icon}</span>
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700">{label}</span>
                      <span className="text-xs text-slate-400">Click to upload</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*,application/pdf"
                    onChange={e => e.target.files?.[0] && handleDocUpload(key, e.target.files[0])} />
                </label>
              </div>
            ))}
            <p className="text-xs text-slate-400 text-center">You can skip this step and upload documents later from your account.</p>
          </div>
        )}

        {/* ── Step 4: Payment ─────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Payment</h2>

            {/* Amount summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
              {[
                ['Advance (1 month rent)', `₹${advance.toLocaleString('en-IN')}`],
                ['Platform Fee', '₹0 (Free)'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm">
                  <span className="text-slate-600">{l}</span>
                  <span className="font-semibold text-slate-900">{v}</span>
                </div>
              ))}
              <div className="border-t border-blue-200 pt-2 flex justify-between font-bold">
                <span className="text-slate-900">Total to Pay</span>
                <span className="text-blue-700 text-lg">₹{advance.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Select Payment Method</p>
              <div className="space-y-2">
                {[
                  { value: 'UPI', label: 'UPI / GPay / PhonePe', icon: <Smartphone className="w-5 h-5 text-green-600" /> },
                  { value: 'CARD', label: 'Debit / Credit Card', icon: <CreditCard className="w-5 h-5 text-blue-600" /> },
                  { value: 'NETBANKING', label: 'Net Banking', icon: <Building2 className="w-5 h-5 text-violet-600" /> },
                ].map(({ value, label, icon }) => (
                  <label key={value} className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${booking.paymentMethod === value ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="payment" value={value} checked={booking.paymentMethod === value as any}
                      onChange={() => setBooking(b => ({ ...b, paymentMethod: value as any }))}
                      className="accent-blue-600" />
                    {icon}
                    <span className="font-medium text-slate-800 text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {payError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Payment Failed</p>
                  <p className="text-sm text-red-600">{payError}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 5: Success ─────────────────────────────────────────────── */}
        {step === 5 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-5 animate-bounce-once">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Booking Confirmed!</h2>
            <p className="text-slate-500 mb-4 text-sm">Your booking has been placed successfully.</p>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-left space-y-2 max-w-sm mx-auto">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Reference</span>
                <span className="font-bold text-blue-700">{bookingRef}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Property</span>
                <span className="font-semibold text-slate-900 truncate max-w-[160px]">{property.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Room Type</span>
                <span className="font-semibold text-slate-900">{ROOM_TYPE_LABELS[booking.selectedRoomType] ?? booking.selectedRoomType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Check-in</span>
                <span className="font-semibold text-slate-900">{booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Monthly Rent</span>
                <span className="font-bold text-green-700">₹{advance.toLocaleString('en-IN')}/mo</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <span className="font-bold text-amber-600">PENDING Review</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
              <button onClick={() => navigate('/account/bookings')}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors">
                View My Bookings
              </button>
              <button onClick={() => navigate('/')}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-sm transition-colors">
                Explore More PGs
              </button>
            </div>
          </div>
        )}

        {/* ── Nav Buttons ─────────────────────────────────────────────────── */}
        {step < 5 && (
          <div className="mt-8 flex gap-3">
            <button onClick={handleBack}
              className="px-5 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              {step === 0 ? 'Back to Property' : 'Back'}
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed() || payLoading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
              {payLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing Payment…</>
              ) : step === 4 ? (
                `Pay ₹${advance.toLocaleString('en-IN')}`
              ) : step === 3 ? (
                'Continue →'
              ) : (
                <>Next <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
