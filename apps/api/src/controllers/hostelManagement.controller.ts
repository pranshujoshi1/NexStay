import { Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User.model';
import { Hostel } from '../models/Hostel.model';
import { HostelStudent } from '../models/HostelStudent.model';
import { sendWelcomeEmail } from '../services/email.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pw = '';
  for (let i = 0; i < length; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

async function getNextHostelCode(): Promise<string> {
  const last = await Hostel.findOne({}).sort({ hostelCode: -1 }).select('hostelCode').lean();
  if (!last) return 'NST-001';
  const num = parseInt(last.hostelCode.replace('NST-', ''), 10) || 0;
  return `NST-${String(num + 1).padStart(3, '0')}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOSTEL CRUD — SuperAdmin only
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/superadmin/hostels
export const createHostel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, ownerId, gender, address, contactPhone, contactEmail, messEnabled } = req.body;

    if (!name || !ownerId || !gender) {
      res.status(400).json({ success: false, message: 'name, ownerId, gender are required' });
      return;
    }

    const owner = await User.findOne({ _id: ownerId, role: 'HOSTEL_ADMIN' });
    if (!owner) {
      res.status(400).json({ success: false, message: 'Invalid ownerId — must be a HOSTEL_ADMIN user' });
      return;
    }

    const hostelCode = await getNextHostelCode();
    const hostel = await Hostel.create({
      hostelCode,
      name,
      ownerId,
      gender,
      address: address || {},
      contactPhone: contactPhone || '',
      contactEmail: contactEmail || '',
      messEnabled: messEnabled !== false,
    });

    const populated = await Hostel.findById(hostel._id)
      .populate('ownerId', 'name email businessName phone')
      .lean();

    res.status(201).json({ success: true, data: populated, message: `Hostel created with code ${hostelCode}` });
  } catch (err) {
    console.error('createHostel:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/superadmin/hostels
export const getAllHostels = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, gender, page = '1', limit = '20', active } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page)), lim = parseInt(limit);
    const filter: any = {};
    if (gender && gender !== 'ALL') filter.gender = gender;
    if (active !== undefined) filter.isActive = active === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { hostelCode: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
      ];
    }
    const [hostels, total] = await Promise.all([
      Hostel.find(filter)
        .populate('ownerId', 'name email businessName')
        .sort({ createdAt: -1 })
        .skip((p - 1) * lim)
        .limit(lim)
        .lean(),
      Hostel.countDocuments(filter),
    ]);

    // Enrich with student count
    const enriched = await Promise.all(hostels.map(async (h) => {
      const studentCount = await HostelStudent.countDocuments({ hostelId: h._id, status: 'ACTIVE' });
      return { ...h, studentCount };
    }));

    res.json({ success: true, data: enriched, total, hasNextPage: p * lim < total });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// GET /api/superadmin/hostels/:id
export const getHostelById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostel = await Hostel.findById(req.params.id)
      .populate('ownerId', 'name email businessName phone')
      .lean();
    if (!hostel) { res.status(404).json({ success: false, message: 'Hostel not found' }); return; }
    const studentCount = await HostelStudent.countDocuments({ hostelId: hostel._id, status: 'ACTIVE' });
    const staffUsers = await User.find({ hostelId: hostel._id, role: { $in: ['WARDEN', 'MESS_MANAGER'] } })
      .select('name role email phone staffPermissions status')
      .lean();
    res.json({ success: true, data: { ...hostel, studentCount, staffUsers } });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// PUT /api/superadmin/hostels/:id
export const updateHostel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, gender, address, contactPhone, contactEmail, messEnabled, messTimings } = req.body;
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) { res.status(404).json({ success: false, message: 'Hostel not found' }); return; }
    if (name) hostel.name = name;
    if (gender) hostel.gender = gender;
    if (address) hostel.address = { ...hostel.address, ...address };
    if (contactPhone !== undefined) hostel.contactPhone = contactPhone;
    if (contactEmail !== undefined) hostel.contactEmail = contactEmail;
    if (messEnabled !== undefined) hostel.messEnabled = messEnabled;
    if (messTimings) hostel.messTimings = { ...hostel.messTimings, ...messTimings };
    await hostel.save();
    res.json({ success: true, data: hostel });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// PATCH /api/superadmin/hostels/:id/toggle
export const toggleHostelActive = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) { res.status(404).json({ success: false, message: 'Hostel not found' }); return; }
    hostel.isActive = !hostel.isActive;
    await hostel.save();
    res.json({ success: true, message: `Hostel ${hostel.isActive ? 'activated' : 'deactivated'}`, data: hostel });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// DELETE /api/superadmin/hostels/:id
export const deleteHostel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activeStudents = await HostelStudent.countDocuments({ hostelId: req.params.id, status: 'ACTIVE' });
    if (activeStudents > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete: ${activeStudents} active student(s) in this hostel`,
      });
      return;
    }
    await Hostel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Hostel deleted' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// OWNER CRUD — SuperAdmin only
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/superadmin/owners
export const createOwner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, businessName } = req.body;
    if (!name || !email || !phone) {
      res.status(400).json({ success: false, message: 'name, email, phone are required' }); return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) { res.status(409).json({ success: false, message: 'Email already registered' }); return; }

    const rawPassword = generatePassword(12);
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    const owner = await User.create({
      name, email: email.toLowerCase(), phone, passwordHash,
      role: 'HOSTEL_ADMIN',
      businessName: businessName || '',
      ownerVerificationStatus: 'APPROVED',
      status: 'ACTIVE',
    });

    // Send welcome email
    await sendWelcomeEmail({
      to: email,
      name,
      role: 'HOSTEL_ADMIN',
      identifier: email.toLowerCase(),
      password: rawPassword,
    });

    res.status(201).json({
      success: true,
      data: { _id: owner._id, name, email, phone, role: 'HOSTEL_ADMIN', businessName },
      message: `Owner created. Credentials sent to ${email}`,
      tempPassword: rawPassword, // show once in response
    });
  } catch (err) {
    console.error('createOwner:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/superadmin/owners
export const getAllOwners = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: any = { role: 'HOSTEL_ADMIN' };
    if (status && status !== 'ALL') filter.status = status;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { businessName: { $regex: search, $options: 'i' } },
    ];
    const p = Math.max(1, parseInt(page)), lim = parseInt(limit);
    const [owners, total] = await Promise.all([
      User.find(filter).select('-passwordHash -otp -otpExpiry -refreshToken').sort({ createdAt: -1 }).skip((p - 1) * lim).limit(lim).lean(),
      User.countDocuments(filter),
    ]);
    const enriched = await Promise.all(owners.map(async (o) => {
      const hostelCount = await Hostel.countDocuments({ ownerId: o._id });
      return { ...o, hostelCount };
    }));
    res.json({ success: true, data: enriched, total, hasNextPage: p * lim < total });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// GET /api/superadmin/owners/:id
export const getOwnerById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const owner = await User.findOne({ _id: req.params.id, role: 'HOSTEL_ADMIN' })
      .select('-passwordHash -otp -otpExpiry -refreshToken').lean();
    if (!owner) { res.status(404).json({ success: false, message: 'Owner not found' }); return; }
    const hostels = await Hostel.find({ ownerId: owner._id }).lean();
    res.json({ success: true, data: { ...owner, hostels } });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// PUT /api/superadmin/owners/:id
export const updateOwner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, businessName, status } = req.body;
    const owner = await User.findOne({ _id: req.params.id, role: 'HOSTEL_ADMIN' });
    if (!owner) { res.status(404).json({ success: false, message: 'Owner not found' }); return; }
    if (name) owner.name = name;
    if (phone) owner.phone = phone;
    if (businessName !== undefined) owner.businessName = businessName;
    if (status && ['ACTIVE', 'SUSPENDED'].includes(status)) owner.status = status;
    await owner.save();
    res.json({ success: true, data: owner });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// STAFF CRUD — SuperAdmin or Owner
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/superadmin/staff
export const createStaffUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, role, hostelId, staffPermissions } = req.body;

    if (!name || !phone || !role || !hostelId) {
      res.status(400).json({ success: false, message: 'name, phone, role, hostelId are required' }); return;
    }
    if (!['WARDEN', 'MESS_MANAGER'].includes(role)) {
      res.status(400).json({ success: false, message: 'role must be WARDEN or MESS_MANAGER' }); return;
    }

    const hostel = await Hostel.findById(hostelId).populate('ownerId', 'name').lean();
    if (!hostel) { res.status(404).json({ success: false, message: 'Hostel not found' }); return; }

    // If caller is HOSTEL_ADMIN, verify they own this hostel
    if (req.user?.role === 'HOSTEL_ADMIN') {
      if (String(hostel.ownerId._id || hostel.ownerId) !== req.user.id) {
        res.status(403).json({ success: false, message: 'You do not own this hostel' }); return;
      }
    }

    // Check if email already exists
    if (email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) { res.status(409).json({ success: false, message: 'Email already registered' }); return; }
    }

    const rawPassword = generatePassword(10);
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    const defaultPermissions = role === 'MESS_MANAGER'
      ? { canUploadMenu: true, canViewSalary: false, canViewStudents: false, canManageComplaints: false, canViewRentRecords: false, canManageRooms: false, canViewAttendance: false }
      : { canViewStudents: true, canManageComplaints: true, canManageRooms: true, canViewSalary: false, canUploadMenu: false, canViewRentRecords: false, canViewAttendance: false };

    const staff = await User.create({
      name,
      email: email ? email.toLowerCase() : undefined,
      phone,
      passwordHash,
      role,
      hostelId: new mongoose.Types.ObjectId(hostelId),
      staffPermissions: staffPermissions || defaultPermissions,
      status: 'ACTIVE',
    });

    // Send welcome email
    if (email) {
      await sendWelcomeEmail({
        to: email,
        name,
        role,
        identifier: email.toLowerCase(),
        password: rawPassword,
        hostelName: (hostel as any).name,
        hostelCode: (hostel as any).hostelCode,
      });
    }

    res.status(201).json({
      success: true,
      data: { _id: staff._id, name, email, phone, role, hostelId },
      message: `${role} created. ${email ? `Credentials sent to ${email}` : 'No email provided.'}`,
      tempPassword: rawPassword,
    });
  } catch (err) {
    console.error('createStaffUser:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/superadmin/hostels/:hostelId/staff
export const getHostelStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staff = await User.find({
      hostelId: req.params.hostelId,
      role: { $in: ['WARDEN', 'MESS_MANAGER'] },
    }).select('-passwordHash -otp -otpExpiry -refreshToken').lean();
    res.json({ success: true, data: staff });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT CRUD — SuperAdmin or Owner
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/superadmin/students
export const createStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, mobile, email, hostelId, gender } = req.body;

    if (!name || !mobile) {
      res.status(400).json({ success: false, message: 'name and mobile are required' }); return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      res.status(400).json({ success: false, message: 'mobile must be 10 digits' }); return;
    }

    // Check for existing studentId
    const existing = await User.findOne({ studentId: mobile });
    if (existing) { res.status(409).json({ success: false, message: 'Student with this mobile already exists' }); return; }

    // Default password = last 4 digits of mobile
    const rawPassword = mobile.slice(-4);
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    let hostel: any = null;
    if (hostelId) {
      hostel = await Hostel.findById(hostelId).lean();
      if (!hostel) { res.status(404).json({ success: false, message: 'Hostel not found' }); return; }

      // If caller is HOSTEL_ADMIN, verify they own this hostel
      if (req.user?.role === 'HOSTEL_ADMIN') {
        if (String((hostel as any).ownerId) !== req.user.id) {
          res.status(403).json({ success: false, message: 'You do not own this hostel' }); return;
        }
      }
    }

    const student = await User.create({
      name,
      email: email ? email.toLowerCase() : undefined,
      phone: mobile,
      passwordHash,
      role: 'STUDENT',
      studentId: mobile,
      hostelId: hostelId ? new mongoose.Types.ObjectId(hostelId) : null,
      status: 'ACTIVE',
    });

    // Send welcome email if email provided
    if (email) {
      await sendWelcomeEmail({
        to: email,
        name,
        role: 'STUDENT',
        identifier: mobile, // students log in with mobile
        password: rawPassword,
        hostelName: hostel ? (hostel as any).name : undefined,
        hostelCode: hostel ? (hostel as any).hostelCode : undefined,
      });
    }

    res.status(201).json({
      success: true,
      data: { _id: student._id, name, mobile, email, role: 'STUDENT', studentId: mobile, hostelId },
      message: `Student created. Login ID: ${mobile}, Password: ${rawPassword}`,
      loginId: mobile,
      tempPassword: rawPassword,
    });
  } catch (err) {
    console.error('createStudent:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/superadmin/hostels/:hostelId/students
export const getHostelStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', search } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page)), lim = parseInt(limit);
    const filter: any = { hostelId: req.params.hostelId, role: 'STUDENT' };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
    ];
    const [students, total] = await Promise.all([
      User.find(filter).select('-passwordHash -otp -otpExpiry -refreshToken').sort({ createdAt: -1 }).skip((p - 1) * lim).limit(lim).lean(),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: students, total, hasNextPage: p * lim < total });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};
