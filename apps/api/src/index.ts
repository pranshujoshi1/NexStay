import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import notificationRoutes from './routes/notification.routes';
import publicRoutes from './routes/public.routes';
import guestRoutes from './routes/guest.routes';
import hostelAdminRoutes from './routes/hostelAdmin.routes';
import erpRoutes from './routes/erp.routes';
import reportsRoutes from './routes/reports.routes';
import superAdminRoutes from './routes/superAdmin.routes';
import { getDevEmails } from './controllers/notification.controller';
import uploadRoutes from './routes/upload.routes';
import wardenRoutes from './routes/warden.routes';
import messManagerRoutes from './routes/messManager.routes';
import studentRoutes from './routes/student.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // No origin = server-to-server / curl / mobile — allow
    if (!origin) return callback(null, true);

    const isLocalhost = origin.startsWith('http://localhost');
    // Allow ALL vercel.app subdomains (covers preview + production deployments)
    const isVercel = origin.endsWith('.vercel.app');
    // Allow explicitly configured FRONTEND_URL
    const isFrontendUrl = process.env.FRONTEND_URL
      ? origin.startsWith(process.env.FRONTEND_URL)
      : false;

    if (isLocalhost || isVercel || isFrontendUrl) {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/hostel-admin', hostelAdminRoutes);
app.use('/api/hostel-admin/erp', erpRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/reports', reportsRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/warden', wardenRoutes);
app.use('/api/mess', messManagerRoutes);
app.use('/api/student', studentRoutes);
app.get('/api/dev/emails', getDevEmails);

// ─── Health ──────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'NexStay API running 🚀', version: '2.0.0' });
});

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must have 4 args to be an Express error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.message && err.message.startsWith('CORS:')) {
    res.status(403).json({ success: false, message: 'CORS: Origin not allowed' });
    return;
  }
  console.error('[Unhandled Error]', err.message, err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ NexStay API v2 running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
  });
});

export default app;
