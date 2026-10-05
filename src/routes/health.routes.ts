import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';

const router = Router();

// Keepalive & health monitoring route (UptimeRobot, Render, Supabase)
router.get('/health', HealthController.check);

export default router;
