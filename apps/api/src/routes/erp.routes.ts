import { Router } from 'express';
import { protect, requireRoles } from '../middleware/auth.middleware';
import {
  getErpRooms, getRoomBeds,
  createFloor, updateFloor, deleteFloor,
  createRoom, updateRoom, deleteRoom,
  getErpStudents, getErpStudentById, getStudentRent,
  recordRentPayment, processCheckIn, processCheckOut, getStudentDues,
} from '../controllers/erpAdmin.controller';
import { getRentReceipt } from '../controllers/hostelAdmin.controller';
import {
  getRentDashboard, getRentRecords, generateMonthlyRent, previewGenerateRent,
  addFine, sendReminders, createFee, getSecurityDeposits,
  getExpenses, createExpense, updateExpense, deleteExpense,
} from '../controllers/erpRent.controller';
import {
  getStaff, getStaffById, createStaff, updateStaff, toggleStaffStatus,
  getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem,
  getAdminComplaints, getAdminComplaintById, updateComplaintStatus, addInternalNote,
} from '../controllers/erpStaff.controller';


const router = Router();
router.use(protect);
router.use(requireRoles('HOSTEL_ADMIN', 'SUPER_ADMIN', 'WARDEN', 'MESS_MANAGER'));

// ── Rooms & Beds ─────────────────────────────────────────────────
router.get('/rooms', getErpRooms);
router.get('/rooms/:roomId/beds', getRoomBeds);

// ── Floors ───────────────────────────────────────────────────────
router.post('/floors', createFloor);
router.put('/floors/:id', updateFloor);
router.delete('/floors/:id', deleteFloor);

// ── Rooms ────────────────────────────────────────────────────────
router.post('/rooms', createRoom);
router.put('/rooms/:id', updateRoom);
router.delete('/rooms/:id', deleteRoom);

// ── Students ─────────────────────────────────────────────────────
router.get('/students', getErpStudents);
router.get('/students/:id', getErpStudentById);
router.get('/students/:id/rent', getStudentRent);
router.get('/dues/:studentId', getStudentDues);

// ── Rent (Phase 4) ───────────────────────────────────────────────
router.post('/rent/:id/pay', recordRentPayment);

// ── Rent (Phase 5) ───────────────────────────────────────────────
router.get('/rent/dashboard', getRentDashboard);
router.get('/rent/records', getRentRecords);
router.get('/rent/preview-generate', previewGenerateRent);
router.get('/rent/security-deposits', getSecurityDeposits);
router.post('/rent/generate', generateMonthlyRent);
router.patch('/rent/:id/fine', addFine);
router.post('/rent/send-reminders', sendReminders);

// ── Additional Fees ──────────────────────────────────────────────
router.post('/fees', createFee);

// ── Expenses ─────────────────────────────────────────────────────
router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

// ── Lifecycle ────────────────────────────────────────────────────
router.post('/checkin', processCheckIn);
router.post('/checkout/:studentId', processCheckOut);

// ── Staff (Phase 6) ──────────────────────────────────────────────
router.get('/staff', getStaff);
router.get('/staff/:id', getStaffById);
router.post('/staff', createStaff);
router.put('/staff/:id', updateStaff);
router.patch('/staff/:id/toggle', toggleStaffStatus);

// ── Inventory (Phase 6) ──────────────────────────────────────────
router.get('/inventory', getInventory);
router.post('/inventory', createInventoryItem);
router.put('/inventory/:id', updateInventoryItem);
router.delete('/inventory/:id', deleteInventoryItem);

// ── Complaints — Admin (Phase 6) ─────────────────────────────────
router.get('/complaints', getAdminComplaints);
router.get('/complaints/:id', getAdminComplaintById);
router.patch('/complaints/:id/status', updateComplaintStatus);
router.post('/complaints/:id/notes', addInternalNote);

// ── Receipt (Bug #5) ──────────────────────────────────────────────
router.get('/rent/:id/receipt', getRentReceipt);

export default router;
