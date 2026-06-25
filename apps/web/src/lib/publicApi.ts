import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const publicApi = axios.create({ baseURL: '/api/public' });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublicProperty {
  _id: string;
  name: string;
  description: string;
  address: string;
  locality?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  gender: 'BOYS' | 'GIRLS' | 'CO_ED';
  amenities: string[];
  rules?: string;
  foodIncluded: boolean;
  images: string[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isPaused: boolean;
  verificationStatus: string;
  createdAt: string;
  // computed
  startingPrice: number;
  availableBeds: number;
  distance?: number;
}

export interface PublicPropertyDetail {
  property: PublicProperty & { ownerName: string };
  rooms: Array<{
    _id: string;
    roomNumber: string;
    roomType: string;
    capacity: number;
    pricePerBed: number;
    availableBeds: number;
    totalBeds: number;
    occupiedBeds: number;
  }>;
  availability: { totalBeds: number; totalAvailable: number; totalOccupied: number };
  reviews: PublicReview[];
}

export interface PublicReview {
  _id: string;
  propertyId: string;
  guestId: { name: string } | null;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  totalCount: number;
  page: number;
  hasNextPage: boolean;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface PropertySearchParams {
  city?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string;
  roomType?: string;
  page?: number;
  limit?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'distance' | 'newest';
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function usePublicProperties(params: PropertySearchParams, options?: { enabled?: boolean }) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  );
  return useQuery<PaginatedResponse<PublicProperty>>({
    queryKey: ['public-properties', cleanParams],
    queryFn: async () => {
      const { data } = await publicApi.get('/properties', { params: cleanParams });
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: options?.enabled !== false,
  });
}

export function usePublicPropertyDetail(id: string | undefined) {
  return useQuery<{ success: boolean; data: PublicPropertyDetail }>({
    queryKey: ['public-property-detail', id],
    queryFn: async () => {
      const { data } = await publicApi.get(`/properties/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePublicCities() {
  return useQuery<{ success: boolean; data: string[] }>({
    queryKey: ['public-cities'],
    queryFn: async () => {
      const { data } = await publicApi.get('/cities');
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function usePublicPropertyReviews(id: string | undefined, page = 1) {
  return useQuery<PaginatedResponse<PublicReview>>({
    queryKey: ['public-reviews', id, page],
    queryFn: async () => {
      const { data } = await publicApi.get(`/properties/${id}/reviews`, { params: { page } });
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
