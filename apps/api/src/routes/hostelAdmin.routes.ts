import { Router } from 'express';
import { protect, requireRoles } from '../middleware/auth.middleware';
import {
  getAdminDashboard,
  getAdminProperties,
  createAdminProperty,
  getAdminPropertyById,
  updateAdminProperty,
  deleteAdminProperty,
  togglePauseProperty,
  getAdminBookings,
  acceptBooking,
  rejectBooking,
} from '../controllers/hostelAdmin.controller';
import {
  createStaffUser, getHostelStaff,
  createStudent, getHostelStudents,
} from '../controllers/hostelManagement.controller';
import { User } from '../models/User.model';
import { Hostel } from '../models/Hostel.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { Response } from 'express';

const router = Router();
router.use(protect);
router.use(requireRoles('HOSTEL_ADMIN'));

// Dashboard
router.get('/dashboard', getAdminDashboard);

// Properties
router.get('/properties', getAdminProperties);
router.post('/properties', createAdminProperty);
router.get('/properties/:id', getAdminPropertyById);
router.put('/properties/:id', updateAdminProperty);
router.delete('/properties/:id', deleteAdminProperty);
router.patch('/properties/:id/pause', togglePauseProperty);

// Marketplace bookings
router.get('/bookings', getAdminBookings);
router.patch('/bookings/:id/accept', acceptBooking);
router.patch('/bookings/:id/reject', rejectBooking);

// My Hostels
router.get('/my-hostels', async (req: AuthRequest, res: Response) => {
  try {
    const hostels = await Hostel.find({ ownerId: req.user?.id }).lean();
    res.json({ success: true, data: hostels });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// Staff management (for owner's hostels)
router.post('/staff', createStaffUser);
router.get('/hostels/:hostelId/staff', getHostelStaff);

// Staff permissions update
router.put('/staff/:staffId/permissions', async (req: AuthRequest, res: Response) => {
  try {
    const { permissions } = req.body;
    const staff = await User.findById(req.params.staffId);
    if (!staff || !['WARDEN', 'MESS_MANAGER'].includes(staff.role)) {
      res.status(404).json({ success: false, message: 'Staff not found' }); return;
    }
    // Verify staff belongs to this owner's hostel
    const hostel = await Hostel.findOne({ _id: staff.hostelId, ownerId: req.user?.id });
    if (!hostel) {
      res.status(403).json({ success: false, message: 'Staff not in your hostel' }); return;
    }
    staff.staffPermissions = { ...staff.staffPermissions, ...permissions } as any;
    await staff.save();
    res.json({ success: true, data: staff, message: 'Permissions updated' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// Student management
router.post('/students', createStudent);
router.get('/hostels/:hostelId/students', getHostelStudents);

export default router;
