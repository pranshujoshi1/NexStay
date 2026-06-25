import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star, MapPin, BedDouble, Utensils, Wifi, Car, Shield, Shirt,
  Camera, Wind, ChevronDown, ChevronUp, ExternalLink, Calendar,
  CheckCircle, Users, Loader2
} from 'lucide-react';
import { usePublicPropertyDetail, usePublicPropertyReviews } from '@/lib/publicApi';
import { useAuth } from '@/contexts/AuthContext';
import ImageGallery from '@/components/marketplace/ImageGallery';
import BedGrid from '@/components/marketplace/BedGrid';
import ScheduleVisitModal from '@/components/marketplace/ScheduleVisitModal';
import AuthModal from '@/components/marketplace/AuthModal';
import MapView from '@/components/marketplace/MapView';

// ─── Constants ────────────────────────────────────────────────────────────────
const AMENITY_ICONS: Record<string, { icon: React.ComponentType<any>; label: string }> = {
  WIFI:         { icon: Wifi,     label: 'WiFi' },
  FOOD:         { icon: Utensils, label: 'Meals Included' },
  PARKING:      { icon: Car,      label: 'Parking' },
  SECURITY:     { icon: Shield,   label: 'Security' },
  LAUNDRY:      { icon: Shirt,    label: 'Laundry' },
  CCTV:         { icon: Camera,   label: 'CCTV' },
  AC:           { icon: Wind,     label: 'AC Rooms' },
  POWER_BACKUP: { icon: CheckCircle, label: 'Power Backup' },
};

const GENDER_LABELS: Record<string, { label: string; color: string }> = {
  BOYS:  { label: 'Boys PG',    color: 'bg-blue-100 text-blue-700' },
  GIRLS: { label: 'Girls PG',  color: 'bg-pink-100 text-pink-700' },
  CO_ED: { label: 'Co-Living', color: 'bg-violet-100 text-violet-700' },
};

const ROOM_TYPE_ORDER = ['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_SHARING'];
const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: 'Single', DOUBLE: 'Double', TRIPLE: 'Triple', FOUR_SHARING: '4-Sharing',
};

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`${cls} ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200'}`} />
      ))}
    </div>
  );
}

function RatingBreakdown({ reviews }: { reviews: any[] }) {
  const counts = [5,4,3,2,1].map(n => ({
    star: n,
    count: reviews.filter(r => Math.round(r.rating) === n).length,
  }));
  const max = Math.max(...counts.map(c => c.count), 1);
  return (
    <div className="space-y-1.5">
      {counts.map(({ star, count }) => (
        <div key={star} className="flex items-center gap-2 text-xs">
          <span className="w-4 text-slate-500 text-right">{star}</span>
          <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-amber-400 h-2 rounded-full transition-all" style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <span className="w-6 text-slate-400">{count}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-80 bg-slate-200 rounded-2xl mb-6" />
      <div className="flex gap-8">
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-slate-200 rounded w-2/3" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="h-20 bg-slate-100 rounded" />
          <div className="h-40 bg-slate-100 rounded" />
        </div>
        <div className="hidden lg:block w-80 h-64 bg-slate-200 rounded-2xl flex-shrink-0" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading, error } = usePublicPropertyDetail(id);
  const [reviewPage, setReviewPage] = useState(1);
  const { data: reviewsData, isFetching: reviewsFetching } = usePublicPropertyReviews(id, reviewPage);

  const [activeRoomType, setActiveRoomType] = useState<string>('');
  const [descExpanded, setDescExpanded] = useState(false);
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const detail = data?.data;
  const property = detail?.property;
  const rooms = detail?.rooms ?? [];
  const availability = detail?.availability;
  const allReviews = reviewsData?.data ?? [];
  const hasMoreReviews = reviewsData?.hasNextPage ?? false;

  // Set default room type tab once rooms load
  useEffect(() => {
    if (rooms.length > 0 && !activeRoomType) {
      const firstType = ROOM_TYPE_ORDER.find(rt => rooms.some(r => r.roomType === rt));
      if (firstType) setActiveRoomType(firstType);
    }
  }, [rooms]);

  const roomTypes = ROOM_TYPE_ORDER.filter(rt => rooms.some(r => r.roomType === rt));
  const activeRooms = rooms.filter(r => r.roomType === activeRoomType);

  const handleBookNow = (roomType?: string) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    const params = roomType ? `?roomType=${roomType}` : '';
    navigate(`/book/${id}${params}`);
  };

  const handleAuthSuccess = () => {
    navigate(`/book/${id}`);
  };

  if (isLoading) return <DetailSkeleton />;
  if (error || !property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl">🏠</div>
        <h2 className="text-xl font-bold text-slate-800">Property not found</h2>
        <button onClick={() => navigate('/')} className="text-blue-600 hover:underline text-sm font-medium">← Back to Home</button>
      </div>
    );
  }

  const genderBadge = GENDER_LABELS[property.gender] ?? { label: property.gender, color: 'bg-slate-100 text-slate-600' };
  const startingPrice = property.startingPrice || 0;
  const availableBeds = property.availableBeds ?? 0;
  const desc = property.description ?? '';
  const isLongDesc = desc.length > 200;
  const shownDesc = descExpanded || !isLongDesc ? desc : desc.slice(0, 200) + '…';

  const mapProps = property.latitude && property.longitude
    ? [{ ...property, _id: property._id, startingPrice, availableBeds } as any]
    : [];

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-400 mb-4 flex items-center gap-1.5">
          <button onClick={() => navigate('/')} className="hover:text-blue-600 transition-colors">Home</button>
          <span>/</span>
          <button onClick={() => navigate('/search')} className="hover:text-blue-600 transition-colors">Search</button>
          <span>/</span>
          <span className="text-slate-700 font-medium truncate max-w-xs">{property.name}</span>
        </nav>

        {/* ── Image Gallery ─────────────────────────────────────────────────── */}
        <ImageGallery images={property.images ?? []} propertyName={property.name} propertyId={property._id} />

        <div className="mt-6 flex flex-col lg:flex-row gap-8">
          {/* ── LEFT CONTENT ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* ── b) Property Header ─────────────────────────────────────────── */}
            <div>
              <div className="flex flex-wrap items-start gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{property.name}</h1>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full mt-1 ${genderBadge.color}`}>{genderBadge.label}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <StarDisplay rating={property.rating} />
                  <span className="font-semibold text-slate-700">{property.rating > 0 ? property.rating.toFixed(1) : 'No ratings'}</span>
                  {property.reviewCount > 0 && <span>({property.reviewCount} reviews)</span>}
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  {[property.locality, property.city, property.state].filter(Boolean).join(', ')}
                </div>
                {property.distance !== undefined && (
                  <span className="text-blue-600 font-medium">📍 {property.distance} km away</span>
                )}
              </div>
            </div>

            {/* ── c) Quick Stats ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { icon: BedDouble, label: 'Total Beds',      value: String(availability?.totalBeds ?? '—') },
                { icon: CheckCircle, label: 'Available',     value: String(availableBeds) },
                { icon: Users, label: 'Occupied',            value: String(availability?.totalOccupied ?? '—') },
                { icon: Utensils, label: 'Food',             value: property.amenities?.includes('FOOD') ? 'Included' : 'Not included' },
                { icon: Wifi, label: 'WiFi',                 value: property.amenities?.includes('WIFI') ? 'Available' : 'Not available' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center gap-1 text-center">
                  <Icon className="w-5 h-5 text-blue-500" />
                  <span className="text-xs text-slate-500 font-medium leading-tight">{label}</span>
                  <span className="text-sm font-bold text-slate-800">{value}</span>
                </div>
              ))}
            </div>

            {/* ── d) About ───────────────────────────────────────────────────── */}
            {desc && (
              <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">About this PG</h2>
                <p className="text-slate-600 text-sm leading-relaxed">{shownDesc}</p>
                {isLongDesc && (
                  <button onClick={() => setDescExpanded(e => !e)} className="text-blue-600 text-sm font-medium mt-1 flex items-center gap-1 hover:text-blue-700">
                    {descExpanded ? <><ChevronUp className="w-4 h-4" /> Show less</> : <><ChevronDown className="w-4 h-4" /> Read more</>}
                  </button>
                )}
              </section>
            )}

            {/* ── e) Amenities ───────────────────────────────────────────────── */}
            {property.amenities?.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-slate-900 mb-3">Amenities</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {property.amenities.map(a => {
                    const cfg = AMENITY_ICONS[a];
                    const Icon = cfg?.icon;
                    return (
                      <div key={a} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center gap-1.5 text-center">
                        {Icon ? <Icon className="w-5 h-5 text-blue-500" /> : <CheckCircle className="w-5 h-5 text-blue-500" />}
                        <span className="text-xs text-slate-600 font-medium leading-tight">{cfg?.label ?? a}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── f) Rules ───────────────────────────────────────────────────── */}
            {property.rules && property.rules.trim().length > 0 && (
              <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">House Rules</h2>
                <ul className="space-y-1.5">
                  {property.rules.split('\n').filter((r: string) => r.trim()).map((rule: string) => (
                    <li key={rule} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-green-500 font-bold mt-0.5">✓</span>
                      {rule.trim()}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* ── g) Room Types & Availability ────────────────────────────────── */}
            {rooms.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-slate-900 mb-3">Room Types & Availability</h2>
                {/* Tab bar */}
                <div className="flex border-b border-slate-200 mb-4 overflow-x-auto no-scrollbar">
                  {roomTypes.map(rt => (
                    <button key={rt} onClick={() => setActiveRoomType(rt)}
                      className={`px-4 py-2.5 text-sm font-semibold flex-shrink-0 border-b-2 transition-colors ${activeRoomType === rt ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                      {ROOM_TYPE_LABELS[rt] ?? rt}
                    </button>
                  ))}
                </div>
                {/* Rooms in active tab */}
                <div className="space-y-4">
                  {activeRooms.map(room => (
                    <div key={room._id} className="bg-white border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-semibold text-slate-900 text-sm">Room {room.roomNumber}</span>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${room.availableBeds > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            {room.availableBeds} of {room.totalBeds} beds free
                          </span>
                        </div>
                        <span className="font-bold text-green-600 text-sm">
                          ₹{room.pricePerBed.toLocaleString('en-IN')}/mo
                        </span>
                      </div>
                      {/* Bed grid placeholder — real beds loaded per property/room */}
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: room.totalBeds }).map((_, i) => {
                          const isOccupied = i >= room.availableBeds;
                          return (
                            <div key={i} className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xs font-bold ${
                              isOccupied ? 'bg-red-100 border-red-200 text-red-500' : 'bg-green-100 border-green-300 text-green-700'
                            }`}>
                              B{i + 1}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleBookNow(activeRoomType)}
                  className="mt-4 w-full py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl font-semibold text-sm transition-colors">
                  Book a {ROOM_TYPE_LABELS[activeRoomType] ?? activeRoomType} Room
                </button>
              </section>
            )}

            {/* ── h) Reviews ─────────────────────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-base font-bold text-slate-900">Reviews</h2>
                {property.reviewCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-slate-900">{property.rating.toFixed(1)}</span>
                    <StarDisplay rating={property.rating} size="lg" />
                    <span className="text-sm text-slate-500">({property.reviewCount})</span>
                  </div>
                )}
              </div>

              {allReviews.length > 0 && (
                <div className="mb-5">
                  <RatingBreakdown reviews={allReviews} />
                </div>
              )}

              {allReviews.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                  <div className="text-3xl mb-2">⭐</div>
                  <p className="text-slate-500 text-sm">No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allReviews.map(review => (
                    <div key={review._id} className="bg-white border border-slate-200 rounded-xl p-4">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                          {(review.guestId?.name ?? 'G').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900 text-sm">{review.guestId?.name ?? 'Guest'}</span>
                            <span className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                          </div>
                          <StarDisplay rating={review.rating} />
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              {hasMoreReviews && (
                <button onClick={() => setReviewPage(p => p + 1)} disabled={reviewsFetching}
                  className="mt-4 w-full py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  {reviewsFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Load More Reviews
                </button>
              )}
            </section>

            {/* ── i) Location Map ─────────────────────────────────────────────── */}
            <section>
              <h2 className="text-base font-bold text-slate-900 mb-3">Location</h2>
              {property.latitude && property.longitude ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 mb-3" style={{ height: 280 }}>
                  <MapView properties={mapProps} />
                </div>
              ) : (
                <div className="bg-slate-100 rounded-2xl h-40 flex items-center justify-center text-slate-400 text-sm mb-3">Map not available</div>
              )}
              <p className="text-sm text-slate-600 mb-2">📍 {property.address}, {property.city}, {property.state} — {property.pincode}</p>
              {property.latitude && property.longitude && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Get Directions <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </section>
          </div>

          {/* ── RIGHT: Sticky Booking Card (desktop) ────────────────────────── */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-20 bg-white border border-slate-200 rounded-2xl shadow-lg p-5 space-y-4">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-green-600">₹{startingPrice.toLocaleString('en-IN')}</span>
                  <span className="text-slate-400 text-sm">/month</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <StarDisplay rating={property.rating} />
                  <span className="text-xs text-slate-500">{property.rating > 0 ? property.rating.toFixed(1) : 'New'} · {property.reviewCount} reviews</span>
                </div>
              </div>

              <div className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg ${availableBeds > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                <BedDouble className="w-4 h-4" />
                {availableBeds > 0 ? `${availableBeds} beds available` : 'No beds available'}
              </div>

              <button
                onClick={() => setVisitModalOpen(true)}
                className="w-full py-2.5 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" /> Schedule Visit
              </button>
              <button
                disabled={availableBeds === 0}
                onClick={() => handleBookNow()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-sm transition-colors shadow-sm">
                {availableBeds === 0 ? 'Fully Occupied' : 'Book Now →'}
              </button>

              <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Verified property</div>
                <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> No hidden charges</div>
                <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Cancel anytime (before check-in)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE: Sticky Bottom Bar ─────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 flex items-center gap-3 z-40 shadow-lg">
        <div className="flex-1">
          <div className="text-lg font-bold text-green-600">₹{startingPrice.toLocaleString('en-IN')}<span className="text-xs text-slate-400 font-normal">/mo</span></div>
          <div className={`text-xs font-semibold ${availableBeds > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {availableBeds > 0 ? `${availableBeds} beds left` : 'Fully occupied'}
          </div>
        </div>
        <button onClick={() => setVisitModalOpen(true)} className="px-4 py-2.5 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold text-sm">
          Visit
        </button>
        <button disabled={availableBeds === 0} onClick={() => handleBookNow()}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:bg-slate-300 disabled:text-slate-400">
          Book Now
        </button>
      </div>

      {/* Modals */}
      {visitModalOpen && (
        <ScheduleVisitModal propertyId={id!} propertyName={property.name} onClose={() => setVisitModalOpen(false)} />
      )}
      {authModalOpen && (
        <AuthModal onClose={() => setAuthModalOpen(false)} onSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}
