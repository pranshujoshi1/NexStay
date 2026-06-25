import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User.model';
import { Property } from '../models/Property.model';
import { Booking } from '../models/Booking.model';
import { RentRecord } from '../models/RentRecord.model';
import { notify } from '../services/notification.service';

const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
function lastNMonths(n: number) {
  const list = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    list.push(ym(d));
  }
  return list;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export const getSuperDashboard = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalOwners, totalGuests, totalBookings] = await Promise.all([
      User.countDocuments({ role: 'HOSTEL_ADMIN' }),
      User.countDocuments({ role: 'GUEST' }),
      Booking.countDocuments({}),
    ]);

    const [approved, pending, rejected] = await Promise.all([
      Property.countDocuments({ verificationStatus: 'APPROVED' }),
      Property.countDocuments({ verificationStatus: 'PENDING' }),
      Property.countDocuments({ verificationStatus: 'REJECTED' }),
    ]);

    const cities = await Property.distinct('city', { verificationStatus: 'APPROVED' });

    const allRent = await RentRecord.find({}).lean();
    const platformRevenue = allRent.reduce((s, r) => s + (r.paidAmount || 0), 0);

    // Charts: last 6 months
    const monthList = lastNMonths(6);
    const ownersByMonth = await Promise.all(monthList.map(async (m) => {
      const [yr, mo] = m.split('-').map(Number);
      const start = new Date(yr, mo - 1, 1); const end = new Date(yr, mo, 0, 23, 59, 59);
      const count = await User.countDocuments({ role: 'HOSTEL_ADMIN', createdAt: { $gte: start, $lte: end } });
      return { month: m, count };
    }));
    const bookingsByMonth = await Promise.all(monthList.map(async (m) => {
      const [yr, mo] = m.split('-').map(Number);
      const start = new Date(yr, mo - 1, 1); const end = new Date(yr, mo, 0, 23, 59, 59);
      const count = await Booking.countDocuments({ createdAt: { $gte: start, $lte: end } });
      return { month: m, count };
    }));
    const revenueByMonth = await Promise.all(monthList.map(async (m) => {
      const recs = await RentRecord.find({ month: m }).lean();
      return { month: m, revenue: recs.reduce((s, r) => s + (r.paidAmount || 0), 0) };
    }));

    // Top 5 cities
    const cityAgg = await Property.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 5 },
    ]);

    res.json({
      success: true,
      data: {
        stats: { totalOwners, totalGuests, totalBookings, approved, pending, rejected, citiesCovered: cities.length, platformRevenue },
        ownersByMonth, bookingsByMonth, revenueByMonth, topCities: cityAgg,
      },
    });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
export const getGuests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: any = { role: 'GUEST' };
    if (status && status !== 'ALL') filter.status = status;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const p = Math.max(1, parseInt(page)), lim = parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-passwordHash -otp -otpExpiry').sort({ createdAt: -1 }).skip((p - 1) * lim).limit(lim).lean(),
      User.countDocuments(filter),
    ]);
    // Enrich with active bookings count
    const enriched = await Promise.all(users.map(async u => {
      const activeBookings = await Booking.countDocuments({ guestId: u._id, status: { $in: ['CONFIRMED','CHECKED_IN'] } });
      return { ...u, activeBookings };
    }));
    res.json({ success: true, data: enriched, total, hasNextPage: p * lim < total });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getOwners = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, verificationStatus, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: any = { role: 'HOSTEL_ADMIN' };
    if (status && status !== 'ALL') filter.status = status;
    if (verificationStatus && verificationStatus !== 'ALL') filter.ownerVerificationStatus = verificationStatus;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { businessName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const p = Math.max(1, parseInt(page)), lim = parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-passwordHash -otp -otpExpiry').sort({ createdAt: -1 }).skip((p - 1) * lim).limit(lim).lean(),
      User.countDocuments(filter),
    ]);
    const enriched = await Promise.all(users.map(async u => {
      const [approvedProps, pendingProps] = await Promise.all([
        Property.countDocuments({ tenantId: u._id, verificationStatus: 'APPROVED' }),
        Property.countDocuments({ tenantId: u._id, verificationStatus: 'PENDING' }),
      ]);
      return { ...u, approvedProps, pendingProps };
    }));
    res.json({ success: true, data: enriched, total, hasNextPage: p * lim < total });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const suspendUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'SUPER_ADMIN') { res.status(404).json({ success: false, message: 'User not found' }); return; }
    user.status = 'SUSPENDED';
    await user.save();
    res.json({ success: true, message: `${user.name} has been suspended` });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const reactivateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'SUPER_ADMIN') { res.status(404).json({ success: false, message: 'User not found' }); return; }
    user.status = 'ACTIVE';
    await user.save();
    res.json({ success: true, message: `${user.name} has been reactivated` });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROPERTY VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════
export const getAllProperties = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { verificationStatus, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: any = {};
    if (verificationStatus && verificationStatus !== 'ALL') filter.verificationStatus = verificationStatus;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { city: { $regex: search, $options: 'i' } }];
    const p = Math.max(1, parseInt(page)), lim = parseInt(limit);
    const [props, total] = await Promise.all([
      Property.find(filter).populate('tenantId', 'name email businessName ownerVerificationStatus').sort({ createdAt: -1 }).skip((p - 1) * lim).limit(lim).lean(),
      Property.countDocuments(filter),
    ]);
    res.json({ success: true, data: props, total, hasNextPage: p * lim < total });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getPropertyDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prop = await Property.findById(req.params.id).populate('tenantId', 'name email businessName createdAt ownerVerificationStatus').lean();
    if (!prop) { res.status(404).json({ success: false, message: 'Property not found' }); return; }
    res.json({ success: true, data: prop });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const approveProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prop = await Property.findById(req.params.id);
    if (!prop) { res.status(404).json({ success: false, message: 'Property not found' }); return; }
    prop.verificationStatus = 'APPROVED';
    prop.rejectionReason = '';

    // Backfill rentStartingFrom from rooms if missing
    if (!prop.rentStartingFrom || prop.rentStartingFrom === 0) {
      const { Room } = await import('../models/Room.model');
      const rooms = await Room.find({ propertyId: prop._id }).select('pricePerBed').lean();
      const prices = rooms.map((r: any) => r.pricePerBed).filter((p: number) => p > 0);
      if (prices.length > 0) prop.rentStartingFrom = Math.min(...prices);
    }

    await prop.save();
    notify({
      userId: prop.tenantId.toString(),
      type: 'PROPERTY_APPROVED',
      title: '🎉 Property Approved!',
      message: `Congratulations! "${prop.name}" is now live on NexStay marketplace.`,
      linkUrl: '/admin/properties',
    }).catch(() => {});
    res.json({ success: true, data: prop });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const rejectProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim().length < 30) {
      res.status(400).json({ success: false, message: 'Rejection reason must be at least 30 characters.' }); return;
    }
    const prop = await Property.findById(req.params.id);
    if (!prop) { res.status(404).json({ success: false, message: 'Property not found' }); return; }
    prop.verificationStatus = 'REJECTED';
    prop.rejectionReason = reason.trim();
    await prop.save();
    notify({
      userId: prop.tenantId.toString(),
      type: 'PROPERTY_REJECTED',
      title: '❌ Property Not Approved',
      message: `Your property "${prop.name}" was not approved. Reason: ${reason.trim()}`,
      linkUrl: '/admin/properties',
    }).catch(() => {});
    res.json({ success: true, data: prop });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// OWNER VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════
export const getPendingOwnerVerifications = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const owners = await User.find({ role: 'HOSTEL_ADMIN', ownerVerificationStatus: 'PENDING' })
      .select('-passwordHash -otp -otpExpiry').sort({ createdAt: 1 }).lean();
    res.json({ success: true, data: owners });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const approveOwnerVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const owner = await User.findOne({ _id: req.params.id, role: 'HOSTEL_ADMIN' });
    if (!owner) { res.status(404).json({ success: false, message: 'Owner not found' }); return; }
    owner.ownerVerificationStatus = 'APPROVED';
    owner.ownerRejectionReason = '';
    await owner.save();
    notify({
      userId: owner._id.toString(),
      type: 'OWNER_VERIFIED',
      title: '✅ Owner Verification Approved',
      message: 'Your business verification has been approved! You can now list properties on NexStay.',
      linkUrl: '/admin/properties',
    }).catch(() => {});
    res.json({ success: true, message: 'Owner verified successfully' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const rejectOwnerVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim().length < 10) {
      res.status(400).json({ success: false, message: 'Rejection reason required (min 10 chars).' }); return;
    }
    const owner = await User.findOne({ _id: req.params.id, role: 'HOSTEL_ADMIN' });
    if (!owner) { res.status(404).json({ success: false, message: 'Owner not found' }); return; }
    owner.ownerVerificationStatus = 'REJECTED';
    owner.ownerRejectionReason = reason.trim();
    await owner.save();
    notify({
      userId: owner._id.toString(),
      type: 'OWNER_VERIFICATION_REJECTED',
      title: '❌ Verification Not Approved',
      message: `Your business verification was not approved. Reason: ${reason.trim()}`,
    }).catch(() => {});
    res.json({ success: true, message: 'Owner verification rejected' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLATFORM MONITORING — Bookings
// ═══════════════════════════════════════════════════════════════════════════════
export const getAllBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, city, page = '1', limit = '20', from, to } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page)), lim = parseInt(limit);
    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;
    if (from || to) filter.createdAt = { ...(from && { $gte: new Date(from) }), ...(to && { $lte: new Date(to) }) };

    let query = Booking.find(filter)
      .populate('guestId', 'name email phone')
      .populate({ path: 'propertyId', select: 'name city tenantId', populate: { path: 'tenantId', select: 'name businessName' } })
      .populate('roomId', 'roomNumber')
      .sort({ createdAt: -1 }).skip((p - 1) * lim).limit(lim);

    const [bookings, total] = await Promise.all([query.lean(), Booking.countDocuments(filter)]);

    // Filter by city if needed (post-query since city is on populated field)
    const filtered = city ? bookings.filter(b => (b.propertyId as any)?.city?.toLowerCase().includes(city.toLowerCase())) : bookings;

    res.json({ success: true, data: filtered, total, hasNextPage: p * lim < total });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLATFORM MONITORING — Revenue
// ═══════════════════════════════════════════════════════════════════════════════
export const getPlatformRevenue = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const monthList = lastNMonths(12);
    const table = await Promise.all(monthList.map(async (m) => {
      const recs = await RentRecord.find({ month: m }).lean();
      const due = recs.reduce((s, r) => s + r.amount + (r.fine || 0), 0);
      const collected = recs.reduce((s, r) => s + (r.paidAmount || 0), 0);
      const pending = Math.max(0, due - collected);
      const [yr, mo] = m.split('-').map(Number);
      const start = new Date(yr, mo - 1, 1); const end = new Date(yr, mo, 0, 23, 59, 59);
      const activeProps = await Property.countDocuments({ verificationStatus: 'APPROVED', createdAt: { $lte: end } });
      return { month: m, due, collected, pending, activeProps };
    }));
    res.json({ success: true, data: table });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};
