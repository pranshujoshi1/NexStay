import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Hostel } from '../models/Hostel.model';
import { HostelStudent } from '../models/HostelStudent.model';
import { Bed } from '../models/Bed.model';
import { Room } from '../models/Room.model';
import { Floor } from '../models/Floor.model';
import { Complaint } from '../models/Complaint.model';
import { RentRecord } from '../models/RentRecord.model';
import { Staff } from '../models/Staff.model';
import { Expense } from '../models/Expense.model';
import { MessMenu } from '../models/MessMenu.model';
import { User } from '../models/User.model';

const todayDate = () => new Date().toISOString().split('T')[0];

// ─── GET /api/warden/dashboard ────────────────────────────────────────────────
export const getWardenDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostelId = req.user?.hostelId;
    if (!hostelId) { res.status(400).json({ success: false, message: 'No hostel assigned' }); return; }

    const hostel = await Hostel.findById(hostelId).select('name hostelCode messEnabled messTimings').lean();

    const [totalStudents, totalBeds, occupiedBeds, openComplaints, pendingRentCount] = await Promise.all([
      HostelStudent.countDocuments({ hostelId, status: 'ACTIVE' }),
      Bed.countDocuments({ hostelId }),
      Bed.countDocuments({ hostelId, status: 'OCCUPIED' }),
      Complaint.countDocuments({ hostelId, status: 'OPEN' }),
      RentRecord.countDocuments({ hostelId, status: { $in: ['UNPAID', 'PARTIAL'] } }),
    ]);

    const availableBeds = totalBeds - occupiedBeds;

    // Today's mess menu
    let todayMenu: any = null;
    if (hostel?.messEnabled) {
      todayMenu = await MessMenu.findOne({ hostelId, date: todayDate() }).lean();
    }

    res.json({
      success: true,
      data: {
        hostel,
        stats: { totalStudents, availableBeds, occupiedBeds, totalBeds, openComplaints, pendingRentCount },
        todayMenu,
      },
    });
  } catch (err) {
    console.error('getWardenDashboard:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET /api/warden/students ─────────────────────────────────────────────────
export const getStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostelId = req.user?.hostelId;
    const { search, status = 'ACTIVE', page = '1', limit = '20' } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page)), lim = parseInt(limit);
    const filter: any = { hostelId, status };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
    const [students, total] = await Promise.all([
      HostelStudent.find(filter)
        .populate('bedId', 'bedNumber')
        .populate({ path: 'bedId', populate: { path: 'roomId', select: 'roomNumber' } })
        .sort({ name: 1 })
        .skip((p - 1) * lim)
        .limit(lim)
        .lean(),
      HostelStudent.countDocuments(filter),
    ]);
    res.json({ success: true, data: students, total, hasNextPage: p * lim < total });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── GET /api/warden/students/:id ────────────────────────────────────────────
export const getStudentDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostelId = req.user?.hostelId;
    const student = await HostelStudent.findOne({ _id: req.params.id, hostelId })
      .populate('bedId', 'bedNumber status')
      .lean();
    if (!student) { res.status(404).json({ success: false, message: 'Student not found' }); return; }

    // Fetch rent records for this student
    const rentRecords = await RentRecord.find({ hostelStudentId: student._id })
      .sort({ month: -1 }).limit(6).lean();
    const complaints = await Complaint.find({ hostelId, hostelStudentId: student._id })
      .sort({ createdAt: -1 }).limit(5).lean();

    res.json({ success: true, data: { ...student, rentRecords, complaints } });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── GET /api/warden/rooms ────────────────────────────────────────────────────
export const getRooms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostelId = req.user?.hostelId;
    const tenantId = req.user?.tenantId;

    const floors = await Floor.find({ hostelId, tenantId }).sort({ order: 1 }).lean();
    const floorIds = floors.map(f => f._id);

    const rooms = await Room.find({ hostelId, tenantId }).lean();
    const roomIds = rooms.map(r => r._id);

    const beds = await Bed.find({ hostelId, tenantId }).lean();

    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'OCCUPIED').length;

    res.json({
      success: true,
      data: {
        floors,
        rooms,
        beds,
        summary: { totalBeds, occupiedBeds, availableBeds: totalBeds - occupiedBeds },
      },
    });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── GET /api/warden/complaints ───────────────────────────────────────────────
export const getComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostelId = req.user?.hostelId;
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page)), lim = parseInt(limit);
    const filter: any = { hostelId };
    if (status && status !== 'ALL') filter.status = status;
    const [complaints, total] = await Promise.all([
      Complaint.find(filter).sort({ createdAt: -1 }).skip((p - 1) * lim).limit(lim).lean(),
      Complaint.countDocuments(filter),
    ]);
    res.json({ success: true, data: complaints, total, hasNextPage: p * lim < total });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── PATCH /api/warden/complaints/:id/status ─────────────────────────────────
export const updateComplaintStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostelId = req.user?.hostelId;
    const { status, note } = req.body;
    if (!status) { res.status(400).json({ success: false, message: 'status is required' }); return; }

    const complaint = await Complaint.findOne({ _id: req.params.id, hostelId });
    if (!complaint) { res.status(404).json({ success: false, message: 'Complaint not found' }); return; }

    complaint.status = status;
    complaint.statusHistory.push({ status, note: note || '', changedBy: req.user?.id || 'Warden', changedAt: new Date() });
    if (status === 'RESOLVED') complaint.resolvedAt = new Date();
    await complaint.save();

    res.json({ success: true, data: complaint });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── GET /api/warden/rent-records ────────────────────────────────────────────
export const getRentRecords = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostelId = req.user?.hostelId;
    const { status, month, page = '1', limit = '20' } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page)), lim = parseInt(limit);
    const filter: any = { hostelId };
    if (status && status !== 'ALL') filter.status = status;
    if (month) filter.month = month;
    const [records, total] = await Promise.all([
      RentRecord.find(filter)
        .populate({ path: 'hostelStudentId', select: 'name phone' })
        .sort({ month: -1 })
        .skip((p - 1) * lim).limit(lim).lean(),
      RentRecord.countDocuments(filter),
    ]);
    res.json({ success: true, data: records, total, hasNextPage: p * lim < total });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── GET /api/warden/salary ───────────────────────────────────────────────────
export const getMySalary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostelId = req.user?.hostelId;
    const tenantId = req.user?.tenantId;
    const me = await User.findById(req.user?.id).select('name phone email').lean();

    // Find ERP Staff record matching this user's phone
    const staffRecord = await Staff.findOne({ hostelId, phone: (me as any)?.phone }).lean();

    // Find salary expense records
    const salaryExpenses = await Expense.find({
      hostelId,
      tenantId,
      category: 'STAFF_SALARY',
      description: { $regex: (me as any)?.name || '', $options: 'i' },
    }).sort({ date: -1 }).limit(12).lean();

    res.json({
      success: true,
      data: {
        user: me,
        staffRecord,
        salaryHistory: salaryExpenses,
      },
    });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── GET /api/warden/mess-menu ────────────────────────────────────────────────
export const getWardenTodayMenu = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostelId = req.user?.hostelId;
    const menu = await MessMenu.findOne({ hostelId, date: todayDate() })
      .populate('uploadedBy', 'name').lean();
    res.json({ success: true, data: menu || null });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};
