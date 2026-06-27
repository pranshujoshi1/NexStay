import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { MessMenu } from '../models/MessMenu.model';
import { Hostel } from '../models/Hostel.model';
import { HostelStudent } from '../models/HostelStudent.model';
import { Staff } from '../models/Staff.model';
import { Expense } from '../models/Expense.model';
import { User } from '../models/User.model';
import { Notification } from '../models/Notification.model';

const todayDate = () => new Date().toISOString().split('T')[0];

// ─── GET /api/mess/dashboard ──────────────────────────────────────────────────
export const getMessDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostelId = req.user?.hostelId;
    if (!hostelId) { res.status(400).json({ success: false, message: 'No hostel assigned' }); return; }

    const hostel = await Hostel.findById(hostelId).select('name hostelCode messEnabled messTimings').lean();

    const [studentCount, todayMenu] = await Promise.all([
      HostelStudent.countDocuments({ hostelId, status: 'ACTIVE' }),
      MessMenu.findOne({ hostelId, date: todayDate() }).lean(),
    ]);

    // Salary info
    const me = await User.findById(req.user?.id).select('name phone').lean();
    const staffRecord = await Staff.findOne({ hostelId, phone: (me as any)?.phone }).lean();

    res.json({
      success: true,
      data: {
        hostel,
        studentCount,
        todayMenuUploaded: !!todayMenu,
        todayMenu: todayMenu || null,
        salary: staffRecord ? (staffRecord as any).salary : null,
      },
    });
  } catch (err) {
    console.error('getMessDashboard:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET /api/mess/menu ───────────────────────────────────────────────────────
export const getTodayMenu = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostelId = req.user?.hostelId;
    const menu = await MessMenu.findOne({ hostelId, date: todayDate() })
      .populate('uploadedBy', 'name').lean();
    res.json({ success: true, data: menu || null });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── POST /api/mess/menu ──────────────────────────────────────────────────────
export const upsertMenu = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostelId = req.user?.hostelId;
    const tenantId = req.user?.tenantId;
    const uploadedBy = req.user?.id;

    if (!hostelId || !tenantId) {
      res.status(400).json({ success: false, message: 'No hostel assigned' }); return;
    }

    const { date, breakfast, lunch, dinner, specialNote } = req.body;
    const menuDate = date || todayDate();

    const menu = await MessMenu.findOneAndUpdate(
      { hostelId, date: menuDate },
      {
        hostelId,
        tenantId,
        date: menuDate,
        uploadedBy,
        breakfast: breakfast || { items: [], photoUrl: null },
        lunch: lunch || { items: [], photoUrl: null },
        dinner: dinner || { items: [], photoUrl: null },
        specialNote: specialNote || '',
      },
      { upsert: true, new: true }
    );

    // Notify all active students in this hostel
    const activeStudents = await HostelStudent.find({ hostelId, status: 'ACTIVE' })
      .select('guestId').lean();

    const notifications = activeStudents.map(s => ({
      userId: s.guestId,
      hostelId,
      type: 'MESS_MENU',
      title: "🍽️ Today's Menu is Ready!",
      message: `The mess menu for ${menuDate} has been uploaded. Check what's for today!`,
      channel: 'IN_APP',
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications, { ordered: false });
    }

    res.json({ success: true, data: menu, message: 'Menu saved and students notified' });
  } catch (err) {
    console.error('upsertMenu:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET /api/mess/menu/history ───────────────────────────────────────────────
export const getMenuHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostelId = req.user?.hostelId;

    // Last 30 days
    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const menus = await MessMenu.find({
      hostelId,
      date: { $in: dates },
    }).populate('uploadedBy', 'name').sort({ date: -1 }).lean();

    res.json({ success: true, data: menus });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── GET /api/mess/salary ─────────────────────────────────────────────────────
export const getMessSalary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostelId = req.user?.hostelId;
    const tenantId = req.user?.tenantId;
    const me = await User.findById(req.user?.id).select('name phone email').lean();

    const staffRecord = await Staff.findOne({ hostelId, phone: (me as any)?.phone }).lean();
    const salaryExpenses = await Expense.find({
      hostelId,
      tenantId,
      category: 'STAFF_SALARY',
      description: { $regex: (me as any)?.name || '', $options: 'i' },
    }).sort({ date: -1 }).limit(12).lean();

    res.json({ success: true, data: { user: me, staffRecord, salaryHistory: salaryExpenses } });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── GET /api/mess/students/count ────────────────────────────────────────────
export const getStudentCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostelId = req.user?.hostelId;
    const count = await HostelStudent.countDocuments({ hostelId, status: 'ACTIVE' });
    res.json({ success: true, data: { count } });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};
