import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { Property } from '../models/Property.model';
import { Room } from '../models/Room.model';
import { Bed } from '../models/Bed.model';
import { Floor } from '../models/Floor.model';
import { Booking } from '../models/Booking.model';
import { RentRecord } from '../models/RentRecord.model';
import { Complaint } from '../models/Complaint.model';
import { Expense } from '../models/Expense.model';
import { Notification } from '../models/Notification.model';
import { HostelStudent } from '../models/HostelStudent.model';
import { notify } from '../services/notification.service';


// ─── Helper: month boundaries ─────────────────────────────────────────────────
function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

// ─── GET /api/hostel-admin/dashboard ─────────────────────────────────────────
export const getAdminDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId } = req.query;

    const propFilter: any = { tenantId };
    if (propertyId) propFilter._id = new mongoose.Types.ObjectId(propertyId as string);

    const properties = await Property.find(propFilter).lean();
    const propertyIds = properties.map(p => p._id);

    // Rooms & Beds
    const rooms = await Room.find({ propertyId: { $in: propertyIds } }).lean();
    const roomIds = rooms.map(r => r._id);
    const [totalBeds, availableBeds, occupiedBeds] = await Promise.all([
      Bed.countDocuments({ roomId: { $in: roomIds } }),
      Bed.countDocuments({ roomId: { $in: roomIds }, status: 'AVAILABLE' }),
      Bed.countDocuments({ roomId: { $in: roomIds }, status: 'OCCUPIED' }),
    ]);

    // Revenue & Due this month
    const { start: mStart, end: mEnd } = currentMonthRange();
    const paidRent = await RentRecord.find({
      tenantId,
      status: { $in: ['PAID', 'PARTIAL'] },
      paidAt: { $gte: mStart, $lte: mEnd },
    }).lean();
    const unpaidRent = await RentRecord.find({
      tenantId,
      status: { $in: ['UNPAID', 'PARTIAL'] },
    }).lean();

    const monthlyRevenue = paidRent.reduce((s, r) => s + (r.paidAmount ?? 0), 0);
    const dueRent = unpaidRent.reduce((s, r) => s + Math.max(0, (r.amount ?? 0) - (r.paidAmount ?? 0)), 0);

    // Recent bookings (last 5)
    const recentBookings = await Booking.find({ tenantId })
      .populate('guestId', 'name email')
      .populate('propertyId', 'name city')
      .populate('roomId', 'roomNumber roomType')
      .populate('bedId', 'bedNumber')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Recent complaints (last 5)
    const recentComplaints = await Complaint.find({ tenantId })
      .populate('guestId', 'name')
      .populate('propertyId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Top overdue rent (last 5)
    const overdueRent = await RentRecord.find({ tenantId, status: { $in: ['UNPAID', 'PARTIAL'] } })
      .populate('hostelStudentId', 'name')
      .sort({ dueDate: 1 })
      .limit(5)
      .lean();

    // Occupancy trend: last 6 months (approximate — count OCCUPIED beds via bookings)
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const occupancyTrend: { month: string; occupancy: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = months[d.getMonth()];
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd   = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const checkedIn = await Booking.countDocuments({
        tenantId,
        status: { $in: ['CHECKED_IN', 'CONFIRMED', 'PENDING'] },
        createdAt: { $lte: monthEnd },
        $or: [{ checkOutDate: null }, { checkOutDate: { $gte: monthStart } }],
      });
      const occupancyPct = totalBeds > 0 ? Math.round((checkedIn / totalBeds) * 100) : 0;
      occupancyTrend.push({ month: label, occupancy: Math.min(100, occupancyPct) });
    }

    // Revenue trend: last 6 months
    const revenueTrend: { month: string; revenue: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = months[d.getMonth()];
      const mS = new Date(d.getFullYear(), d.getMonth(), 1);
      const mE = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const [rentDocs, expDocs] = await Promise.all([
        RentRecord.find({ tenantId, status: { $in: ['PAID','PARTIAL'] }, paidAt: { $gte: mS, $lte: mE } }).lean(),
        Expense.find({ tenantId, date: { $gte: mS.toISOString().split('T')[0], $lte: mE.toISOString().split('T')[0] } }).lean(),
      ]);
      const revenue  = rentDocs.reduce((s, r) => s + (r.paidAmount ?? 0), 0);
      const expenses = expDocs.reduce((s, e) => s + (e.amount ?? 0), 0);
      revenueTrend.push({ month: label, revenue, expenses });
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalProperties: properties.length,
          totalRooms: rooms.length,
          totalBeds,
          availableBeds,
          occupiedBeds,
          monthlyRevenue,
          dueRent,
        },
        properties: properties.map(p => ({ _id: p._id, name: p.name })),
        recentBookings,
        recentComplaints,
        overdueRent,
        occupancyTrend,
        revenueTrend,
      },
    });
  } catch (err) {
    console.error('[hostel-admin] dashboard:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/hostel-admin/properties ─────────────────────────────────────────
export const getAdminProperties = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { q, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));

    const filter: any = { tenantId };
    if (q) filter.name = { $regex: q, $options: 'i' };

    const [properties, total] = await Promise.all([
      Property.find(filter).sort({ createdAt: -1 }).skip((pageNum-1)*limitNum).limit(limitNum).lean(),
      Property.countDocuments(filter),
    ]);

    // Enrich with room/bed stats
    const enriched = await Promise.all(properties.map(async p => {
      const rooms = await Room.find({ propertyId: p._id }).lean();
      const roomIds = rooms.map(r => r._id);
      const { start: mStart } = currentMonthRange();

      const [totalBeds, occupiedBeds, monthRent] = await Promise.all([
        Bed.countDocuments({ roomId: { $in: roomIds } }),
        Bed.countDocuments({ roomId: { $in: roomIds }, status: { $in: ['OCCUPIED','RESERVED'] } }),
        RentRecord.aggregate([
          {
            $match: {
              tenantId: new mongoose.Types.ObjectId(tenantId),
              propertyId: new mongoose.Types.ObjectId(String(p._id)), // ✅ per-property filter
              status: { $in: ['PAID', 'PARTIAL'] },
              paidAt: { $gte: mStart },
            },
          },
          { $group: { _id: null, total: { $sum: '$paidAmount' } } },
        ]),
      ]);
      return {
        ...p,
        totalRooms: rooms.length,
        totalBeds,
        occupiedBeds,
        occupancyPct: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
        monthlyRevenue: monthRent[0]?.total ?? 0,
      };
    }));

    res.json({ success: true, data: enriched, total, page: pageNum, hasNextPage: pageNum * limitNum < total });
  } catch (err) {
    console.error('[hostel-admin] getProperties:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── POST /api/hostel-admin/properties ───────────────────────────────────────
export const createAdminProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;

    // Note: We allow PENDING owners to submit properties.
    // The property itself gets verificationStatus: 'PENDING' and won't appear on the
    // public marketplace until a Super Admin approves it. That is the correct review gate.
    // Blocking property *submission* for PENDING owners would break the core workflow:
    // signup → list property → Super Admin reviews → approve owner + property.

    const {
      name, description, address, city, locality, state, pincode,
      latitude, longitude, gender, amenities, rules,
      foodIncluded, images, videoUrl, roomSetups,
    } = req.body;

    if (!name || !city || !state || !gender) {
      res.status(400).json({ success: false, message: 'name, city, state, gender are required' });
      return;
    }


    // Compute rentStartingFrom = min pricePerBed across all room setups
    let rentStartingFrom = 0;
    if (Array.isArray(roomSetups) && roomSetups.length > 0) {
      const prices = roomSetups
        .map((rs: any) => Number(rs.pricePerBed))
        .filter((p) => p > 0);
      if (prices.length > 0) rentStartingFrom = Math.min(...prices);
    }

    const property = await Property.create({
      tenantId, name, description, address, city, locality, state, pincode,
      latitude, longitude, gender,
      amenities: amenities ?? [],
      rules, foodIncluded: foodIncluded ?? false,
      images: images ?? [],
      videoUrl,
      rentStartingFrom,
      verificationStatus: 'PENDING',
      isActive: true, isPaused: false, rating: 0, reviewCount: 0,
    });

    // Create floors, rooms, beds from roomSetups
    if (Array.isArray(roomSetups) && roomSetups.length > 0) {
      for (let si = 0; si < roomSetups.length; si++) {
        const { roomType, count, pricePerBed } = roomSetups[si];
        if (!roomType || !count || count < 1) continue;

        const floor = await Floor.create({
          tenantId, propertyId: property._id,
          name: `Floor ${si + 1}`, order: si,
        });

        const capacity = roomType === 'SINGLE' ? 1 : roomType === 'DOUBLE' ? 2 : roomType === 'TRIPLE' ? 3 : 4;
        for (let ri = 1; ri <= count; ri++) {
          const room = await Room.create({
            tenantId, propertyId: property._id, floorId: floor._id,
            roomNumber: `${si+1}0${ri}`, capacity, roomType,
            status: 'AVAILABLE', pricePerBed: pricePerBed ?? 6000,
          });
          for (let bi = 1; bi <= capacity; bi++) {
            await Bed.create({
              tenantId, propertyId: property._id, roomId: room._id,
              bedNumber: `B${bi}`, status: 'AVAILABLE',
            });
          }
        }
      }
    }

    res.status(201).json({ success: true, data: property });
  } catch (err) {
    console.error('[hostel-admin] createProperty:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/hostel-admin/properties/:id ────────────────────────────────────
export const getAdminPropertyById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const property = await Property.findOne({ _id: req.params.id, tenantId }).lean();
    if (!property) { res.status(404).json({ success: false, message: 'Property not found' }); return; }
    const rooms = await Room.find({ propertyId: property._id }).lean();
    res.json({ success: true, data: { ...property, rooms } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── PUT /api/hostel-admin/properties/:id ────────────────────────────────────
export const updateAdminProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const property = await Property.findOne({ _id: req.params.id, tenantId });
    if (!property) { res.status(404).json({ success: false, message: 'Property not found' }); return; }

    const { name, description, images, amenities, rules, foodIncluded, address, city, locality, state, pincode, latitude, longitude, gender, videoUrl } = req.body;

    // Changes to key fields reset to PENDING
    const needsReview = (name && name !== property.name) ||
                        (description && description !== property.description) ||
                        (images && JSON.stringify(images) !== JSON.stringify(property.images));

    Object.assign(property, {
      ...(name && { name }), ...(description !== undefined && { description }),
      ...(images && { images }), ...(amenities && { amenities }),
      ...(rules !== undefined && { rules }), ...(foodIncluded !== undefined && { foodIncluded }),
      ...(address && { address }), ...(city && { city }), ...(locality !== undefined && { locality }),
      ...(state && { state }), ...(pincode && { pincode }),
      ...(latitude !== undefined && { latitude }), ...(longitude !== undefined && { longitude }),
      ...(gender && { gender }), ...(videoUrl !== undefined && { videoUrl }),
      ...(needsReview && { verificationStatus: 'PENDING' }),
    });

    await property.save();
    res.json({ success: true, data: property, pendingReview: needsReview });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── DELETE /api/hostel-admin/properties/:id ─────────────────────────────────
export const deleteAdminProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const property = await Property.findOne({ _id: req.params.id, tenantId });
    if (!property) { res.status(404).json({ success: false, message: 'Property not found' }); return; }

    // Bug #2: Block delete if active bookings exist
    const activeBookings = await Booking.countDocuments({
      propertyId: property._id, status: { $in: ['PENDING','CONFIRMED','CHECKED_IN'] },
    });
    if (activeBookings > 0) {
      res.status(400).json({ success: false, message: `Cannot delete — ${activeBookings} active booking(s) exist.` });
      return;
    }

    // Bug #2: Also block delete if active students in ERP
    const activeStudents = await HostelStudent.countDocuments({
      propertyId: property._id, status: 'ACTIVE',
    });
    if (activeStudents > 0) {
      res.status(400).json({ success: false, message: `Cannot delete: ${activeStudents} active student(s) in this property` });
      return;
    }

    await Property.deleteOne({ _id: property._id });
    res.json({ success: true, message: 'Property deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/hostel-admin/erp/rent/:id/receipt ───────────────────────────────
// Bug #5 fix: returns printable HTML receipt
export const getRentReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const record = await RentRecord.findOne({ _id: req.params.id, tenantId })
      .populate({ path: 'hostelStudentId', select: 'name phone email admissionDate' })
      .populate({ path: 'propertyId', select: 'name address city' })
      .lean();
    if (!record) { res.status(404).json({ success: false, message: 'Record not found' }); return; }

    const student = record.hostelStudentId as any;
    const property = record.propertyId as any;
    const paidDate = record.paidAt ? new Date(record.paidAt).toLocaleDateString('en-IN') : 'N/A';

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8" />
<title>Rent Receipt — ${student?.name || 'Student'}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #1a1a1a; }
  .header { background: #1d4ed8; color: white; padding: 24px; border-radius: 8px 8px 0 0; }
  .header h1 { margin: 0; font-size: 20px; } .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.8; }
  .body { border: 1px solid #e2e8f0; padding: 24px; border-top: 0; border-radius: 0 0 8px 8px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  td:first-child { color: #64748b; width: 40%; } td:last-child { font-weight: 600; }
  .status { display: inline-block; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 700; }
  .PAID { background: #dcfce7; color: #16a34a; } .PARTIAL { background: #fef3c7; color: #d97706; } .UNPAID { background: #fee2e2; color: #dc2626; }
  .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8; }
  @media print { body { margin: 0; } }
</style></head>
<body>
  <div class="header"><h1>🏠 NexStay — Rent Receipt</h1><p>Receipt ID: ${record._id}</p></div>
  <div class="body">
    <h3 style="margin:0 0 12px">${property?.name || 'Hostel'} — ${property?.city || ''}</h3>
    <table>
      <tr><td>Student Name</td><td>${student?.name || '—'}</td></tr>
      <tr><td>Phone</td><td>${student?.phone || '—'}</td></tr>
      <tr><td>Month</td><td>${record.month}</td></tr>
      <tr><td>Rent Amount</td><td>₹${(record.amount || 0).toLocaleString('en-IN')}</td></tr>
      <tr><td>Fine</td><td>₹${(record.fine || 0).toLocaleString('en-IN')}</td></tr>
      <tr><td>Amount Paid</td><td>₹${(record.paidAmount || 0).toLocaleString('en-IN')}</td></tr>
      <tr><td>Due Date</td><td>${new Date(record.dueDate).toLocaleDateString('en-IN')}</td></tr>
      <tr><td>Paid On</td><td>${paidDate}</td></tr>
      <tr><td>Payment Method</td><td>${record.paymentMethod || '—'}</td></tr>
      <tr><td>Status</td><td><span class="status ${record.status}">${record.status}</span></td></tr>
    </table>
    <div class="footer">Generated by NexStay • ${new Date().toLocaleDateString('en-IN')} • This is a computer-generated receipt.</div>
  </div>
  <script>window.onload = () => window.print();</script>
</body></html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── PATCH /api/hostel-admin/properties/:id/pause ────────────────────────────
export const togglePauseProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const property = await Property.findOne({ _id: req.params.id, tenantId });
    if (!property) { res.status(404).json({ success: false, message: 'Property not found' }); return; }
    property.isPaused = !property.isPaused;
    await property.save();
    res.json({ success: true, data: { isPaused: property.isPaused }, message: property.isPaused ? 'Listing paused' : 'Listing activated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/hostel-admin/bookings ──────────────────────────────────────────
export const getAdminBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { status, propertyId, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = parseInt(limit);

    const filter: any = { tenantId };
    if (status && status !== 'ALL') filter.status = status;
    if (propertyId) filter.propertyId = new mongoose.Types.ObjectId(propertyId);

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('guestId', 'name email phone')
        .populate('propertyId', 'name city')
        .populate('roomId', 'roomNumber roomType')
        .populate('bedId', 'bedNumber')
        .sort({ createdAt: -1 })
        .skip((pageNum-1)*limitNum)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    res.json({ success: true, data: bookings, total, page: pageNum, hasNextPage: pageNum * limitNum < total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── PATCH /api/hostel-admin/bookings/:id/accept ─────────────────────────────
export const acceptBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const booking = await Booking.findOne({ _id: req.params.id, tenantId });
    if (!booking) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
    if (booking.status !== 'PENDING') {
      res.status(400).json({ success: false, message: 'Only PENDING bookings can be accepted' }); return;
    }
    booking.status = 'CONFIRMED';
    await booking.save();
    notify({
      userId: booking.guestId.toString(),
      type: 'BOOKING_CONFIRMED',
      title: '✅ Booking Confirmed!',
      message: 'Your booking has been confirmed by the property owner. You can now proceed with check-in.',
      linkUrl: '/account/bookings',
    }).catch(() => {});
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── PATCH /api/hostel-admin/bookings/:id/reject ─────────────────────────────
export const rejectBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { reason } = req.body;
    const booking = await Booking.findOne({ _id: req.params.id, tenantId });
    if (!booking) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
    if (booking.status !== 'PENDING') {
      res.status(400).json({ success: false, message: 'Only PENDING bookings can be rejected' }); return;
    }
    booking.status = 'CANCELLED';
    booking.notes = reason ?? 'Rejected by owner';
    await booking.save();
    await Bed.findByIdAndUpdate(booking.bedId, { status: 'AVAILABLE' });
    notify({
      userId: booking.guestId.toString(),
      type: 'BOOKING_CANCELLED',
      title: '❌ Booking Not Accepted',
      message: reason ? `Your booking was not accepted. Reason: ${reason}` : 'Your booking was not accepted by the property.',
      linkUrl: '/account/bookings',
    }).catch(() => {});
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
