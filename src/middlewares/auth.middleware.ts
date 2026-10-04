import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { User } from '../models/User.model';

export class AuthMiddleware {
  /**
   * Protects authenticated routes (Parties, Ledger, Profile)
   */
  public static async requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = req.cookies?.auth_token;

    if (!token) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      if (req.flash) req.flash('errors', ['Please login to access this page.']);
      res.redirect('/login');
      return;
    }

    try {
      const decoded = jwt.verify(token, env.security.jwtSecret) as { id: string; email: string };
      const user = await User.findByPk(decoded.id);

      if (!user) {
        res.clearCookie('auth_token');
        if (req.flash) req.flash('errors', ['User account not found. Please login again.']);
        res.redirect('/login');
        return;
      }

      req.user = user;
      res.locals.currentUser = user;
      next();
    } catch {
      res.clearCookie('auth_token');
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
        return;
      }
      if (req.flash) req.flash('errors', ['Your session has expired. Please login again.']);
      res.redirect('/login');
    }
  }

  /**
   * For routes like /login and /register - if already logged in, redirect to /parties
   */
  public static guestOnly(req: Request, res: Response, next: NextFunction): void {
    const token = req.cookies?.auth_token;
    if (token) {
      try {
        jwt.verify(token, env.security.jwtSecret);
        res.redirect('/parties');
        return;
      } catch {
        // Token invalid/expired, allow guest access
      }
    }
    next();
  }
}
