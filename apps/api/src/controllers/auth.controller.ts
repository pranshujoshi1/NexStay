import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.model';
import { Hostel } from '../models/Hostel.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateOTP } from '../utils/otp';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendOtpEmail } from '../services/email.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatUser = (user: InstanceType<typeof User>) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
  avatar: user.avatar,
  businessName: user.businessName,
  ownerVerificationStatus: user.ownerVerificationStatus,
  hostelId: user.hostelId || null,
  studentId: user.studentId || null,
  staffPermissions: user.staffPermissions || null,
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Body: { identifier, password, role, hostelCode? }
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password, role, email, hostelCode } = req.body;

    const loginId = identifier || email;
    const loginRole = role || null;

    if (!loginId || !password) {
      res.status(400).json({ success: false, message: 'Login ID and password are required' });
      return;
    }

    // Build query — find by email OR studentId, optionally by role
    const orConditions: object[] = [
      { email: loginId.toLowerCase() },
      { studentId: loginId },
      { phone: loginId },
    ];
    const query: any = { $or: orConditions };
    if (loginRole) query.role = loginRole;

    // If hostelCode is provided (Warden/Mess/Student), scope to that hostel
    if (hostelCode && ['WARDEN', 'MESS_MANAGER', 'STUDENT'].includes(loginRole)) {
      const { Hostel: H } = await import('../models/Hostel.model');
      const hostelDoc = await H.findOne({ hostelCode: hostelCode.toUpperCase() }).lean();
      if (!hostelDoc) {
        res.status(401).json({ success: false, message: `Hostel code "${hostelCode}" not found` });
        return;
      }
      query.hostelId = hostelDoc._id;
    }

    const user = await User.findOne(query);

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    if (user.status === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact support.',
      });
      return;
    }

    // Build JWT payload
    const payload = {
      id: user._id,
      role: user.role,
      email: user.email || '',
      hostelId: user.hostelId || null,
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Store hashed refresh token
    const hashedRefresh = await bcrypt.hash(refreshToken, 8);
    user.refreshToken = hashedRefresh;
    await user.save();

    // Populate hostel data for relevant roles
    let hostel: any = null;
    let hostels: any[] = [];

    if ((user.role === 'WARDEN' || user.role === 'MESS_MANAGER') && user.hostelId) {
      const { Hostel: H } = await import('../models/Hostel.model');
      const h = await H.findById(user.hostelId).select('name hostelCode address gender messEnabled messTimings').lean();
      if (h) hostel = h;
    }

    if (user.role === 'HOSTEL_ADMIN') {
      const { Hostel: H } = await import('../models/Hostel.model');
      hostels = await H.find({ ownerId: user._id, isActive: true })
        .select('name hostelCode address gender isActive messEnabled')
        .lean();
    }

    if (user.role === 'STUDENT' && user.hostelId) {
      const { Hostel: H } = await import('../models/Hostel.model');
      const h = await H.findById(user.hostelId).select('name hostelCode').lean();
      if (h) hostel = h;
    }

    const loginResult: Record<string, any> = { success: true, user: formatUser(user), accessToken, refreshToken };
    if (hostel) loginResult.hostel = hostel;
    if (hostels.length > 0) loginResult.hostels = hostels;
    res.json(loginResult);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



// ─── POST /api/auth/verify-otp ────────────────────────────────────────────────
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    const isDev = process.env.NODE_ENV !== 'production';
    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({ success: false, message: 'User not found' });
      return;
    }

    const isDevOtp = isDev && otp === '123456';
    const isRealOtp = user.otp === otp && user.otpExpiry && user.otpExpiry > new Date();

    if (!isDevOtp && !isRealOtp) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      return;
    }

    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const payload = { id: user._id, role: user.role, email: user.email || '', hostelId: user.hostelId || null };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.json({
      success: true,
      message: 'Account verified',
      user: formatUser(user),
      accessToken,
      refreshToken,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, message: 'Refresh token required' });
      return;
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('-passwordHash -otp -otpExpiry');
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    // Verify stored refresh token (Bug 6 — stateful logout)
    if (user.refreshToken) {
      const isValid = await bcrypt.compare(token, user.refreshToken);
      if (!isValid) {
        res.status(401).json({ success: false, message: 'Refresh token invalidated' });
        return;
      }
    }

    const payload = { id: user._id, role: user.role, email: user.email || '', hostelId: user.hostelId || null };
    const accessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    // Update stored refresh token
    const hashedRefresh = await bcrypt.hash(newRefreshToken, 8);
    user.refreshToken = hashedRefresh;
    await user.save();

    res.json({ success: true, accessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.id) {
      // Invalidate refresh token in DB (Bug 6 fix)
      await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch {
    res.json({ success: true, message: 'Logged out' });
  }
};

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
      return;
    }

    const isDev = process.env.NODE_ENV !== 'production';
    user.otp = isDev ? '123456' : generateOTP();
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    if (isDev) {
      console.log(`[DEV] Password reset OTP for ${email}: ${user.otp}`);
    } else {
      // Send real OTP email
      await sendOtpEmail(email, user.otp, user.name);
    }

    res.json({
      success: true,
      message: isDev ? 'OTP sent. Use 123456 in dev mode.' : 'If that email exists, an OTP has been sent.',
      ...(isDev && { otp: user.otp }),
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── POST /api/auth/reset-password ────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    const isDev = process.env.NODE_ENV !== 'production';
    const isDevOtp = isDev && otp === '123456';
    const isRealOtp = user?.otp === otp && user?.otpExpiry && user.otpExpiry > new Date();

    if (!user || (!isDevOtp && !isRealOtp)) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('-passwordHash -otp -otpExpiry -refreshToken');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Attach hostel data
    let hostel: any = null;
    let hostels: any[] = [];

    if ((user.role === 'WARDEN' || user.role === 'MESS_MANAGER') && user.hostelId) {
      const h = await Hostel.findById(user.hostelId).select('name hostelCode address gender messEnabled messTimings').lean();
      if (h) hostel = h;
    }

    if (user.role === 'HOSTEL_ADMIN') {
      hostels = await Hostel.find({ ownerId: user._id, isActive: true })
        .select('name hostelCode address gender isActive messEnabled')
        .lean();
    }

    const result: Record<string, any> = { success: true, user: formatUser(user) };
    if (hostel) result.hostel = hostel;
    if (hostels.length > 0) result.hostels = hostels;
    res.json(result);
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── PATCH /api/auth/profile ──────────────────────────────────────────────────
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user?.id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    if (name) user.name = name;
    if (phone) user.phone = phone;
    await user.save();
    res.json({ success: true, user: formatUser(user) });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── PATCH /api/auth/password ─────────────────────────────────────────────────
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' }); return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters' }); return;
    }
    const user = await User.findById(req.user?.id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) { res.status(400).json({ success: false, message: 'Current password is incorrect' }); return; }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
