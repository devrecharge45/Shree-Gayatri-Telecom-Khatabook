import { Request, Response } from 'express';
import { sequelize } from '../config/database';
import { env } from '../config/environment';
import { Logger } from '../utils/logger';

export class HealthController {
  /**
   * Health check endpoint to prevent Render & Supabase from sleeping.
   * Pinged by UptimeRobot / cron / status monitors every 1-2 minutes.
   *
   * 1. Keeps Render alive by receiving and processing incoming HTTP traffic.
   * 2. Keeps Supabase PostgreSQL active by executing a fast database ping query.
   */
  public static async check(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      // Execute a lightweight query to Supabase to keep PostgreSQL active and pool warm
      await sequelize.query('SELECT 1;');
      const latencyMs = Date.now() - startTime;

      res.status(200).json({
        status: 'ok',
        uptime_seconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: {
          status: 'connected',
          latency: `${latencyMs}ms`
        },
        service: 'active',
        app: env.company.name
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Database ping failed';
      Logger.error(`Health check failed: ${errorMessage}`);

      res.status(503).json({
        status: 'error',
        uptime_seconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          error: errorMessage
        },
        service: 'degraded'
      });
    }
  }
}
