import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/environment';
import { Party } from '../models/Party.model';

export class PortalAuthMiddleware {
  /**
   * Protects customer/party passbook routes (Read-only portal)
   */
  public static async requirePartyAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const token = req.cookies?.party_auth_token;

    if (!token) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        res.status(401).json({ success: false, message: 'Customer passbook login required' });
        return;
      }
      if (req.flash) req.flash('errors', ['Please log in to access your passbook.']);
      res.redirect('/portal/login');
      return;
    }

    try {
      const decoded = jwt.verify(token, env.security.jwtSecret) as {
        id: string;
        mobile_no: string;
        role: string;
        exp?: number;
      };

      if (decoded.role !== 'party') {
        res.clearCookie('party_auth_token', {
          httpOnly: true,
          sameSite: 'lax',
          secure: env.server.nodeEnv === 'production'
        });
        res.redirect('/portal/login');
        return;
      }

      const party = await Party.findByPk(decoded.id);

      if (!party || !party.portal_access_enabled) {
        res.clearCookie('party_auth_token', {
          httpOnly: true,
          sameSite: 'lax',
          secure: env.server.nodeEnv === 'production'
        });
        if (req.flash) {
          req.flash('errors', ['Portal access has been disabled by the store administrator.']);
        }
        res.redirect('/portal/login');
        return;
      }

      // Sliding session renewal:
      // If token is nearing expiration (under 3 days left), renew for 15 days
      if (decoded.exp) {
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const threeDaysInSeconds = 3 * 24 * 60 * 60;
        if (decoded.exp - nowInSeconds < threeDaysInSeconds) {
          const newToken = jwt.sign(
            { id: party.id, mobile_no: party.mobile_no, role: 'party' },
            env.security.jwtSecret,
            { expiresIn: env.security.jwtExpiresIn as SignOptions['expiresIn'] }
          );
          res.cookie('party_auth_token', newToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: env.server.nodeEnv === 'production',
            maxAge: 15 * 24 * 60 * 60 * 1000
          });
        }
      }

      req.party = party;
      res.locals.currentParty = party;
      next();
    } catch {
      res.clearCookie('party_auth_token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.server.nodeEnv === 'production'
      });
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
        return;
      }
      if (req.flash) req.flash('errors', ['Your session has expired. Please log in again.']);
      res.redirect('/portal/login');
    }
  }

  /**
   * For /portal/login - if already logged in as a party, redirect to /portal/passbook
   */
  public static guestOnly(req: Request, res: Response, next: NextFunction): void {
    const token = req.cookies?.party_auth_token;
    if (token) {
      try {
        const decoded = jwt.verify(token, env.security.jwtSecret) as { role: string };
        if (decoded.role === 'party') {
          res.redirect('/portal/passbook');
          return;
        }
      } catch {
        // Token invalid, continue to login page
      }
    }
    next();
  }
}
