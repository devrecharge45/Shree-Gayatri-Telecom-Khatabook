import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
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
      const decoded = jwt.verify(token, env.security.jwtSecret) as {
        id: string;
        email: string;
        exp?: number;
      };
      const user = await User.findByPk(decoded.id);

      if (!user) {
        res.clearCookie('auth_token', {
          httpOnly: true,
          sameSite: 'lax',
          secure: env.server.nodeEnv === 'production'
        });
        if (req.flash) req.flash('errors', ['User account not found. Please login again.']);
        res.redirect('/login');
        return;
      }

      // Sliding session renewal:
      // If token is valid and nearing expiration (fewer than 3 days remaining),
      // seamlessly renew it for 15 days so active users are never logged out unexpectedly.
      if (decoded.exp) {
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const threeDaysInSeconds = 3 * 24 * 60 * 60;
        if (decoded.exp - nowInSeconds < threeDaysInSeconds) {
          const newToken = jwt.sign({ id: user.id, email: user.email }, env.security.jwtSecret, {
            expiresIn: env.security.jwtExpiresIn as SignOptions['expiresIn']
          });
          res.cookie('auth_token', newToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: env.server.nodeEnv === 'production',
            maxAge: 15 * 24 * 60 * 60 * 1000
          });
        }
      }

      req.user = user;
      res.locals.currentUser = user;
      next();
    } catch {
      res.clearCookie('auth_token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.server.nodeEnv === 'production'
      });
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
