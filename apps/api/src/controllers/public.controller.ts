import { Request, Response } from 'express';
import { Property } from '../models/Property.model';
import { Room } from '../models/Room.model';
import { Bed } from '../models/Bed.model';
import { Review } from '../models/Review.model';
import { User } from '../models/User.model';

// ─── Haversine formula (returns distance in km) ──────────────────────────────
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Enrich a list of properties with computed fields ────────────────────────
async function enrichProperties(
  props: any[],
  userLat?: number,
  userLng?: number
): Promise<any[]> {
  return Promise.all(
    props.map(async (p) => {
      // Get all rooms for this property
      const rooms = await Room.find({ propertyId: p._id }).select('_id pricePerBed capacity').lean();
      const roomIds = rooms.map((r) => r._id);

      // Starting price = min pricePerBed across rooms
      const startingPrice =
        rooms.length > 0
          ? Math.min(...rooms.map((r) => r.pricePerBed ?? 0).filter((x) => x > 0))
          : (p.rentStartingFrom ?? 0);

      // Available beds
      const availableBeds = await Bed.countDocuments({
        roomId: { $in: roomIds },
        status: 'AVAILABLE',
      });

      // Distance
      let distance: number | undefined;
      if (userLat !== undefined && userLng !== undefined && p.latitude && p.longitude) {
        distance = Math.round(haversine(userLat, userLng, p.latitude, p.longitude) * 10) / 10;
      }

      return {
        ...p,
        startingPrice,
        availableBeds,
        ...(distance !== undefined ? { distance } : {}),
      };
    })
  );
}

// ─── GET /api/public/properties ───────────────────────────────────────────────
export const getPublicProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      city,
      lat,
      lng,
      radius = '5',
      gender,
      minPrice,
      maxPrice,
      amenities,
      roomType,
      page = '1',
      limit = '12',
      sortBy = 'newest',
    } = req.query as Record<string, string>;

    const userLat = lat ? parseFloat(lat) : undefined;
    const userLng = lng ? parseFloat(lng) : undefined;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    // Base filter — always required
    const filter: any = {
      verificationStatus: 'APPROVED',
      isActive: true,
      isPaused: false,
    };

    if (city) filter.city = { $regex: city.trim(), $options: 'i' };
    if (gender && gender !== 'ALL') filter.gender = gender;
    if (amenities) {
      const list = amenities.split(',').map((a) => a.trim()).filter(Boolean);
      if (list.length) filter.amenities = { $all: list };
    }

    // NOTE: Price pre-filter intentionally removed — properties with rentStartingFrom=0
    // (e.g. newly created before schema fix) would be incorrectly excluded.
    // Accurate price filtering is done post-enrichment using actual room prices (line ~156).

    // Room type filter — find properties that have rooms of the requested type
    let propertyIdsWithRoomType: any[] | undefined;
    if (roomType) {
      const roomTypes = roomType.split(',').map((t) => t.trim()).filter(Boolean);
      if (roomTypes.length) {
        const matchingRooms = await Room.find({ roomType: { $in: roomTypes } }).select('propertyId').lean();
        propertyIdsWithRoomType = [...new Set(matchingRooms.map((r) => String(r.propertyId)))];
        filter._id = { $in: propertyIdsWithRoomType };
      }
    }

    // Sort map (distance handled post-fetch)
    const sortMap: Record<string, any> = {
      price_asc:  { rentStartingFrom: 1 },
      price_desc: { rentStartingFrom: -1 },
      rating:     { rating: -1 },
      newest:     { createdAt: -1 },
      distance:   { createdAt: -1 }, // fetch all then sort by distance below
    };
    const mongoSort = sortMap[sortBy] ?? { createdAt: -1 };

    // For distance sort we need all properties within radius — fetch without pagination first
    const isDistanceSort = sortBy === 'distance' && userLat !== undefined && userLng !== undefined;

    let properties: any[];
    let totalCount: number;

    if (isDistanceSort) {
      const all = await Property.find(filter).sort(mongoSort).lean();
      const enriched = await enrichProperties(all, userLat, userLng);
      // Filter by radius
      const radiusKm = parseFloat(radius);
      const filtered = enriched.filter((p) =>
        p.distance === undefined || p.distance <= radiusKm
      );
      filtered.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
      totalCount = filtered.length;
      properties = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);
    } else {
      [properties, totalCount] = await Promise.all([
        Property.find(filter)
          .sort(mongoSort)
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean(),
        Property.countDocuments(filter),
      ]);
      properties = await enrichProperties(properties, userLat, userLng);
    }

    // Apply price filter post-enrichment if minPrice/maxPrice set (accurate)
    if (minPrice || maxPrice) {
      const min = minPrice ? Number(minPrice) : 0;
      const max = maxPrice ? Number(maxPrice) : Infinity;
      properties = properties.filter((p) => p.startingPrice >= min && p.startingPrice <= max);
    }

    res.json({
      success: true,
      data: properties,
      totalCount,
      page: pageNum,
      hasNextPage: pageNum * limitNum < totalCount,
    });
  } catch (err) {
    console.error('[public] getPublicProperties error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/public/properties/:id ──────────────────────────────────────────
export const getPublicPropertyDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const property = await Property.findOne({
      _id: id,
      verificationStatus: 'APPROVED',
      isActive: true,
    }).lean();

    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found' });
      return;
    }

    // Owner display name only (no contact info)
    const owner = await User.findById((property as any).tenantId).select('name').lean();

    // Rooms with bed availability
    const rooms = await Room.find({ propertyId: id }).lean();
    const roomsWithBeds = await Promise.all(
      rooms.map(async (room) => {
        const [availableBeds, totalBeds] = await Promise.all([
          Bed.countDocuments({ roomId: room._id, status: 'AVAILABLE' }),
          Bed.countDocuments({ roomId: room._id }),
        ]);
        return { ...room, availableBeds, totalBeds, occupiedBeds: totalBeds - availableBeds };
      })
    );

    // Property-level bed summary
    const roomIds = rooms.map((r) => r._id);
    const [totalAvailable, totalBeds] = await Promise.all([
      Bed.countDocuments({ roomId: { $in: roomIds }, status: 'AVAILABLE' }),
      Bed.countDocuments({ roomId: { $in: roomIds } }),
    ]);

    // Starting price
    const startingPrice =
      rooms.length > 0
        ? Math.min(...rooms.map((r) => r.pricePerBed ?? 0).filter((x) => x > 0))
        : ((property as any).rentStartingFrom ?? 0);

    // Last 10 reviews with reviewer name
    const reviews = await Review.find({ propertyId: id })
      .populate('guestId', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: {
        property: {
          ...property,
          startingPrice,
          availableBeds: totalAvailable,
          ownerName: owner?.name ?? 'NexStay Partner',
        },
        rooms: roomsWithBeds,
        availability: { totalBeds, totalAvailable, totalOccupied: totalBeds - totalAvailable },
        reviews,
      },
    });
  } catch (err) {
    console.error('[public] getPublicPropertyDetail error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/public/cities ───────────────────────────────────────────────────
export const getPublicCities = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cities = await Property.distinct('city', {
      verificationStatus: 'APPROVED',
      isActive: true,
      isPaused: false,
    });
    res.json({ success: true, data: cities.sort() });
  } catch (err) {
    console.error('[public] getPublicCities error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/public/properties/:id/reviews ──────────────────────────────────
export const getPublicPropertyReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const page = Math.max(1, parseInt((req.query.page as string) ?? '1'));
    const limit = Math.min(20, Math.max(1, parseInt((req.query.limit as string) ?? '10')));

    const [reviews, totalCount] = await Promise.all([
      Review.find({ propertyId: id })
        .populate('guestId', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Review.countDocuments({ propertyId: id }),
    ]);

    res.json({
      success: true,
      data: reviews,
      totalCount,
      page,
      hasNextPage: page * limit < totalCount,
    });
  } catch (err) {
    console.error('[public] getPublicPropertyReviews error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/public/properties/:id/beds ─────────────────────────────────────
export const getPublicPropertyBeds = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { roomId } = req.query;
    const filter: any = { propertyId: id };
    if (roomId) filter.roomId = roomId;
    const beds = await Bed.find(filter).lean();
    res.json({ success: true, data: beds });
  } catch (err) {
    console.error('[public] getPublicPropertyBeds error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
