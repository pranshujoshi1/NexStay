import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  verifyOtp,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

// ─── Rate Limiter — only on login/forgot in production ────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 100, // relaxed in dev
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production', // skip entirely in dev
});

const router = Router();

// Public routes (with rate limiting only on mutation endpoints)
router.post('/login',          loginLimiter, login);
router.post('/forgot-password', loginLimiter, forgotPassword);
router.post('/verify-otp',     verifyOtp);
router.post('/refresh',        refreshToken);
router.post('/reset-password', resetPassword);

// Protected routes — no rate limiting
router.post('/logout',   protect, logout);
router.get('/me',        protect, getMe);
router.patch('/profile', protect, updateProfile);
router.patch('/password', protect, changePassword);

export default router;

