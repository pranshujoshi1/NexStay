import { Router } from 'express';
import { protect, requireRoles, requireHostelAccess, requirePermission } from '../middleware/auth.middleware';
import {
  getMessDashboard,
  getTodayMenu,
  upsertMenu,
  getMenuHistory,
  getMessSalary,
  getStudentCount,
} from '../controllers/messManager.controller';

const router = Router();

// All mess routes require authentication + MESS_MANAGER role
router.use(protect, requireRoles('MESS_MANAGER'), requireHostelAccess);

router.get('/dashboard',        getMessDashboard);
router.get('/menu',             getTodayMenu);
router.post('/menu',            requirePermission('canUploadMenu'), upsertMenu);
router.get('/menu/history',     getMenuHistory);
router.get('/salary',           requirePermission('canViewSalary'), getMessSalary);
router.get('/students/count',   getStudentCount);

export default router;
