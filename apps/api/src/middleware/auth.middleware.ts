import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { User, StaffPermissions } from '../models/User.model';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
    hostelId?: string | null;
    tenantId?: string | null;
    staffPermissions?: StaffPermissions;
  };
}

// ─── Authenticate: verify JWT, attach req.user ────────────────────────────────
export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('-passwordHash -otp -otpExpiry -refreshToken');
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }
    if (user.status === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact support.',
      });
      return;
    }

    // Build tenantId: for HOSTEL_ADMIN = their own _id; for WARDEN/MESS_MANAGER = ownerId of their hostel
    let tenantId: string | null = null;
    if (user.role === 'HOSTEL_ADMIN') {
      tenantId = String(user._id);
    } else if ((user.role === 'WARDEN' || user.role === 'MESS_MANAGER') && user.hostelId) {
      // Populate hostel to get ownerId
      const { Hostel } = await import('../models/Hostel.model');
      const hostel = await Hostel.findById(user.hostelId).select('ownerId').lean();
      if (hostel) tenantId = String(hostel.ownerId);
    }

    req.user = {
      id: String(user._id),
      role: user.role,
      email: user.email || '',
      hostelId: user.hostelId ? String(user.hostelId) : null,
      tenantId,
      staffPermissions: user.staffPermissions || undefined,
    };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// ─── Optional auth: attach user if token present, continue if not ─────────────
export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('-passwordHash -otp -otpExpiry -refreshToken');
    if (user && user.status === 'ACTIVE') {
      req.user = {
        id: String(user._id),
        role: user.role,
        email: user.email || '',
        hostelId: user.hostelId ? String(user.hostelId) : null,
        tenantId: user.role === 'HOSTEL_ADMIN' ? String(user._id) : null,
      };
    }
  } catch {
    // ignore — public route still continues
  }
  next();
};

// ─── requireRoles: check role is in allowed list ─────────────────────────────
export const requireRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }
    next();
  };
};

// ─── requireTenantAccess: auto-scope queries to tenantId = req.user.id ────────
export const requireTenantAccess = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  if (req.user.role === 'SUPER_ADMIN') {
    next();
    return;
  }
  if (req.user.role !== 'HOSTEL_ADMIN') {
    res.status(403).json({ success: false, message: 'Hostel admin access required' });
    return;
  }
  next();
};

// ─── requireHostelAccess: WARDEN/MESS_MANAGER can only access their hostelId ──
export const requireHostelAccess = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  const { role, hostelId } = req.user;
  // SUPER_ADMIN and HOSTEL_ADMIN bypass this check
  if (role === 'SUPER_ADMIN' || role === 'HOSTEL_ADMIN') {
    next();
    return;
  }
  const requestedHostelId =
    (req.params as any).hostelId ||
    (req.body as any).hostelId ||
    (req.query as any).hostelId;

  if (requestedHostelId && requestedHostelId !== hostelId) {
    res.status(403).json({ success: false, message: 'Access denied to this hostel' });
    return;
  }
  next();
};

// ─── requirePermission: checks staffPermissions toggles ──────────────────────
export const requirePermission = (permission: keyof StaffPermissions) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const { role, staffPermissions } = req.user || {};
    // SUPER_ADMIN and HOSTEL_ADMIN always pass
    if (role === 'SUPER_ADMIN' || role === 'HOSTEL_ADMIN') {
      next();
      return;
    }
    if (!staffPermissions || !staffPermissions[permission]) {
      res.status(403).json({
        success: false,
        message: `Permission denied: ${permission}`,
        permission,
      });
      return;
    }
    next();
  };
};
