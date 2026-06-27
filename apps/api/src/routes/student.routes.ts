import { Router } from 'express';
import { protect, requireRoles } from '../middleware/auth.middleware';
import {
  getStudentDashboard,
  getMyProfile,
  updateMyProfile,
  changeStudentPassword,
  getMyActiveBooking,
  getMyRentHistory,
  getCurrentMonthRent,
  getMyComplaints,
  raiseComplaint,
  getTodayMenuForMyHostel,
  getWeekMenu,
  getHostelNotices,
  getMyRoommates,
} from '../controllers/student.controller';

const router = Router();

// All student routes require auth + STUDENT role
router.use(protect, requireRoles('STUDENT'));

router.get('/dashboard',        getStudentDashboard);
router.get('/profile',          getMyProfile);
router.patch('/profile',        updateMyProfile);
router.patch('/password',       changeStudentPassword);
router.get('/booking',          getMyActiveBooking);
router.get('/rent',             getMyRentHistory);
router.get('/rent/current',     getCurrentMonthRent);
router.get('/complaints',       getMyComplaints);
router.post('/complaints',      raiseComplaint);
router.get('/mess/menu',        getTodayMenuForMyHostel);
router.get('/mess/menu/week',   getWeekMenu);
router.get('/notices',          getHostelNotices);
router.get('/roommates',        getMyRoommates);

export default router;
