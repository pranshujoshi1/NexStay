import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { usePublicProperties, type PublicProperty } from '@/lib/publicApi';
import PropertyCard from '@/components/marketplace/PropertyCard';
import PropertyCardSkeleton from '@/components/marketplace/PropertyCardSkeleton';

// ─── Quick filter chips ───────────────────────────────────────────────────────
const QUICK_FILTERS = [
  { label: '🧑 Boys PG',      params: '?gender=BOYS' },
  { label: '👩 Girls PG',     params: '?gender=GIRLS' },
  { label: '🤝 Co-Living',    params: '?gender=CO_ED' },
  { label: '🍽️ With Food',   params: '?amenities=FOOD' },
  { label: '❄️ AC Room',     params: '?amenities=AC' },
  { label: '💸 Under ₹5000', params: '?maxPrice=5000' },
];

// ─── Individual property section row ─────────────────────────────────────────
interface SectionProps {
  title: string;
  viewAllHref: string;
  queryParams: Record<string, string | number>;
  userLat?: number;
  userLng?: number;
}

function PropertySection({ title, viewAllHref, queryParams, userLat, userLng }: SectionProps) {
  const navigate = useNavigate();
  const params = {
    ...queryParams,
    limit: 8,
    ...(userLat !== undefined ? { lat: userLat } : {}),
    ...(userLng !== undefined ? { lng: userLng } : {}),
  };

  const { data, isLoading } = usePublicProperties(params as any);
  const properties: PublicProperty[] = data?.data ?? [];

  // Hide section entirely when done loading and empty
  if (!isLoading && properties.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-0">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <button
          onClick={() => navigate(viewAllHref)}
          className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex gap-4 overflow-x-auto pb-3 no-scrollbar px-4 sm:px-0">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-72">
                <PropertyCardSkeleton />
              </div>
            ))
          : properties.map((p) => (
              <div key={p._id} className="flex-shrink-0 w-72">
                <PropertyCard property={p} />
              </div>
            ))}
      </div>
    </section>
  );
}

// ─── Homepage ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [userLat, setUserLat] = useState<number | undefined>();
  const [userLng, setUserLng] = useState<number | undefined>();
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Fetch total verified property count for hero badge
  const { data: totalData } = usePublicProperties({ limit: 1 });
  const totalVerified = totalData?.totalCount ?? 0;

  const handleSearch = () => {
    const q = searchInput.trim();
    navigate(q ? `/search?city=${encodeURIComponent(q)}` : '/search');
  };

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setGeoLoading(false);
      },
      () => {
        setGeoError('Could not get location. Please allow location access.');
        setGeoLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  return (
    <div className="animate-fade-in">
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            {totalVerified > 0 ? `${totalVerified}+ Verified PGs & Hostels` : 'Verified PGs & Hostels'}
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-3">
            Find Your Perfect
            <span className="text-blue-600"> PG or Hostel</span>
          </h1>
          <p className="text-lg text-slate-500 mb-8">
            Near your college. Within your budget.
          </p>

          {/* Search bar */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-2 flex items-center gap-2 max-w-xl mx-auto">
            <Search className="w-5 h-5 text-slate-400 ml-2 flex-shrink-0" />
            <input
              id="hero-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="City or College or Area..."
              className="flex-1 outline-none text-slate-900 placeholder-slate-400 text-sm py-2 bg-transparent"
            />
            <button
              id="hero-search-btn"
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              Search
            </button>
          </div>

          {/* Geolocation CTA */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              id="geo-location-btn"
              onClick={handleGeolocate}
              disabled={geoLoading}
              className="text-sm text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              {geoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
              {userLat ? '✅ Location active — showing nearby PGs' : '📍 Use my current location'}
            </button>
          </div>
          {geoError && <p className="text-xs text-red-500 mt-2">{geoError}</p>}

          {/* Quick filter chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.label}
                id={`quick-filter-${f.label.replace(/\s+/g, '-')}`}
                onClick={() => navigate(`/search${f.params}`)}
                className="text-sm bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 px-4 py-2 rounded-full transition-all duration-150 font-medium"
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────────────────────── */}
      <div className="bg-slate-50 border-b border-slate-100 py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 font-medium">
          <span className="flex items-center gap-1.5"><span className="text-green-500 font-bold">✓</span> Verified Owners</span>
          <span className="w-px h-4 bg-slate-200 hidden sm:block" />
          <span className="flex items-center gap-1.5"><span className="text-blue-500 font-bold">⭐</span> Rated by Students</span>
          <span className="w-px h-4 bg-slate-200 hidden sm:block" />
          <span className="flex items-center gap-1.5"><span className="text-violet-500 font-bold">🔐</span> Safe &amp; Secure</span>
          <span className="w-px h-4 bg-slate-200 hidden sm:block" />
          <span className="flex items-center gap-1.5"><span className="text-orange-500 font-bold">🍽️</span> Food Included Options</span>
        </div>
      </div>

      {/* ── Property Sections ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Section 1: Nearby (only if location granted) */}
        {userLat !== undefined && userLng !== undefined && (
          <PropertySection
            title="📍 Nearby PGs"
            viewAllHref={`/search?lat=${userLat}&lng=${userLng}&radius=5&sortBy=distance`}
            queryParams={{ sortBy: 'distance', radius: 5 }}
            userLat={userLat}
            userLng={userLng}
          />
        )}

        {/* Section 2: Budget Friendly */}
        <PropertySection
          title="💸 Budget Friendly (Under ₹5,000)"
          viewAllHref="/search?maxPrice=5000"
          queryParams={{ maxPrice: 5000, sortBy: 'price_asc' }}
        />

        {/* Section 3: Boys Hostels */}
        <PropertySection
          title="🧑 Boys Hostels"
          viewAllHref="/search?gender=BOYS"
          queryParams={{ gender: 'BOYS', sortBy: 'rating' }}
        />

        {/* Section 4: Girls PGs */}
        <PropertySection
          title="👩 Girls PGs"
          viewAllHref="/search?gender=GIRLS"
          queryParams={{ gender: 'GIRLS', sortBy: 'rating' }}
        />

        {/* Section 5: Newly Listed */}
        <PropertySection
          title="🆕 Newly Listed"
          viewAllHref="/search?sortBy=newest"
          queryParams={{ sortBy: 'newest' }}
        />
      </div>

      {/* ── Footer CTA ───────────────────────────────────────────────────────── */}
      <section className="bg-blue-600 text-white py-14 px-4 mt-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">Own a PG or Hostel?</h2>
          <p className="text-blue-100 mb-6">List your property on NexStay and reach thousands of students and professionals.</p>
          <button
            onClick={() => navigate('/signup?role=HOSTEL_ADMIN')}
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 rounded-xl transition-colors shadow-sm"
          >
            List Your Property →
          </button>
        </div>
      </section>
    </div>
  );
}
