import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import partyRoutes from './party.routes';
import transactionRoutes from './transaction.routes';
import reportRoutes from './report.routes';
import profileRoutes from './profile.routes';
import manifestRoutes from './manifest.routes';

const router = Router();

// Health check endpoint (for UptimeRobot / Render / Supabase keepalive)
router.use('/', healthRoutes);

// Dynamic PWA manifest
router.use('/', manifestRoutes);

// Root path redirects to /parties
router.get('/', (req, res) => {
  res.redirect('/parties');
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
