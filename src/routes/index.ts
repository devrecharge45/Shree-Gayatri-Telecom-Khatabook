import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import partyRoutes from './party.routes';
import transactionRoutes from './transaction.routes';
import reportRoutes from './report.routes';
import profileRoutes from './profile.routes';
import manifestRoutes from './manifest.routes';
import portalRoutes from './portal.routes';

const router = Router();

// Health check endpoint (for UptimeRobot / Render / Supabase keepalive)
router.use('/', healthRoutes);

// Dynamic PWA manifest
router.use('/', manifestRoutes);

// Customer Passbook Portal Routes (/portal/login, /portal/passbook, etc.)
router.use('/portal', portalRoutes);

// Smart root path redirect based on user or customer session
router.get('/', (req, res) => {
  if (req.cookies?.party_auth_token) {
    res.redirect('/portal/passbook');
    return;
  }
  if (req.cookies?.auth_token) {
    res.redirect('/parties');
    return;
  }
  res.redirect('/portal/login');
});

// Authentication Routes (/login, /register, /logout)
router.use('/', authRoutes);

// Parties Routes (Main Home Dashboard)
router.use('/parties', partyRoutes);

// Ledger & Transaction Routes
router.use('/parties', transactionRoutes);

// PDF & Excel Report Routes
router.use('/parties', reportRoutes);

// Profile & Password Reset Routes
router.use('/profile', profileRoutes);

export default router;
